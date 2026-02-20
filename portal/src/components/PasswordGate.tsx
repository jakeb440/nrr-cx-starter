"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

const PASS_HASH = "ACO2026";
const STORAGE_KEY = "aco_auth";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === PASS_HASH) {
        setAuthenticated(true);
      }
    } catch {
      // localStorage unavailable
    }
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === PASS_HASH) {
      try {
        localStorage.setItem(STORAGE_KEY, PASS_HASH);
      } catch {
        // localStorage unavailable
      }
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (checking) return null;

  if (authenticated) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-white">
            Agentic Customer Operations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter the access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Access code"
            autoFocus
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-center text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500"
          />
          {error && (
            <p className="text-center text-xs text-red-400">
              Incorrect code. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
