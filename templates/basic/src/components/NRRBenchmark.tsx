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
  LineChart,
  Line,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { NRRData, PeerDataPoint } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

interface NRRBenchmarkProps {
  nrr: NRRData;
  companyName: string;
}

function quartileColor(nrr: number, q1: number, q4: number, median: number): string {
  if (nrr >= q1) return "#10b981";
  if (nrr >= median) return "#3b82f6";
  if (nrr >= q4) return "#f59e0b";
  return "#ef4444";
}

function QuartileBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Q1: "bg-emerald-100 text-emerald-800",
    Q2: "bg-blue-100 text-blue-800",
    Q3: "bg-amber-100 text-amber-800",
    Q4: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colorMap[label] ?? "bg-slate-100 text-slate-800"
      )}
    >
      {label}
    </span>
  );
}

export function NRRBenchmark({ nrr, companyName }: NRRBenchmarkProps) {
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

  const trendData = nrr.history.map((h) => ({
    period: h.period,
    nrr: h.nrr,
  }));

  return (
    <section className="bg-white rounded-xl border border-border shadow-sm">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-lg font-semibold text-text">NRR Peer Benchmark</h2>
        <p className="text-sm text-text-secondary mt-1">
          {companyName} vs. {nrr.peers.count} peers · Median{" "}
          {formatNumber(nrr.peers.median, 0)}% · Range {nrr.peers.range}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* NRR hero + quartile badge */}
        <div className="flex flex-wrap items-baseline gap-4">
          <div>
            <span className="text-4xl font-bold text-primary">
              {nrr.current}%
            </span>
            <span className="ml-2 text-sm text-text-secondary">
              ({nrr.currentPeriod})
            </span>
          </div>
          <QuartileBadge label={nrr.quartile} />
        </div>

        {/* 5-stat card row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Peers" value={String(nrr.peers.count)} />
          <StatCard label="Median" value={`${formatNumber(nrr.peers.median)}%`} />
          <StatCard label="Top quartile (Q1)" value={`≥ ${formatNumber(nrr.peers.topQuartile)}%`} />
          <StatCard label="Bottom quartile (Q4)" value={`≤ ${formatNumber(nrr.peers.bottomQuartile)}%`} />
          <StatCard label="Range" value={nrr.peers.range} />
        </div>

        {/* Vertical bar chart with quartile coloring */}
        <div className="rounded-xl border border-border p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
            <span className="font-medium text-text">Quartile:</span>
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
            <span className="ml-4 border-l border-border pl-4 font-medium text-text">
              Period opacity:
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-text-muted" />
              Reported
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-text-muted/60" />
              Estimated / implied
            </span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={70}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                domain={[
                  (dataMin: number) => Math.floor(dataMin / 5) * 5 - 5,
                  (dataMax: number) => Math.ceil(dataMax / 5) * 5 + 5,
                ]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-lg">
                      <p className="font-semibold text-text">{d.name}</p>
                      <p className="text-text-secondary">
                        NRR: <span className="font-medium">{d.nrr}%</span>
                      </p>
                      <p className="text-text-muted">{d.period}</p>
                      {d.isEstimated && (
                        <p className="text-xs italic text-warning">Estimated / implied</p>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={nrr.peers.median}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `Median ${formatNumber(nrr.peers.median, 0)}%`,
                  position: "right",
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              <Bar dataKey="nrr" radius={[4, 4, 0, 0]} barSize={32}>
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

        {/* NRR Trend */}
        {trendData.length > 1 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              {companyName} NRR Trend
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    domain={["dataMin - 3", "dataMax + 3"]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "NRR"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="nrr"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Methodology notes — always visible, per-peer detail */}
        {nrr.methodologyNotes.length > 0 && (
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-text mb-3">
              NRR Methodology Notes
            </h3>
            <div className="space-y-3">
              {nrr.methodologyNotes.map((note, i) => {
                const colonIdx = note.indexOf(":");
                const hasPeerName = colonIdx > 0 && colonIdx < 40;
                return (
                  <div key={i} className="text-sm text-text-secondary leading-relaxed">
                    {hasPeerName ? (
                      <>
                        <span className="font-semibold text-text">
                          {note.slice(0, colonIdx)}:
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
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-alt px-4 py-3">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text">{value}</p>
    </div>
  );
}
