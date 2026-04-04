"""
Orders page endpoint — searchable, filterable orders table with pagination.
"""
from __future__ import annotations

import math

import pandas as pd
from fastapi import APIRouter, Query

from services.data_loader import _DATA

router = APIRouter()


@router.get("/api/orders")
def get_orders(
    status: str = Query(default=""),
    payment: str = Query(default=""),
    search: str = Query(default=""),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=500),
    date_from: str = Query(default=""),
    date_to: str = Query(default=""),
):
    """Return paginated and filtered orders."""
    df_all = _DATA.get("orders", pd.DataFrame())

    if df_all.empty:
        return {"orders": [], "total": 0, "page": page, "pages": 0}

    df = df_all.copy()

    # Status filter
    if status:
        df = df[df["statusName"].astype(str).str.strip() == status.strip()]

    # Payment form filter
    if payment:
        df = df[df["paymentForm"].astype(str).str.strip() == payment.strip()]

    # Date range filter
    if date_from:
        try:
            cutoff_from = pd.to_datetime(date_from, errors="coerce").date()
            if cutoff_from is not None:
                df = df[pd.to_datetime(df["date"], errors="coerce").dt.date >= cutoff_from]
        except Exception:
            pass

    if date_to:
        try:
            cutoff_to = pd.to_datetime(date_to, errors="coerce").date()
            if cutoff_to is not None:
                df = df[pd.to_datetime(df["date"], errors="coerce").dt.date <= cutoff_to]
        except Exception:
            pass

    # Search filter — match on code, itemName, deliveryCity
    if search:
        term = search.strip().lower()
        mask = (
            df["code"].astype(str).str.lower().str.contains(term, na=False)
            | df["itemName"].astype(str).str.lower().str.contains(term, na=False)
            | df["deliveryCity"].astype(str).str.lower().str.contains(term, na=False)
        )
        df = df[mask]

    total = len(df)
    pages = math.ceil(total / limit) if limit > 0 else 0

    # Sort by date descending
    try:
        df = df.sort_values("date", ascending=False)
    except Exception:
        pass

    # Paginate
    start = (page - 1) * limit
    end = start + limit
    df_page = df.iloc[start:end]

    # Numeric coerce for response
    df_page = df_page.copy()
    df_page["totalPriceWithVat"] = pd.to_numeric(df_page["totalPriceWithVat"], errors="coerce").fillna(0)

    orders_out = []
    for _, row in df_page.iterrows():
        orders_out.append({
            "code": str(row.get("code", "")),
            "date": str(row.get("date", "")),
            "itemName": str(row.get("itemName", "")),
            "totalPriceWithVat": round(float(row["totalPriceWithVat"]), 2),
            "statusName": str(row.get("statusName", "")),
            "sourceName": str(row.get("sourceName", "")),
            "paymentForm": str(row.get("paymentForm", "")),
            "deliveryCity": str(row.get("deliveryCity", "")),
            "currency": str(row.get("currency", "")),
        })

    return {
        "orders": orders_out,
        "total": total,
        "page": page,
        "pages": pages,
    }
