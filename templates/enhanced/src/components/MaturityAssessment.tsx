import type { MaturityDimension } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MaturityAssessmentProps {
  maturity: MaturityDimension[];
  companyName: string;
}

const MATURITY_LEVELS = ["Basic", "Advanced", "Next-gen"] as const;

function maturityPosition(level: string): number {
  const idx = MATURITY_LEVELS.indexOf(level as (typeof MATURITY_LEVELS)[number]);
  return idx >= 0 ? idx : 0;
}

function maturityColor(level: string): string {
  switch (level) {
    case "Basic":
      return "bg-amber-500";
    case "Advanced":
      return "bg-blue-500";
    case "Next-gen":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

export function MaturityAssessment({ maturity, companyName }: MaturityAssessmentProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          NRR Maturity Assessment
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {companyName}&apos;s maturity across the 6 dimensions that drive
          best-in-class NRR performance (McKinsey NRR Benchmark, N=101)
        </p>
      </div>

      <div className="space-y-4">
        {maturity.map((dim) => {
          const currentPos = maturityPosition(dim.current);
          const targetPos = maturityPosition(dim.target);

          return (
            <div
              key={dim.dimension}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {dim.dimension}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {dim.label}
                </span>
              </div>

              <div className="mt-4">
                {/* Scale bar */}
                <div className="relative h-3 rounded-full bg-slate-100">
                  {/* Current position marker */}
                  <div
                    className={cn(
                      "absolute top-0 h-3 rounded-full transition-all",
                      maturityColor(dim.current)
                    )}
                    style={{
                      left: 0,
                      width: `${((currentPos + 1) / MATURITY_LEVELS.length) * 100}%`,
                    }}
                  />
                  {/* Target marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      left: `${((targetPos + 0.5) / MATURITY_LEVELS.length) * 100}%`,
                    }}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>

                {/* Scale labels */}
                <div className="mt-2 flex justify-between">
                  {MATURITY_LEVELS.map((level, i) => (
                    <span
                      key={level}
                      className={cn(
                        "text-xs",
                        i === currentPos
                          ? "font-semibold text-slate-900"
                          : "text-slate-400"
                      )}
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Maturity scale:</span>
        {MATURITY_LEVELS.map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", maturityColor(level))} />
            {level}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600">
            <span className="h-1 w-1 rounded-full bg-white" />
          </span>
          Target
        </span>
      </div>

      <p className="text-xs italic text-slate-400">
        Source: McKinsey NRR Maturity Benchmark (N=101 B2B SaaS companies)
      </p>
    </div>
  );
}
