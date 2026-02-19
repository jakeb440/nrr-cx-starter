"use client";

import { Quote } from "lucide-react";

interface ManagementCommentaryProps {
  commentary: {
    quote: string;
    source: string;
  }[];
}

export function ManagementCommentary({ commentary }: ManagementCommentaryProps) {
  if (commentary.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-border shadow-sm">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-lg font-semibold text-text">
          Management Commentary on NRR
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Key quotes from earnings calls and investor presentations
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {commentary.map((item, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-border bg-surface-alt p-5"
            >
              <Quote className="absolute right-4 top-4 h-6 w-6 text-primary/10" />
              <blockquote className="relative text-sm leading-relaxed text-text">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <p className="mt-3 text-xs font-medium text-text-muted">
                — {item.source}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
