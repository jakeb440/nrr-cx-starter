"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react";
import type { JourneyData, JourneyStage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface JourneyMapProps {
  journey: JourneyData;
  companyName: string;
}

const SEVERITY_WEIGHT: Record<string, number> = { high: 3, medium: 2, low: 1 };

function stageHealthColor(stage: JourneyStage): { bg: string; text: string; border: string } {
  const strengthScore = stage.strengths.reduce(
    (sum, s) => sum + (SEVERITY_WEIGHT[s.severity] ?? 2), 0
  );
  const painScore = stage.painPoints.reduce(
    (sum, p) => sum + (SEVERITY_WEIGHT[p.severity] ?? 2), 0
  );

  if (stage.strengths.length === 0 && stage.painPoints.length === 0) {
    return { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-300" };
  }
  if (painScore > strengthScore) {
    return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
  }
  if (strengthScore > painScore) {
    return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" };
  }
  return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" };
}

const CONTEXT_BADGES: Record<string, string> = {
  unique: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  "competitors-better": "bg-amber-100 text-amber-800 border border-amber-200",
  "industry-wide": "bg-slate-100 text-slate-700 border border-slate-200",
};

export function JourneyMap({ journey, companyName }: JourneyMapProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  function toggle(n: number) {
    setExpandedStage(expandedStage === n ? null : n);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Current-State Customer Journey
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {journey.description || `${companyName} — strengths and pain points across the B2B CX journey`}
        </p>
      </div>

      {/* Vertical timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative ml-8">
          {journey.stages.map((stage, i) => {
            const health = stageHealthColor(stage);
            const isOpen = expandedStage === stage.number;
            const isLast = i === journey.stages.length - 1;

            return (
              <div key={stage.number} className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-200" />
                )}

                {/* Stage circle + content */}
                <div className="flex gap-5">
                  {/* Circle */}
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                      health.bg,
                      health.text,
                      health.border
                    )}
                  >
                    {stage.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => toggle(stage.number)}
                      className="flex w-full items-start justify-between text-left group"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {stage.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {stage.strengths.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              {stage.strengths.length} strength{stage.strengths.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {stage.painPoints.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                              {stage.painPoints.length} pain point{stage.painPoints.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {stage.description}
                        </p>
                      </div>
                      <div className="ml-3 shrink-0 pt-1 text-slate-400">
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="mt-4 grid gap-5 md:grid-cols-2">
                        {stage.strengths.length > 0 && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                              <CheckCircle2 className="h-4 w-4" />
                              Strengths
                            </h4>
                            <ul className="space-y-2">
                              {stage.strengths.map((s, j) => (
                                <li key={j} className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-slate-700">
                                  {s.text}
                                  {s.source && (
                                    <span className="mt-1 block text-xs italic text-slate-400">
                                      — {s.source}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {stage.painPoints.length > 0 && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              Pain Points
                            </h4>
                            <ul className="space-y-2">
                              {stage.painPoints.map((p, j) => (
                                <li key={j} className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-sm text-slate-700">
                                  {p.text}
                                  {p.source && (
                                    <span className="mt-1 block text-xs italic text-slate-400">
                                      — {p.source}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {stage.competitiveContext && stage.competitiveContext.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="mb-2 text-xs font-medium text-slate-500">Competitive context:</p>
                            <div className="flex flex-wrap gap-2">
                              {stage.competitiveContext.map((ctx, j) => (
                                <span
                                  key={j}
                                  className={cn(
                                    "rounded-full px-3 py-1 text-xs font-medium",
                                    CONTEXT_BADGES[ctx.type] ?? CONTEXT_BADGES["industry-wide"]
                                  )}
                                >
                                  {ctx.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">Stage health:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Net positive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Mixed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            Net negative
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">Competitive context:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
            Unique to client
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Competitors do better
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Industry-wide
          </span>
        </div>
      </div>
    </div>
  );
}
