# NRR CX Diagnostics Starter

A starter kit for generating client-ready CX diagnostic web apps. Built for McKinsey colleagues working on customer experience, NRR benchmarking, and agentic transformation engagements. Tell Cursor what to build, review the output, deploy to Vercel, and share the link with your client team.

---

## Products

| Product | Description | Effort | Live Example |
|---|---|---|---|
| **NRR CX Basic** | NRR benchmark vs 5-7 peers, customer journey map with strengths and pain points, diagnostic synthesis with top 3 strengths and top 3 risks to NRR | ~2-4 hours | [Okta](https://nrr-cx-okta.vercel.app/) |
| **NRR CX Enhanced** | Everything in Basic + NRR maturity assessment (6 dimensions), NRR waterfall, value-at-stake scenarios with EV modeling, and 5 highest-impact actions with pp NRR estimates | ~1-2 days | [Databricks](https://nrr-cx-databricks-enhanced.vercel.app/) |
| **Agentic CX Teardown** | How agentic AI transforms Customer Success, Professional Services, and Support for a company — role-by-role impact analysis, disruption assessment, and capabilities framework | ~1-2 days | [Agentic Overview](https://n-eight-zeta.vercel.app/) |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | 18+ | Required for all products (Next.js builds) |
| **Python** | 3.11+ | Required for Enhanced product (scraping pipeline, OpenAI API, Reddit API, yfinance) |
| **Cursor IDE** | Latest | The AI does the code generation — you review and iterate |
| **Vercel account** | Free tier works | Deployment target for all diagnostics |

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/jakeb440/nrr-cx-starter.git

# 2. Open in Cursor
cd nrr-cx-starter
cursor .

# 3. Tell Cursor what to generate (in the chat panel)
#    "Generate an NRR CX basic for Oracle"
#    "Generate an NRR CX enhanced for CrowdStrike"
#    "Generate an agentic CX teardown for ServiceNow"

# 4. Review the output, iterate, then deploy
cd output/nrr-cx-oracle-basic
npm install && npm run build
npx vercel --prod
```

---

## Repo Structure

```
nrr-cx-starter/
├── .cursor/
│   └── rules/
│       ├── generate-basic.mdc      # Generation rules for Basic product
│       ├── generate-enhanced.mdc   # Generation rules for Enhanced product
│       └── generate-agentic.mdc    # Generation rules for Agentic product
├── templates/
│   ├── basic/                      # Next.js template for Basic
│   ├── enhanced/                   # Next.js template + Python scrapers for Enhanced
│   └── agentic/                    # Next.js template for Agentic Teardown
├── examples/
│   ├── okta-basic/                 # Reference: completed Basic diagnostic
│   ├── databricks-enhanced/        # Reference: completed Enhanced diagnostic
│   └── agentic-overview/           # Reference: completed Agentic teardown
├── scripts/
│   └── ...                         # Utility scripts (scraping, data validation)
├── portal/                         # Colleague portal — browse all deployed diagnostics
├── output/                         # Generated diagnostics land here (gitignored)
├── diagnostics.json                # Registry of all generated/deployed diagnostics
├── README.md                       # This file
├── QUICK_START.md                  # Non-technical colleague guide
└── .cursorrules                    # Root Cursor rules (product overview)
```

---

## Naming Convention

All diagnostics follow a strict naming scheme used for repos, Vercel projects, and URLs:

| Product | Naming Pattern | Example URL |
|---|---|---|
| NRR CX Basic | `nrr-cx-{client}-basic` | `nrr-cx-oracle-basic.vercel.app` |
| NRR CX Enhanced | `nrr-cx-{client}-enhanced` | `nrr-cx-crowdstrike-enhanced.vercel.app` |
| Agentic CX Teardown | `agentic-cx-{client}` | `agentic-cx-servicenow.vercel.app` |

**Client name rules:** lowercase, no spaces, hyphens allowed (e.g., `databricks`, `t-mobile`, `crowdstrike`).

If a Basic diagnostic later gets upgraded to Enhanced, deploy Enhanced as a separate project. Keep the Basic live.

---

## How to Generate Each Product

### NRR CX Basic

**Prompt Cursor:**

> Generate an NRR CX basic for [Company]

**What Cursor needs from you:**

- Client name and sector/sub-sector
- Client NRR (latest reported or implied from revenue growth)
- Peer set of 5-7 companies in the same sub-sector
- Peer NRR figures (from SEC filings, earnings calls, or the NRR Tracker)
- Multiple periods of NRR data if available (for trend lines)

**What Cursor generates:**

A Next.js app in `output/nrr-cx-{client}-basic/` with all client data in `public/data/client-data.json`. Sections include NRR Benchmark (peer quartiles, multi-period trend, methodology notes), Management Commentary (earnings call quotes), Current-State Customer Journey (6-8 stages with strengths and pain points), and Diagnostic Synthesis (narrative + top 3 strengths + top 3 risks).

**Workflow:**

1. Cursor gathers data from public sources (SEC filings, G2, Gartner Peer Insights, Reddit, earnings calls)
2. Populates `client-data.json` with structured data
3. Generates the Next.js app from the Basic template
4. You review for accuracy, iterate on content, then deploy

---

### NRR CX Enhanced

**Prompt Cursor:**

> Generate an NRR CX enhanced for [Company]

**What Cursor needs from you:**

Everything for Basic, plus:

- Financial context (ARR, growth rate, current valuation, EV multiples)
- Competitor financial data for EV multiple comparisons
- Any internal knowledge about the client's CX maturity

**What Cursor generates:**

Everything in Basic, plus NRR Maturity Assessment (6 dimensions rated Basic/Advanced/Next-gen), NRR Waterfall (current vs target with retention/expansion/contraction decomposition), Value at Stake (Realistic and Aspirational scenarios with incremental ARR and EV gain), and 5 Highest-Impact Actions (with pp NRR impact, timeline, dimension mapping, and detailed rationale).

**The 6 maturity dimensions** (from the McKinsey NRR Maturity Benchmark, N=101 B2B SaaS):

1. Segment & Cover
2. Design Journeys Customer-Back
3. Predict & Preempt Health
4. Pricing, Packaging & Policies
5. Org & Talent Engine
6. Equip the Frontline

**Optional scraping pipeline:**

```bash
cd templates/enhanced
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your OpenAI, Reddit API keys

python cx_teardown.py \
  --company "CrowdStrike" \
  --competitors "SentinelOne,Palo Alto,Fortinet" \
  --industry b2b-enterprise-software
```

Targets G2, Gartner Peer Insights, and Reddit for 50-200 reviews per source (last 12-18 months). After scraping, manually add 5-10 quotes from earnings calls and analyst reports.

---

### Agentic CX Teardown

**Prompt Cursor:**

> Generate an agentic CX teardown for [Company]

**What Cursor needs from you:**

- Target company name and sector
- Any knowledge about the company's CS/PS/Support org structure and headcount
- The company's public AI/automation investments in customer ops

**What Cursor generates:**

A Next.js app in `output/agentic-cx-{client}/` covering Research Overview (headline thesis, 4 sourced stats, 4 key findings), three function deep-dives (Customer Success, Professional Services, Support — each with 3 operational motions, disruption levels, and affected roles), and an Agentic Capabilities Framework (12 capabilities mapped across 9 operational motions with maturity timelines).

**How it differs from NRR CX:** No NRR benchmark or financial waterfall. The focus is on operating model transformation — which roles get elevated, restructured, or displaced by agentic AI. Forward-looking rather than diagnostic.

---

## Deployment

All products deploy as static Next.js exports to Vercel.

```bash
# Navigate to the generated diagnostic
cd output/nrr-cx-{client}-{product}

# Install dependencies and build
npm install
npm run build    # Produces static export in out/

# Deploy to Vercel
npx vercel --prod
```

On first deploy, Vercel will prompt you to link a project. Use the naming convention (`nrr-cx-oracle-basic`, `agentic-cx-servicenow`, etc.).

After deployment, update `diagnostics.json` with the new entry (see next section).

---

## Diagnostics Registry

`diagnostics.json` is the machine-readable registry of all generated diagnostics. It powers the colleague portal and provides a single source of truth for what has been built.

**Schema:**

```json
{
  "client": "oracle",
  "product": "basic",
  "repo": "jakeb440/nrr-cx-oracle-basic",
  "url": "https://nrr-cx-oracle-basic.vercel.app",
  "created": "2026-02-15",
  "author": "jake",
  "status": "deployed",
  "nrr": "112%",
  "sector": "Enterprise Cloud Applications / ERP",
  "description": "NRR CX Basic diagnostic with peer benchmark, journey map, and synthesis."
}
```

**How to update:**

1. Open `diagnostics.json`
2. Add a new object to the array with the fields above
3. Set `status` to `"deployed"` once the Vercel URL is live, or `"generated"` if not yet deployed
4. Commit the change

The portal reads this file to display all available diagnostics.

---

## Quality Checklist

Run through this before deploying any diagnostic.

### All Products

- [ ] Client name and sector are correct throughout
- [ ] No hardcoded client names in component code (all from `client-data.json`)
- [ ] All quotes are real and sourced — never AI-fabricated
- [ ] Responsive layout works at 1280px and above
- [ ] No internal McKinsey references in the deployed version
- [ ] `npm run build` completes without errors

### Basic + Enhanced

- [ ] NRR figures verified against SEC filings or the NRR Tracker
- [ ] Peer set is appropriate (same sub-sector, comparable scale)
- [ ] Every journey stage has at least 1 strength or pain point
- [ ] Methodology notes explain how each peer's NRR was derived
- [ ] Management commentary quotes are from actual earnings calls
- [ ] Synthesis narrative is specific to this client (not generic)

### Enhanced Only

- [ ] NRR maturity ratings are supported by evidence
- [ ] Waterfall components sum correctly to total NRR
- [ ] Value-at-stake math is internally consistent
- [ ] EV multiples are reasonable (cite comparable company multiples)
- [ ] 5 actions sum to the realistic improvement target
- [ ] Each action has specific, non-generic language with real evidence

### Agentic Only

- [ ] Stats are sourced (company name, survey, or "industry analyst estimates")
- [ ] Disruption levels are justified (High = fundamental role change, Moderate = augmentation)
- [ ] Capabilities framework covers all 9 operational motions
- [ ] Key insights are specific to the target company
- [ ] Roles listed are actual job titles used at the target company or industry
- [ ] Maturity levels reflect actual market readiness

---

## Portal

The colleague portal is a local web app for browsing all deployed diagnostics. It reads from `diagnostics.json`.

```bash
# Run the portal locally
cd portal
npm install
npm run dev
# Open http://localhost:3000
```

The portal shows each diagnostic with its client name, product type, deployment status, and a link to the live site. Use it to quickly find existing diagnostics or check what has already been built for a client.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Build | Static export (`output: "export"`) |
| Hosting | Vercel (free tier) |
| Scraping (Enhanced) | Python 3.11+, OpenAI API, Reddit API, yfinance |
| Data | Single `client-data.json` per diagnostic |

---

## Contributing

### Adding a New Template

1. Create a new directory under `templates/` (e.g., `templates/executive-summary/`)
2. Include a working Next.js app with placeholder data in `public/data/client-data.json`
3. Add a corresponding Cursor rule in `.cursor/rules/generate-{product}.mdc` with:
   - What the product includes (sections, data requirements)
   - The `client-data.json` schema
   - Quality checklist
   - Deployment instructions
4. Add a gold standard example to `examples/`
5. Update this README with the new product in the Products table

### Improving Existing Templates

- Edit the template files in `templates/{product}/`
- Update the Cursor rule in `.cursor/rules/` if the data schema or sections change
- Test by generating a diagnostic and verifying the output
- Update the gold standard example if the output format changes significantly

### Improving Generation Quality

- Edit the Cursor rules in `.cursor/rules/generate-{product}.mdc`
- Add more specific instructions, better data schemas, or stricter quality checks
- The rules are the primary lever for output quality — invest time here

### Updating the Portal

- Edit files in `portal/`
- The portal reads `diagnostics.json` — no changes needed to add new diagnostics (just update the JSON)
