"use client";

import { useDashboardData } from "@/lib/data";
import { NRRBenchmark } from "@/components/NRRBenchmark";
import { ManagementCommentary } from "@/components/ManagementCommentary";
import { JourneyMap } from "@/components/JourneyMap";
import { MaturityAssessment } from "@/components/MaturityAssessment";
import { NRRWaterfall } from "@/components/NRRWaterfall";
import { ValueAtStake } from "@/components/ValueAtStake";
import { HighestImpactActions } from "@/components/HighestImpactActions";
import { DiagnosticSynthesis } from "@/components/DiagnosticSynthesis";

const NAV_SECTIONS = [
  { id: "benchmark", label: "NRR Benchmark" },
  { id: "commentary", label: "Commentary" },
  { id: "journey", label: "Journey" },
  { id: "maturity", label: "Maturity" },
  { id: "waterfall", label: "Waterfall" },
  { id: "value", label: "Value at Stake" },
  { id: "actions", label: "Actions" },
  { id: "synthesis", label: "Synthesis" },
];

export default function DashboardPage() {
  const data = useDashboardData();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
          <div className="shrink-0">
            <h1 className="text-lg font-semibold text-slate-900">
              {data.company.name}
            </h1>
            <p className="text-xs text-slate-500">{data.company.sector}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-16 px-6 py-10">
        <p className="text-sm text-slate-500">{data.company.financials}</p>

        <section id="benchmark">
          <NRRBenchmark nrr={data.nrr} company={data.company} />
        </section>

        <section id="commentary">
          <ManagementCommentary
            commentary={data.nrr.managementCommentary}
          />
        </section>

        <section id="journey">
          <JourneyMap journey={data.journey} companyName={data.company.name} />
        </section>

        <section id="maturity">
          <MaturityAssessment
            maturity={data.nrr.maturity}
            companyName={data.company.name}
          />
        </section>

        <section id="waterfall">
          <NRRWaterfall
            waterfall={data.nrr.waterfall}
            companyName={data.company.name}
          />
        </section>

        <section id="value">
          <ValueAtStake
            valueAtStake={data.nrr.valueAtStake}
            companyName={data.company.name}
          />
        </section>

        <section id="actions">
          <HighestImpactActions actions={data.nrr.actions} />
        </section>

        <section id="synthesis">
          <DiagnosticSynthesis synthesis={data.synthesis} />
        </section>
      </main>
    </>
  );
}
