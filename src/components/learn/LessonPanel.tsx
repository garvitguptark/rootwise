"use client";

import clsx from "clsx";
import { ChevronDown, Lightbulb, ListChecks, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useReadAloud, useSpeechSupport } from "@/hooks/useSpeech";
import type { ConceptWithLesson, Misconception } from "@/lib/schema";
import { Button, Card } from "../ui";

export function LessonPanel({
  concept,
  misconceptions,
  detected,
  language,
}: {
  concept: ConceptWithLesson;
  misconceptions: Misconception[];
  detected: Set<string>;
  language: string;
}) {
  const [revealed, setRevealed] = useState(1);
  const { tts } = useSpeechSupport();
  const { speak, speakingId } = useReadAloud(language);
  const steps = concept.example.steps;

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">The idea</p>
          {tts && (
            <button
              type="button"
              onClick={() => speak("lesson", `${concept.name}. ${concept.lesson}`)}
              className="pressable -mr-1 -mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-ink-3 hover:bg-surface-2 hover:text-ink"
              aria-label={speakingId === "lesson" ? "Stop reading" : "Read lesson aloud"}
            >
              {speakingId === "lesson" ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />} Listen
            </button>
          )}
        </div>
        <p className="mt-3 text-[16px] leading-[1.7]">{concept.lesson}</p>

        <p className="mt-6 flex items-center gap-2 text-[13px] font-semibold">
          <ListChecks className="size-4 text-ink-3" aria-hidden /> Key ideas
        </p>
        <ul className="mt-2 space-y-1.5">
          {concept.keyIdeas.map((k) => (
            <li key={k} className="flex gap-2.5 text-[14.5px] leading-relaxed text-ink-2">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-good" aria-hidden />
              {k}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Worked example</p>
        <p className="mt-3 text-[15.5px] font-medium leading-snug">{concept.example.problem}</p>
        <ol className="mt-3 space-y-2">
          {steps.slice(0, revealed).map((s, i) => (
            <li key={i} className="enter flex gap-3 text-[14.5px] leading-relaxed">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] text-ink-2">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {revealed < steps.length ? (
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setRevealed((r) => r + 1)}>
            <ChevronDown className="size-3.5" /> Show next step ({revealed}/{steps.length})
          </Button>
        ) : (
          <p className="mt-4 text-[12.5px] text-ink-3">Try predicting each step before revealing it next time.</p>
        )}
      </Card>

      {misconceptions.length > 0 && (
        <Card className="p-5 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Traps to avoid</p>
          <ul className="mt-3 space-y-3">
            {misconceptions.map((m) => (
              <li
                key={m.id}
                className={clsx("rounded-xl border p-3", detected.has(m.id) ? "border-warn/40 bg-warn-soft/60" : "border-line")}
              >
                <p className="flex items-start gap-2 text-[14px] font-medium">
                  <Lightbulb className={clsx("mt-0.5 size-4 shrink-0", detected.has(m.id) ? "text-warn-ink" : "text-ink-3")} aria-hidden />
                  <span>
                    {m.label}
                    {detected.has(m.id) && <span className="mt-0.5 block text-[11.5px] font-semibold text-warn-ink">Your answers showed this one</span>}
                  </span>
                </p>
                <p className="mt-1 pl-6 text-[13.5px] leading-relaxed text-ink-2">{m.explanation}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
