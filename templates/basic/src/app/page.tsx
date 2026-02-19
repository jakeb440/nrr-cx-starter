"use client";

import { useDashboardData } from "@/lib/data";
import { NRRBenchmark } from "@/components/NRRBenchmark";
import { ManagementCommentary } from "@/components/ManagementCommentary";
import { JourneyMap } from "@/components/JourneyMap";
import { DiagnosticSynthesis } from "@/components/DiagnosticSynthesis";
import { BarChart3 } from "lucide-react";

export default function Home() {
  const data = useDashboardData();

  return (
    <main className="min-h-screen bg-surface-alt">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {data.company.name} — NRR &amp; CX Diagnostic
              </h1>
              <p className="text-sm text-text-secondary">
                {data.company.sector} · {data.company.financials}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <NRRBenchmark nrr={data.nrr} companyName={data.company.name} />
        <ManagementCommentary commentary={data.nrr.managementCommentary} />
        <JourneyMap journey={data.journey} companyName={data.company.name} />
        <DiagnosticSynthesis
          synthesis={data.synthesis}
          companyName={data.company.name}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-text-muted">
          NRR &amp; CX Diagnostic · {data.company.name} · Generated{" "}
          {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  );
}
