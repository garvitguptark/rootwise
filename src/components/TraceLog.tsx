"use client";

import clsx from "clsx";
import { AlertTriangle, Check, Crosshair, Filter, Flag, Lock, RotateCcw, SkipForward, Sparkles, Target, TrendingDown, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { TraceEvent, TraceKind } from "@/lib/engine/types";

const STYLE: Record<TraceKind, { icon: LucideIcon; cls: string }> = {
  start: { icon: Sparkles, cls: "text-ink-3" },
  next: { icon: Crosshair, cls: "text-accent" },
  correct: { icon: Check, cls: "text-good-ink" },
  wrong: { icon: X, cls: "text-bad-ink" },
  misconception: { icon: AlertTriangle, cls: "text-warn-ink" },
  infer: { icon: SkipForward, cls: "text-good-ink" },
  descend: { icon: TrendingDown, cls: "text-bad-ink" },
  narrow: { icon: Filter, cls: "text-ink-3" },
  confirm: { icon: RotateCcw, cls: "text-accent" },
  blocked: { icon: Lock, cls: "text-bad-ink" },
  root: { icon: Target, cls: "text-bad-ink font-semibold" },
  finish: { icon: Flag, cls: "text-ink font-semibold" },
};

export function TraceLog({ trace, className, max }: { trace: TraceEvent[]; className?: string; max?: number }) {
  const ref = useRef<HTMLOListElement>(null);
  const items = max ? trace.slice(-max) : trace;
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [trace.length]);
  return (
    <ol ref={ref} className={clsx("scrollbar-thin space-y-1.5 overflow-y-auto pr-1", className)} aria-live="polite" aria-label="Diagnostic reasoning">
      {items.map((t, i) => {
        const s = STYLE[t.kind];
        const Icon = s.icon;
        const latest = i === items.length - 1;
        return (
          <li
            key={`${trace.length - items.length + i}-${t.kind}`}
            className={clsx("enter flex items-start gap-2 text-[12.5px] leading-snug", s.cls, !latest && t.kind !== "root" && "opacity-80")}
          >
            <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className={clsx(t.kind === "next" || t.kind === "narrow" || t.kind === "start" ? "text-ink-2" : undefined)}>{t.text}</span>
          </li>
        );
      })}
    </ol>
  );
}
