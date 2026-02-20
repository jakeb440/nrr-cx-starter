"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { NRRData, Company, PeerDataPoint } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

interface NRRBenchmarkProps {
  nrr: NRRData;
  company: Company;
}

function quartileColor(nrr: number, q1: number, q4: number, median: number): string {
  if (nrr >= q1) return "#10b981";
  if (nrr >= median) return "#3b82f6";
  if (nrr >= q4) return "#f59e0b";
  return "#ef4444";
}

function quartileBg(quartile: string): string {
  const map: Record<string, string> = {
    Q1: "bg-emerald-600",
    Q2: "bg-blue-600",
    Q3: "bg-amber-500",
    Q4: "bg-red-600",
  };
  return map[quartile] ?? "bg-slate-500";
}

export function NRRBenchmark({ nrr, company }: NRRBenchmarkProps) {
  const [notesOpen, setNotesOpen] = useState(true);

  const sortedPeers = [...nrr.peerData].sort((a, b) => b.nrr - a.nrr);
  const { topQuartile, bottomQuartile, median } = nrr.peers;

  const chartData = sortedPeers.map((p: PeerDataPoint) => ({
    name: p.company,
    nrr: p.nrr,
    isTarget: p.isTarget,
    isEstimated: p.isEstimated ?? false,
    period: p.period,
    fill: p.isTarget
      ? "#6366f1"
      : quartileColor(p.nrr, topQuartile, bottomQuartile, median),
    opacity: p.isEstimated ? 0.6 : 1,
  }));

  const uniquePeriods = [...new Set(nrr.peerData.map((p) => p.period))];

  return (
    <div className="space-y-8">
      {/* Section heading + NRR circle */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">NRR Benchmark</h2>
          <p className="mt-1 text-sm text-slate-500">
            {company.sector} &middot; {company.financials} &middot;{" "}
            {nrr.peers.count} peers &middot; {nrr.history.length} periods
          </p>
        </div>

        {/* Large quartile circle */}
        <div
          className={cn(
            "flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full text-white shadow-lg",
            quartileBg(nrr.quartile)
          )}
        >
          <span className="text-xs font-medium opacity-90">{company.name}:</span>
          <span className="text-lg font-bold leading-tight">{nrr.current}% ({nrr.currentPeriod})</span>
          <span className="text-xs font-semibold opacity-80">&mdash; {nrr.quartile}</span>
        </div>
      </div>

      {/* 5-stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="PEERS" value={String(nrr.peers.count)} />
        <StatCard label="MEDIAN" value={`${formatNumber(nrr.peers.median)}%`} />
        <StatCard label="TOP QUARTILE (Q1)" value={`≥ ${formatNumber(nrr.peers.topQuartile)}%`} />
        <StatCard label="BOTTOM QUARTILE (Q4)" value={`≤ ${formatNumber(nrr.peers.bottomQuartile)}%`} />
        <StatCard label="RANGE" value={nrr.peers.range} />
      </div>

      {/* Horizontal bar chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Legend */}
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Quartile:</span>
          {[
            { label: "Q1", color: "bg-emerald-500" },
            { label: "Q2", color: "bg-blue-500" },
            { label: "Q3", color: "bg-amber-500" },
            { label: "Q4", color: "bg-red-500" },
          ].map((q) => (
            <span key={q.label} className="flex items-center gap-1.5">
              <span className={cn("h-3 w-3 rounded-sm", q.color)} />
              {q.label}
            </span>
          ))}
        </div>

        {/* Period timeline */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Period opacity:</span>
          {uniquePeriods.map((period) => {
            const isEstimated = period.includes("est.") || period.includes("impl.");
            return (
              <span
                key={period}
                className={cn(
                  "font-medium",
                  isEstimated ? "text-slate-300" : "text-slate-600"
                )}
              >
                {period}
              </span>
            );
          })}
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex h-3 w-3 items-center justify-center rounded border border-dashed border-slate-400 text-[6px]">⋯</span>
          Estimated / implied
        </div>

        <ResponsiveContainer width="100%" height={Math.max(280, sortedPeers.length * 48)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[
                (dataMin: number) => Math.floor(dataMin / 5) * 5 - 5,
                (dataMax: number) => Math.ceil(dataMax / 5) * 5 + 5,
              ]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 12, fill: "#334155" }}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
                    <p className="font-semibold text-slate-900">{d.name}</p>
                    <p className="text-slate-600">
                      NRR: <span className="font-medium">{d.nrr}%</span>
                    </p>
                    <p className="text-slate-500">{d.period}</p>
                    {d.isEstimated && (
                      <p className="text-xs italic text-amber-600">Estimated / implied</p>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine
              x={nrr.peers.median}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{ value: "Median", position: "top", fontSize: 11, fill: "#94a3b8" }}
            />
            <Bar dataKey="nrr" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  fillOpacity={entry.opacity}
                  stroke={entry.isTarget ? "#4f46e5" : "none"}
                  strokeWidth={entry.isTarget ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Methodology notes — always visible, per-peer bold names */}
      {nrr.methodologyNotes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            NRR Methodology Notes
          </h3>
          <div className="space-y-3">
            {nrr.methodologyNotes.map((note, i) => {
              const colonIdx = note.indexOf(":");
              const hasPeerName = colonIdx > 0 && colonIdx < 40;
              return (
                <div key={i} className="text-sm text-slate-500 leading-relaxed">
                  {hasPeerName ? (
                    <>
                      <span className="font-bold text-slate-800">
                        {note.slice(0, colonIdx).toUpperCase()}:
                      </span>
                      {note.slice(colonIdx + 1)}
                    </>
                  ) : (
                    note
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}
