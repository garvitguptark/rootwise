"use client";

import { AlertCircle, BookOpenCheck, ChevronLeft, Dumbbell, MessagesSquare, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CourseGate } from "@/components/CourseGate";
import { LessonPanel } from "@/components/learn/LessonPanel";
import { ProductSumGame } from "@/components/learn/ProductSumGame";
import { Practice } from "@/components/learn/Practice";
import { TeachBack } from "@/components/learn/TeachBack";
import { TutorChat } from "@/components/learn/TutorChat";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, Card, Meter, PageShell, Skeleton, Tabs } from "@/components/ui";
import { useAIStatus } from "@/hooks/useAIStatus";
import { lessonRequest, postJson } from "@/lib/client";
import { buildGraph } from "@/lib/engine/graph";
import type { ConceptWithLesson, Course, Lesson } from "@/lib/schema";
import { useApp } from "@/store/app";

export default function LearnPage() {
  const { courseId, conceptId } = useParams<{ courseId: string; conceptId: string }>();
  return <CourseGate courseId={courseId}>{(course) => <Learn key={conceptId} course={course} conceptId={conceptId} />}</CourseGate>;
}

type Tab = "tutor" | "teach" | "practice";

function Learn({ course, conceptId }: { course: Course; conceptId: string }) {
  const concept = course.concepts.find((c) => c.id === conceptId);
  const progress = useApp((s) => s.progress[course.id]);
  const diag = useApp((s) => s.diagnostics[course.id]);
  const settings = useApp((s) => s.settings);
  const setLesson = useApp((s) => s.setLesson);
  const recordPractice = useApp((s) => s.recordPractice);
  const ai = useAIStatus();
  const [tab, setTab] = useState<Tab>("tutor");
  const [prefill, setPrefill] = useState<string | undefined>();
  const [lessonError, setLessonError] = useState<string | null>(null);
  const requested = useRef(false);
  const g = useMemo(() => buildGraph(course.concepts), [course]);

  const hasLesson = !!(concept?.lesson && concept.keyIdeas && concept.example && concept.socratic);

  // Generated courses get their teaching material written on first visit.
  useEffect(() => {
    if (!concept || hasLesson || !ai?.live || lessonError || requested.current) return;
    requested.current = true;
    postJson<Lesson>("/api/generate/lesson", lessonRequest(course, concept.id, settings.language))
      .then((lesson) => setLesson(course.id, concept.id, lesson))
      .catch((e: Error) => setLessonError(e.message))
      .finally(() => {
        requested.current = false;
      });
  }, [course, concept, hasLesson, ai, lessonError, settings.language, setLesson]);

  const detectedIds = useMemo(() => new Set((diag?.attempts ?? []).map((a) => a.misconceptionId).filter(Boolean) as string[]), [diag]);
  const ownMisconceptions = useMemo(() => course.misconceptions.filter((m) => m.conceptId === conceptId), [course, conceptId]);
  // Misconceptions the student actually showed that belong to this concept (or were revealed while answering it).
  const relevantDetected = useMemo(() => {
    const byAttempt = (diag?.attempts ?? []).filter((a) => a.conceptId === conceptId && a.misconceptionId).map((a) => a.misconceptionId!);
    const ids = new Set([...ownMisconceptions.filter((m) => detectedIds.has(m.id)).map((m) => m.id), ...byAttempt]);
    return course.misconceptions.filter((m) => ids.has(m.id));
  }, [course, diag, conceptId, ownMisconceptions, detectedIds]);
  const recentMistakes = useMemo(
    () =>
      (diag?.attempts ?? [])
        .filter((a) => a.conceptId === conceptId && !a.correct)
        .map((a) => {
          const q = course.questions.find((x) => x.id === a.questionId);
          return q
            ? {
                stem: q.stem,
                chosen: q.options.find((o) => o.id === a.optionId)?.text ?? "",
                correct: q.options.find((o) => o.id === q.correctOptionId)?.text ?? "",
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [diag, conceptId, course],
  );

  if (!concept) {
    return (
      <PageShell className="py-24 text-center">
        <h1 className="font-serif text-3xl">Concept not found</h1>
        <Link href={`/courses/${course.id}`} className="mt-4 inline-block text-accent-ink underline">
          Back to {course.title}
        </Link>
      </PageShell>
    );
  }

  const cp = progress?.[concept.id];
  const prereqs = (g.prereqs.get(concept.id) ?? []).map((id) => g.byId.get(id)!);
  const unlocks = (g.dependents.get(concept.id) ?? []).map((id) => g.byId.get(id)!);
  const isRoot = cp?.status === "gap" && cp.verdict === "root";
  const full = hasLesson ? (concept as ConceptWithLesson) : null;

  return (
    <PageShell wide className="pb-16">
      <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden /> {course.title}
      </Link>

      <header className="mt-4 grid items-end gap-x-8 gap-y-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge view={cp} />
            {isRoot && <span className="text-[12.5px] text-bad-ink">This is where your mistakes started.</span>}
          </div>
          <h1 className="mt-2 font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[52px]">{concept.name}</h1>
          <p className="mt-2 max-w-2xl text-[15.5px] text-ink-2">{concept.summary}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-3">
            {prereqs.length > 0 && (
              <p>
                Builds on:{" "}
                {prereqs.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ", "}
                    <Link href={`/courses/${course.id}/learn/${p.id}`} className="text-ink-2 underline decoration-line-2 underline-offset-2 hover:text-ink">
                      {p.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            {unlocks.length > 0 && (
              <p>
                Unlocks:{" "}
                {unlocks.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ", "}
                    <Link href={`/courses/${course.id}/learn/${p.id}`} className="text-ink-2 underline decoration-line-2 underline-offset-2 hover:text-ink">
                      {p.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
        <div className="w-full max-w-[320px]">
          <div className="mb-1.5 flex justify-between text-[12.5px] text-ink-2">
            <span>How well you know it</span>
            <span className="font-mono">{cp ? `${Math.round(cp.p * 100)}%` : "—"}</span>
          </div>
          <Meter value={cp?.p ?? 0} tone={!cp ? "neutral" : cp.status === "mastered" ? "good" : cp.status === "gap" ? "bad" : "warn"} label="Mastery" />
        </div>
      </header>

      {concept.id === "factor-pairs" && (
        <section className="mt-8" aria-label="Interactive game">
          <ProductSumGame
            mistake={recentMistakes.find((m) => m.stem.includes("10") && m.stem.includes("−7")) ?? recentMistakes[0]}
            language={settings.language}
            onRound={(firstTry) => recordPractice(course.id, concept.id, firstTry, { difficulty: 2, optionCount: 5 })}
          />
        </section>
      )}

      {!full ? (
        <div className="mt-8">
          {ai && !ai.live ? (
            <Card className="flex items-start gap-3 p-5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-warn-ink" aria-hidden />
              <div>
                <p className="font-medium">This lesson hasn&rsquo;t been generated yet.</p>
                <p className="mt-1 text-[14px] text-ink-2">Lessons for AI-generated courses are written on demand, and this server has no AI key. Practice still works below.</p>
              </div>
            </Card>
          ) : lessonError ? (
            <Card className="flex items-start gap-3 p-5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-bad-ink" aria-hidden />
              <div>
                <p className="font-medium">Couldn&rsquo;t write this lesson.</p>
                <p className="mt-1 text-[14px] text-ink-2">{lessonError}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setLessonError(null)}>
                  <RefreshCw className="size-3.5" /> Try again
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <p className="text-[13px] text-ink-3">Writing a lesson for {concept.name}…</p>
                <Skeleton className="h-64" />
                <Skeleton className="h-40" />
              </div>
              <Skeleton className="h-[520px]" />
            </div>
          )}
          {ai && !ai.live && (
            <Card className="mt-6 overflow-hidden">
              <Practice course={course} conceptId={concept.id} language={settings.language} autoRead={settings.autoRead} />
            </Card>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <LessonPanel concept={full} misconceptions={ownMisconceptions} detected={detectedIds} language={settings.language} />
          <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <Tabs<Tab>
              value={tab}
              onChange={(t) => {
                setTab(t);
                setPrefill(undefined);
              }}
              className="mb-3"
              items={[
                { value: "tutor", label: <><MessagesSquare className="size-3.5" /> Tutor</> },
                { value: "teach", label: <><BookOpenCheck className="size-3.5" /> Teach it back</> },
                { value: "practice", label: <><Dumbbell className="size-3.5" /> Practice</> },
              ]}
            />
            <Card className="overflow-hidden">
              {tab === "tutor" && (
                <TutorChat
                  course={course}
                  concept={full}
                  isRoot={isRoot}
                  misconceptions={relevantDetected.length ? relevantDetected : []}
                  recentMistakes={recentMistakes}
                  language={settings.language}
                  initialInput={prefill}
                />
              )}
              {tab === "teach" && (
                <TeachBack
                  course={course}
                  concept={full}
                  misconceptions={ownMisconceptions}
                  language={settings.language}
                  onAskTutor={(text) => {
                    setPrefill(text);
                    setTab("tutor");
                  }}
                />
              )}
              {tab === "practice" && <Practice course={course} conceptId={concept.id} language={settings.language} autoRead={settings.autoRead} />}
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
