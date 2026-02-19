import { useState, useEffect } from 'react'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { FunctionPanel } from './components/FunctionPanel'
import { PriorityRoadmap } from './components/PriorityRoadmap'
import { fetchAssessment } from './services/api'
import type { AssessmentData } from './services/api'

/** Main application — auto-loads assessment on mount. */
function App() {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssessment()
      .then((data) => setAssessment(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Assessment failed'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-mck-navy text-white px-6 py-5 shadow-mck-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight">
            {assessment ? `${assessment.company.name} Agentic Customer Operations Assessment` : 'Agentic Customer Operations Assessment'}
          </h1>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 text-sm px-6 py-3 text-center">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && <LoadingState />}

        {assessment && !isLoading && (
          <div className="space-y-8 animate-fade-in">
            {/* Executive Summary — impact cards + dollar impact chart + peer comparison */}
            <ExecutiveSummary
              company={assessment.company}
              summary={assessment.summary}
              peerFinancials={assessment.peer_financials}
              dollarImpact={assessment.dollar_impact}
            />

            {/* Function deep-dives with commentary */}
            {assessment.functions.map((func) => (
              <FunctionPanel key={func.function_key} data={func} />
            ))}

            {/* Prioritized roadmap — timeline view */}
            <PriorityRoadmap roadmap={assessment.roadmap} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-white py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto text-xs text-text-muted text-center">
          Data sourced from LinkedIn, job boards, Trustpilot, KLAS Research, company press releases, internal workshop findings, and industry benchmarks.
          Estimates are directional and should be validated with company-specific data.
        </div>
      </footer>
    </div>
  )
}

/** Loading spinner. */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 rounded-full border-4 border-mck-blue-100 border-t-mck-blue-500 animate-spin mb-6" />
      <h2 className="text-xl font-semibold text-text-primary mb-2">Loading Assessment...</h2>
      <p className="text-text-secondary text-sm">
        Loading pre-computed assessment data.
      </p>
    </div>
  )
}

export default App