"use client";

import { ArrowRight, PartyPopper, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAIStatus } from "@/hooks/useAIStatus";
import { postJson } from "@/lib/client";
import { studyPath } from "@/lib/engine/analysis";
import type { Course, LanguageCode, Question } from "@/lib/schema";
import { useApp } from "@/store/app";
import { QuestionCard, type Feedback } from "../QuestionCard";
import { Button, Meter, Spinner } from "../ui";

function shuffle<T>(xs: T[], seed: number): T[] {
  const a = [...xs];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Practice({ course, conceptId, language, autoRead }: { course: Course; conceptId: string; language: LanguageCode; autoRead: boolean }) {
  const progress = useApp((s) => s.progress[course.id]);
  const diag = useApp((s) => s.diagnostics[course.id]);
  const recordPractice = useApp((s) => s.recordPractice);
  const ai = useAIStatus();
  const concept = course.concepts.find((c) => c.id === conceptId)!;
  const cp = progress?.[conceptId];

  const [extra, setExtra] = useState<Question[]>([]);
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [justMastered, setJustMastered] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const pool = useMemo(() => {
    const seen = new Set(diag?.attempts.map((a) => a.questionId) ?? []);
    const own = course.questions.filter((q) => q.conceptId === conceptId);
    const fresh = [...own.filter((q) => !seen.has(q.id)), ...own.filter((q) => seen.has(q.id))];
    const base = round === 0 ? fresh : shuffle(own, round * 7919);
    return [...base, ...extra];
  }, [course.questions, conceptId, diag, round, extra]);

  const q = pool[index];
  const next = useMemo(() => {
    if (!progress) return undefined;
    return studyPath(course, progress).find((s) => s.conceptId !== conceptId);
  }, [course, progress, conceptId]);

  async function generate() {
    setGenerating(true);
    setGenError(null);
    try {
      const names = new Map(course.concepts.map((c) => [c.id, c.name]));
      const { questions } = await postJson<{ questions: Question[] }>("/api/generate/questions", {
        courseTitle: course.title,
        level: course.level,
        audience: course.audience || undefined,
        language,
        concepts: [{ id: concept.id, name: concept.name, summary: concept.summary, prerequisites: concept.prerequisites.map((p) => names.get(p) ?? p) }],
        misconceptions: course.misconceptions.map((m) => ({ id: m.id, conceptId: m.conceptId, label: m.label })).slice(0, 40),
        perConcept: 3,
        avoid: pool.map((x) => x.stem).slice(0, 20),
      });
      if (!questions.length) throw new Error("No usable questions came back — try again.");
      setExtra((e) => [...e, ...questions]);
      setIndex(pool.length);
    } catch (e) {
      setGenError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const p = cp?.p ?? 0.5;

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
          <span className="text-ink-2">
            Mastery of <strong className="font-medium text-ink">{concept.name}</strong>
          </span>
          <span className="font-mono text-ink-2">{Math.round(p * 100)}% · goal 85%</span>
        </div>
        <div className="relative">
          <Meter value={p} tone={p >= 0.85 ? "good" : p <= 0.3 ? "bad" : "warn"} label="Mastery" />
          <span className="absolute top-[-3px] h-3 w-px bg-ink-3" style={{ left: "85%" }} aria-hidden />
        </div>
      </div>

      {justMastered && (
        <div className="enter mb-6 flex flex-col gap-3 rounded-2xl border border-good/30 bg-good-soft p-4 sm:flex-row sm:items-center">
          <PartyPopper className="size-6 shrink-0 text-good-ink" aria-hidden />
          <div>
            <p className="font-semibold text-good-ink">{concept.name} is solid now.</p>
            <p className="text-[13px] text-ink-2">Your map just updated. Keep practising or move on.</p>
          </div>
          {next && (
            <Link
              href={`/courses/${course.id}/learn/${next.conceptId}`}
              className="pressable inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-[13px] font-medium text-brand-ink sm:ml-auto"
            >
              Next: {course.concepts.find((c) => c.id === next.conceptId)?.name} <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}

      {q ? (
        <QuestionCard
          key={`${q.id}-${round}`}
          question={q}
          eyebrow={
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
              Practice · {index + 1} of {pool.length}
              {round > 0 && ` · round ${round + 1}`}
            </span>
          }
          feedback={feedback}
          misconception={
            feedback && !feedback.correct ? course.misconceptions.find((m) => m.id === q.options.find((o) => o.id === feedback.optionId)?.misconceptionId) : undefined
          }
          showGuessing={false}
          language={language}
          autoRead={autoRead}
          continueLabel="Next question"
          onSubmit={(optionId) => {
            const correct = optionId === q.correctOptionId;
            const before = cp?.status;
            const after = recordPractice(course.id, conceptId, correct, { difficulty: q.difficulty, optionCount: q.options.length });
            if (before !== "mastered" && after.status === "mastered") setJustMastered(true);
            setFeedback({ optionId, correct });
          }}
          onContinue={() => {
            setFeedback(null);
            setIndex((i) => i + 1);
          }}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-line-2 p-6 text-center">
          <p className="font-medium">You&rsquo;ve worked through every question for this concept.</p>
          <p className="mt-1 text-[13.5px] text-ink-2">
            {ai?.live ? "Generate fresh questions targeted at this concept, or run the set again." : "Run the set again in a new order."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {ai?.live && (
              <Button onClick={generate} disabled={generating}>
                {generating ? <Spinner /> : <Sparkles className="size-4" />} {generating ? "Writing questions…" : "Generate 3 new questions"}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setRound((r) => r + 1);
                setIndex(0);
                setExtra([]);
              }}
            >
              <RefreshCw className="size-4" /> Practise again
            </Button>
          </div>
          {genError && <p className="mt-3 text-[13px] text-bad-ink">{genError}</p>}
        </div>
      )}
    </div>
  );
}
