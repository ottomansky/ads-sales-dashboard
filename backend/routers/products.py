"""
Products page endpoint — top products by revenue.
"""
from __future__ import annotations

from datetime import date, timedelta

import pandas as pd
from fastapi import APIRouter, Query

from services.data_loader import _DATA

router = APIRouter()


def _filter_period(df: pd.DataFrame, date_col: str, period: str) -> pd.DataFrame:
    """Filter dataframe to the given period relative to max date in the data."""
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


@router.get("/api/products")
def get_products(period: str = Query(default="L3M")):
    """Return top products by revenue and order count."""
    df_all = _DATA.get("orders", pd.DataFrame())

    if df_all.empty:
        return []

    df = _filter_period(df_all, "date", period).copy()

    df["itemTotalPriceWithVat"] = pd.to_numeric(df["itemTotalPriceWithVat"], errors="coerce").fillna(0)
    df["itemAmount"] = pd.to_numeric(df["itemAmount"], errors="coerce").fillna(0)

    grp = (
        df.groupby("itemName", sort=False)
        .agg(
            order_count=("code", "count"),
            total_revenue=("itemTotalPriceWithVat", "sum"),
        )
        .reset_index()
        .sort_values("total_revenue", ascending=False)
    )

    return [
        {
            "itemName": str(row["itemName"]),
            "order_count": int(row["order_count"]),
            "total_revenue": round(float(row["total_revenue"]), 2),
        }
        for _, row in grp.iterrows()
    ]
