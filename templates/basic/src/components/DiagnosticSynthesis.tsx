"use client";

import { FileText, ShieldCheck, AlertOctagon } from "lucide-react";
import type { SynthesisData } from "@/lib/types";

interface DiagnosticSynthesisProps {
  synthesis: SynthesisData;
  companyName: string;
}

/** Narrative synthesis with top strengths and top risks to NRR */
export function DiagnosticSynthesis({
  synthesis,
  companyName,
}: DiagnosticSynthesisProps) {
  return (
    <section className="bg-white rounded-xl border border-border shadow-sm">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">
            Diagnostic Synthesis
          </h2>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Connecting {companyName}&apos;s NRR performance to CX findings
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Narrative */}
        <div className="prose prose-slate prose-sm max-w-none">
          {synthesis.narrative.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm text-text leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Top Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-text">
              Top Strengths Driving NRR
            </h3>
          </div>
          <div className="space-y-4">
            {synthesis.topStrengths.map((strength, i) => (
              <div
                key={i}
                className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-800">
                      {strength.title}
                    </h4>
                    <div className="mt-2 text-sm text-text leading-relaxed whitespace-pre-line">
                      {strength.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-text">
              Top Risks to NRR
            </h3>
          </div>
          <div className="space-y-4">
            {synthesis.topRisks.map((risk, i) => (
              <div
                key={i}
                className="rounded-lg border border-red-200 bg-red-50/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">
                      {risk.title}
                    </h4>
                    <div className="mt-2 text-sm text-text leading-relaxed whitespace-pre-line">
                      {risk.detail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
