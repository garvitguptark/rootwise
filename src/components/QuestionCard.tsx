"use client";

import clsx from "clsx";
import { ArrowRight, Check, HelpCircle, Lightbulb, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReadAloud, useSpeechSupport } from "@/hooks/useSpeech";
import type { Misconception, Question } from "@/lib/schema";
import { Button, Kbd } from "./ui";

export interface Feedback {
  optionId: string;
  correct: boolean;
}

interface Props {
  question: Question;
  eyebrow?: ReactNode;
  feedback: Feedback | null;
  misconception?: Misconception;
  onSubmit: (optionId: string, guessing: boolean, ms: number) => void;
  onContinue: () => void;
  continueLabel?: string;
  showGuessing?: boolean;
  language: string;
  autoRead?: boolean;
}

/**
 * One multiple-choice question with keyboard support (1–5, Enter, G),
 * read-aloud, an honest "I'm guessing" flag and inline feedback.
 * Remount it (key={question.id}) for each new question.
 */
export function QuestionCard({
  question,
  eyebrow,
  feedback,
  misconception,
  onSubmit,
  onContinue,
  continueLabel = "Continue",
  showGuessing = true,
  language,
  autoRead,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [guessing, setGuessing] = useState(false);
  const shownAt = useRef(0);
  const { tts } = useSpeechSupport();
  const { speak, speakingId, stop } = useReadAloud(language);
  const continueRef = useRef<HTMLButtonElement>(null);

  const readText = `${question.stem}. ${question.options.map((o, i) => `Option ${i + 1}: ${o.text}`).join(". ")}`;

  useEffect(() => {
    shownAt.current = performance.now();
    if (autoRead) speak(question.id, readText);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per question
  }, [question.id]);

  useEffect(() => {
    if (feedback) continueRef.current?.focus();
  }, [feedback]);

  const submit = useCallback(() => {
    if (!selected || feedback) return;
    onSubmit(selected, guessing, Math.round(performance.now() - shownAt.current));
  }, [selected, feedback, guessing, onSubmit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (!feedback && n >= 1 && n <= question.options.length) {
        setSelected(question.options[n - 1].id);
      } else if (e.key === "Enter") {
        // Let unrelated focused buttons (read aloud, guessing…) handle Enter themselves;
        // on an answer option, Enter means "check".
        if (t.tagName === "BUTTON" && t !== continueRef.current && !t.closest('[role="radio"]')) return;
        e.preventDefault();
        if (feedback) onContinue();
        else submit();
      } else if (!feedback && showGuessing && (e.key === "g" || e.key === "G")) {
        setGuessing((g) => !g);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, feedback, submit, onContinue, showGuessing]);

  const correctId = question.correctOptionId;

  return (
    <div className="enter">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-[12px] font-medium">{eyebrow}</div>
        {tts && (
          <button
            type="button"
            onClick={() => speak(question.id, readText)}
            className="pressable inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] text-ink-3 hover:bg-surface-2 hover:text-ink"
            aria-label={speakingId === question.id ? "Stop reading" : "Read question aloud"}
          >
            {speakingId === question.id ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            <span className="hidden sm:inline">{speakingId === question.id ? "Stop" : "Read aloud"}</span>
          </button>
        )}
      </div>

      <h2 className="mt-3 text-[20px] font-medium leading-snug tracking-[-0.01em] sm:text-[22px]" id={`q-${question.id}`}>
        {question.stem}
      </h2>

      <div role="radiogroup" aria-labelledby={`q-${question.id}`} className="mt-6 grid gap-2.5">
        {question.options.map((o, i) => {
          const isSel = selected === o.id;
          const isCorrect = o.id === correctId;
          const state = feedback ? (isCorrect ? "correct" : feedback.optionId === o.id ? "wrong" : "dim") : isSel ? "selected" : "idle";
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={isSel}
              disabled={!!feedback}
              onClick={() => setSelected(o.id)}
              className={clsx(
                "pressable group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-[15.5px] disabled:cursor-default",
                state === "idle" && "border-line-2 bg-surface hover:border-ink-3 hover:bg-surface-2",
                state === "selected" && "border-ink bg-surface shadow-[0_0_0_1px_var(--ink)]",
                state === "correct" && "border-good bg-good-soft",
                state === "wrong" && "border-bad bg-bad-soft",
                state === "dim" && "border-line bg-surface opacity-55",
              )}
            >
              <span
                className={clsx(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-[11.5px] transition-colors",
                  state === "selected" ? "border-ink bg-ink text-bg" : state === "correct" ? "border-good bg-good text-white" : state === "wrong" ? "border-bad bg-bad text-white" : "border-line-2 text-ink-3",
                )}
                aria-hidden
              >
                {state === "correct" ? <Check className="size-3.5" /> : state === "wrong" ? <X className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">{o.text}</span>
            </button>
          );
        })}
      </div>

      {!feedback ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={submit} disabled={!selected}>
            Check answer
          </Button>
          {showGuessing && (
            <button
              type="button"
              role="switch"
              aria-checked={guessing}
              onClick={() => setGuessing((g) => !g)}
              className={clsx(
                "pressable inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-[14px]",
                guessing ? "border-warn bg-warn-soft text-warn-ink" : "border-line-2 text-ink-2 hover:text-ink",
              )}
              title="Honest guesses make the diagnosis more accurate (G)"
            >
              <HelpCircle className="size-4" aria-hidden /> I&rsquo;m guessing
            </button>
          )}
          <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-ink-3 md:flex">
            <Kbd>1</Kbd>–<Kbd>{question.options.length}</Kbd> choose <Kbd>↵</Kbd> check {showGuessing && <><Kbd>G</Kbd> guessing</>}
          </span>
        </div>
      ) : (
        <div className="enter mt-6">
          <div
            className={clsx("rounded-xl border p-4", feedback.correct ? "border-good/30 bg-good-soft/60" : "border-bad/25 bg-bad-soft/50")}
            role="status"
          >
            <p className={clsx("flex items-center gap-2 text-[14px] font-semibold", feedback.correct ? "text-good-ink" : "text-bad-ink")}>
              {feedback.correct ? <Check className="size-4" /> : <X className="size-4" />}
              {feedback.correct ? "Correct" : "Not quite"}
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{question.explanation}</p>
            {!feedback.correct && misconception && (
              <p className="mt-3 flex gap-2 border-t border-bad/15 pt-3 text-[13.5px] leading-relaxed text-ink-2">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn-ink" aria-hidden />
                <span>
                  <strong className="font-semibold text-ink">A common mix-up: {misconception.label}.</strong> {misconception.explanation}
                </span>
              </p>
            )}
          </div>
          <Button ref={continueRef} size="lg" className="mt-4" onClick={onContinue}>
            {continueLabel} <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
