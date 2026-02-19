"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { ValueAtStakeData, ValueAtStakeScenario } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ValueAtStakeProps {
  valueAtStake: ValueAtStakeData;
  companyName: string;
}

const SCENARIO_STYLES: Record<string, { border: string; badge: string; bar: string }> = {
  Current: {
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-700",
    bar: "#94a3b8",
  },
  Realistic: {
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    bar: "#6366f1",
  },
  Aspirational: {
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    bar: "#10b981",
  },
};

function getStyle(name: string) {
  return SCENARIO_STYLES[name] ?? SCENARIO_STYLES.Current;
}

export function ValueAtStake({ valueAtStake, companyName }: ValueAtStakeProps) {
  const { scenarios } = valueAtStake;

  const evChartData = scenarios
    .filter((s) => s.evGain !== "—")
    .map((s) => ({
      name: s.name,
      evGain: parseEvGain(s.evGain),
      label: s.evGain,
      fill: getStyle(s.name).bar,
    }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Value at Stake — NRR Improvement Scenarios
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Translating NRR improvement to incremental ARR and enterprise value
          for {companyName} (base ARR: {valueAtStake.baseARR})
        </p>
      </div>

      {valueAtStake.methodology && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Methodology
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {valueAtStake.methodology}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.name}
            scenario={scenario}
            currentMultiple={valueAtStake.currentMultiple}
          />
        ))}
      </div>

      {evChartData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Enterprise Value Gain by Scenario
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evChartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `$${v}B`}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <p className="text-slate-600">EV Gain: {d.label}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="evGain" radius={[6, 6, 0, 0]} barSize={56}>
                {evChartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="label"
                  position="top"
                  style={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  currentMultiple,
}: {
  scenario: ValueAtStakeScenario;
  currentMultiple: number;
}) {
  const style = getStyle(scenario.name);

  return (
    <div className={cn("rounded-xl border bg-white p-5 shadow-sm", style.border)}>
      <div className="flex items-center justify-between">
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", style.badge)}>
          {scenario.name}
        </span>
        {scenario.evGain !== "—" && (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        )}
      </div>

      <div className="mt-4 space-y-3">
        <MetricRow label="NRR" value={`${scenario.targetNRR}%`} />
        <MetricRow label="Incremental ARR" value={scenario.incrementalARR} />
        <MetricRow label="EV Multiple" value={`${scenario.evMultiple}x`} />
        <MetricRow
          label="Implied EV Gain"
          value={scenario.evGain}
          highlight={scenario.evGain !== "—"}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {scenario.rationale}
      </p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold",
          highlight ? "text-emerald-700" : "text-slate-900"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Extracts a numeric value from strings like "+$18.1B" or "$5.9B" */
function parseEvGain(str: string): number {
  const match = str.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}
