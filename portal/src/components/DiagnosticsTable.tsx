"use client";

import { useState, useEffect } from "react";
import { ExternalLink, CheckCircle, Clock, RefreshCw } from "lucide-react";
import {
  GITHUB_DIAGNOSTICS_URL,
  fallbackDiagnostics,
  type Diagnostic,
} from "@/data/diagnostics";

type FilterTab = "all" | "basic" | "enhanced" | "agentic";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "basic", label: "NRR + CX" },
  { key: "enhanced", label: "NRR Growth" },
  { key: "agentic", label: "Operations" },
];

const BADGE_STYLES: Record<
  Diagnostic["product"],
  { bg: string; text: string; label: string }
> = {
  basic: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "NRR + CX" },
  enhanced: { bg: "bg-blue-500/15", text: "text-blue-400", label: "NRR Growth" },
  agentic: { bg: "bg-purple-500/15", text: "text-purple-400", label: "Operations" },
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const isDeployed = status === "deployed";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isDeployed ? "text-emerald-400" : "text-amber-400"
      }`}
    >
      {isDeployed ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <Clock className="h-3.5 w-3.5" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DiagnosticsTable() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [diagnostics, setDiagnostics] =
    useState<Diagnostic[]>(fallbackDiagnostics);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch(GITHUB_DIAGNOSTICS_URL)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: Diagnostic[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDiagnostics(data);
          setIsLive(true);
        }
      })
      .catch(() => {
        setIsLive(false);
      });
  }, []);

  const sorted = [...diagnostics].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );

  const filtered =
    activeTab === "all"
      ? sorted
      : sorted.filter((d) => d.product === activeTab);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-slate-700/60 bg-slate-800/30 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <RefreshCw className="h-3 w-3" />
          {isLive ? "Live from GitHub" : "Cached data"}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-700/60 md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Client
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Product
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                URL
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Author
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                NRR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {filtered.map((d) => (
              <tr
                key={d.url}
                className="transition-colors hover:bg-slate-800/40"
              >
                <td className="px-5 py-3.5 text-sm font-medium text-white">
                  {d.client}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[d.product]?.bg ?? ""} ${BADGE_STYLES[d.product]?.text ?? "text-slate-400"}`}
                  >
                    {BADGE_STYLES[d.product]?.label ?? d.product}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    {new URL(d.url).hostname.replace("www.", "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-300">
                  {d.author}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-300">
                  {formatDate(d.created)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-5 py-3.5 text-sm font-medium text-white">
                  {d.nrr || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((d) => (
          <div
            key={d.url}
            className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {d.client}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[d.product]?.bg ?? ""} ${BADGE_STYLES[d.product]?.text ?? "text-slate-400"}`}
              >
                {BADGE_STYLES[d.product]?.label ?? d.product}
              </span>
            </div>
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 inline-flex items-center gap-1 text-sm text-indigo-400 hover:underline"
            >
              {new URL(d.url).hostname.replace("www.", "")}
              <ExternalLink className="h-3 w-3" />
            </a>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>{d.author}</span>
              <span>{formatDate(d.created)}</span>
              <StatusBadge status={d.status} />
              {d.nrr && (
                <span className="font-medium text-white">NRR {d.nrr}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          No diagnostics found for this filter.
        </div>
      )}
    </div>
  );
}
