import type { PriorityItem } from '../services/api'

interface Props {
  items: PriorityItem[]
}

/** Category badge colors. */
function categoryColor(cat: string): string {
  if (cat === 'Quick Win') return 'bg-emerald-100 text-emerald-800'
  if (cat === 'Near-term') return 'bg-blue-100 text-blue-800'
  if (cat.includes('Transformation')) return 'bg-violet-100 text-violet-800'
  return 'bg-gray-100 text-gray-600'
}

/** Lever badge colors. */
function leverColor(lever: string): string {
  if (lever.includes('Automation')) return 'bg-sky-100 text-sky-800'
  if (lever.includes('Offshoring') || lever.includes('ffshore')) return 'bg-orange-100 text-orange-800'
  if (lever.includes('Agentic')) return 'bg-fuchsia-100 text-fuchsia-800'
  return 'bg-gray-100 text-gray-600'
}

/** Prioritized roadmap table. */
export function PriorityMatrix({ items }: Props) {
  if (!items.length) return null

  return (
    <section>
      <div className="bg-white rounded-xl shadow-mck border border-surface-border overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-text-primary">Prioritized Roadmap</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Top opportunities ranked by estimated FTE impact across all levers and functions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-tertiary text-text-tertiary text-xs uppercase tracking-wide">
                <th className="text-left px-6 py-3 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Function</th>
                <th className="text-center px-4 py-3 font-medium">Timeline</th>
                <th className="text-center px-4 py-3 font-medium">Lever</th>
                <th className="text-right px-4 py-3 font-medium">Impact (FTEs)</th>
                <th className="text-left px-6 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map((item, idx) => (
                <tr
                  key={`${item.role}-${item.lever}-${idx}`}
                  className="border-b border-surface-borderLight hover:bg-surface-tertiary/50 transition-colors"
                >
                  <td className="px-6 py-3 text-text-muted font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{item.role}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{item.function}</td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${leverColor(item.lever)}`}>
                      {item.lever}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3 font-bold text-text-primary">
                    {Math.round(item.impact_ftes).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-xs text-text-secondary max-w-xs truncate">
                    {item.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}