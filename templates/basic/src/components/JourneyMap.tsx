"use client";

import { useState } from "react";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Flag,
} from "lucide-react";
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

const CONTEXT_STYLES: Record<string, string> = {
  unique: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "competitors-better": "bg-amber-50 text-amber-700 border border-amber-200",
  "industry-wide": "bg-slate-100 text-slate-600 border border-slate-200",
};

export function JourneyMap({ journey, companyName }: JourneyMapProps) {
  return (
    <section className="bg-white rounded-xl border border-border shadow-sm">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">
            Current-State Customer Journey
          </h2>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          {journey.description ||
            `${companyName} — strengths and pain points across the B2B customer experience journey`}
        </p>
      </div>

      {/* Journey timeline rail with color-coded bubbles */}
      <div className="px-6 py-4 border-b border-border bg-surface-alt">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {journey.stages.map((stage, i) => {
            const health = stageHealthColor(stage);
            return (
              <div key={stage.number} className="flex items-center shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium text-text-secondary">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ring-1",
                      health.bg,
                      health.text,
                      health.ring
                    )}
                  >
                    {stage.number}
                  </span>
                  {stage.name}
                </div>
                {i < journey.stages.length - 1 && (
                  <div className="w-4 h-px bg-border mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage details */}
      <div className="divide-y divide-border">
        {journey.stages.map((stage) => (
          <StageCard key={stage.number} stage={stage} />
        ))}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-border bg-surface-alt">
        <div className="flex flex-wrap gap-6 text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="font-medium text-text">Stage health:</span>
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
            <span className="font-medium text-text">Competitive context:</span>
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
    </section>
  );
}

function StageCard({ stage }: { stage: JourneyStage }) {
  const [expanded, setExpanded] = useState(true);
  const health = stageHealthColor(stage);

  const strengthCount = stage.strengths.length;
  const painCount = stage.painPoints.length;

  return (
    <div className="px-6 py-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ring-1",
              health.bg,
              health.text,
              health.ring
            )}
          >
            {stage.number}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
              {stage.name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {stage.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {strengthCount > 0 && (
            <span className="text-xs text-emerald-600 font-medium">
              {strengthCount} strength{strengthCount !== 1 ? "s" : ""}
            </span>
          )}
          {painCount > 0 && (
            <span className="text-xs text-red-600 font-medium">
              {painCount} pain point{painCount !== 1 ? "s" : ""}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid md:grid-cols-2 gap-4 pl-10">
          <div>
            <h4 className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Strengths
            </h4>
            <ul className="space-y-2">
              {stage.strengths.map((s, i) => (
                <li
                  key={i}
                  className={cn(
                    "text-sm text-text rounded-md px-3 py-2 border-l-2",
                    severityBorder(s.severity, "positive")
                  )}
                >
                  {s.text}
                </li>
              ))}
              {stage.strengths.length === 0 && (
                <li className="text-xs text-text-muted italic">
                  No notable strengths identified
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pain Points
            </h4>
            <ul className="space-y-2">
              {stage.painPoints.map((p, i) => (
                <li
                  key={i}
                  className={cn(
                    "text-sm text-text rounded-md px-3 py-2 border-l-2",
                    severityBorder(p.severity, "negative")
                  )}
                >
                  {p.text}
                </li>
              ))}
              {stage.painPoints.length === 0 && (
                <li className="text-xs text-text-muted italic">
                  No notable pain points identified
                </li>
              )}
            </ul>
          </div>

          {stage.competitiveContext && stage.competitiveContext.length > 0 && (
            <div className="md:col-span-2">
              <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                Competitive Context
              </h4>
              <div className="flex flex-wrap gap-2">
                {stage.competitiveContext.map((ctx, i) => (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium",
                      CONTEXT_STYLES[ctx.type] ?? CONTEXT_STYLES["industry-wide"]
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
  );
}

function severityBorder(
  severity: "high" | "medium" | "low",
  tone: "positive" | "negative"
): string {
  if (tone === "positive") {
    const map: Record<string, string> = {
      high: "border-emerald-500 bg-emerald-50/50",
      medium: "border-emerald-300 bg-emerald-50/30",
      low: "border-emerald-200 bg-emerald-50/20",
    };
    return map[severity] ?? map.medium;
  }
  const map: Record<string, string> = {
    high: "border-red-500 bg-red-50/50",
    medium: "border-red-300 bg-red-50/30",
    low: "border-red-200 bg-red-50/20",
  };
  return map[severity] ?? map.medium;
}
