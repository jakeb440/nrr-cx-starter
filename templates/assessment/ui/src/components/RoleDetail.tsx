import type { RoleData } from '../services/api'

interface Props {
  role: RoleData
}

/** Expanded detail panel for a single role — shows productivity, AI horizons, and offshoring detail. */
export function RoleDetail({ role }: Props) {
  const ai = role.ai
  const off = role.offshoring
  const prod = role.productivity

  return (
    <div className="bg-surface-tertiary/60 border-t border-surface-border px-8 py-5 animate-fade-in">
      {/* FTE estimation methodology */}
      {role.fte_source_note && (
        <div className="mb-4 bg-white rounded-lg px-4 py-3 border border-surface-borderLight">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-text-tertiary">
              FTE Estimation Method
            </span>
            <FteSourceBadge source={role.fte_source} />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {role.fte_source_note}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3">
            Productivity Opportunity
          </h4>
          <div className={`rounded-lg border p-4 ${prod.has_opportunity ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
            {prod.has_opportunity ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                    {Math.round(prod.opportunity_ftes)} FTEs
                  </span>
                  <span className="text-xs text-teal-700 opacity-70">opportunity</span>
                </div>
                <p className="text-sm text-teal-800 leading-relaxed mb-2">
                  {Math.round(prod.excess_above_median)} FTEs above median benchmark.
                  Productivity lever captures 25% of excess = <strong>{Math.round(prod.opportunity_ftes)} FTE</strong> savings.
                </p>
                <div className="space-y-2">
                  <BarCompare label="Current FTEs" value={role.estimated_ftes ?? 0} max={Math.max(role.estimated_ftes ?? 0, role.benchmark_median ?? 0) * 1.2} color="bg-teal-500" />
                  <BarCompare label="Benchmark median" value={role.benchmark_median ?? 0} max={Math.max(role.estimated_ftes ?? 0, role.benchmark_median ?? 0) * 1.2} color="bg-gray-400" />
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                {role.pct_vs_benchmark < -5 ? (
                  <p>Running <strong>{Math.abs(Math.round(role.pct_vs_benchmark))}% below</strong> benchmark median — no productivity lever. AI efficiency adjusted by 0.85x.</p>
                ) : (
                  <p>At or near benchmark median — no significant productivity opportunity.</p>
                )}
              </div>
            )}

            {/* Cost context */}
            <div className="mt-3 pt-3 border-t border-surface-borderLight text-xs text-text-muted">
              Blended FTE cost: <strong>${Math.round(role.costs.blended_cost).toLocaleString()}</strong> /yr
              (onshore ${role.costs.onshore_usd.toLocaleString()} / offshore ${role.costs.offshore_usd.toLocaleString()})
            </div>
          </div>
        </div>

        {/* AI / Agentic Horizons */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3">
            AI Efficiency — {ai.efficiency_pct_2026}% ('26) &rarr; {ai.efficiency_pct_2027}% ('27) &rarr; {ai.efficiency_pct_2028}% ('28)
          </h4>
          {ai.ai_adjustment_factor < 1 && (
            <div className="mb-2 text-[10px] px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">
              AI efficiency reduced by {Math.round((1 - ai.ai_adjustment_factor) * 100)}% (role is {Math.abs(Math.round(role.pct_vs_benchmark))}% below benchmark)
            </div>
          )}
          <div className="space-y-3">
            <HorizonCard
              label="H1: Automate"
              sublabel="Rules-based, no AI needed"
              color="bg-sky-50 border-sky-200"
              barColor="bg-sky-400"
              tasks={ai.h1_automate.tasks}
              pct={ai.h1_automate.impact_pct}
            />
            <HorizonCard
              label="H2: AI-Assisted"
              sublabel="Human in the loop"
              color="bg-violet-50 border-violet-200"
              barColor="bg-violet-400"
              tasks={ai.h2_ai_assisted.tasks}
              pct={ai.h2_ai_assisted.impact_pct}
            />
            <HorizonCard
              label="H3: Agentic"
              sublabel="AI acts autonomously"
              color="bg-fuchsia-50 border-fuchsia-200"
              barColor="bg-fuchsia-400"
              tasks={ai.h3_agentic.tasks}
              pct={ai.h3_agentic.impact_pct}
            />
          </div>
          <div className="mt-3 text-xs text-text-secondary bg-white rounded-lg px-3 py-2 border border-surface-borderLight">
            Total addressable: <strong>{ai.total_impact_pct}%</strong>
            {ai.impact_ftes != null && (
              <span> ({Math.round(ai.impact_ftes).toLocaleString()} FTEs)</span>
            )}
          </div>
        </div>

        {/* Offshoring Detail */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3">
            Offshoring — Current vs. Benchmark
          </h4>
          <div className={`rounded-lg border p-4 ${offshoreColor(off.rating)}`}>
            <div className="flex items-center gap-2 mb-3">
              <OffshoreRatingBadge rating={off.rating} />
              {off.gap_ftes != null && off.gap_ftes > 0 && (
                <span className="text-xs opacity-70">
                  Gap: ~{Math.round(off.gap_ftes).toLocaleString()} FTEs
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed mb-3">{off.rationale}</p>

            <div className="space-y-2">
              <BarCompare label="Current offshore %" value={off.current_offshore_pct} max={100} color="bg-gray-400" />
              <BarCompare label="Benchmark offshore %" value={off.benchmark_offshore_pct} max={100} color="bg-orange-400" />
            </div>

            {off.gap_pct > 0 && (
              <div className="mt-3 text-xs font-medium text-orange-800 bg-orange-50 rounded px-2 py-1">
                +{off.gap_pct}pp gap = ~{Math.round(off.gap_ftes ?? 0).toLocaleString()} FTEs additional offshore opportunity
              </div>
            )}

            {off.notes && (
              <p className="text-xs mt-2 opacity-70 italic">{off.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- Sub-components --- */

interface HorizonCardProps {
  label: string
  sublabel: string
  color: string
  barColor: string
  tasks: string
  pct: number
}

function HorizonCard({ label, sublabel, color, barColor, tasks, pct }: HorizonCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-[10px] text-text-muted ml-2">{sublabel}</span>
        </div>
        <span className="text-sm font-bold">{pct}%</span>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{tasks}</p>
      <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface BarCompareProps {
  label: string
  value: number
  max: number
  color: string
}

function BarCompare({ label, value, max, color }: BarCompareProps) {
  const width = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 text-[11px] text-right">{label}</div>
      <div className="flex-1 h-4 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${width}%` }} />
      </div>
      <div className="w-10 text-xs font-medium text-right">{typeof value === 'number' && value > 1000 ? Math.round(value).toLocaleString() : `${value}%`}</div>
    </div>
  )
}

function OffshoreRatingBadge({ rating }: { rating: string }) {
  const colors: Record<string, string> = {
    High: 'bg-emerald-100 text-emerald-800',
    'Medium-High': 'bg-lime-100 text-lime-800',
    Medium: 'bg-amber-100 text-amber-800',
    Low: 'bg-orange-100 text-orange-800',
    'Not Recommended': 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[rating] ?? 'bg-gray-100 text-gray-600'}`}>
      {rating}
    </span>
  )
}

function offshoreColor(rating: string): string {
  if (rating === 'High') return 'bg-emerald-50 border-emerald-200 text-emerald-800'
  if (rating === 'Medium-High') return 'bg-lime-50 border-lime-200 text-lime-800'
  if (rating === 'Medium') return 'bg-amber-50 border-amber-200 text-amber-800'
  if (rating === 'Low') return 'bg-orange-50 border-orange-200 text-orange-800'
  if (rating === 'Not Recommended') return 'bg-red-50 border-red-200 text-red-800'
  return 'bg-gray-50 border-gray-200 text-gray-700'
}

/** Badge showing the FTE estimation source method. */
function FteSourceBadge({ source }: { source: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    linkedin_people: { label: 'LinkedIn Assessment', color: 'bg-blue-100 text-blue-800' },
    linkedin_openroles: { label: 'LinkedIn Assessment', color: 'bg-indigo-100 text-indigo-800' },
    job_indicators: { label: 'LinkedIn Assessment', color: 'bg-sky-100 text-sky-800' },
    revenue_benchmark: { label: 'Revenue Benchmark', color: 'bg-gray-100 text-gray-600' },
  }
  const info = labels[source] ?? { label: source, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${info.color}`}>
      {info.label}
    </span>
  )
}