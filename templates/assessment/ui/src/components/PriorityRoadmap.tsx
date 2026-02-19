import { useState } from 'react'
import type { Roadmap, AIUseCase, RoadmapRoleItem } from '../services/api'

interface Props {
  roadmap: Roadmap
}

/** Horizon color for AI use case badges. */
function horizonColor(horizon: string): string {
  if (horizon.includes('H1')) return 'bg-sky-100 text-sky-800'
  if (horizon.includes('H2')) return 'bg-violet-100 text-violet-800'
  if (horizon.includes('H3')) return 'bg-fuchsia-100 text-fuchsia-800'
  return 'bg-gray-100 text-gray-700'
}

/** Category color for timeline badge. */
function categoryColor(cat: string): string {
  if (cat === 'Quick Win') return 'bg-emerald-100 text-emerald-800'
  if (cat === 'Near-term') return 'bg-blue-100 text-blue-800'
  if (cat === 'Medium-term') return 'bg-amber-100 text-amber-800'
  if (cat === 'Transformation') return 'bg-fuchsia-100 text-fuchsia-800'
  return 'bg-gray-100 text-gray-700'
}

/** Function color dot. */
function funcDotColor(fk: string): string {
  const map: Record<string, string> = {
    professional_services: 'bg-blue-400',
    customer_success: 'bg-emerald-400',
    customer_support: 'bg-amber-400',
  }
  return map[fk] ?? 'bg-gray-400'
}

/** Prioritized Roadmap — timeline view with 2026/2027/2028 columns. */
export function PriorityRoadmap({ roadmap }: Props) {
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null)
  const years = ['2026', '2027', '2028'] as const

  const handleToggle = (id: string) => {
    setExpandedUseCase((prev) => (prev === id ? null : id))
  }

  return (
    <section>
      <div className="bg-white rounded-xl shadow-mck border border-surface-border overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-text-primary">Priority Roadmap</h2>
          <p className="text-xs text-text-muted mt-0.5">
            2026: Productivity + Offshoring + Quick-win AI &middot; 2027-2028: Deeper AI transformation.
            AI items shown at use-case level with impacted roles.
          </p>
        </div>

        {/* Timeline columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-surface-border">
          {years.map((year) => {
            const yearData = roadmap.years[year]
            return (
              <div key={year} className="p-4">
                {/* Year header */}
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-bold text-text-primary">{year}</h3>
                  <div className="flex-1 h-px bg-surface-border" />
                </div>

                {/* AI use cases — always shown first */}
                {yearData.ai.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-wide font-semibold text-violet-700 mb-2">
                      AI Use Cases ({yearData.ai.length})
                    </div>
                    <div className="space-y-2">
                      {yearData.ai.map((uc) => (
                        <AIUseCaseCard
                          key={uc.id}
                          useCase={uc}
                          isExpanded={expandedUseCase === uc.id}
                          onToggle={() => handleToggle(uc.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Productivity — rolled up by function */}
                {yearData.productivity.length > 0 && (
                  <FunctionRollup
                    items={yearData.productivity}
                    lever="Productivity"
                    colorClass="teal"
                  />
                )}

                {/* Offshoring — rolled up by function */}
                {yearData.offshoring.length > 0 && (
                  <FunctionRollup
                    items={yearData.offshoring}
                    lever="Offshoring"
                    colorClass="orange"
                  />
                )}

                {/* Empty state */}
                {yearData.productivity.length === 0 && yearData.offshoring.length === 0 && yearData.ai.length === 0 && (
                  <p className="text-xs text-text-muted italic">No items planned for this year.</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary footer */}
        <RoadmapSummary roadmap={roadmap} />
      </div>
    </section>
  )
}

/* --- Function-level rollup for Productivity / Offshoring --- */

interface FunctionRollupProps {
  items: RoadmapRoleItem[]
  lever: string
  colorClass: 'teal' | 'orange'
}

/** Groups role-level items by function and shows a compact summary. */
function FunctionRollup({ items, lever, colorClass }: FunctionRollupProps) {
  const colorMap = {
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-800', label: 'text-teal-700', bold: 'text-teal-900' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', label: 'text-orange-700', bold: 'text-orange-900' },
  }
  const c = colorMap[colorClass]

  const byFunction: Record<string, { function: string; function_key: string; totalFtes: number; count: number }> = {}
  for (const item of items) {
    const key = item.function_key
    if (!byFunction[key]) {
      byFunction[key] = { function: item.function, function_key: key, totalFtes: 0, count: 0 }
    }
    byFunction[key].totalFtes += item.impact_ftes
    byFunction[key].count += 1
  }
  const groups = Object.values(byFunction).sort((a, b) => b.totalFtes - a.totalFtes)
  const totalFtes = groups.reduce((s, g) => s + g.totalFtes, 0)

  return (
    <div className="mb-3">
      <div className={`text-[10px] uppercase tracking-wide font-semibold ${c.label} mb-1.5`}>
        {lever} — {Math.round(totalFtes)} FTEs total
      </div>
      <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
        <div className="space-y-1.5">
          {groups.map((g) => (
            <div key={g.function_key} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${funcDotColor(g.function_key)}`} />
                <span className={`text-xs ${c.text}`}>{g.function}</span>
                <span className="text-[9px] text-text-muted">({g.count} roles)</span>
              </div>
              <span className={`text-xs font-bold ${c.bold}`}>{Math.round(g.totalFtes)} FTEs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* --- AI use case card --- */

interface AIUseCaseProps {
  useCase: AIUseCase
  isExpanded: boolean
  onToggle: () => void
}

function AIUseCaseCard({ useCase, isExpanded, onToggle }: AIUseCaseProps) {
  return (
    <div
      className="rounded-lg border border-violet-200 bg-violet-50 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onToggle}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${horizonColor(useCase.horizon)}`}>
                {useCase.horizon}
              </span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${categoryColor(useCase.category)}`}>
                {useCase.category}
              </span>
              {useCase.half && (
                <span className="text-[9px] text-text-muted">{useCase.half}</span>
              )}
            </div>
            <p className="text-xs font-semibold text-violet-900 leading-snug">{useCase.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-sm font-bold text-violet-800 whitespace-nowrap">
              {useCase.estimated_fte_impact} FTEs
            </div>
            {useCase.estimated_ticket_deflection_pct != null && (
              <div className="text-[9px] text-violet-600">
                ~{useCase.estimated_ticket_deflection_pct}% ticket deflection
              </div>
            )}
          </div>
        </div>

        {/* Impacted roles chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {useCase.impacted_roles.map((role) => (
            <span key={role} className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-white/70 text-violet-700 border border-violet-200">
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-violet-200 bg-white p-3 animate-fade-in">
          <p className="text-xs text-text-secondary leading-relaxed mb-2">{useCase.description}</p>
          <div className="bg-violet-50 rounded p-2">
            <p className="text-[10px] font-semibold text-violet-700 mb-0.5">Mechanism</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">{useCase.mechanism}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* --- Roadmap summary footer --- */

function RoadmapSummary({ roadmap }: { roadmap: Roadmap }) {
  const totalAiFtes = roadmap.ai_use_cases.reduce((s, uc) => s + uc.estimated_fte_impact, 0)
  const totalProdFtes = roadmap.years['2026'].productivity.reduce((s, i) => s + i.impact_ftes, 0)
  const totalOffFtes = roadmap.years['2026'].offshoring.reduce((s, i) => s + i.impact_ftes, 0)

  return (
    <div className="px-6 py-4 bg-surface-tertiary border-t border-surface-border">
      <div className="flex flex-wrap gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-teal-400" />
          <span className="text-text-secondary">Productivity: <strong className="text-text-primary">{Math.round(totalProdFtes)} FTEs</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-400" />
          <span className="text-text-secondary">Offshoring: <strong className="text-text-primary">{Math.round(totalOffFtes)} FTEs</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-violet-500" />
          <span className="text-text-secondary">AI (all years): <strong className="text-text-primary">{Math.round(totalAiFtes)} FTEs</strong></span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${funcDotColor('professional_services')}`} /> <span className="text-text-muted">PS</span>
          <div className={`w-2 h-2 rounded-full ${funcDotColor('customer_success')}`} /> <span className="text-text-muted">CS</span>
          <div className={`w-2 h-2 rounded-full ${funcDotColor('customer_support')}`} /> <span className="text-text-muted">Support</span>
        </div>
      </div>
    </div>
  )
}