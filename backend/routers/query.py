"""
My Dashboards — /api/data-schema and /api/query-data endpoints.
Provides the schema for the custom chart builder and executes grouped aggregations.
"""
from __future__ import annotations

from datetime import date, timedelta

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from services.data_loader import _DATA

router = APIRouter()

# Schema definition for all tables
SCHEMA = {
    "marketing_metrics": {
        "date_col": "date",
        "dimensions": {"date"},
        "measures": {
            "orders": "sum",
            "revenue": "sum",
            "ad_costs": "sum",
            "google_costs": "sum",
            "meta_costs": "sum",
            "cac": "mean",
            "mer": "mean",
            "roi": "mean",
            "aov": "mean",
            "cm2": "sum",
            "cm3": "sum",
        },
        "supports_period": True,
    },
    "orders": {
        "date_col": "date",
        "dimensions": {
            "date",
            "itemName",
            "statusName",
            "sourceName",
            "paymentForm",
            "deliveryCity",
            "deliveryCountryName",
            "currency",
            "code",
        },
        "measures": {
            "totalPriceWithVat": "sum",
            "itemAmount": "sum",
            "itemTotalPriceWithVat": "sum",
        },
        "supports_period": True,
    },
    "ga4_analytics": {
        "date_col": "date",
        "dimensions": {"date", "sessionGoogleAdsCampaignName"},
        "measures": {
            "advertiserAdClicks": "sum",
            "advertiserAdImpressions": "sum",
            "advertiserAdCost": "sum",
            "sessions": "sum",
            "conversions": "sum",
        },
        "supports_period": True,
    },
    "meta_insights": {
        "date_col": "date_start",
        "dimensions": {"date_start", "ad_name"},
        "measures": {
            "clicks": "sum",
            "impressions": "sum",
            "spend": "sum",
        },
        "supports_period": True,
    },
}

DATA_SCHEMA_RESPONSE = {
    "sources": [
        {
            "id": "marketing_metrics",
            "label": "Marketing Metrics",
            "dimensions": [
                {"column": "date", "label": "Date", "is_date": True},
            ],
            "measures": [
                {"column": "orders", "label": "Orders"},
                {"column": "revenue", "label": "Revenue"},
                {"column": "ad_costs", "label": "Ad Costs"},
                {"column": "google_costs", "label": "Google Costs"},
                {"column": "meta_costs", "label": "Meta Costs"},
                {"column": "cac", "label": "CAC"},
                {"column": "mer", "label": "MER"},
                {"column": "roi", "label": "ROI"},
                {"column": "aov", "label": "AOV"},
                {"column": "cm2", "label": "CM2"},
                {"column": "cm3", "label": "CM3"},
            ],
            "supports_period": True,
        },
        {
            "id": "orders",
            "label": "Orders",
            "dimensions": [
                {"column": "date", "label": "Date", "is_date": True},
                {"column": "itemName", "label": "Product Name", "is_date": False},
                {"column": "statusName", "label": "Order Status", "is_date": False},
                {"column": "sourceName", "label": "Source", "is_date": False},
                {"column": "paymentForm", "label": "Payment Method", "is_date": False},
                {"column": "deliveryCity", "label": "Delivery City", "is_date": False},
                {"column": "deliveryCountryName", "label": "Delivery Country", "is_date": False},
                {"column": "currency", "label": "Currency", "is_date": False},
                {"column": "code", "label": "Order Code", "is_date": False},
            ],
            "measures": [
                {"column": "totalPriceWithVat", "label": "Order Total (incl. VAT)"},
                {"column": "itemAmount", "label": "Item Quantity"},
                {"column": "itemTotalPriceWithVat", "label": "Item Total (incl. VAT)"},
            ],
            "supports_period": True,
        },
        {
            "id": "ga4_analytics",
            "label": "Google Ads Analytics",
            "dimensions": [
                {"column": "date", "label": "Date", "is_date": True},
                {"column": "sessionGoogleAdsCampaignName", "label": "Campaign Name", "is_date": False},
            ],
            "measures": [
                {"column": "advertiserAdClicks", "label": "Clicks"},
                {"column": "advertiserAdImpressions", "label": "Impressions"},
                {"column": "advertiserAdCost", "label": "Ad Cost"},
                {"column": "sessions", "label": "Sessions"},
                {"column": "conversions", "label": "Conversions"},
            ],
            "supports_period": True,
        },
        {
            "id": "meta_insights",
            "label": "Meta Ad Insights",
            "dimensions": [
                {"column": "date_start", "label": "Date", "is_date": True},
                {"column": "ad_name", "label": "Ad Name", "is_date": False},
            ],
            "measures": [
                {"column": "clicks", "label": "Clicks"},
                {"column": "impressions", "label": "Impressions"},
                {"column": "spend", "label": "Spend"},
            ],
            "supports_period": True,
        },
    ]
}


def _filter_period(df: pd.DataFrame, date_col: str, period: str | None) -> pd.DataFrame:
    if period is None or date_col not in df.columns:
        return df
    try:
        dates = pd.to_datetime(df[date_col], errors="coerce")
        latest = dates.max()
        if pd.isna(latest):
            return df
        ref = latest.date() if hasattr(latest, "date") else latest
        if period == "L3M":
            cutoff = ref - timedelta(days=90)
        elif period == "L6M":
            cutoff = ref - timedelta(days=180)
        elif period == "YTD":
            cutoff = date(ref.year, 1, 1)
        elif period == "12M":
            cutoff = ref - timedelta(days=365)
        else:
            return df
        return df.loc[pd.to_datetime(df[date_col], errors="coerce").dt.date >= cutoff]
    except Exception:
        return df


@router.get("/api/data-schema")
def get_data_schema():
    return DATA_SCHEMA_RESPONSE


@router.get("/api/query-data")
def query_data(
    source: str = Query(...),
    dimension: str = Query(...),
    measures: str = Query(...),
    period: str | None = Query(default=None),
):
    if source not in SCHEMA:
        raise HTTPException(status_code=422, detail=f"Invalid source: {source}")
    schema = SCHEMA[source]
    if dimension not in schema["dimensions"]:
        raise HTTPException(status_code=422, detail=f"Invalid dimension '{dimension}'")
    measure_list = [m.strip() for m in measures.split(",") if m.strip()]
    if not measure_list:
        raise HTTPException(status_code=422, detail="At least one measure required")
    invalid = [m for m in measure_list if m not in schema["measures"]]
    if invalid:
        raise HTTPException(status_code=422, detail=f"Invalid measures: {invalid}")

    df = _DATA.get(source)
    if df is None or df.empty:
        return {"headers": [dimension] + measure_list, "rows": []}

    # Virtual 'count' measure
    if measure_list == ["count"] and "count" not in df.columns:
        result = df.groupby(dimension).size().reset_index(name="count")
        rows = [[str(r[dimension]), str(r["count"])] for _, r in result.iterrows()]
        return {"headers": [dimension, "count"], "rows": rows}

    date_col = schema["date_col"]
    if schema["supports_period"] and period and date_col:
        df = _filter_period(df, date_col, period)

    missing = [c for c in [dimension] + measure_list if c not in df.columns]
    if missing:
        raise HTTPException(status_code=422, detail=f"Columns not found: {missing}")

    df = df.copy()
    if dimension == date_col and date_col:
        df[dimension] = pd.to_datetime(df[dimension], errors="coerce").dt.to_period("M").astype(str)

    # Convert measure columns to numeric before aggregation
    for m in measure_list:
        df[m] = pd.to_numeric(df[m], errors="coerce").fillna(0)

    agg_dict = {m: schema["measures"][m] for m in measure_list}
    grouped = df.groupby(dimension, sort=True).agg(agg_dict).reset_index()
    headers = [dimension] + measure_list
    rows = [
        [str(r[dimension])] + [
            f"{r[m]:.2f}" if isinstance(r[m], float) else str(r[m])
            for m in measure_list
        ]
        for _, r in grouped.iterrows()
    ]
    return {"headers": headers, "rows": rows}
