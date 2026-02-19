import { ExternalLink, Clock, ArrowRight, Github } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ProductCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  exampleUrl: string;
  repoUrl?: string;
  accentColor: string;
  badgeBg: string;
}

export default function ProductCard({
  icon: Icon,
  title,
  description,
  time,
  exampleUrl,
  repoUrl,
  accentColor,
  badgeBg,
}: ProductCardProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-900/50">
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
        style={{ backgroundColor: badgeBg }}
      >
        <Icon className="h-5 w-5" style={{ color: accentColor }} />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-300">
        {description}
      </p>

      <div className="mb-5 flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        <span>{time}</span>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <a
          href={exampleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/50 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Example
        </a>
        {repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            <Github className="h-3.5 w-3.5" />
            Open Repo
          </a>
        ) : (
          <a
            href="#getting-started"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}
      </div>
    </div>
  );
}
