"use client";

import { MessageSquareQuote } from "lucide-react";

interface ManagementCommentaryProps {
  commentary: {
    quote: string;
    source: string;
  }[];
}

/** Displays management commentary quotes from earnings calls */
export function ManagementCommentary({
  commentary,
}: ManagementCommentaryProps) {
  if (commentary.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-border shadow-sm">
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text">
            Management Commentary on NRR
          </h2>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Key quotes from earnings calls and investor presentations
        </p>
      </div>

      <div className="p-6 space-y-4">
        {commentary.map((item, i) => (
          <blockquote
            key={i}
            className="relative pl-4 border-l-2 border-primary/30"
          >
            <p className="text-sm text-text leading-relaxed italic">
              &ldquo;{item.quote}&rdquo;
            </p>
            <cite className="block mt-1.5 text-xs text-text-muted not-italic">
              — {item.source}
            </cite>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
