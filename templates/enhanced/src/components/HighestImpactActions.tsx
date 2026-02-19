"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Target, Layers } from "lucide-react";
import type { Action } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HighestImpactActionsProps {
  actions: Action[];
}

export function HighestImpactActions({ actions }: HighestImpactActionsProps) {
  const totalImpact = actions.reduce((sum, a) => {
    const match = a.impact.match(/[\d.]+/);
    return sum + (match ? parseFloat(match[0]) : 0);
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Highest-Impact Actions
        </h2>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Note on overlap:</span> Actions are
          uniquely weighted — each action&apos;s pp impact is independent and
          non-overlapping. Total sums to{" "}
          <span className="font-semibold">{totalImpact}pp</span>.
        </p>
      </div>

      <div className="space-y-4">
        {actions.map((action) => (
          <ActionCard key={action.rank} action={action} />
        ))}
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: Action }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {action.rank}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-slate-900">
            {action.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <Target className="h-3 w-3" />
              {action.impact}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              <Clock className="h-3 w-3" />
              {action.timeline}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              <Layers className="h-3 w-3" />
              {action.dimension}
            </span>
          </div>
        </div>

        <div className="shrink-0 pt-1 text-slate-400">
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-3">
          <div className="ml-13 pl-0 md:ml-[52px]">
            <p className="text-sm leading-relaxed text-slate-600">
              {action.rationale}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
