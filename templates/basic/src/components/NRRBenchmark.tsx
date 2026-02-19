"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { NRRData, PeerDataPoint } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

interface NRRBenchmarkProps {
  nrr: NRRData;
  companyName: string;
}

/** Peer benchmark chart with quartile bands, trend line, and methodology notes */
export function NRRBenchmark({ nrr, companyName }: NRRBenchmarkProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  const sortedPeers = [...nrr.peerData].sort((a, b) => b.nrr - a.nrr);

  const barData = sortedPeers.map((peer) => ({
    name: peer.company,
    nrr: peer.nrr,
    isTarget: peer.isTarget,
    isEstimated: peer.isEstimated,
    fill: peer.isTarget ? "#6366f1" : "#94a3b8",
  }));

  const trendData = nrr.history.map((h) => ({
    period: h.period,
    nrr: h.nrr,
  }));

  return (
    <section className="bg-white rounded-xl border border-border shadow-sm">
      {/* Section header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">
            NRR Peer Benchmark
          </h2>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          {companyName} vs. {nrr.peers.count} peers · Median{" "}
          {formatNumber(nrr.peers.median, 0)}% · Range {nrr.peers.range}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Current NRR"
            value={`${formatNumber(nrr.current, 0)}%`}
            sub={nrr.currentPeriod}
            accent
          />
          <KPICard
            label="Peer Median"
            value={`${formatNumber(nrr.peers.median, 0)}%`}
            sub={`${nrr.peers.count} companies`}
          />
          <KPICard
            label="Top Quartile"
            value={`≥${formatNumber(nrr.peers.topQuartile, 0)}%`}
          />
          <KPICard
            label="Quartile Rank"
            value={nrr.quartile}
            sub={quartileDescription(nrr.quartile)}
          />
        </div>

        {/* Peer bar chart */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            NRR by Company
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "NRR"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                  }}
                />
                <ReferenceLine
                  y={nrr.peers.median}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{
                    value: `Median ${formatNumber(nrr.peers.median, 0)}%`,
                    position: "right",
                    fontSize: 11,
                    fill: "#6366f1",
                  }}
                />
                <Bar
                  dataKey="nrr"
                  radius={[4, 4, 0, 0]}
                  fill="#94a3b8"
                  isAnimationActive={false}
                >
                  {barData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend chart (if history available) */}
        {trendData.length > 1 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              {companyName} NRR Trend
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    domain={["dataMin - 3", "dataMax + 3"]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "NRR"]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
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

        {/* Methodology notes (collapsible) */}
        {nrr.methodologyNotes.length > 0 && (
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text transition-colors"
            >
              <Info className="w-4 h-4" />
              NRR Methodology Notes
              {showMethodology ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showMethodology && (
              <ul className="mt-3 space-y-1.5 text-sm text-text-secondary">
                {nrr.methodologyNotes.map((note, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-text-muted shrink-0">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

function KPICard({ label, value, sub, accent }: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        accent
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-surface-alt"
      )}
    >
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold mt-1",
          accent ? "text-primary" : "text-text"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  );
}

function quartileDescription(q: string): string {
  const map: Record<string, string> = {
    Q1: "Top quartile",
    Q2: "Above median",
    Q3: "Below median",
    Q4: "Bottom quartile",
  };
  return map[q] ?? "";
}
