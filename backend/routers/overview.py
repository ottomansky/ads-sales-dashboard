"""
Overview page endpoints — KPIs and Revenue/Ad Costs trend chart.
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


def _prev_period_df(df: pd.DataFrame, date_col: str, period: str) -> pd.DataFrame:
    """Return the prior period dataframe (same length as current period, shifted back)."""
    try:
        dates = pd.to_datetime(df[date_col], errors="coerce")
        latest = dates.max()
        if pd.isna(latest):
            return df.iloc[0:0]
        ref = latest.date() if hasattr(latest, "date") else latest
        if period == "L3M":
            cur_start = ref - timedelta(days=90)
            prev_start = ref - timedelta(days=180)
        elif period == "L6M":
            cur_start = ref - timedelta(days=180)
            prev_start = ref - timedelta(days=360)
        elif period == "YTD":
            cur_start = date(ref.year, 1, 1)
            prev_start = date(ref.year - 1, 1, 1)
        elif period == "12M":
            cur_start = ref - timedelta(days=365)
            prev_start = ref - timedelta(days=730)
        else:
            return df.iloc[0:0]
        d = pd.to_datetime(df[date_col], errors="coerce").dt.date
        return df.loc[(d >= prev_start) & (d < cur_start)]
    except Exception:
        return df.iloc[0:0]


@router.get("/api/kpis")
def get_kpis(period: str = Query(default="L3M")):
    """Return KPI cards for the Overview page."""
    df_all = _DATA.get("marketing_metrics", pd.DataFrame())

    if df_all.empty:
        return []

    df = _filter_period(df_all, "date", period)
    df_prev = _prev_period_df(df_all, "date", period)

    def _sum(frame: pd.DataFrame, col: str) -> float:
        if col not in frame.columns or frame.empty:
            return 0.0
        return float(pd.to_numeric(frame[col], errors="coerce").sum())

    def _mean(frame: pd.DataFrame, col: str) -> float:
        if col not in frame.columns or frame.empty:
            return 0.0
        return float(pd.to_numeric(frame[col], errors="coerce").mean())

    def _delta(cur: float, prev: float) -> float:
        if prev == 0:
            return 0.0
        return round((cur - prev) / abs(prev) * 100, 2)

    revenue = _sum(df, "revenue")
    prev_revenue = _sum(df_prev, "revenue")

    orders = _sum(df, "orders")
    prev_orders = _sum(df_prev, "orders")

    ad_costs = _sum(df, "ad_costs")
    prev_ad_costs = _sum(df_prev, "ad_costs")

    cac = _mean(df, "cac")
    prev_cac = _mean(df_prev, "cac")

    roi = _mean(df, "roi")
    prev_roi = _mean(df_prev, "roi")

    aov = _mean(df, "aov")
    prev_aov = _mean(df_prev, "aov")

    return [
        {
            "label": "Revenue",
            "value": round(revenue, 2),
            "delta": _delta(revenue, prev_revenue),
            "description": "Total revenue in the selected period",
            "formula": "SUM(revenue)",
            "sources": ["marketing_metrics"],
        },
        {
            "label": "Orders",
            "value": round(orders, 0),
            "delta": _delta(orders, prev_orders),
            "description": "Total number of orders in the selected period",
            "formula": "SUM(orders)",
            "sources": ["marketing_metrics"],
        },
        {
            "label": "Ad Costs",
            "value": round(ad_costs, 2),
            "delta": _delta(ad_costs, prev_ad_costs),
            "description": "Total advertising spend across all channels",
            "formula": "SUM(ad_costs)",
            "sources": ["marketing_metrics"],
        },
        {
            "label": "CAC",
            "value": round(cac, 2),
            "delta": _delta(cac, prev_cac),
            "description": "Average customer acquisition cost",
            "formula": "AVG(cac)",
            "sources": ["marketing_metrics"],
        },
        {
            "label": "ROI",
            "value": round(roi, 2),
            "delta": _delta(roi, prev_roi),
            "description": "Average return on investment for ad spend",
            "formula": "AVG(roi)",
            "sources": ["marketing_metrics"],
        },
        {
            "label": "AOV",
            "value": round(aov, 2),
            "delta": _delta(aov, prev_aov),
            "description": "Average order value in the selected period",
            "formula": "AVG(aov)",
            "sources": ["marketing_metrics"],
        },
    ]


@router.get("/api/overview-chart")
def get_overview_chart(period: str = Query(default="L3M")):
    """Return daily Revenue & Ad Costs trend for the line chart."""
    df_all = _DATA.get("marketing_metrics", pd.DataFrame())

    if df_all.empty:
        return []

    df = _filter_period(df_all, "date", period).copy()

    df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce").fillna(0)
    df["ad_costs"] = pd.to_numeric(df["ad_costs"], errors="coerce").fillna(0)

    df_sorted = df[["date", "revenue", "ad_costs"]].sort_values("date")

    return [
        {
            "date": str(row["date"]),
            "revenue": round(float(row["revenue"]), 2),
            "ad_costs": round(float(row["ad_costs"]), 2),
        }
        for _, row in df_sorted.iterrows()
    ]
