"""
FastAPI backend for Keboola Data App.

ARCHITECTURE:
  - Data loaded once at startup from Keboola Storage API (or local CSVs)
  - Endpoints serve pre-computed results from in-memory DataFrames
  - User context read from Keboola OIDC headers (x-kbc-user-email)

HOW TO ADD AN ENDPOINT:
  1. Create a router file: backend/routers/my_feature.py
  2. Use get_data() dependency to access loaded DataFrames
  3. Use get_user_context() dependency for user info
  4. Register the router below
  5. Add matching types + hook in frontend (lib/types.ts + lib/api.ts)

See routers/__init__.py for a detailed example.
"""
import asyncio
import logging
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from services.data_loader import TABLE_IDS, _DATA, init_data
from services.user_context import UserContext, get_user_context

logger = logging.getLogger(__name__)

# Load .env for local dev (no-op in production where env vars are injected)
load_dotenv(Path(__file__).parent / ".env")

# ─── KAI module-level state ────────────────────────────────────────────────────
_http_client: httpx.AsyncClient | None = None
_kai_url: str | None = None
_streams: dict[str, dict] = {}


# ─── KAI service discovery helpers ────────────────────────────────────────────

def _kbc_base_url() -> str:
    """Extract base connection URL from KBC_URL, stripping /v2/storage if present."""
    kbc_url = os.getenv("KBC_URL", "").strip().rstrip("/")
    return kbc_url.split("/v2/")[0] if "/v2/" in kbc_url else kbc_url


async def _discover_kai_url() -> str:
    """Discover KAI assistant URL from Keboola Storage API services list. Caches result."""
    global _kai_url
    if _kai_url:
        return _kai_url
    kbc_token = os.getenv("KBC_TOKEN", "").strip()
    base = _kbc_base_url()
    if not kbc_token or not base:
        raise HTTPException(500, "KBC_TOKEN / KBC_URL not configured")
    assert _http_client is not None
    resp = await _http_client.get(
        f"{base}/v2/storage",
        headers={"x-storageapi-token": kbc_token},
        timeout=30.0,
    )
    data = resp.json()
    services = data.get("services", [])
    svc = next((s for s in services if s["id"] == "kai-assistant"), None)
    if not svc:
        service_ids = [s.get("id") for s in services]
        raise HTTPException(500, f"kai-assistant not found. Available: {service_ids}")
    _kai_url = svc["url"].rstrip("/")
    logger.info("Discovered KAI URL: %s", _kai_url)
    return _kai_url


def _kai_headers() -> tuple[str, str, dict]:
    """Return (base_url, token, headers) for KAI requests."""
    kai_token = os.getenv("KAI_TOKEN", "").strip() or os.getenv("KBC_TOKEN", "").strip()
    base = _kbc_base_url()
    return base, kai_token, {
        "Content-Type": "application/json",
        "x-storageapi-token": kai_token,
        "x-storageapi-url": base,
    }


# ─── KAI stream buffer + consumer ─────────────────────────────────────────────

async def _kai_stream_consumer(stream_id: str, resp: httpx.Response, client: httpx.AsyncClient) -> None:
    """Background task: read KAI SSE stream and buffer raw event strings."""
    buf = _streams[stream_id]
    try:
        raw = b""
        async for chunk in resp.aiter_bytes():
            raw += chunk
            while b"\n\n" in raw:
                event_bytes, raw = raw.split(b"\n\n", 1)
                event_str = event_bytes.decode("utf-8", errors="replace").strip()
                if event_str:
                    buf["events"].append(event_str)
        # Handle any trailing data
        if raw.strip():
            buf["events"].append(raw.decode("utf-8", errors="replace").strip())
    except Exception as exc:
        logger.warning("KAI stream %s error: %s", stream_id, exc)
        buf["error"] = str(exc)
    finally:
        buf["done"] = True
        await resp.aclose()
        await client.aclose()


async def _start_kai_stream(kai_url: str, headers: dict, body: dict) -> str:
    """Start a background KAI stream and return its stream_id."""
    stream_id = str(uuid.uuid4())
    client = httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=30.0))
    req = client.build_request("POST", f"{kai_url}/api/chat", headers=headers, json=body)
    resp = await client.send(req, stream=True)

    if resp.status_code != 200:
        error_body = await resp.aread()
        await resp.aclose()
        await client.aclose()
        _streams[stream_id] = {
            "events": [],
            "done": True,
            "error": f"KAI returned {resp.status_code}: {error_body.decode()[:200]}",
        }
        return stream_id

    _streams[stream_id] = {"events": [], "done": False, "error": None}
    asyncio.create_task(_kai_stream_consumer(stream_id, resp, client))
    return stream_id


# ─── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all Keboola tables into memory at startup."""
    global _http_client
    # Persistent connection pool — avoids TCP+TLS handshake per KAI request
    _http_client = httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=30.0))
    # Pre-warm KAI service URL discovery so first chat is instant
    try:
        await _discover_kai_url()
    except Exception as e:
        logger.warning("KAI pre-warm failed (will retry on first request): %s", e)

    try:
        init_data()
    except Exception:
        logger.error("Data loading failed — app cannot start", exc_info=True)
        raise

    yield

    await _http_client.aclose()
    _http_client = None


app = FastAPI(title="Keboola Data App", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Local dev only — in production, Nginx proxies same-origin so CORS is irrelevant.
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
from routers import overview, ads, orders, products, customers, query  # noqa: E402

app.include_router(overview.router)
app.include_router(ads.router)
app.include_router(orders.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(query.router)


# ─── Core endpoints ────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    """Health check — frontend uses this to confirm backend is reachable."""
    tables = [
        {
            "short_name": name,
            "row_count": len(_DATA[name]) if name in _DATA else 0,
            "table_id": TABLE_IDS.get(name, ""),
            "loaded_at": None,
        }
        for name in TABLE_IDS
    ]
    return {
        "status": "ok",
        "tables_loaded": len(_DATA),
        "tables": tables,
    }


@app.get("/api/platform")
def platform():
    """Keboola connection info for the frontend."""
    kbc_url = os.getenv("KBC_URL", "").strip().rstrip("/")
    kbc_project_id = os.getenv("KBC_PROJECTID", "").strip()
    if not kbc_project_id:
        kbc_token = os.getenv("KBC_TOKEN", "")
        if "-" in kbc_token:
            kbc_project_id = kbc_token.split("-", 1)[0]
    connection_base = kbc_url.split("/v2/")[0] if "/v2/" in kbc_url else kbc_url
    return {
        "connection_url": connection_base or None,
        "project_id": kbc_project_id or None,
    }


@app.get("/api/me")
def me(user: UserContext = Depends(get_user_context)):
    """Current user info from Keboola OIDC."""
    return {
        "email": user.email or "demo@localhost",
        "role": user.role,
        "is_authenticated": user.is_authenticated,
    }


# ─── KAI endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def kai_chat(request: Request):
    kai_url = await _discover_kai_url()
    _base, _token, headers = _kai_headers()
    body = await request.json()
    stream_id = await _start_kai_stream(kai_url, headers, body)
    return {"stream_id": stream_id}


@app.get("/api/chat/{stream_id}/poll")
async def kai_poll(stream_id: str, cursor: int = 0):
    buf = _streams.get(stream_id)
    if not buf:
        raise HTTPException(404, "Stream not found or expired")
    events = buf["events"][cursor:]
    new_cursor = cursor + len(events)
    done = buf["done"]
    error = buf["error"]
    # Clean up completed streams after all events are consumed
    if done and new_cursor >= len(buf["events"]):
        _streams.pop(stream_id, None)
    return {
        "events": events,
        "cursor": new_cursor,
        "done": done,
        "error": error,
    }


@app.post("/api/chat/{chat_id}/{action}/{approval_id}")
async def kai_tool_approval(chat_id: str, action: str, approval_id: str):
    kai_url = await _discover_kai_url()
    _base, _token, headers = _kai_headers()
    approved = action == "approve"
    payload = {
        "id": chat_id,
        "message": {
            "id": str(uuid.uuid4()),
            "role": "user",
            "parts": [
                {
                    "type": "tool-approval-response",
                    "approvalId": approval_id,
                    "approved": approved,
                    **({"reason": "User denied"} if not approved else {}),
                }
            ],
        },
        "selectedChatModel": "chat-model",
        "selectedVisibilityType": "private",
    }
    stream_id = await _start_kai_stream(kai_url, headers, payload)
    return {"stream_id": stream_id}
