"use client";

import { useState } from "react";
import {
  GitBranch,
  Monitor,
  MessageSquare,
  Rocket,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  details: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: GitBranch,
    title: "Clone the starter repo",
    description: "Get the templates and generation rules on your machine.",
    details:
      'Open a terminal and run: git clone https://github.com/jakeb440/nrr-cx-starter.git — this downloads all the templates, prompts, and configuration that Cursor uses to generate diagnostics.',
  },
  {
    number: 2,
    icon: Monitor,
    title: "Open in Cursor",
    description: "Launch the AI-powered editor with the project loaded.",
    details:
      'Open the Cursor app, go to File > Open Folder, and select the nrr-cx-starter folder. You\'ll see the project files in the sidebar and a chat panel on the right. Press Cmd+L (Mac) or Ctrl+L (Windows) if the chat panel isn\'t visible.',
  },
  {
    number: 3,
    icon: MessageSquare,
    title: "Tell Cursor what to build",
    description: "Describe the diagnostic you want in plain English. Inform with your hypotheses, sector, or client intelligence.",
    details:
      'Type a prompt like "Generate an NRR CX basic for Oracle" or "Generate an NRR CX enhanced for CrowdStrike." Share any hypotheses, sector context, or client intelligence you have — the more specific you are, the better the output. Cursor reads the generation rules, gathers public data, and builds a complete Next.js app. This takes 3-10 minutes.',
  },
  {
    number: 4,
    icon: Rocket,
    title: "Review, iterate, deploy",
    description: "Preview locally, refine with feedback, then ship it.",
    details:
      'Run "npm install && npm run dev" to preview locally. Ask Cursor for changes in plain English — adjust the peer set, sharpen insights, change colors. When you\'re happy, run "npx vercel --prod" to deploy to a shareable URL.',
  },
];

function StepCard({ step }: { step: Step }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = step.icon;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 transition-colors hover:border-slate-600">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400">
              Step {step.number}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-white">{step.title}</h4>
          <p className="mt-0.5 text-sm text-slate-400">{step.description}</p>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-slate-700/40 px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-slate-300">
            {step.details}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GettingStarted() {
  return (
    <div className="grid gap-3">
      {STEPS.map((step) => (
        <StepCard key={step.number} step={step} />
      ))}
    </div>
  );
}
