/* ---------- Types ---------- */

export interface CompanyData {
  name: string
  ticker: string | null
  ownership: string
  industry: string
  clinicians_on_platform: number | null
  revenue_usd: number | null
  employees: number | null
  revenue_per_employee: number | null
  india_employees: number | null
  india_locations: string[]
  us_locations: string[]
}

export interface PeerFinancial {
  name: string
  revenue_usd: number | null
  employees: number | null
  revenue_per_employee: number | null
  note: string
}

export interface HorizonDetail {
  tasks: string
  impact_pct: number
}

export interface ProductivityData {
  opportunity_ftes: number
  excess_above_median: number
  has_opportunity: boolean
}

export interface AIData {
  h1_automate: HorizonDetail
  h2_ai_assisted: HorizonDetail
  h3_agentic: HorizonDetail
  total_impact_pct: number
  efficiency_pct_2026: number
  efficiency_pct_2027: number
  efficiency_pct_2028: number
  ai_adjustment_factor: number
  impact_ftes: number | null
}

export interface OffshoringData {
  rating: string
  rationale: string
  current_offshore_pct: number
  benchmark_offshore_pct: number
  gap_pct: number
  gap_ftes: number | null
  notes: string
}

export interface RoleCosts {
  onshore_usd: number
  offshore_usd: number
  blended_cost: number
}

export interface RoleData {
  role: string
  short: string
  description: string
  estimated_ftes: number | null
  fte_source: string
  fte_source_note: string
  current_offshore_pct: number
  benchmark_range: [number | null, number | null]
  benchmark_median: number | null
  pct_vs_benchmark: number
  productivity: ProductivityData
  ai: AIData
  offshoring: OffshoringData
  costs: RoleCosts
}

export interface FunctionSummary {
  total_ai_addressable_ftes: number
  total_offshore_gap_ftes: number
  total_productivity_ftes: number
}

export interface CommentaryQuote {
  text: string
  source: string
  date: string
  relevance: string
  sentiment: 'positive' | 'negative'
}

export interface FunctionCommentary {
  theme: string
  quotes: CommentaryQuote[]
  insight_summary: string
}

export interface FunctionData {
  function: string
  function_key: string
  typical_pct_of_headcount: [number, number]
  estimated_total_ftes: number | null
  estimation_note: string
  roles: RoleData[]
  summary: FunctionSummary
  commentary: FunctionCommentary
}

export interface AssessmentSummary {
  total_customer_ops_ftes: number
  total_ai_addressable_ftes: number
  total_offshore_gap_ftes: number
  total_productivity_ftes: number
  ai_pct_of_total: number | null
  offshore_gap_pct_of_total: number | null
  productivity_pct_of_total: number | null
}

export interface DollarImpactYear {
  productivity: number
  ai: number
  offshoring: number
  total: number
}

export interface DollarImpact {
  '2026': DollarImpactYear
  '2027': DollarImpactYear
  '2028': DollarImpactYear
}

export interface AIUseCase {
  id: string
  name: string
  description: string
  mechanism: string
  year: number
  half: string
  category: string
  horizon: string
  impacted_roles: string[]
  impacted_functions: string[]
  estimated_ticket_deflection_pct: number | null
  estimated_fte_impact: number
}

export interface RoadmapRoleItem {
  role: string
  function: string
  function_key: string
  lever: string
  year: number
  impact_ftes: number
  description: string
}

/** Flattened roadmap row for PriorityMatrix (role-level or AI use case). */
export interface PriorityItem {
  role: string
  function: string
  lever: string
  category: string
  impact_ftes: number
  rationale: string
}

export interface RoadmapYearData {
  productivity: RoadmapRoleItem[]
  offshoring: RoadmapRoleItem[]
  ai: AIUseCase[]
}

export interface Roadmap {
  years: {
    '2026': RoadmapYearData
    '2027': RoadmapYearData
    '2028': RoadmapYearData
  }
  ai_use_cases: AIUseCase[]
}

export interface AssessmentData {
  company: CompanyData
  peer_financials: PeerFinancial[]
  functions: FunctionData[]
  summary: AssessmentSummary
  dollar_impact: DollarImpact
  roadmap: Roadmap
}

/* ---------- Data loader ---------- */

/** Load the pre-computed athenahealth assessment from static JSON. */
export async function fetchAssessment(): Promise<AssessmentData> {
  const res = await fetch('/assessment.json')
  if (!res.ok) {
    throw new Error(`Failed to load assessment data (${res.status})`)
  }
  return res.json()
}