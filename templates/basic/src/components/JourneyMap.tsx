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

/** Current-state customer journey map with stages, strengths, and pain points */
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
          {journey.description || `${companyName} customer lifecycle stages with CX strengths and pain points`}
        </p>
      </div>

      {/* Journey timeline rail */}
      <div className="px-6 py-4 border-b border-border bg-surface-alt">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {journey.stages.map((stage, i) => (
            <div key={stage.number} className="flex items-center shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {stage.number}
                </span>
                {stage.name}
              </div>
              {i < journey.stages.length - 1 && (
                <div className="w-4 h-px bg-border mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage details */}
      <div className="divide-y divide-border">
        {journey.stages.map((stage) => (
          <StageCard key={stage.number} stage={stage} />
        ))}
      </div>
    </section>
  );
}

function StageCard({ stage }: { stage: JourneyStage }) {
  const [expanded, setExpanded] = useState(true);

  const strengthCount = stage.strengths.length;
  const painCount = stage.painPoints.length;

  return (
    <div className="px-6 py-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
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
          <span className="text-xs text-emerald-600 font-medium">
            {strengthCount} strength{strengthCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-red-600 font-medium">
            {painCount} pain point{painCount !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid md:grid-cols-2 gap-4 pl-10">
          {/* Strengths */}
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

          {/* Pain points */}
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

          {/* Competitive context flags */}
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
                      contextStyle(ctx.type)
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

function contextStyle(
  type: "unique" | "competitors-better" | "industry-wide"
): string {
  const map: Record<string, string> = {
    unique: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    "competitors-better":
      "bg-amber-50 text-amber-700 border border-amber-200",
    "industry-wide": "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return map[type] ?? map["industry-wide"];
}
