"""
Assessment engine — multi-company customer operations optimization.
Loads company-specific role estimates, applies AI/offshoring/productivity
benchmarks, builds peer comparison, attaches customer commentary, and
computes dollar impact.  Supports athenahealth and Oracle.
No LLM or SEC EDGAR required.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

REF_DIR = Path(__file__).parent.parent / "reference" / "customer_ops_optimizer"


def _load_json(name: str) -> dict:
    """Load a JSON file from the reference directory."""
    with open(REF_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Company configuration registry
# ---------------------------------------------------------------------------

COMPANY_CONFIG: dict[str, dict[str, Any]] = {
    "athenahealth": {
        "roles_file": "athenahealth_roles.json",
        "commentary_file": "athenahealth_commentary.json",
        "benchmarks_file": "role_benchmarks.json",
        "ai_horizons_file": "ai_horizons.json",
        "offshoring_file": "offshoring_roles.json",
        "role_costs_file": "role_costs.json",
        "func_keys": ("professional_services", "customer_success", "customer_support"),
        "productivity_capture_rate": 0.50,
        "peers": [
            {"name": "Epic Systems", "revenue_usd": 4200000000, "employees": 13500, "note": "Private, Verona WI"},
            {"name": "Veeva Systems", "revenue_usd": 2360000000, "employees": 7200, "note": "NYSE: VEEV"},
            {"name": "Cerner (Oracle Health)", "revenue_usd": 5800000000, "employees": 28500, "note": "Acquired by Oracle 2022"},
            {"name": "eClinicalWorks", "revenue_usd": 700000000, "employees": 6000, "note": "Private, Westborough MA"},
            {"name": "NextGen Healthcare", "revenue_usd": 630000000, "employees": 3000, "note": "NASDAQ: NXGN"},
            {"name": "Medidata (Dassault)", "revenue_usd": 950000000, "employees": 5500, "note": "Acquired by Dassault 2019"},
        ],
    },
    "oracle": {
        "roles_file": "oracle_roles.json",
        "commentary_file": "oracle_commentary.json",
        "benchmarks_file": "oracle_role_benchmarks.json",
        "ai_horizons_file": "oracle_ai_horizons.json",
        "offshoring_file": "oracle_offshoring_roles.json",
        "role_costs_file": "oracle_role_costs.json",
        "func_keys": ("professional_services", "customer_success", "customer_support"),
        "productivity_capture_rate": 0.65,
        "peers": [
            {"name": "SAP", "revenue_usd": 35000000000, "employees": 107000, "note": "NYSE: SAP"},
            {"name": "Salesforce", "revenue_usd": 35000000000, "employees": 73000, "note": "NYSE: CRM"},
            {"name": "Microsoft (Cloud+AI)", "revenue_usd": 105000000000, "employees": 228000, "note": "NASDAQ: MSFT — Intelligent Cloud + Productivity segments"},
            {"name": "ServiceNow", "revenue_usd": 10500000000, "employees": 24500, "note": "NYSE: NOW"},
            {"name": "Workday", "revenue_usd": 8000000000, "employees": 19800, "note": "NASDAQ: WDAY"},
            {"name": "Adobe", "revenue_usd": 21500000000, "employees": 30000, "note": "NASDAQ: ADBE"},
        ],
    },
}


def _get_company_financials(company_id: str) -> dict[str, Any]:
    """Return company financials from the roles JSON metadata."""
    cfg = COMPANY_CONFIG[company_id]
    roles = _load_json(cfg["roles_file"])
    meta = roles["metadata"]
    revenue = meta["revenue_usd"]
    employees = meta["total_employees"]
    return {
        "name": meta["company"],
        "ticker": None,
        "ownership": meta["ownership"],
        "industry": meta["industry"],
        "clinicians_on_platform": meta.get("clinicians_on_platform"),
        "revenue_usd": revenue,
        "employees": employees,
        "revenue_per_employee": round(revenue / employees) if revenue and employees else None,
        "india_employees": meta.get("india_employees"),
        "india_locations": meta.get("india_locations", []),
        "us_locations": meta.get("us_locations", []),
    }


def _build_peer_comparison(company_id: str) -> list[dict[str, Any]]:
    """Build revenue-per-employee comparison with industry peers."""
    peers = []
    for p in COMPANY_CONFIG[company_id]["peers"]:
        rev = p["revenue_usd"]
        emp = p["employees"]
        peers.append({
            "name": p["name"],
            "revenue_usd": rev,
            "employees": emp,
            "revenue_per_employee": round(rev / emp) if rev and emp else None,
            "note": p.get("note", ""),
        })
    return peers


# ---------------------------------------------------------------------------
# Blended FTE cost calculation
# ---------------------------------------------------------------------------

def _blended_fte_cost(
    onshore_usd: float,
    offshore_usd: float,
    offshore_pct: float,
) -> float:
    """Calculate blended annual cost per FTE given offshore mix."""
    onshore_share = 1.0 - (offshore_pct / 100.0)
    offshore_share = offshore_pct / 100.0
    return onshore_usd * onshore_share + offshore_usd * offshore_share


# ---------------------------------------------------------------------------
# Role-level assessment
# ---------------------------------------------------------------------------

def _assess_function(
    func_key: str,
    ath_roles: dict,
    benchmarks: dict,
    ai_horizons_list: list[dict],
    offshoring_list: list[dict],
    role_costs: dict,
    revenue_100m: float | None,
    productivity_capture_rate: float = 0.50,
) -> dict[str, Any]:
    """Build full assessment for one function (PS / CS / Support / RCM)."""
    func_bench = benchmarks[func_key]
    label = func_bench["label"]
    ath_func = ath_roles.get(func_key, {})
    ath_role_data = ath_func.get("roles", {})
    func_costs = role_costs.get(func_key, {})

    roles_out = []
    total_ai_impact_ftes = 0.0
    total_offshore_gap_ftes = 0.0
    total_productivity_ftes = 0.0
    total_estimated_ftes = 0.0

    ai_map = {r["role"]: r for r in ai_horizons_list}
    off_map = {r["role"]: r for r in offshoring_list}

    for role_b in func_bench["roles"]:
        role_name = role_b["role"]
        median = role_b["median_fte_per_100m"]
        fte_range = role_b["fte_per_100m"]

        ath_role = ath_role_data.get(role_name, {})
        est_fte = ath_role.get("estimated_ftes")
        fte_source = ath_role.get("source", "revenue_benchmark")
        fte_source_note = ath_role.get("source_note", "")
        current_offshore_pct = ath_role.get("current_offshore_pct", 0)

        if est_fte is None and revenue_100m:
            est_fte = round(median * revenue_100m, 1)
            fte_source = "revenue_benchmark"
            fte_source_note = "Estimated from revenue-based benchmark"

        bench_low = round(fte_range[0] * revenue_100m, 1) if revenue_100m else None
        bench_high = round(fte_range[1] * revenue_100m, 1) if revenue_100m else None
        bench_median = round(median * revenue_100m, 1) if revenue_100m else None

        # Productivity vs benchmark (% above/below median)
        pct_vs_median = 0.0
        if est_fte and bench_median and bench_median > 0:
            pct_vs_median = round((est_fte - bench_median) / bench_median * 100, 1)

        productivity_opportunity_ftes = 0.0
        if est_fte and bench_median and est_fte > bench_median:
            productivity_opportunity_ftes = round(productivity_capture_rate * (est_fte - bench_median), 1)

        # AI horizons
        ai_data = ai_map.get(role_name, {})
        horizons = ai_data.get("horizons", {})
        total_ai_pct = ai_data.get("total_impact_pct", 0)
        eff_2026 = ai_data.get("efficiency_pct_2026", 0)
        eff_2027 = ai_data.get("efficiency_pct_2027", 0)
        eff_2028 = ai_data.get("efficiency_pct_2028", 0)

        # AI efficiency adjustment: if role is 10%+ below benchmark, reduce by 0.85
        ai_adjustment_factor = 1.0
        if pct_vs_median <= -10.0:
            ai_adjustment_factor = 0.85

        adjusted_eff_2026 = round(eff_2026 * ai_adjustment_factor, 1)
        adjusted_eff_2027 = round(eff_2027 * ai_adjustment_factor, 1)
        adjusted_eff_2028 = round(eff_2028 * ai_adjustment_factor, 1)

        ai_impact_ftes = round(est_fte * total_ai_pct / 100 * ai_adjustment_factor, 1) if est_fte else None

        # Offshoring — current vs benchmark
        off_data = off_map.get(role_name, {})
        benchmark_offshore_pct = off_data.get("benchmark_offshore_pct", 0)
        offshore_gap_pct = max(0, benchmark_offshore_pct - current_offshore_pct)
        offshore_gap_ftes = round(est_fte * offshore_gap_pct / 100, 1) if est_fte else None

        # Dollar impact per role — costs from role_costs.json
        cost_data = func_costs.get(role_name, {})
        onshore_usd = cost_data.get("onshore_usd", 120000)
        offshore_usd = cost_data.get("offshore_usd", 38000)
        blended_cost = _blended_fte_cost(onshore_usd, offshore_usd, current_offshore_pct)

        # Offshoring savings = gap FTEs * (onshore cost - offshore cost)
        # Only the FTEs being moved from onshore to offshore generate savings
        offshore_savings_per_fte = onshore_usd - offshore_usd
        offshore_dollar_impact = round(offshore_gap_ftes * offshore_savings_per_fte) if offshore_gap_ftes else 0

        if est_fte:
            total_estimated_ftes += est_fte
        if ai_impact_ftes:
            total_ai_impact_ftes += ai_impact_ftes
        if offshore_gap_ftes:
            total_offshore_gap_ftes += offshore_gap_ftes
        total_productivity_ftes += productivity_opportunity_ftes

        role_out: dict[str, Any] = {
            "role": role_name,
            "short": role_b["short"],
            "description": role_b["description"],
            "estimated_ftes": est_fte,
            "fte_source": fte_source,
            "fte_source_note": fte_source_note,
            "current_offshore_pct": current_offshore_pct,
            "benchmark_range": [bench_low, bench_high],
            "benchmark_median": bench_median,
            "pct_vs_benchmark": pct_vs_median,
            "productivity": {
                "opportunity_ftes": productivity_opportunity_ftes,
                "excess_above_median": round(est_fte - bench_median, 1) if est_fte and bench_median else 0,
                "has_opportunity": productivity_opportunity_ftes > 0,
            },
            "ai": {
                "h1_automate": horizons.get("h1_automate", {}),
                "h2_ai_assisted": horizons.get("h2_ai_assisted", {}),
                "h3_agentic": horizons.get("h3_agentic", {}),
                "total_impact_pct": total_ai_pct,
                "efficiency_pct_2026": adjusted_eff_2026,
                "efficiency_pct_2027": adjusted_eff_2027,
                "efficiency_pct_2028": adjusted_eff_2028,
                "ai_adjustment_factor": ai_adjustment_factor,
                "impact_ftes": ai_impact_ftes,
            },
            "offshoring": {
                "rating": off_data.get("offshore_rating", "N/A"),
                "rationale": off_data.get("rationale", ""),
                "current_offshore_pct": current_offshore_pct,
                "benchmark_offshore_pct": benchmark_offshore_pct,
                "gap_pct": offshore_gap_pct,
                "gap_ftes": offshore_gap_ftes,
                "notes": off_data.get("notes", ""),
            },
            "costs": {
                "onshore_usd": onshore_usd,
                "offshore_usd": offshore_usd,
                "blended_cost": round(blended_cost),
            },
        }
        roles_out.append(role_out)

    est_total = ath_func.get("estimated_total_ftes") or (round(total_estimated_ftes) if total_estimated_ftes else None)

    return {
        "function": label,
        "function_key": func_key,
        "typical_pct_of_headcount": func_bench["typical_pct_of_total_headcount"],
        "estimated_total_ftes": est_total,
        "estimation_note": ath_func.get("estimation_note", ""),
        "roles": roles_out,
        "summary": {
            "total_ai_addressable_ftes": round(total_ai_impact_ftes, 1),
            "total_offshore_gap_ftes": round(total_offshore_gap_ftes, 1),
            "total_productivity_ftes": round(total_productivity_ftes, 1),
        },
    }


# ---------------------------------------------------------------------------
# Dollar impact calculation (per year, per lever)
# ---------------------------------------------------------------------------

def _compute_dollar_impact(
    functions: list[dict],
    role_costs: dict,
    ath_roles: dict,
) -> dict[str, Any]:
    """
    Compute run-rate dollar impact by lever for 2026, 2027, 2028.
    AI and productivity savings factor in onshore/offshore mix — equally
    impact onshore and offshore populations proportionally.
    """
    impact_2026 = {"productivity": 0, "ai": 0, "offshoring": 0}
    impact_2027 = {"productivity": 0, "ai": 0, "offshoring": 0}
    impact_2028 = {"productivity": 0, "ai": 0, "offshoring": 0}

    for func in functions:
        fk = func["function_key"]
        func_costs = role_costs.get(fk, {})
        ath_func_roles = ath_roles.get(fk, {}).get("roles", {})

        for role in func["roles"]:
            rn = role["role"]
            est = role["estimated_ftes"] or 0
            if est == 0:
                continue

            cost_data = func_costs.get(rn, {})
            onshore_usd = cost_data.get("onshore_usd", 120000)
            offshore_usd = cost_data.get("offshore_usd", 38000)
            current_offshore_pct = role.get("current_offshore_pct", 0)
            blended_cost = _blended_fte_cost(onshore_usd, offshore_usd, current_offshore_pct)

            # Productivity: ramps — 75% realized in 2026, 100% from 2027+
            prod_ftes = role["productivity"]["opportunity_ftes"]
            prod_dollars_full = round(prod_ftes * blended_cost)
            impact_2026["productivity"] += round(prod_dollars_full * 0.75)
            impact_2027["productivity"] += prod_dollars_full
            impact_2028["productivity"] += prod_dollars_full

            # AI: incremental by year, uses blended cost (proportional onshore/offshore)
            eff_26 = role["ai"]["efficiency_pct_2026"]
            eff_27 = role["ai"]["efficiency_pct_2027"]
            eff_28 = role["ai"]["efficiency_pct_2028"]

            ai_base_ftes = est - prod_ftes
            ai_ftes_26 = ai_base_ftes * eff_26 / 100
            ai_ftes_27 = ai_base_ftes * eff_27 / 100
            ai_ftes_28 = ai_base_ftes * eff_28 / 100

            impact_2026["ai"] += round(ai_ftes_26 * blended_cost)
            impact_2027["ai"] += round(ai_ftes_27 * blended_cost)
            impact_2028["ai"] += round(ai_ftes_28 * blended_cost)

            # Offshoring: ramps — 50% realized in 2026, 100% from 2027+
            offshore_gap_ftes = role["offshoring"]["gap_ftes"] or 0
            savings_per_fte = onshore_usd - offshore_usd
            off_dollars_full = round(offshore_gap_ftes * savings_per_fte)
            impact_2026["offshoring"] += round(off_dollars_full * 0.50)
            impact_2027["offshoring"] += off_dollars_full
            impact_2028["offshoring"] += off_dollars_full

    return {
        "2026": {
            "productivity": impact_2026["productivity"],
            "ai": impact_2026["ai"],
            "offshoring": impact_2026["offshoring"],
            "total": impact_2026["productivity"] + impact_2026["ai"] + impact_2026["offshoring"],
        },
        "2027": {
            "productivity": impact_2027["productivity"],
            "ai": impact_2027["ai"],
            "offshoring": impact_2027["offshoring"],
            "total": impact_2027["productivity"] + impact_2027["ai"] + impact_2027["offshoring"],
        },
        "2028": {
            "productivity": impact_2028["productivity"],
            "ai": impact_2028["ai"],
            "offshoring": impact_2028["offshoring"],
            "total": impact_2028["productivity"] + impact_2028["ai"] + impact_2028["offshoring"],
        },
    }


# ---------------------------------------------------------------------------
# Priority roadmap — use-case-level AI, role-level prod+offshoring
# ---------------------------------------------------------------------------

AI_USE_CASES = [
    # ---------------------------------------------------------------
    # 2026 — Quick Wins (H1) + Near-term (H2)
    # Target: ~395 FTEs (PS=115, CS=80, Support=200)
    # ---------------------------------------------------------------
    {
        "id": "ai-password-reset",
        "name": "AI chat for password resets & account access",
        "description": "Self-serve automated workflow handles locked accounts, security question resets, and patient portal login issues via AI chat. Deflects ~70% of password/access tickets (~10-14% of total L1 volume).",
        "mechanism": "AI agent verifies identity, triggers automated reset, walks user through portal re-enrollment.",
        "year": 2026,
        "half": "H1",
        "category": "Quick Win",
        "horizon": "H1 Automate",
        "impacted_roles": ["Tier-1 Support Representatives"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 12,
        "estimated_fte_impact": 50,
    },
    {
        "id": "ai-claims-status",
        "name": "AI-powered claims status & eligibility lookup",
        "description": "Conversational AI handles 'where is my claim' and eligibility verification queries via integration with Availity (450+ payers) and athenaCollector. Covers ~15-20% of L1 ticket volume.",
        "mechanism": "AI retrieves claim status from payer API, explains hold codes in plain language, provides next-step guidance.",
        "year": 2026,
        "half": "H1",
        "category": "Quick Win",
        "horizon": "H1 Automate",
        "impacted_roles": ["Tier-1 Support Representatives"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 18,
        "estimated_fte_impact": 65,
    },
    {
        "id": "ai-kb-auto-generation",
        "name": "AI auto-generation of KB articles from resolved tickets",
        "description": "AI monitors resolved support tickets, clusters common patterns, auto-drafts knowledge base articles for O-help. Auto-retires outdated content based on age and search-result feedback. Reduces stale-article complaints and improves self-serve resolution for Tier-1 agents.",
        "mechanism": "NLP clusters resolved tickets by topic, generates draft articles, routes for human review, publishes to O-help. Auto-flags stale articles with low helpfulness scores.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Knowledge Base Authors / Content Mgrs", "Tier-1 Support Representatives"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 8,
        "estimated_fte_impact": 40,
    },
    {
        "id": "ai-smart-triage-routing",
        "name": "AI-powered case triage, routing & agent-assist",
        "description": "Intent classification at ticket creation auto-categorizes, prioritizes, and routes cases to the right queue or specialist. Provides real-time agent-assist with suggested resolutions for Tier-2 engineers. Auto-generates QA scorecards from interaction data for quality analysts. Feeds workforce scheduling with predicted volume patterns for WFM planners.",
        "mechanism": "NLP classifier reads ticket subject + description, assigns category/priority/queue. Agent-assist panel surfaces relevant KB articles and similar resolved cases. Auto-QA engine scores random sample of interactions. WFM module ingests predicted volumes for schedule optimization.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Tier-2 Technical Support Engineers", "Support Operations / Workforce Mgmt", "Support QA / CSAT Analysts"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 45,
    },
    {
        "id": "ai-handoff-synthesizer",
        "name": "AI-powered sales-to-implementation handoff synthesizer",
        "description": "AI extracts contract data, scope details, and customer expectations from sales artifacts. Auto-populates QSG, flags misaligned timelines, and generates kick-off prep decks for implementation managers. Pre-populates configuration templates from contract scope so technical analysts can start builds faster. Addresses systematic handoff gaps between sales and delivery.",
        "mechanism": "NLP processes sales proposals, contracts, discovery notes. Outputs structured handoff package with gaps flagged for EM review. Auto-generates configuration pre-population scripts from scoped modules.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Implementation & Delivery Managers", "Configuration / Technical Analysts"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 55,
    },
    {
        "id": "ai-qsg-automap",
        "name": "AI auto-mapping of QSG data to athena configuration & validation",
        "description": "Auto-generate foundational build from QSG data, eliminating manual re-keying between systems. Fields mapped intelligently even when not 1:1 between QSG and athena. Auto-generates regression test suites from the generated configuration to validate correctness before go-live.",
        "mechanism": "AI reads QSG exports, maps fields to athena table structure, generates configuration scripts, validates against business rules. Automatically produces UAT test cases matching the generated config for QA validation.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Configuration / Technical Analysts", "QA / Test Engineers"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 60,
    },
    {
        "id": "ai-agentic-csm-plays",
        "name": "Agentic CSM plays",
        "description": "AI monitors customer usage signals in real-time — detecting drops in module adoption, declining login frequency, or feature abandonment — and auto-triggers personalized engagement campaigns. Runs churn and adoption plays backed by health scoring: when a practice stops using a clinical workflow it previously adopted, the system auto-sends targeted re-engagement content, schedules CSM outreach for high-value accounts, and triggers digital nudges for the long tail. Auto-generates health score insights and anomaly reports for health/analytics analysts, shifting their work from manual data pulls to model tuning and strategic analysis.",
        "mechanism": "Event-driven engine monitors usage telemetry across athenaOne modules. Health scoring model classifies accounts by risk tier. Play engine matches risk signals to pre-built playbooks (adoption drop, feature churn, billing anomaly) and auto-executes: personalized email sequences, in-app messaging, webinar invitations for digital accounts; CSM task creation for named accounts.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Customer Success Managers", "Scale / Digital CS Reps", "Customer Health / Analytics Analysts"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 80,
    },
    # ---------------------------------------------------------------
    # 2027 — AI-Assisted + partial Agentic
    # Target: ~265 FTEs (PS=55+45=100 split, CS=45+20=65, Support=120)
    # ---------------------------------------------------------------
    {
        "id": "ai-how-to-agent",
        "name": "AI conversational agent for how-to, workflow & knowledge validation",
        "description": "Full conversational AI agent handles 'how do I' questions about athenaOne workflows: scheduling, billing setup, order entry, document management. Covers ~20-25% of Tier-1 volume. Escalates complex diagnostic questions to Tier-2 engineers with full context summary, reducing their intake overhead.",
        "mechanism": "Retrieval-augmented generation over athenaOne documentation + resolved tickets. Walks user through multi-step workflows with screenshots. Escalates to human when confidence low, packaging full interaction context for Tier-2 handoff.",
        "year": 2027,
        "half": "H1",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Tier-1 Support Representatives", "Tier-2 Technical Support Engineers"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 22,
        "estimated_fte_impact": 120,
    },
    {
        "id": "ai-renewal-automation",
        "name": "AI-powered long-tail renewal automation & contract generation",
        "description": "Automates the end-to-end renewal process for long-tail accounts: AI generates renewal quotes based on current contract terms, usage patterns, and pricing rules. Auto-populates contract templates, manages reminder cadences, and routes approvals. Provides optimal discount recommendations within guardrails based on churn propensity and account health. Automates territory optimization and renewal pipeline forecasting for CS operations. For digital CS, powers segment-specific renewal outreach with personalized messaging.",
        "mechanism": "Renewal engine ingests contract data, usage metrics, and health scores. Auto-generates quotes with recommended pricing tiers. Contract template module populates terms and routes for e-signature. Discount optimizer recommends retention offers within pre-set guardrails. CS Ops integration auto-updates pipeline forecasts and territory assignments based on renewal outcomes. Digital outreach triggers personalized renewal sequences for long-tail accounts.",
        "year": 2027,
        "half": "H1",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Renewal Managers", "CS Operations / Strategy Analysts", "Scale / Digital CS Reps"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 45,
    },
    {
        "id": "ai-go-live-validator",
        "name": "AI-powered go-live readiness validation & test automation",
        "description": "AI generates comprehensive test suites from implementation specifications, executes visual regression detection, and validates configuration completeness before go-live. Smart test prioritization focuses QA effort on highest-risk areas. Provides solution architects with automated API compatibility checks and integration health assessments. Delivers practice leads with AI-powered methodology effectiveness metrics and talent-demand forecasting based on project pipeline.",
        "mechanism": "AI reads implementation specs and user stories, auto-generates test cases with expected outcomes. Visual regression engine compares pre/post configuration screenshots. Integration validator checks API endpoints, data flows, and payer connectivity. Leadership dashboard aggregates project health, resource utilization, and methodology adherence metrics.",
        "year": 2027,
        "half": "H1",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["QA / Test Engineers", "Solution Architects", "Practice Leads / Directors"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 55,
    },
    {
        "id": "ai-training-content-gen",
        "name": "Adaptive AI training & customer-specific enablement",
        "description": "AI creates customer-specific training content that adapts to each practice's unique workflow, specialty mix, and adoption maturity. AI virtual assistants provide on-demand answers to practice staff during go-live and steady-state. Digital twin simulations replicate the customer's actual athenaOne environment for risk-free hands-on practice. Auto-generates tailored self-serve resources — videos, FAQs, how-to guides — customized to the customer's configured modules and workflows. Powers the content library for self-serve onboarding flows and ongoing feature adoption.",
        "mechanism": "Content engine ingests customer configuration data, specialty profiles, and usage patterns. AI generates training materials tailored to the specific modules and workflows the customer has deployed. Virtual assistant uses RAG over customer-specific documentation and resolved support tickets. Digital twin engine clones customer configuration into sandboxed environment. Self-serve resource generator auto-produces video walkthroughs, FAQ pages, and step-by-step guides keyed to customer's active features.",
        "year": 2027,
        "half": "H2",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Training & Enablement Specialists", "Onboarding Specialists"],
        "impacted_functions": ["professional_services", "customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 45,
    },
    {
        "id": "ai-support-quality-analytics",
        "name": "AI-powered support quality analytics & KB optimization",
        "description": "AI auto-scores 100% of support interactions against quality rubrics — replacing manual sampled QA with full-coverage monitoring. Identifies content gaps where agents struggle and auto-prioritizes KB article creation and updates. Generates demand forecasts from ticket trend data to optimize workforce scheduling.",
        "mechanism": "NLP engine scores every interaction for resolution quality, compliance, and customer sentiment. Content gap module identifies topics where agents rely on escalation rather than KB, auto-drafts article priorities. Demand forecasting model ingests historical ticket volumes, seasonality, and product release calendars for WFM planning.",
        "year": 2027,
        "half": "H2",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Support QA / CSAT Analysts", "Knowledge Base Authors / Content Mgrs", "Support Operations / Workforce Mgmt"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 30,
    },
    {
        "id": "ai-escalation-premium-monitoring",
        "name": "AI-driven escalation intelligence & premium account monitoring",
        "description": "Detects multi-case clusters and velocity spikes that signal emerging critical issues, auto-generating war-room briefs with affected accounts and estimated blast radius for escalation managers. Proactive telemetry monitoring for premium/designated accounts surfaces anomalies before customers report them, enabling preemptive outreach.",
        "mechanism": "Pattern detection engine monitors ticket velocity, cross-account clustering, and severity distribution in real-time. Auto-drafts escalation briefs with impact radius and recommended response. Premium monitoring layer ingests environment telemetry and usage signals, triggers proactive alerts for designated support engineers when anomalies detected.",
        "year": 2027,
        "half": "H2",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Escalation / Critical-Issue Managers", "Premium / Designated Support Engineers"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 20,
    },
    # ---------------------------------------------------------------
    # 2028 — Agentic AI
    # Target: ~300 FTEs (PS+CS=85+70=155, Support=145)
    # ---------------------------------------------------------------
    {
        "id": "ai-autonomous-t1",
        "name": "Autonomous AI agent for Tier-1 resolution (non-clinical)",
        "description": "Full autonomous resolution of non-clinical Tier-1 cases: configuration how-to, billing questions, scheduling issues, document management. Human oversight for clinical/safety issues only. Replaces the majority of live Tier-1 agent interactions with an AI agent that resolves end-to-end.",
        "mechanism": "Agentic AI with tool use: reads customer context, queries athenaOne via API, performs actions (reset settings, adjust configs), generates resolution summary. Auto-escalates if outside scope.",
        "year": 2028,
        "half": "H1",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["Tier-1 Support Representatives"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 15,
        "estimated_fte_impact": 145,
    },
    {
        "id": "ai-self-serve-onboarding",
        "name": "Self-serve interactive onboarding with AI guidance",
        "description": "AI-guided self-serve implementation for small practices: auto-configured environment, interactive setup wizard, real-time sandboxes, autonomous milestone tracking. Embeds AI-generated training content and personalized learning paths directly into the onboarding flow so training specialists no longer need to deliver live sessions for standard implementations.",
        "mechanism": "Agentic AI walks practice through setup steps, auto-configures based on specialty and size, creates practice sandbox, verifies readiness, and triggers go-live when ready. Embedded training modules adapt in real-time based on user proficiency signals.",
        "year": 2028,
        "half": "H2",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["Configuration / Technical Analysts", "Implementation & Delivery Managers", "Onboarding Specialists"],
        "impacted_functions": ["professional_services", "customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 85,
    },
    {
        "id": "ai-autonomous-cs-health",
        "name": "Agentic customer success — autonomous account management",
        "description": "AI agents take end-to-end actions on behalf of CSMs for larger accounts: autonomous health monitoring, proactive intervention execution, expansion opportunity identification, and quarterly business review preparation — with human CSMs retaining relationship ownership and strategic oversight. For the long tail of accounts, a fully autonomous model manages the entire lifecycle: usage optimization nudges, renewal orchestration, and churn intervention — with human escalation only for exceptions. Automates renewal execution within guardrails for long-tail accounts.",
        "mechanism": "Agentic system with tool-use capabilities monitors account health signals continuously. For named accounts, AI executes playbooks (adoption campaigns, risk interventions) and prepares CSM briefings with recommended actions. For long-tail accounts, fully autonomous agent manages lifecycle end-to-end: triggers usage optimization sequences, orchestrates renewals, and intervenes on churn signals.",
        "year": 2028,
        "half": "H1",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["Customer Success Managers", "Scale / Digital CS Reps", "Renewal Managers"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 70,
    },
]


# ---------------------------------------------------------------------------
# Oracle AI use cases
# ---------------------------------------------------------------------------

ORACLE_AI_USE_CASES = [
    # 2026 — Quick Wins + Near-term
    {
        "id": "orc-ai-ticket-routing",
        "name": "AI-powered cross-product ticket routing & triage",
        "description": "Intent classification at ticket creation auto-categorizes by product line (Fusion, OCI, On-Prem, NetSuite), severity, and customer tier. Routes to the correct product-specific support queue, eliminating manual triage delays and cross-product misrouting — one of Oracle's biggest support pain points.",
        "mechanism": "NLP classifier reads My Oracle Support ticket subject + description, identifies product line, assigns severity and queue. Cross-product detector flags multi-product issues and creates linked collaboration tickets automatically.",
        "year": 2026,
        "half": "H1",
        "category": "Quick Win",
        "horizon": "H1 Automate",
        "impacted_roles": ["L1 Support Engineers (Fusion/SaaS)", "L1/L2 NOC Engineers (OCI)", "L2 Frontend Support Engineers"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 15,
        "estimated_fte_impact": 280,
    },
    {
        "id": "orc-ai-fusion-config-validation",
        "name": "AI-powered Fusion configuration validation & auto-mapping",
        "description": "Auto-generate Fusion Apps configuration from requirements documents. Validates field mappings, cross-module dependencies, and data migration scripts. Eliminates manual re-keying and catches configuration drift before go-live.",
        "mechanism": "AI reads requirements specs, maps fields to Fusion table structure, generates configuration scripts, validates against business rules. Auto-generates UAT test cases matching the generated config.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Delivery Engineers (Functional)", "Delivery Engineers (Technical)"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 350,
    },
    {
        "id": "orc-ai-noc-incident-triage",
        "name": "Automated OCI NOC incident detection & triage",
        "description": "AI monitors OCI infrastructure telemetry in real-time, auto-detects anomalies and known failure patterns, and triggers automated runbooks for standard incidents. Reduces NOC engineer manual monitoring load and accelerates mean-time-to-detect.",
        "mechanism": "Anomaly detection engine monitors cloud telemetry across compute, network, and storage. Known-pattern matcher triggers automated runbooks. Novel anomalies auto-escalated with diagnostic context to L2 engineers.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["L1/L2 NOC Engineers (OCI)"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 20,
        "estimated_fte_impact": 150,
    },
    {
        "id": "orc-ai-handoff-synthesizer",
        "name": "AI-powered sales-to-consulting handoff & project scoping",
        "description": "AI extracts contract data, scope details, and customer expectations from sales artifacts. Auto-populates project plans, flags misaligned timelines, generates kick-off prep materials. Addresses handoff gaps between Oracle's decentralized sales orgs and consulting teams.",
        "mechanism": "NLP processes sales proposals, contracts, discovery notes. Outputs structured handoff package with gaps flagged for practice manager review. Auto-generates complexity score and resource allocation recommendations.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Practice Managers / Engagement Leads", "Program / Project Managers"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 120,
    },
    {
        "id": "orc-ai-csm-engagement-plays",
        "name": "Agentic CSM engagement plays for cloud customers",
        "description": "AI monitors cloud usage signals — detecting drops in module adoption, declining login frequency, or feature abandonment — and auto-triggers personalized engagement campaigns. Runs churn and adoption plays backed by health scoring for Fusion and NetSuite customers. Provides coverage for mid-market accounts that lack dedicated CSMs.",
        "mechanism": "Event-driven engine monitors usage telemetry across Fusion/NetSuite modules. Health scoring model classifies accounts by risk tier. Play engine matches risk signals to pre-built playbooks and auto-executes personalized outreach.",
        "year": 2026,
        "half": "H2",
        "category": "Near-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Customer Success Managers", "CS Operations / Strategy Analysts"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 120,
    },
    # 2027 — AI-Assisted + partial Agentic
    {
        "id": "orc-ai-fusion-how-to-agent",
        "name": "AI conversational agent for Fusion/NetSuite how-to",
        "description": "Full conversational AI agent handles 'how do I' questions about Fusion Apps and NetSuite workflows: ERP configuration, HCM setup, report building, workflow automation. Covers ~20-25% of L1 volume. Escalates complex issues to L2 with full context.",
        "mechanism": "RAG over My Oracle Support documentation, resolved tickets, and product docs. Walks user through multi-step workflows with screenshots. Escalates to human when confidence low.",
        "year": 2027,
        "half": "H1",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["L1 Support Engineers (Fusion/SaaS)", "Advanced Support Engineers (ASE)"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 22,
        "estimated_fte_impact": 220,
    },
    {
        "id": "orc-ai-cloud-migration-accelerator",
        "name": "AI-powered cloud migration assessment & automation",
        "description": "AI analyzes on-prem Oracle environments (database, middleware, applications) and auto-generates cloud migration plans for OCI. Identifies dependencies, estimates complexity, generates IaC templates, and validates migration readiness. Reduces migration scoping from weeks to days.",
        "mechanism": "Discovery agent scans on-prem environment, catalogs components and dependencies. Migration planner generates OCI architecture recommendations, IaC templates, and testing checklists. Complexity scorer estimates effort and risk.",
        "year": 2027,
        "half": "H1",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Delivery Engineers (Technical)", "Solution Architects"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 180,
    },
    {
        "id": "orc-ai-renewal-automation",
        "name": "AI-powered cloud renewal automation & contract generation",
        "description": "Automates end-to-end renewal process for long-tail cloud subscriptions: AI generates renewal quotes based on current contract terms, usage patterns, and pricing rules. Auto-populates contract templates, manages reminder cadences, and provides optimal discount recommendations within guardrails.",
        "mechanism": "Renewal engine ingests contract data, usage metrics, and health scores. Auto-generates quotes with recommended pricing tiers. Contract template module populates terms and routes for approval. Discount optimizer recommends retention offers within guardrails.",
        "year": 2027,
        "half": "H1",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Renewal / Expansion Managers", "Service Delivery Managers (Paid Tier)"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 90,
    },
    {
        "id": "orc-ai-kb-auto-generation",
        "name": "AI auto-generation of My Oracle Support content",
        "description": "AI monitors resolved support tickets, clusters common patterns, and auto-drafts knowledge base articles for My Oracle Support. Auto-retires outdated content — especially for cloud-migrated products where on-prem documentation is stale. Keeps KB current with product evolution.",
        "mechanism": "NLP clusters resolved tickets by topic, generates draft articles, routes for human review, publishes to My Oracle Support. Auto-flags stale articles referencing deprecated on-prem versions.",
        "year": 2027,
        "half": "H2",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Knowledge Base / Content Engineers", "Support Operations / Workforce Mgmt"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 10,
        "estimated_fte_impact": 65,
    },
    {
        "id": "orc-ai-cross-product-synthesis",
        "name": "AI cross-product case synthesis & collaboration",
        "description": "AI detects when a support issue spans multiple Oracle product lines (Fusion + OCI, Database + Analytics) and auto-synthesizes context across tickets. Creates unified case views that bridge Oracle's decentralized support orgs, eliminating the customer bouncing between teams.",
        "mechanism": "Cross-product detection engine analyzes ticket content for multi-product signals. Auto-creates linked collaboration tickets with synthesized context. Unified dashboard shows all related tickets across product orgs for the assigned engineer.",
        "year": 2027,
        "half": "H2",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Senior Advanced Support Engineers (Sr. ASE)", "Incident Management (OCI Critical)"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 45,
    },
    {
        "id": "orc-ai-tam-proactive-monitoring",
        "name": "AI-powered proactive account monitoring for TAMs",
        "description": "AI monitors environment telemetry, usage patterns, and support ticket velocity for paid-tier accounts. Auto-generates proactive health reports, detects emerging issues before customers report them, and prepares quarterly business review materials. Shifts TAM work from reactive firefighting to proactive value delivery.",
        "mechanism": "Monitoring engine ingests environment telemetry, usage data, and ticket patterns. Anomaly detector surfaces emerging issues. QBR generator auto-produces account health decks with recommendations. Alert system triggers proactive outreach on detected anomalies.",
        "year": 2027,
        "half": "H2",
        "category": "Medium-term",
        "horizon": "H2 AI-Assisted",
        "impacted_roles": ["Technical Account Managers (TAMs)"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 65,
    },
    # 2028 — Agentic AI
    {
        "id": "orc-ai-autonomous-l1",
        "name": "Autonomous AI agent for L1 Fusion/SaaS resolution",
        "description": "Full autonomous resolution of standard L1 Fusion and SaaS cases: configuration how-to, user access, report setup, workflow troubleshooting. Human oversight for data integrity and security issues only. Replaces the majority of live L1 interactions.",
        "mechanism": "Agentic AI with tool use: reads customer context, queries Fusion/NetSuite via API, performs configuration actions, generates resolution summary. Auto-escalates if outside scope.",
        "year": 2028,
        "half": "H1",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["L1 Support Engineers (Fusion/SaaS)"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 18,
        "estimated_fte_impact": 320,
    },
    {
        "id": "orc-ai-self-serve-cloud-onboarding",
        "name": "Self-serve cloud onboarding with AI guidance",
        "description": "AI-guided self-serve implementation for standard Fusion Cloud deployments: auto-configured environment, interactive setup wizard, real-time sandboxes, autonomous milestone tracking. Reduces dependence on Oracle Consulting for standard implementations.",
        "mechanism": "Agentic AI walks customer through setup steps, auto-configures based on industry and size, creates sandbox environment, verifies readiness, and triggers go-live when ready.",
        "year": 2028,
        "half": "H1",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["Delivery Engineers (Functional)", "Practice Managers / Engagement Leads"],
        "impacted_functions": ["professional_services"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 250,
    },
    {
        "id": "orc-ai-autonomous-cs",
        "name": "Agentic customer success — autonomous cloud account management",
        "description": "AI agents take end-to-end actions for cloud accounts: autonomous health monitoring, proactive intervention execution, expansion opportunity identification, and QBR preparation — with human CSMs retaining relationship ownership for enterprise accounts. For the long tail of cloud subscriptions, a fully autonomous model manages the entire lifecycle.",
        "mechanism": "Agentic system monitors account health signals continuously. For enterprise accounts, AI executes playbooks and prepares CSM briefings. For long-tail accounts, fully autonomous agent manages lifecycle end-to-end: triggers usage optimization, orchestrates renewals, intervenes on churn signals.",
        "year": 2028,
        "half": "H2",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["Customer Success Managers", "Renewal / Expansion Managers"],
        "impacted_functions": ["customer_success"],
        "estimated_ticket_deflection_pct": None,
        "estimated_fte_impact": 150,
    },
    {
        "id": "orc-ai-autonomous-noc",
        "name": "Autonomous OCI infrastructure self-healing",
        "description": "Autonomous AI for OCI infrastructure: self-healing for known failure patterns, proactive scaling based on workload predictions, autonomous incident remediation for standard issues. Human oversight for novel incidents and multi-service cascading failures only.",
        "mechanism": "Agentic system with infrastructure tool use: monitors telemetry, detects anomalies, executes automated remediation runbooks, triggers scaling actions. Auto-escalates novel patterns to incident management with full diagnostic context.",
        "year": 2028,
        "half": "H2",
        "category": "Transformation",
        "horizon": "H3 Agentic",
        "impacted_roles": ["L1/L2 NOC Engineers (OCI)"],
        "impacted_functions": ["customer_support"],
        "estimated_ticket_deflection_pct": 15,
        "estimated_fte_impact": 180,
    },
]


# Map company_id to its use case list
_USE_CASES_BY_COMPANY: dict[str, list[dict]] = {
    "athenahealth": AI_USE_CASES,
    "oracle": ORACLE_AI_USE_CASES,
}


def _build_roadmap(functions: list[dict], company_id: str = "athenahealth") -> dict[str, Any]:
    """
    Build priority roadmap organized by year and lever type.
    AI items are at use-case level; productivity and offshoring at role level.
    """
    prod_items = []
    offshoring_items = []

    for func in functions:
        for role in func["roles"]:
            est = role["estimated_ftes"] or 0
            if est == 0:
                continue

            # Productivity items (2026)
            prod_ftes = role["productivity"]["opportunity_ftes"]
            if prod_ftes > 0:
                prod_items.append({
                    "role": role["role"],
                    "function": func["function"],
                    "function_key": func["function_key"],
                    "lever": "Productivity",
                    "year": 2026,
                    "impact_ftes": prod_ftes,
                    "description": f"Rationalize {prod_ftes} FTEs ({role['pct_vs_benchmark']}% above median benchmark)",
                })

            # Offshoring items (2026)
            off_gap = role["offshoring"]["gap_ftes"] or 0
            if off_gap > 2:
                offshoring_items.append({
                    "role": role["role"],
                    "function": func["function"],
                    "function_key": func["function_key"],
                    "lever": "Offshoring",
                    "year": 2026,
                    "impact_ftes": off_gap,
                    "description": f"Move {off_gap} FTEs offshore ({role['offshoring']['current_offshore_pct']}% -> {role['offshoring']['benchmark_offshore_pct']}%)",
                })

    prod_items.sort(key=lambda x: x["impact_ftes"], reverse=True)
    offshoring_items.sort(key=lambda x: x["impact_ftes"], reverse=True)

    use_cases = _USE_CASES_BY_COMPANY.get(company_id, AI_USE_CASES)
    ai_by_year: dict[int, list] = {2026: [], 2027: [], 2028: []}
    for uc in use_cases:
        ai_by_year[uc["year"]].append(uc)

    return {
        "years": {
            "2026": {
                "productivity": prod_items,
                "offshoring": offshoring_items,
                "ai": ai_by_year[2026],
            },
            "2027": {
                "productivity": [],
                "offshoring": [],
                "ai": ai_by_year[2027],
            },
            "2028": {
                "productivity": [],
                "offshoring": [],
                "ai": ai_by_year[2028],
            },
        },
        "ai_use_cases": use_cases,
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run_assessment(company_id: str = "athenahealth") -> dict[str, Any]:
    """
    Run a full customer operations assessment for the given company.
    Returns structured dict ready for frontend rendering.
    """
    cfg = COMPANY_CONFIG[company_id]

    company = _get_company_financials(company_id)
    revenue = company["revenue_usd"]
    revenue_100m = revenue / 100_000_000 if revenue else None

    peer_financials = _build_peer_comparison(company_id)

    benchmarks = _load_json(cfg["benchmarks_file"])
    ai_horizons = _load_json(cfg["ai_horizons_file"])
    offshoring = _load_json(cfg["offshoring_file"])
    co_roles = _load_json(cfg["roles_file"])
    commentary = _load_json(cfg["commentary_file"])
    role_costs = _load_json(cfg["role_costs_file"])

    func_keys = cfg["func_keys"]
    productivity_rate = cfg.get("productivity_capture_rate", 0.50)
    functions = []
    for func_key in func_keys:
        func_result = _assess_function(
            func_key=func_key,
            ath_roles=co_roles,
            benchmarks=benchmarks,
            ai_horizons_list=ai_horizons.get(func_key, []),
            offshoring_list=offshoring.get(func_key, []),
            role_costs=role_costs,
            revenue_100m=revenue_100m,
            productivity_capture_rate=productivity_rate,
        )
        func_commentary = commentary.get(func_key, {})
        func_result["commentary"] = {
            "theme": func_commentary.get("theme", ""),
            "quotes": func_commentary.get("quotes", []),
            "insight_summary": func_commentary.get("insight_summary", ""),
        }
        functions.append(func_result)

    total_est_ftes = sum(f["estimated_total_ftes"] or 0 for f in functions)
    total_ai_ftes = sum(f["summary"]["total_ai_addressable_ftes"] for f in functions)
    total_offshore_gap = sum(f["summary"]["total_offshore_gap_ftes"] for f in functions)
    total_productivity = sum(f["summary"]["total_productivity_ftes"] for f in functions)

    dollar_impact = _compute_dollar_impact(functions, role_costs, co_roles)
    roadmap = _build_roadmap(functions, company_id=company_id)

    return {
        "company": company,
        "peer_financials": peer_financials,
        "functions": functions,
        "summary": {
            "total_customer_ops_ftes": round(total_est_ftes),
            "total_ai_addressable_ftes": round(total_ai_ftes),
            "total_offshore_gap_ftes": round(total_offshore_gap),
            "total_productivity_ftes": round(total_productivity),
            "ai_pct_of_total": round(total_ai_ftes / total_est_ftes * 100, 1) if total_est_ftes else None,
            "offshore_gap_pct_of_total": round(total_offshore_gap / total_est_ftes * 100, 1) if total_est_ftes else None,
            "productivity_pct_of_total": round(total_productivity / total_est_ftes * 100, 1) if total_est_ftes else None,
        },
        "dollar_impact": dollar_impact,
        "roadmap": roadmap,
    }