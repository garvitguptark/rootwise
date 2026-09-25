"use client";

import { useEffect, useState } from "react";

export interface AIStatus {
  live: boolean;
  provider: string;
  model: string | null;
}

let cache: Promise<AIStatus> | null = null;

function load(): Promise<AIStatus> {
  cache ??= fetch("/api/status", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<AIStatus>) : { live: false, provider: "demo", model: null }))
    .catch(() => ({ live: false, provider: "demo", model: null }));
  return cache;
}

/** Whether the server has a live AI provider (null while loading). */
export function useAIStatus(): AIStatus | null {
  const [status, setStatus] = useState<AIStatus | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}
