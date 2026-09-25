"use client";

import { ArrowRight, ChevronLeft, Flag, Target } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CourseGate } from "@/components/CourseGate";
import { KnowledgeGraph, StatusLegend } from "@/components/KnowledgeGraph";
import { QuestionCard, type Feedback } from "@/components/QuestionCard";
import { TraceLog } from "@/components/TraceLog";
import { Button, ButtonLink, Card, Meter, PageShell, Skeleton } from "@/components/ui";
import { answer, currentQuestion, finishNow, startDiagnostic } from "@/lib/engine/diagnostic";
import { buildGraph, descendants } from "@/lib/engine/graph";
import type { Course, Question } from "@/lib/schema";
import { useApp } from "@/store/app";

export default function DiagnosePage() {
  const { courseId } = useParams<{ courseId: string }>();
  return <CourseGate courseId={courseId}>{(course) => <Diagnose course={course} />}</CourseGate>;
}

function Diagnose({ course }: { course: Course }) {
  const router = useRouter();
  const diag = useApp((s) => s.diagnostics[course.id]);
  const hasProgress = useApp((s) => !!s.progress[course.id]);
  const setDiagnostic = useApp((s) => s.setDiagnostic);
  const settings = useApp((s) => s.settings);
  const [feedback, setFeedback] = useState<(Feedback & { question: Question }) | null>(null);
  const g = useMemo(() => buildGraph(course.concepts), [course]);

  // Start a fresh diagnostic if none exists (or the last one finished and was reset).
  useEffect(() => {
    if (!diag) setDiagnostic(course.id, startDiagnostic(course));
  }, [diag, course, setDiagnostic]);

  if (!diag) {
    return (
      <PageShell wide>
        <Skeleton className="h-[520px]" />
      </PageShell>
    );
  }

  const q = feedback?.question ?? currentQuestion(diag, course);
  const concept = q ? g.byId.get(q.conceptId) : undefined;
  const answered = diag.attempts.length;
  const misconception =
    feedback && !feedback.correct
      ? course.misconceptions.find((m) => m.id === q?.options.find((o) => o.id === feedback.optionId)?.misconceptionId)
      : undefined;
  const roots = Object.entries(diag.concepts)
    .filter(([, c]) => c.status === "gap" && c.verdict === "root")
    .map(([id]) => id);
  const showDone = diag.done && !feedback;

  return (
    <PageShell wide className="pb-16">
      <h1 className="sr-only">Diagnostic: {course.title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
          <ChevronLeft className="size-4" aria-hidden /> {course.title}
        </Link>
        <div className="ml-auto flex items-center gap-3 text-[12.5px] text-ink-3">
          <span className="font-mono">
            {diag.done ? `${answered} answered` : `Question ${answered + (feedback ? 0 : 1)} · at most ${diag.budget}`}
          </span>
          {!diag.done && answered >= 4 && !feedback && (
            <Button variant="ghost" size="sm" onClick={() => setDiagnostic(course.id, finishNow(diag, course))}>
              <Flag className="size-3.5" /> Finish now
            </Button>
          )}
        </div>
      </div>
      <Meter className="mt-3" value={diag.done ? 1 : answered / diag.budget} label="Diagnostic progress" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section aria-label="Question" className="min-w-0">
          {showDone ? (
            <div className="enter">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Diagnosis complete</p>
              <h2 className="mt-3 font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[48px]">
                {roots.length ? (
                  <>
                    Your root gap{roots.length > 1 ? "s" : ""}: <em className="text-bad-ink">{roots.map((r) => g.byId.get(r)!.name).join(" & ")}</em>
                  </>
                ) : (
                  <>No root gaps. You&rsquo;re solid.</>
                )}
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-2">
                {roots.length
                  ? `Found in ${answered} questions with ${Math.round((diag.confidence ?? 0) * 100)}% confidence. Fixing ${roots.length > 1 ? "these" : "it"} first unlocks ${new Set(roots.flatMap((r) => [...descendants(g, r).keys()])).size} concepts built on top.`
                  : `Checked in ${answered} questions (${Math.round((diag.confidence ?? 0) * 100)}% confident). Try practice on the goal concepts to stretch yourself.`}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => router.push(`/courses/${course.id}/report`)}>
                  See my full report <ArrowRight className="size-4" />
                </Button>
                {roots[0] && (
                  <ButtonLink href={`/courses/${course.id}/learn/${roots[0]}`} size="lg" variant="secondary">
                    <Target className="size-4" /> Start fixing it
                  </ButtonLink>
                )}
              </div>
              {!hasProgress && <p className="mt-4 text-[12.5px] text-ink-3">Saving your results…</p>}
            </div>
          ) : q && concept ? (
            <QuestionCard
              key={q.id}
              question={q}
              eyebrow={
                <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-2.5 py-1 text-accent-ink">
                  <span className="size-1.5 rounded-full bg-accent" /> Checking: {concept.name}
                </span>
              }
              feedback={feedback}
              misconception={misconception}
              language={settings.language}
              autoRead={settings.autoRead}
              continueLabel={diag.done ? "See the diagnosis" : "Next question"}
              onSubmit={(optionId, guessing, ms) => {
                const next = answer(diag, course, { questionId: q.id, optionId, guessing, ms });
                setDiagnostic(course.id, next);
                setFeedback({ question: q, optionId, correct: optionId === q.correctOptionId });
              }}
              onContinue={() => setFeedback(null)}
            />
          ) : (
            <Skeleton className="h-80" />
          )}
        </section>

        <aside aria-label="Live knowledge map" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <p className="text-[13px] font-medium">Your knowledge map, live</p>
              <StatusLegend compact />
            </div>
            <div className="grain px-2 py-3 sm:px-3">
              <KnowledgeGraph
                course={course}
                view={diag.concepts}
                // While showing feedback, let the answered node reveal its new state.
                activeId={feedback || diag.done ? null : q?.conceptId}
                focusIds={feedback ? [feedback.question.conceptId] : undefined}
                density="compact"
                minWidth={540}
              />
            </div>
            <div className="border-t border-line p-4">
              <div className="mb-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11.5px] text-ink-3">Diagnosis confidence</p>
                  <p className="font-mono text-[18px] font-semibold">{Math.round((diag.confidence ?? 0) * 100)}%</p>
                  <Meter className="mt-1" value={diag.confidence ?? 0} tone="ink" label="Diagnosis confidence" />
                </div>
                <div>
                  <p className="text-[11.5px] text-ink-3">Plausible explanations left</p>
                  <p className="font-mono text-[18px] font-semibold">
                    ~{diag.explanations ?? "–"}
                    {diag.stateCount ? <span className="text-[12px] font-normal text-ink-3"> of {diag.stateCount}</span> : null}
                  </p>
                  <Meter
                    className="mt-1"
                    value={diag.stateCount ? 1 - Math.log((diag.explanations ?? 1)) / Math.log(diag.stateCount) : 0}
                    tone="accent"
                    label="Explanations ruled out"
                  />
                </div>
              </div>
              <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Reasoning</p>
              <TraceLog trace={diag.trace} className="max-h-44" />
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
