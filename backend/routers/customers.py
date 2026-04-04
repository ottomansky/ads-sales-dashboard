"""
Customers page endpoint — geography and payment method breakdowns.
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


@router.get("/api/customers")
def get_customers(period: str = Query(default="L3M")):
    """Return customer geography and payment method breakdown."""
    df_all = _DATA.get("orders", pd.DataFrame())

    if df_all.empty:
        return {"by_city": [], "by_payment": []}

    df = _filter_period(df_all, "date", period).copy()

    df["totalPriceWithVat"] = pd.to_numeric(df["totalPriceWithVat"], errors="coerce").fillna(0)

    # By city (unique orders only — deduplicate on order code to avoid item-level inflation)
    df_orders_unique = df.drop_duplicates(subset=["code"])

    by_city_grp = (
        df_orders_unique.groupby(["deliveryCity", "deliveryCountryName"], sort=False)
        .agg(
            order_count=("code", "count"),
            revenue=("totalPriceWithVat", "sum"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    by_city = [
        {
            "city": str(row["deliveryCity"]),
            "country": str(row["deliveryCountryName"]),
            "order_count": int(row["order_count"]),
            "revenue": round(float(row["revenue"]), 2),
        }
        for _, row in by_city_grp.iterrows()
    ]

    # By payment method (unique orders)
    by_payment_grp = (
        df_orders_unique.groupby("paymentForm", sort=False)
        .agg(
            order_count=("code", "count"),
            revenue=("totalPriceWithVat", "sum"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    by_payment = [
        {
            "payment": str(row["paymentForm"]),
            "order_count": int(row["order_count"]),
            "revenue": round(float(row["revenue"]), 2),
        }
        for _, row in by_payment_grp.iterrows()
    ]

    return {
        "by_city": by_city,
        "by_payment": by_payment,
    }
