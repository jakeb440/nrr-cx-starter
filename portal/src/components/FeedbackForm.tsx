"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type FeedbackType = "generation_learning" | "client_reaction";
type Product = "basic" | "enhanced" | "agentic";

interface FeedbackEntry {
  date: string;
  client: string;
  product: Product;
  type: FeedbackType;
  submitter: string;
  feedback: string;
  suggestion: string;
}

const PRODUCT_OPTIONS: { value: Product; label: string }[] = [
  { value: "basic", label: "NRR + CX Diagnostic" },
  { value: "enhanced", label: "NRR Growth Diagnostic" },
  { value: "agentic", label: "Customer Operations Assessment" },
];

const GITHUB_REPO = "jakeb440/nrr-cx-starter";
const FEEDBACK_DIR = "feedback";

/** Pushes a new JSON file to the feedback/ directory via the GitHub API. */
async function pushFeedbackToGitHub(entry: FeedbackEntry): Promise<boolean> {
  const slug = entry.client.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const submitterSlug = entry.submitter.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `${entry.date}-${slug}-${submitterSlug}.json`;
  const path = `${FEEDBACK_DIR}/${filename}`;
  const content = btoa(JSON.stringify(entry, null, 2));

  let token = "";
  try {
    const stored = localStorage.getItem("gh_token");
    if (stored) token = stored;
  } catch {
    // localStorage unavailable
  }

  if (!token) {
    const prompted = window.prompt(
      "To save feedback, enter a GitHub personal access token with repo scope.\n" +
        "This is stored in your browser only and never sent anywhere else."
    );
    if (!prompted) return false;
    token = prompted.trim();
    try {
      localStorage.setItem("gh_token", token);
    } catch {
      // localStorage unavailable
    }
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `feedback: ${entry.type} for ${entry.client} from ${entry.submitter}`,
        content,
      }),
    }
  );

  if (res.status === 401) {
    try {
      localStorage.removeItem("gh_token");
    } catch {
      // localStorage unavailable
    }
    throw new Error("Invalid GitHub token. Please try again.");
  }

  return res.ok;
}

export default function FeedbackForm() {
  const [client, setClient] = useState("");
  const [product, setProduct] = useState<Product>("enhanced");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("generation_learning");
  const [feedback, setFeedback] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isValid = client.trim() && feedback.trim() && submitter.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setStatus("submitting");
    setErrorMessage("");

    const entry: FeedbackEntry = {
      date: new Date().toISOString().slice(0, 10),
      client: client.trim(),
      product,
      type: feedbackType,
      submitter: submitter.trim(),
      feedback: feedback.trim(),
      suggestion: suggestion.trim(),
    };

    try {
      const ok = await pushFeedbackToGitHub(entry);
      if (ok) {
        setStatus("success");
        setClient("");
        setFeedback("");
        setSuggestion("");
      } else {
        setStatus("error");
        setErrorMessage("Failed to save feedback. Check your GitHub token and try again.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Feedback type toggle */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-300">
          What kind of feedback?
        </legend>
        <div className="flex gap-2">
          <TypeToggle
            active={feedbackType === "generation_learning"}
            onClick={() => setFeedbackType("generation_learning")}
            label="My generation learnings"
          />
          <TypeToggle
            active={feedbackType === "client_reaction"}
            onClick={() => setFeedbackType("client_reaction")}
            label="Client reaction"
          />
        </div>
      </fieldset>

      {/* Row: Client + Product + Submitter */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Client name" required>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. Oracle"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
          />
        </Field>

        <Field label="Product" required>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as Product)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-500"
          >
            {PRODUCT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Your name" required>
          <input
            type="text"
            value={submitter}
            onChange={(e) => setSubmitter(e.target.value)}
            placeholder="e.g. Jake"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
          />
        </Field>
      </div>

      {/* Feedback text */}
      <Field
        label={
          feedbackType === "generation_learning"
            ? "What did you learn while building this?"
            : "What did the client say or react to?"
        }
        required
      >
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder={
            feedbackType === "generation_learning"
              ? "e.g. Cursor struggled with the peer set for this sector — I had to manually correct it..."
              : "e.g. Client said the NRR waterfall was the most compelling part of the deck..."
          }
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
        />
      </Field>

      {/* Suggestion (optional) */}
      <Field label="What should we change? (optional)">
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          rows={2}
          placeholder="e.g. Add a section on competitive displacement risk for cybersecurity clients..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
        />
      </Field>

      {/* Submit + status */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!isValid || status === "submitting"}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {status === "submitting" ? "Submitting..." : "Submit Feedback"}
        </button>

        {status === "success" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            Saved to GitHub
          </span>
        )}

        {status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function TypeToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-indigo-500 bg-indigo-500/15 text-indigo-300"
          : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
