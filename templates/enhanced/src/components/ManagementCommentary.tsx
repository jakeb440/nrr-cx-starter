"use client";

import { useState } from "react";
import { Quote, ChevronDown, ChevronUp } from "lucide-react";

interface ManagementCommentaryProps {
  commentary: { quote: string; source: string }[];
}

export function ManagementCommentary({ commentary }: ManagementCommentaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (commentary.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          Management Commentary on NRR
        </h3>
        <div className="text-slate-400 shrink-0 ml-4">
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-6">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {commentary.map((item, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-5"
              >
                <Quote className="absolute right-4 top-4 h-6 w-6 text-indigo-100" />
                <blockquote className="relative text-sm leading-relaxed text-slate-700">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  — {item.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
