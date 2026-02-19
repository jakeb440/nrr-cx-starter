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
    <div className="space-y-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-2xl font-bold text-slate-900">
          Management Commentary on NRR
        </h2>
        <div className="text-slate-400 shrink-0 ml-4">
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>
      <p className="mt-1 text-sm text-slate-500">
        Key quotes from earnings calls and investor presentations
      </p>

      {isOpen && (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {commentary.map((item, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <Quote className="absolute right-4 top-4 h-6 w-6 text-indigo-100" />
              <blockquote className="relative text-sm leading-relaxed text-slate-700">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <p className="mt-4 text-xs font-medium text-slate-500">
                — {item.source}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
