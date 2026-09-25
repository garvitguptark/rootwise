"use client";

import clsx from "clsx";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { quadratics } from "@/content/quadratics";
import { answer, currentQuestion, startDiagnostic } from "@/lib/engine/diagnostic";
import { buildGraph, descendants } from "@/lib/engine/graph";
import type { DiagnosticState } from "@/lib/engine/types";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { TraceLog } from "./TraceLog";

/**
 * Auto-playing diagnostic on the landing page: the real engine, answering
 * as a student who has a hidden gap in "Product–sum pairs".
 */
const HOLE = "factor-pairs";
const STEP_MS = 2300;

function scriptedAnswer(state: DiagnosticState, unknown: Set<string>) {
  const q = currentQuestion(state, quadratics)!;
  const wrong = q.options.find((o) => o.id !== q.correctOptionId && o.misconceptionId) ?? q.options.find((o) => o.id !== q.correctOptionId)!;
  return { q, optionId: unknown.has(q.conceptId) ? wrong.id : q.correctOptionId };
}

export function HeroDemo() {
  const unknown = useMemo(() => {
    const g = buildGraph(quadratics.concepts);
    return new Set([HOLE, ...descendants(g, HOLE).keys()]);
  }, []);
  const [state, setState] = useState<DiagnosticState>(() => startDiagnostic(quadratics, { now: "2026-01-01T00:00:00Z" }));
  const [picked, setPicked] = useState<{ optionId: string; correct: boolean } | null>(null);
  const reducedMotion = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [userPlaying, setPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(
      () => {
        if (state.done) {
          setPicked(null);
          setState(startDiagnostic(quadratics, { now: "2026-01-01T00:00:00Z" }));
          return;
        }
        if (!picked) {
          const { q, optionId } = scriptedAnswer(state, unknown);
          setPicked({ optionId, correct: optionId === q.correctOptionId });
          return;
        }
        const q = currentQuestion(state, quadratics)!;
        setState(answer(state, quadratics, { questionId: q.id, optionId: picked.optionId, now: "2026-01-01T00:00:00Z" }));
        setPicked(null);
      },
      state.done ? 6000 : picked ? 900 : STEP_MS,
    );
    return () => clearTimeout(t);
  }, [playing, state, picked, unknown]);

  const q = currentQuestion(state, quadratics);
  const concept = q ? quadratics.concepts.find((c) => c.id === q.conceptId) : undefined;

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
          <span className="size-2.5 rounded-full bg-surface-3" />
        </span>
        <p className="ml-1 truncate font-mono text-[11px] text-ink-3">live diagnostic · Class 10 · Quadratic Equations</p>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="pressable rounded-md p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
            aria-label={playing ? "Pause demo" : "Play demo"}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setState(startDiagnostic(quadratics, { now: "2026-01-01T00:00:00Z" }));
              setPlaying(true);
            }}
            className="pressable rounded-md p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
            aria-label="Restart demo"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grain px-2 pt-3 sm:px-4">
        <KnowledgeGraph course={quadratics} view={state.concepts} activeId={q?.conceptId} minWidth={560} density="compact" label="Live demo knowledge graph" />
      </div>

      <div className="grid gap-0 border-t border-line sm:grid-cols-[1.1fr_1fr]">
        <div className="min-h-[148px] border-b border-line p-4 sm:border-b-0 sm:border-r">
          {q && concept ? (
            <div key={q.id} className="enter">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent">Checking · {concept.name}</p>
              <p className="mt-1.5 text-[13.5px] font-medium leading-snug">{q.stem}</p>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                {q.options.map((o) => {
                  const chosen = picked?.optionId === o.id;
                  return (
                    <span
                      key={o.id}
                      className={clsx(
                        "truncate rounded-lg border px-2 py-1 text-[12px] transition-colors duration-300",
                        chosen ? (picked!.correct ? "border-good bg-good-soft text-good-ink" : "border-bad bg-bad-soft text-bad-ink") : "border-line text-ink-2",
                      )}
                    >
                      {o.text}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="enter">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-bad-ink">Diagnosis</p>
              <p className="mt-1.5 font-serif text-[26px] leading-tight">
                The real gap: <em className="text-bad-ink">Product–sum pairs</em>
              </p>
              <p className="mt-1 text-[12.5px] text-ink-2">
                Found in {state.attempts.length} questions — {Math.round((state.confidence ?? 0) * 100)}% confident. The student &ldquo;failed
                quadratics&rdquo;, but the cause sits three steps below.
              </p>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="mb-2 flex items-center justify-between gap-3 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            <span>Reasoning</span>
            <span>
              Q{Math.min(state.attempts.length + (state.done ? 0 : 1), state.budget)} · ~{state.explanations} left
            </span>
          </p>
          <TraceLog trace={state.trace.filter((t) => t.kind !== "start")} max={4} className="max-h-[104px] [mask-image:linear-gradient(to_bottom,transparent,black_18px)] pt-2" />
        </div>
      </div>
    </div>
  );
}
