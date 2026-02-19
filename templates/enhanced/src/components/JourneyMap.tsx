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

/** Computes a red/amber/green color for a stage based on strengths vs pain points */
function stageHealthColor(stage: JourneyStage): {
  bg: string;
  text: string;
  ring: string;
} {
  const strengthScore = stage.strengths.reduce(
    (sum, s) => sum + (SEVERITY_WEIGHT[s.severity] ?? 2),
    0
  );
  const painScore = stage.painPoints.reduce(
    (sum, p) => sum + (SEVERITY_WEIGHT[p.severity] ?? 2),
    0
  );

  if (stage.strengths.length === 0 && stage.painPoints.length === 0) {
    return { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-300" };
  }
  if (painScore > strengthScore) {
    return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-300" };
  }
  if (strengthScore > painScore) {
    return { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300" };
  }
  return { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300" };
}

const SEVERITY_COLORS = {
  high: { strength: "bg-emerald-500", pain: "bg-red-500" },
  medium: { strength: "bg-emerald-400", pain: "bg-red-400" },
  low: { strength: "bg-emerald-300", pain: "bg-red-300" },
};

const CONTEXT_BADGES: Record<string, { bg: string; text: string }> = {
  unique: { bg: "bg-indigo-100", text: "text-indigo-800" },
  "competitors-better": { bg: "bg-amber-100", text: "text-amber-800" },
  "industry-wide": { bg: "bg-slate-100", text: "text-slate-700" },
};

const CONTEXT_LABELS: Record<string, string> = {
  unique: "Unique to client",
  "competitors-better": "Competitors do better",
  "industry-wide": "Industry-wide",
};

export function JourneyMap({ journey, companyName }: JourneyMapProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  function toggle(stageNumber: number) {
    setExpandedStage(expandedStage === stageNumber ? null : stageNumber);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Current-State Customer Journey
        </h2>
        <p className="mt-1 text-sm text-slate-500">{journey.description}</p>
      </div>

      {/* Pipeline with color-coded stage bubbles */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-0 pb-4" style={{ minWidth: journey.stages.length * 140 }}>
          {journey.stages.map((stage, i) => {
            const health = stageHealthColor(stage);
            return (
              <div key={stage.number} className="flex items-center">
                <button
                  onClick={() => toggle(stage.number)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md",
                    expandedStage === stage.number
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1",
                      health.bg,
                      health.text,
                      health.ring
                    )}
                  >
                    {stage.number}
                  </div>
                  <span className="max-w-[110px] text-center text-xs font-medium text-slate-700 leading-tight">
                    {stage.name}
                  </span>
                  <div className="flex gap-2">
                    {stage.strengths.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        {stage.strengths.length}
                      </span>
                    )}
                    {stage.painPoints.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        <AlertTriangle className="h-3 w-3" />
                        {stage.painPoints.length}
                      </span>
                    )}
                  </div>
                </button>
                {i < journey.stages.length - 1 && (
                  <div className="h-0.5 w-6 bg-slate-300 shrink-0" />
                )}
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
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-700">Competitive context:</span>
          {Object.entries(CONTEXT_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", CONTEXT_BADGES[key].bg)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded stage detail */}
      {expandedStage !== null && (
        <StageDetail
          stage={journey.stages.find((s) => s.number === expandedStage)!}
          onClose={() => setExpandedStage(null)}
        />
      )}
    </div>
  );
}

function StageDetail({ stage, onClose }: { stage: JourneyStage; onClose: () => void }) {
  const health = stageHealthColor(stage);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1",
              health.bg,
              health.text,
              health.ring
            )}
          >
            {stage.number}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{stage.name}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <ChevronUp className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {stage.description}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {stage.strengths.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Strengths
            </h4>
            <ul className="space-y-2">
              {stage.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      SEVERITY_COLORS[s.severity].strength
                    )}
                  />
                  {s.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage.painPoints.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4" />
              Pain Points
            </h4>
            <ul className="space-y-2">
              {stage.painPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      SEVERITY_COLORS[p.severity].pain
                    )}
                  />
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {stage.competitiveContext && stage.competitiveContext.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {stage.competitiveContext.map((ctx, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                CONTEXT_BADGES[ctx.type]?.bg ?? "bg-slate-100",
                CONTEXT_BADGES[ctx.type]?.text ?? "text-slate-700"
              )}
            >
              {ctx.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
