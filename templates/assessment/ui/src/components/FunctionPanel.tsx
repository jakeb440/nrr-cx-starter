import { useState } from 'react'
import type { FunctionData, RoleData } from '../services/api'
import { RoleDetail } from './RoleDetail'

interface Props {
  data: FunctionData
}

/** Color map for function keys. */
const FUNC_COLORS: Record<string, { bg: string; badge: string; accent: string }> = {
  professional_services: { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', accent: 'border-blue-300' },
  customer_success: { bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800', accent: 'border-emerald-300' },
  customer_support: { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', accent: 'border-amber-300' },
}

/** Format number with fallback. */
function fmt(n: number | null): string {
  if (n == null) return '—'
  return Math.round(n).toLocaleString('en-US')
}

/** One function panel — role table on left, commentary on right. */
export function FunctionPanel({ data }: Props) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const colors = FUNC_COLORS[data.function_key] ?? FUNC_COLORS.professional_services

  const handleToggle = (role: string) => {
    setExpandedRole((prev) => (prev === role ? null : role))
  }

  return (
    <section>
      <div className="bg-white rounded-xl shadow-mck border border-surface-border overflow-hidden">
        {/* Function header */}
        <div className={`px-6 py-4 ${colors.bg} border-b ${colors.accent}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{data.function}</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Est. <strong>{fmt(data.estimated_total_ftes)}</strong> FTEs
                {data.estimation_note && <span className="text-text-muted ml-1">— {data.estimation_note.slice(0, 120)}...</span>}
              </p>
            </div>
            <div className="flex gap-2 text-xs flex-wrap">
              <span className={`px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                AI: {fmt(data.summary.total_ai_addressable_ftes)} FTEs
              </span>
              <span className={`px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                Productivity: {fmt(data.summary.total_productivity_ftes)} FTEs
              </span>
              <span className={`px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                Offshore gap: {fmt(data.summary.total_offshore_gap_ftes)} FTEs
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout: role table + commentary */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,340px]">
          {/* Left — Role table */}
          <div className="overflow-x-auto border-r border-surface-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-tertiary text-text-tertiary text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  <th className="text-right px-3 py-3 font-medium">Est. FTEs</th>
                  <th className="text-right px-3 py-3 font-medium">Peer Median</th>
                  <th className="text-center px-3 py-3 font-medium">vs. Median</th>
                  <th className="text-center px-3 py-3 font-medium">Prod. Opp.</th>
                  <th className="text-center px-3 py-3 font-medium">AI '26</th>
                  <th className="text-center px-3 py-3 font-medium">AI '27</th>
                  <th className="text-center px-3 py-3 font-medium">Offshore Gap</th>
                  <th className="text-center px-3 py-3 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.roles.map((role: RoleData) => (
                  <RoleRow
                    key={role.role}
                    role={role}
                    isExpanded={expandedRole === role.role}
                    onToggle={() => handleToggle(role.role)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Right — Commentary */}
          <CommentaryPanel commentary={data.commentary} functionKey={data.function_key} />
        </div>
      </div>
    </section>
  )
}

/* --- Role row --- */

interface RoleRowProps {
  role: RoleData
  isExpanded: boolean
  onToggle: () => void
}

/** Productivity badge based on % vs benchmark median. */
function ProductivityBadge({ pct }: { pct: number }) {
  if (pct <= 5 && pct >= -5) return <span className="text-xs text-text-muted">At median</span>
  if (pct > 5) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        +{Math.round(pct)}%
      </span>
    )
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      {Math.round(pct)}%
    </span>
  )
}

function RoleRow({ role, isExpanded, onToggle }: RoleRowProps) {
  return (
    <>
      <tr
        className="border-b border-surface-borderLight hover:bg-surface-tertiary/50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-5 py-3">
          <div className="font-medium text-text-primary text-sm">{role.short}</div>
          <div className="text-[11px] text-text-muted">{role.description.slice(0, 80)}</div>
        </td>
        <td className="text-right px-3 py-3 font-semibold text-text-primary">
          {fmt(role.estimated_ftes)}
          <div className="text-[10px] text-text-muted font-normal">
            {role.fte_source.startsWith('linkedin') || role.fte_source === 'job_indicators'
              ? 'LinkedIn Assessment' : role.fte_source}
          </div>
        </td>
        <td className="text-right px-3 py-3 text-text-secondary text-xs">
          {role.benchmark_median != null ? (
            <>
              <div className="font-semibold text-text-primary">{fmt(role.benchmark_median)}</div>
              <div className="text-[10px] text-text-muted">
                {role.benchmark_range[0] != null ? `${fmt(role.benchmark_range[0])}–${fmt(role.benchmark_range[1])}` : ''}
              </div>
            </>
          ) : '—'}
        </td>
        <td className="text-center px-3 py-3">
          <ProductivityBadge pct={role.pct_vs_benchmark} />
        </td>
        <td className="text-center px-3 py-3">
          {role.productivity.has_opportunity ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
              {fmt(role.productivity.opportunity_ftes)}
            </span>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </td>
        <td className="text-center px-3 py-3">
          <span className="text-sm font-medium text-violet-700">{role.ai.efficiency_pct_2026}%</span>
        </td>
        <td className="text-center px-3 py-3">
          <span className="text-sm font-medium text-violet-900">{role.ai.efficiency_pct_2027}%</span>
        </td>
        <td className="text-center px-3 py-3">
          {role.offshoring.gap_pct > 0 ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              +{role.offshoring.gap_pct}pp
            </span>
          ) : (
            <span className="text-xs text-text-muted">At benchmark</span>
          )}
        </td>
        <td className="text-center px-3 py-3">
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="px-0 py-0">
            <RoleDetail role={role} />
          </td>
        </tr>
      )}
    </>
  )
}

/* --- Commentary panel --- */

interface CommentaryPanelProps {
  commentary: {
    theme: string
    quotes: Array<{ text: string; source: string; date: string; relevance: string; sentiment?: string }>
    insight_summary: string
  }
  functionKey: string
}

function CommentaryPanel({ commentary, functionKey }: CommentaryPanelProps) {
  const borderColors: Record<string, string> = {
    professional_services: 'border-l-blue-400',
    customer_success: 'border-l-emerald-400',
    customer_support: 'border-l-amber-400',
  }

  return (
    <div className="p-5 bg-surface-tertiary/40">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-2">
        Customer &amp; Operational Commentary
      </h3>
      {commentary.theme && (
        <p className="text-sm font-medium text-text-primary mb-3 italic">
          &ldquo;{commentary.theme}&rdquo;
        </p>
      )}

      <div className="space-y-3">
        {commentary.quotes.map((q, i) => {
          const isPositive = q.sentiment === 'positive'
          return (
            <div
              key={i}
              className={`bg-white rounded-lg p-3 border-l-4 ${isPositive ? 'border-l-emerald-400' : borderColors[functionKey] ?? 'border-l-gray-300'} shadow-sm`}
            >
              <div className="flex gap-2">
                <span className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {isPositive ? '+' : '\u2212'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary leading-relaxed">
                    &ldquo;{q.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-text-muted">
                    <span>{q.source}</span>
                    <span>{q.date}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {commentary.insight_summary && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-surface-border">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary mb-1">
            Summary Insight
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            {commentary.insight_summary}
          </p>
        </div>
      )}
    </div>
  )
}