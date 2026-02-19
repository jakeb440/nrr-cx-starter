"""
Fetch public company data from SEC EDGAR (company facts and submissions).
SEC requires a descriptive User-Agent; use for assessment context only.
"""

from __future__ import annotations

import logging
from typing import Any

import requests

SEC_USER_AGENT = "CustomerOpsOptimizer/1.0 (assessment tool; contact via your-org)"
SEC_BASE = "https://data.sec.gov"


def _cik_pad(cik: str) -> str:
    """Return 10-digit CIK string with leading zeros."""
    s = str(cik).strip()
    return s.zfill(10)


def fetch_company_facts(cik: str) -> dict[str, Any] | None:
    """Fetch company facts JSON from SEC EDGAR. Returns None on failure."""
    cik = _cik_pad(cik)
    url = f"{SEC_BASE}/api/xbrl/companyfacts/CIK{cik}.json"
    try:
        r = requests.get(
            url,
            headers={"User-Agent": SEC_USER_AGENT},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        logging.warning("SEC company facts fetch failed for CIK %s: %s", cik, e)
        return None
    except ValueError as e:
        logging.warning("SEC company facts parse failed for CIK %s: %s", cik, e)
        return None


def fetch_submissions(cik: str) -> dict[str, Any] | None:
    """Fetch submissions (filings metadata) from SEC EDGAR. Returns None on failure."""
    cik = _cik_pad(cik)
    url = f"{SEC_BASE}/submissions/CIK{cik}.json"
    try:
        r = requests.get(
            url,
            headers={"User-Agent": SEC_USER_AGENT},
            timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        logging.warning("SEC submissions fetch failed for CIK %s: %s", cik, e)
        return None
    except ValueError as e:
        logging.warning("SEC submissions parse failed for CIK %s: %s", cik, e)
        return None


def _latest_revenue_usd(facts: dict[str, Any]) -> int | None:
    """Extract latest annual revenue in USD from company facts.

    Checks multiple revenue tags and returns the MOST RECENT across all of them.
    """
    try:
        gaap = facts.get("facts", {}).get("us-gaap", {})
        candidates: list[tuple[str, int]] = []  # (end_date, value)

        revenue_tags = (
            "Revenues",
            "RevenueFromContractWithCustomerExcludingAssessedTax",
            "RevenueFromContractWithCustomerIncludingAssessedTax",
            "SalesRevenueNet",
            "SalesRevenueGoodsAndServicesNet",
            "SalesRevenueServicesNet",
        )
        for tag in revenue_tags:
            if tag not in gaap:
                continue
            usd_list = gaap[tag].get("units", {}).get("USD", [])
            if not usd_list:
                continue
            annual = [x for x in usd_list if x.get("form") == "10-K" or x.get("fp") == "FY"]
            if not annual:
                continue
            annual.sort(key=lambda x: x.get("end", ""), reverse=True)
            val = annual[0].get("val")
            end = annual[0].get("end", "")
            if val is not None and isinstance(val, (int, float)):
                candidates.append((end, int(val)))

        if candidates:
            # Return the most recent value across all tags
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
    except (KeyError, TypeError, IndexError):
        pass
    return None


def _latest_cogs_usd(facts: dict[str, Any]) -> int | None:
    """Extract latest annual cost of revenue (COGS) in USD from company facts.
    Used for customer-ops financial comparison vs peers.
    """
    try:
        gaap = facts.get("facts", {}).get("us-gaap", {})
        candidates: list[tuple[str, int]] = []

        cogs_tags = (
            "CostOfRevenue",
            "CostOfGoodsAndServicesSold",
            "CostOfGoodsSold",
            "CostOfServices",
            "CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization",
            "CostOfRevenueExcludingDepreciationAndAmortization",
        )
        for tag in cogs_tags:
            if tag not in gaap:
                continue
            usd_list = gaap[tag].get("units", {}).get("USD", [])
            if not usd_list:
                continue
            annual = [x for x in usd_list if x.get("form") == "10-K" or x.get("fp") == "FY"]
            if not annual:
                continue
            annual.sort(key=lambda x: x.get("end", ""), reverse=True)
            val = annual[0].get("val")
            end = annual[0].get("end", "")
            if val is not None and isinstance(val, (int, float)):
                candidates.append((end, int(val)))

        if candidates:
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
    except (KeyError, TypeError, IndexError):
        pass
    return None


def _employee_count_from_facts(facts: dict[str, Any]) -> int | None:
    """Extract latest employee count from company facts (dei:NumberOfEmployees) if available."""
    try:
        dei = facts.get("facts", {}).get("dei", {})
        if "NumberOfEmployees" not in dei:
            return None
        units = dei["NumberOfEmployees"].get("units", {})
        # Can be "pure" (list of values) or keyed by unit type
        for unit_key, items in units.items():
            if unit_key == "USD":
                continue
            lst = items if isinstance(items, list) else []
            annual = [x for x in lst if x.get("form") == "10-K" or x.get("fp") == "FY"]
            if not annual:
                annual = lst
            if not annual:
                continue
            annual.sort(key=lambda x: x.get("end", ""), reverse=True)
            val = annual[0].get("val")
            if val is not None and isinstance(val, (int, float)):
                return int(val)
    except (KeyError, TypeError, IndexError):
        pass
    return None


def get_company_financials(cik: str, company_name: str | None = None) -> dict[str, Any]:
    """
    Return revenue, COGS, and COGS % for a company (from latest 10-K).
    Used for customer-ops financial comparison vs peers.
    """
    facts = fetch_company_facts(cik)
    subs = fetch_submissions(cik)
    name = company_name or (subs.get("name") if subs else None) or (facts.get("entityName") if facts else None) or "Unknown"

    revenue = _latest_revenue_usd(facts) if facts else None
    cogs = _latest_cogs_usd(facts) if facts else None

    cogs_pct = None
    if revenue and cogs and revenue > 0:
        cogs_pct = round(cogs / revenue * 100, 1)

    return {
        "name": name,
        "revenue_usd": revenue,
        "cogs_usd": cogs,
        "cogs_pct": cogs_pct,
    }


def get_company_public_summary(cik: str, company_name: str | None = None) -> str:
    """
    Build a text summary of public SEC data for the company (revenue, employees if available).
    Used as context for the Customer Ops Optimizer agent.
    """
    facts = fetch_company_facts(cik)
    submissions = fetch_submissions(cik)
    lines = [
        f"Company: {company_name or 'Unknown'}",
        f"SEC CIK: {_cik_pad(cik)}",
        "",
    ]
    revenue = None
    if facts:
        revenue = _latest_revenue_usd(facts)
        if not company_name and isinstance(facts.get("entityName"), str):
            lines[0] = f"Company: {facts['entityName']}"
        emp = _employee_count_from_facts(facts)
        if emp is not None:
            lines.append(f"Employees (from latest 10-K): {emp:,}")
            lines.append("")
    if submissions and not company_name:
        name = (submissions.get("name") or "").strip()
        if name:
            lines[0] = f"Company: {name}"
    if revenue is not None:
        rev_m = revenue / 1_000_000
        lines.append(f"Latest annual revenue (USD): ${rev_m:,.0f}M (from SEC filings)")
    else:
        lines.append("Latest annual revenue: not found in SEC company facts (company may use different reporting).")
    lines.append("")
    lines.append("(Use this scale and any employee/revenue data above to benchmark customer-facing functions and estimate optimization potential. If revenue or headcount is missing, state assumptions.)")
    return "\n".join(lines)