import type { CompanyData, AssessmentSummary, PeerFinancial, DollarImpact } from '../services/api'

interface Props {
  company: CompanyData
  summary: AssessmentSummary
  peerFinancials: PeerFinancial[]
  dollarImpact: DollarImpact
}

/** Format a number with commas. */
function fmt(n: number | null | undefined, opts?: { prefix?: string; suffix?: string }): string {
  if (n == null) return 'N/A'
  const formatted = Math.round(n).toLocaleString('en-US')
  return `${opts?.prefix ?? ''}${formatted}${opts?.suffix ?? ''}`
}

/** Format revenue as $XB or $XM. */
function fmtRevenue(n: number | null): string {
  if (n == null) return 'N/A'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}

/** Format dollar value as $XM. */
function fmtDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

/** Executive Summary — the first thing a senior stakeholder sees. */
export function ExecutiveSummary({ company, summary, peerFinancials, dollarImpact }: Props) {
  const combinedFtes = summary.total_ai_addressable_ftes + summary.total_offshore_gap_ftes + summary.total_productivity_ftes
  const combinedPct = summary.total_customer_ops_ftes > 0
    ? Math.round(combinedFtes / summary.total_customer_ops_ftes * 100)
    : null

  return (
    <section className="space-y-6">
      {/* Impact headline */}
      <div className="bg-white rounded-xl shadow-mck border border-surface-border p-6">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-xl font-semibold text-text-primary">{company.name}</h2>
          {company.ownership && (
            <span className="text-xs text-text-muted">{company.ownership}</span>
          )}
        </div>
        <p className="text-xs text-text-muted mb-6">
          {company.industry}
          {company.clinicians_on_platform != null && ` · ${fmt(company.clinicians_on_platform)} clinicians on platform`}
          {' · Source: LinkedIn, public reviews, company reports'}
        </p>

        {/* Impact cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <ImpactCard
            label="Customer Ops FTEs"
            value={fmt(summary.total_customer_ops_ftes)}
            sublabel="PS, CS, Support"
            color="bg-mck-blue-50 text-mck-blue-700"
          />
          <ImpactCard
            label="AI-Addressable FTEs"
            value={fmt(summary.total_ai_addressable_ftes)}
            sublabel={summary.ai_pct_of_total != null ? `${Math.round(summary.ai_pct_of_total)}% of total` : ''}
            color="bg-violet-50 text-violet-700"
          />
          <ImpactCard
            label="Productivity FTEs"
            value={fmt(summary.total_productivity_ftes)}
            sublabel={summary.productivity_pct_of_total != null ? `${Math.round(summary.productivity_pct_of_total)}% of total` : ''}
            color="bg-teal-50 text-teal-700"
          />
          <ImpactCard
            label="Offshoring Gap FTEs"
            value={fmt(summary.total_offshore_gap_ftes)}
            sublabel={summary.offshore_gap_pct_of_total != null ? `${Math.round(summary.offshore_gap_pct_of_total)}% additional` : ''}
            color="bg-orange-50 text-orange-700"
          />
          <ImpactCard
            label="Combined Opportunity"
            value={fmt(combinedFtes)}
            sublabel={combinedPct != null ? `${combinedPct}% of customer ops` : ''}
            color="bg-emerald-50 text-emerald-700"
            highlight
          />
          <ImpactCard
            label="Total Employees"
            value={fmt(company.employees)}
            sublabel={`Revenue: ${fmtRevenue(company.revenue_usd)}`}
            color="bg-gray-50 text-gray-700"
          />
        </div>

        {/* Dollar Impact Stacked Bar Chart */}
        <DollarImpactChart dollarImpact={dollarImpact} />

        {/* Financial context */}
        <div className="grid grid-cols-3 gap-4 text-center mt-6">
          <MiniStat label="Annual Revenue" value={fmtRevenue(company.revenue_usd)} />
          <MiniStat label="Revenue / Employee" value={fmt(company.revenue_per_employee, { prefix: '$' })} />
          <MiniStat label="India Employees" value={fmt(company.india_employees)} />
        </div>
      </div>

      {/* Peer Revenue/Employee comparison */}
      <PeerComparison company={company} peers={peerFinancials} />
    </section>
  )
}

/* --- Dollar Impact Stacked Bar Chart --- */

interface DollarChartProps {
  dollarImpact: DollarImpact
}

/** Stacked bar chart showing dollar impact by lever for 2026-2028. */
function DollarImpactChart({ dollarImpact }: DollarChartProps) {
  const years: Array<{ year: string; data: { productivity: number; ai: number; offshoring: number; total: number } }> = [
    { year: '2026', data: dollarImpact['2026'] },
    { year: '2027', data: dollarImpact['2027'] },
    { year: '2028', data: dollarImpact['2028'] },
  ]

  const maxTotal = Math.max(...years.map((y) => y.data.total))
  if (maxTotal === 0) return null

  return (
    <div className="mt-6 pt-6 border-t border-surface-border">
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        Estimated Run-Rate Dollar Impact by Year
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Stacked by lever: Productivity + AI + Offshoring. Productivity and AI savings calculated at blended onshore/offshore cost rates.
      </p>

      <div className="space-y-4">
        {years.map(({ year, data }) => {
          const prodWidth = (data.productivity / maxTotal) * 100
          const aiWidth = (data.ai / maxTotal) * 100
          const offWidth = (data.offshoring / maxTotal) * 100

          return (
            <div key={year} className="flex items-center gap-3">
              <div className="w-12 text-sm font-semibold text-text-primary">{year}</div>
              <div className="flex-1 flex h-8 rounded-lg overflow-hidden bg-gray-100">
                {data.ai > 0 && (
                  <div
                    className="bg-violet-500 flex items-center justify-center text-[10px] font-medium text-white"
                    style={{ width: `${aiWidth}%` }}
                    title={`AI: ${fmtDollars(data.ai)}`}
                  >
                    {aiWidth > 8 ? fmtDollars(data.ai) : ''}
                  </div>
                )}
                {data.productivity > 0 && (
                  <div
                    className="bg-teal-400 flex items-center justify-center text-[10px] font-medium text-white"
                    style={{ width: `${prodWidth}%` }}
                    title={`Productivity: ${fmtDollars(data.productivity)}`}
                  >
                    {prodWidth > 8 ? fmtDollars(data.productivity) : ''}
                  </div>
                )}
                {data.offshoring > 0 && (
                  <div
                    className="bg-orange-400 flex items-center justify-center text-[10px] font-medium text-white"
                    style={{ width: `${offWidth}%` }}
                    title={`Offshoring: ${fmtDollars(data.offshoring)}`}
                  >
                    {offWidth > 8 ? fmtDollars(data.offshoring) : ''}
                  </div>
                )}
              </div>
              <div className="w-16 text-sm font-bold text-text-primary text-right">
                {fmtDollars(data.total)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-500" />
          <span>AI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-teal-400" />
          <span>Productivity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-400" />
          <span>Offshoring</span>
        </div>
      </div>
    </div>
  )
}

/* --- Sub-components --- */

interface ImpactCardProps {
  label: string
  value: string
  sublabel: string
  color: string
  highlight?: boolean
}

function ImpactCard({ label, value, sublabel, color, highlight }: ImpactCardProps) {
  return (
    <div className={`rounded-lg px-4 py-3 ${color} ${highlight ? 'ring-2 ring-emerald-300' : ''}`}>
      <div className="text-[10px] uppercase tracking-wide font-medium opacity-70 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
      {sublabel && <div className="text-[10px] opacity-60 mt-0.5">{sublabel}</div>}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-tertiary rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted font-medium">{label}</div>
      <div className="text-sm font-semibold text-text-primary mt-0.5">{value}</div>
    </div>
  )
}

interface PeerProps {
  company: CompanyData
  peers: PeerFinancial[]
}

/** Horizontal bar chart comparing Revenue/Employee across company and industry peers. */
function PeerComparison({ company, peers }: PeerProps) {
  const all = [
    { name: company.name, rev_per_emp: company.revenue_per_employee, isTarget: true },
    ...peers
      .filter((p) => p.revenue_per_employee != null)
      .map((p) => ({ name: p.name, rev_per_emp: p.revenue_per_employee, isTarget: false })),
  ]
    .filter((p) => p.rev_per_emp != null)
    .sort((a, b) => (b.rev_per_emp ?? 0) - (a.rev_per_emp ?? 0))

  if (all.length < 2) return null

  const maxVal = Math.max(...all.map((p) => p.rev_per_emp ?? 0))

  return (
    <div className="bg-white rounded-xl shadow-mck border border-surface-border p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Revenue per Employee — Peer Comparison</h3>
      <p className="text-xs text-text-muted mb-4">
        Lower revenue/employee may indicate heavier service delivery model. Source: public data, company reports.
      </p>
      <div className="space-y-2">
        {all.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <div className={`w-36 text-xs text-right truncate ${p.isTarget ? 'font-bold text-mck-blue-700' : 'text-text-secondary'}`}>
              {p.name}
            </div>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${p.isTarget ? 'bg-mck-blue-500' : 'bg-gray-300'}`}
                style={{ width: `${((p.rev_per_emp ?? 0) / (maxVal * 1.1)) * 100}%` }}
              />
            </div>
            <div className={`w-16 text-xs text-right ${p.isTarget ? 'font-bold text-mck-blue-700' : 'text-text-secondary'}`}>
              ${((p.rev_per_emp ?? 0) / 1000).toFixed(0)}K
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}