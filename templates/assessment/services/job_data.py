"""
Role-level FTE estimation from job indicators.

When available: use company-specific estimates from job postings / LinkedIn-style data.
Otherwise: fall back to revenue-based benchmark with clear methodology note.
Integration points: LinkedIn API, Indeed/Adzuna, company career-page scraping.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REF_DIR = Path(__file__).parent.parent / "reference" / "customer_ops_optimizer"
JOB_ESTIMATES_DIR = REF_DIR / "job_estimates"


def get_role_ftes(
    company_id: str,
    role_name: str,
    revenue_100m: float | None,
    benchmark_median_fte_per_100m: float,
) -> dict[str, Any]:
    """
    Return estimated FTEs for this company and role.

    Prefer company-specific job-based estimate if present in job_estimates/{company_id}.json.
    Else use revenue-based benchmark and label source as revenue_benchmark.
    """
    override = _load_company_job_estimates(company_id)
    if override and role_name in override.get("roles", {}):
        r = override["roles"][role_name]
        return {
            "estimated_ftes": r.get("estimated_ftes"),
            "source": r.get("source", "job_indicators"),
            "source_note": r.get("source_note", "Estimated from job postings / public indicators."),
            "current_offshore_pct": r.get("current_offshore_pct"),
        }

    # Fallback: revenue-based benchmark
    est = round(benchmark_median_fte_per_100m * revenue_100m, 1) if revenue_100m else None
    return {
        "estimated_ftes": est,
        "source": "revenue_benchmark",
        "source_note": "Job board / LinkedIn integration planned. Current estimate from revenue-based benchmark (FTE per $100M).",
        "current_offshore_pct": None,
    }


def _load_company_job_estimates(company_id: str) -> dict | None:
    """Load company-specific role estimates if file exists."""
    path = JOB_ESTIMATES_DIR / f"{company_id}.json"
    if not path.is_file():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def get_peer_benchmark_ftes(
    role_name: str,
    revenue_100m: float,
    benchmark_low_fte_per_100m: float,
    benchmark_high_fte_per_100m: float,
    benchmark_median_fte_per_100m: float,
) -> dict[str, Any]:
    """
    Return peer benchmark range and median for this role at this revenue scale.
    Used to compare company's estimated FTEs vs peers (e.g. "Salesforce has 320 Impl PMs vs peer benchmark 280–380").
    """
    low = round(benchmark_low_fte_per_100m * revenue_100m, 1)
    high = round(benchmark_high_fte_per_100m * revenue_100m, 1)
    median = round(benchmark_median_fte_per_100m * revenue_100m, 1)
    return {
        "peer_benchmark_low": low,
        "peer_benchmark_high": high,
        "peer_benchmark_median": median,
    }