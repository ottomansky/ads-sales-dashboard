"""
Ad Performance page endpoint — Google vs Meta campaigns.
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


@router.get("/api/ads")
def get_ads(period: str = Query(default="L3M")):
    """Return Google and Meta ad performance data."""
    df_ga4 = _DATA.get("ga4_analytics", pd.DataFrame())
    df_meta = _DATA.get("meta_insights", pd.DataFrame())

    # --- Google ---
    google_rows = []
    google_total = 0.0
    if not df_ga4.empty:
        df_g = _filter_period(df_ga4, "date", period).copy()
        for col in ["advertiserAdClicks", "advertiserAdImpressions", "advertiserAdCost", "sessions", "conversions"]:
            df_g[col] = pd.to_numeric(df_g[col], errors="coerce").fillna(0)

        grp = (
            df_g.groupby("sessionGoogleAdsCampaignName", sort=False)
            .agg(
                clicks=("advertiserAdClicks", "sum"),
                impressions=("advertiserAdImpressions", "sum"),
                cost=("advertiserAdCost", "sum"),
                sessions=("sessions", "sum"),
                conversions=("conversions", "sum"),
            )
            .reset_index()
            .sort_values("cost", ascending=False)
        )
        for _, row in grp.iterrows():
            google_rows.append({
                "campaign": str(row["sessionGoogleAdsCampaignName"]),
                "clicks": int(row["clicks"]),
                "impressions": int(row["impressions"]),
                "cost": round(float(row["cost"]), 2),
                "sessions": int(row["sessions"]),
                "conversions": round(float(row["conversions"]), 2),
            })
        google_total = round(float(grp["cost"].sum()), 2)

    # --- Meta ---
    meta_rows = []
    meta_total = 0.0
    if not df_meta.empty:
        df_m = _filter_period(df_meta, "date_start", period).copy()
        for col in ["clicks", "impressions", "spend"]:
            df_m[col] = pd.to_numeric(df_m[col], errors="coerce").fillna(0)

        grp_m = (
            df_m.groupby("ad_name", sort=False)
            .agg(
                clicks=("clicks", "sum"),
                impressions=("impressions", "sum"),
                spend=("spend", "sum"),
            )
            .reset_index()
            .sort_values("spend", ascending=False)
        )
        for _, row in grp_m.iterrows():
            meta_rows.append({
                "ad_name": str(row["ad_name"]),
                "clicks": int(row["clicks"]),
                "impressions": int(row["impressions"]),
                "spend": round(float(row["spend"]), 2),
            })
        meta_total = round(float(grp_m["spend"].sum()), 2)

    return {
        "google": google_rows,
        "meta": meta_rows,
        "summary": {
            "google_total": google_total,
            "meta_total": meta_total,
        },
    }
