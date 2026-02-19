import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes with clsx conditional support */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number with locale-aware separators (e.g. 1,234.5) */
export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Returns a text color class based on sentiment */
export function sentimentColor(
  sentiment: "positive" | "negative" | "neutral" | "warning"
): string {
  const map: Record<string, string> = {
    positive: "text-emerald-700",
    negative: "text-red-700",
    neutral: "text-slate-700",
    warning: "text-amber-700",
  };
  return map[sentiment] ?? "text-slate-700";
}

/** Returns a background color class based on sentiment */
export function sentimentBg(
  sentiment: "positive" | "negative" | "neutral" | "warning"
): string {
  const map: Record<string, string> = {
    positive: "bg-emerald-50",
    negative: "bg-red-50",
    neutral: "bg-slate-50",
    warning: "bg-amber-50",
  };
  return map[sentiment] ?? "bg-slate-50";
}
