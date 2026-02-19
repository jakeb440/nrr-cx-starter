import { Quote } from "lucide-react";

interface ManagementCommentaryProps {
  commentary: { quote: string; source: string }[];
}

export function ManagementCommentary({ commentary }: ManagementCommentaryProps) {
  if (commentary.length === 0) return null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-900">
        Management Commentary on NRR
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
