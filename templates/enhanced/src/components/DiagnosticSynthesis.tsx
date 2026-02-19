"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, AlertTriangle } from "lucide-react";
import type { SynthesisData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DiagnosticSynthesisProps {
  synthesis: SynthesisData;
}

export function DiagnosticSynthesis({ synthesis }: DiagnosticSynthesisProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">
        Diagnostic Synthesis
      </h2>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {synthesis.narrative}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
            <ShieldCheck className="h-5 w-5" />
            Top Strengths
          </h3>
          {synthesis.topStrengths.map((strength, i) => (
            <SynthesisCard
              key={i}
              rank={i + 1}
              title={strength.title}
              detail={strength.detail}
              variant="strength"
            />
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Top Risks to NRR
          </h3>
          {synthesis.topRisks.map((risk, i) => (
            <SynthesisCard
              key={i}
              rank={i + 1}
              title={risk.title}
              detail={risk.detail}
              variant="risk"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SynthesisCard({
  rank,
  title,
  detail,
  variant,
}: {
  rank: number;
  title: string;
  detail: string;
  variant: "strength" | "risk";
}) {
  const [expanded, setExpanded] = useState(false);

  const isStrength = variant === "strength";
  const ringColor = isStrength ? "bg-emerald-600" : "bg-red-600";
  const borderColor = isStrength ? "border-emerald-200" : "border-red-200";
  const hoverBg = isStrength ? "hover:bg-emerald-50/50" : "hover:bg-red-50/50";

  return (
    <div className={cn("rounded-xl border bg-white shadow-sm", borderColor)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn("flex w-full items-start gap-3 p-4 text-left transition-colors", hoverBg)}
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
            ringColor
          )}
        >
          {rank}
        </div>
        <h4 className="flex-1 text-sm font-medium leading-snug text-slate-900">
          {title}
        </h4>
        <div className="shrink-0 pt-0.5 text-slate-400">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <p className="ml-10 text-sm leading-relaxed text-slate-600">
            {detail}
          </p>
        </div>
      )}
    </div>
  );
}
