"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { WaterfallData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface NRRWaterfallProps {
  waterfall: WaterfallData;
  companyName: string;
}

export function NRRWaterfall({ waterfall, companyName }: NRRWaterfallProps) {
  const { components } = waterfall;

  const expansionDelta = components.expansion.target - components.expansion.current;
  const contractionDelta = Math.abs(components.contraction.target) - Math.abs(components.contraction.current);
  const retentionDelta = components.grossRetention.target - components.grossRetention.current;

  const chartData = [
    {
      name: "Current NRR",
      value: waterfall.currentNRR,
      base: 0,
      fill: "#6366f1",
      label: `${formatNumber(waterfall.currentNRR)}%`,
    },
    {
      name: "Retention\nImprovement",
      value: retentionDelta,
      base: waterfall.currentNRR,
      fill: "#10b981",
      label: `+${formatNumber(retentionDelta)}pp`,
    },
    {
      name: "Expansion\nGrowth",
      value: expansionDelta,
      base: waterfall.currentNRR + retentionDelta,
      fill: "#10b981",
      label: `+${formatNumber(expansionDelta)}pp`,
    },
    {
      name: "Contraction\nReduction",
      value: -contractionDelta,
      base: waterfall.currentNRR + retentionDelta + expansionDelta,
      fill: contractionDelta > 0 ? "#10b981" : "#ef4444",
      label: `${contractionDelta > 0 ? "+" : ""}${formatNumber(-contractionDelta)}pp`,
    },
    {
      name: "Target NRR",
      value: waterfall.targetNRR,
      base: 0,
      fill: "#4f46e5",
      label: `${formatNumber(waterfall.targetNRR)}%`,
    },
  ];

  const chartMin = Math.floor((waterfall.currentNRR - 10) / 5) * 5;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          NRR Waterfall — Current vs. Improved
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Decomposition of {companyName}&apos;s NRR into retention and expansion
          components, with 2-3 year improvement targets
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Current NRR</p>
          <p className="mt-1 text-3xl font-bold text-indigo-600">
            {formatNumber(waterfall.currentNRR)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Target NRR</p>
          <p className="mt-1 text-3xl font-bold text-indigo-800">
            {formatNumber(waterfall.targetNRR)}%{" "}
            <span className="text-lg font-semibold text-emerald-600">
              (+{formatNumber(waterfall.improvement)}pp)
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
            />
            <YAxis
              domain={[chartMin, "auto"]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
                    <p className="font-semibold text-slate-900">{d.name.replace("\n", " ")}</p>
                    <p className="text-slate-600">{d.label}</p>
                  </div>
                );
              }}
            />
            {/* Invisible base bar */}
            <Bar dataKey="base" stackId="stack" fill="transparent" />
            {/* Visible value bar */}
            <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="label"
                position="top"
                style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-indigo-500" /> Current
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-indigo-800" /> 2-3yr Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" /> Expansion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-500" /> Contraction
          </span>
        </div>
      </div>

      {/* Component detail table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Improvement Levers Detail
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-slate-100">
              <th className="px-6 py-3 text-left font-medium text-slate-500">Component</th>
              <th className="px-6 py-3 text-right font-medium text-slate-500">Current</th>
              <th className="px-6 py-3 text-right font-medium text-slate-500">Target</th>
              <th className="px-6 py-3 text-right font-medium text-slate-500">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-6 py-3 text-slate-700">Gross Retention</td>
              <td className="px-6 py-3 text-right text-slate-600">{components.grossRetention.current}%</td>
              <td className="px-6 py-3 text-right text-slate-600">{components.grossRetention.target}%</td>
              <td className="px-6 py-3 text-right font-medium text-emerald-600">
                +{components.grossRetention.target - components.grossRetention.current}pp
              </td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-700">Expansion</td>
              <td className="px-6 py-3 text-right text-slate-600">{components.expansion.current}%</td>
              <td className="px-6 py-3 text-right text-slate-600">{components.expansion.target}%</td>
              <td className="px-6 py-3 text-right font-medium text-emerald-600">
                +{components.expansion.target - components.expansion.current}pp
              </td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-slate-700">Contraction</td>
              <td className="px-6 py-3 text-right text-slate-600">{components.contraction.current}%</td>
              <td className="px-6 py-3 text-right text-slate-600">{components.contraction.target}%</td>
              <td className="px-6 py-3 text-right font-medium text-emerald-600">
                +{Math.abs(components.contraction.current) - Math.abs(components.contraction.target)}pp
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
