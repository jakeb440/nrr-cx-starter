"use client";

import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MaturityDimension } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MaturityAssessmentProps {
  maturity: MaturityDimension[];
  companyName: string;
}

const MATURITY_VALUE: Record<string, number> = {
  Basic: 1,
  Advanced: 2,
  "Next-gen": 3,
};

export function MaturityAssessment({ maturity, companyName }: MaturityAssessmentProps) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  const radarData = maturity.map((dim) => ({
    dimension: dim.dimension.replace(/ /g, "\n"),
    dimensionFull: dim.dimension,
    current: MATURITY_VALUE[dim.current] ?? 1,
    target: MATURITY_VALUE[dim.target] ?? 3,
    currentLabel: dim.current,
    targetLabel: dim.target,
    label: dim.label,
  }));

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

      {/* Radar chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mx-auto" style={{ maxWidth: 500 }}>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 11, fill: "#334155" }}
              />
              <PolarRadiusAxis
                domain={[0, 3]}
                tickCount={4}
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                tickFormatter={(v: number) => {
                  const labels: Record<number, string> = { 1: "Basic", 2: "Adv.", 3: "Next-gen" };
                  return labels[v] ?? "";
                }}
              />
              <Radar
                name="Current"
                dataKey="current"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Radar
                name="Target (2-3yr)"
                dataKey="target"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.08}
                strokeWidth={2}
                strokeDasharray="6 3"
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dimension cards */}
      <div className="space-y-3">
        {maturity.map((dim) => {
          const isOpen = expandedDim === dim.dimension;
          return (
            <button
              key={dim.dimension}
              onClick={() => setExpandedDim(isOpen ? null : dim.dimension)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {dim.dimension}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {dim.label}
                </span>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Maturity scale:</span>
        {["Basic", "Advanced", "Next-gen"].map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                level === "Basic" ? "bg-amber-500" : level === "Advanced" ? "bg-blue-500" : "bg-emerald-500"
              )}
            />
            {level}
          </span>
        ))}
      </div>

      <p className="text-xs italic text-slate-400">
        Source: McKinsey NRR Maturity Benchmark (N=101 B2B SaaS companies)
      </p>
    </div>
  );
}
