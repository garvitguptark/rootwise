"use client";

import clsx from "clsx";
import { ArrowRight, ChevronRight, Clock, Keyboard, RotateCcw, Target, Timer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { CourseGate } from "@/components/CourseGate";
import { KnowledgeGraph, StatusLegend, type NodeView } from "@/components/KnowledgeGraph";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, ButtonLink, Card, Eyebrow, Meter, PageShell } from "@/components/ui";
import { defaultBudget } from "@/lib/engine/diagnostic";
import { buildGraph, descendants, topoSort } from "@/lib/engine/graph";
import type { Course } from "@/lib/schema";
import { useApp } from "@/store/app";

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  return <CourseGate courseId={courseId}>{(course) => <CourseOverview course={course} />}</CourseGate>;
}

function CourseOverview({ course }: { course: Course }) {
  const router = useRouter();
  const diag = useApp((s) => s.diagnostics[course.id]);
  const progress = useApp((s) => s.progress[course.id]);
  const setDiagnostic = useApp((s) => s.setDiagnostic);
  const resetCourse = useApp((s) => s.resetCourse);
  const g = useMemo(() => buildGraph(course.concepts), [course]);
  const order = useMemo(() => topoSort(g).reverse(), [g]);

  const view: Record<string, NodeView | undefined> = progress ?? (diag ? diag.concepts : {});
  const roots = progress ? course.concepts.filter((c) => progress[c.id]?.status === "gap" && progress[c.id]?.verdict === "root") : [];
  const mastered = progress ? course.concepts.filter((c) => progress[c.id]?.status === "mastered").length : 0;
  const inProgress = diag && !diag.done;

  return (
    <PageShell wide>
      <nav className="flex items-center gap-1 text-[13px] text-ink-3" aria-label="Breadcrumb">
        <Link href="/courses" className="hover:text-ink">
          Courses
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-ink-2">{course.title}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Eyebrow>
            {course.subject} · {course.audience || course.level}
          </Eyebrow>
          <h1 className="mt-2 font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[52px]">{course.title}</h1>
          <p className="mt-3 max-w-2xl text-[15.5px] text-ink-2">{course.description}</p>

          <Card className="mt-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <p className="text-[13px] font-medium">Prerequisite map · foundations at the bottom</p>
              <StatusLegend compact={!progress} />
            </div>
            <div className="grain p-3 sm:p-5">
              <KnowledgeGraph
                course={course}
                view={view}
                onSelect={(id) => router.push(`/courses/${course.id}/learn/${id}`)}
                label={`Prerequisite map for ${course.title}`}
              />
            </div>
            <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-3">Tip: click any concept to open its lesson, tutor and practice.</p>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {!diag && (
            <Card className="p-5">
              <p className="text-[13px] font-medium text-ink-3">Step 1</p>
              <h2 className="mt-1 text-[20px] font-semibold">Find your root gaps</h2>
              <p className="mt-1.5 text-[14px] text-ink-2">
                An adaptive test that starts where it learns the most and traces misses down the map. It stops as soon as it&rsquo;s confident.
              </p>
              <ul className="mt-4 space-y-2 text-[13px] text-ink-2">
                <li className="flex items-center gap-2">
                  <Timer className="size-4 text-ink-3" aria-hidden /> About 10 minutes · at most {defaultBudget(course)} questions
                </li>
                <li className="flex items-center gap-2">
                  <Target className="size-4 text-ink-3" aria-hidden /> Honest guesses help — mark “I&rsquo;m guessing”
                </li>
                <li className="flex items-center gap-2">
                  <Keyboard className="size-4 text-ink-3" aria-hidden /> Keys 1–4 to answer, Enter to continue
                </li>
              </ul>
              <ButtonLink href={`/courses/${course.id}/diagnose`} size="lg" className="mt-5 w-full">
                Start diagnostic <ArrowRight className="size-4" />
              </ButtonLink>
            </Card>
          )}

          {inProgress && (
            <Card className="p-5">
              <p className="text-[13px] font-medium text-accent-ink">Diagnostic in progress</p>
              <h2 className="mt-1 text-[20px] font-semibold">{diag.attempts.length} answered so far</h2>
              <Meter className="mt-3" value={diag.confidence ?? 0} label="Diagnosis confidence" />
              <p className="mt-1.5 text-[12px] text-ink-3">Diagnosis confidence {Math.round((diag.confidence ?? 0) * 100)}%</p>
              <ButtonLink href={`/courses/${course.id}/diagnose`} size="lg" className="mt-5 w-full">
                Resume <ArrowRight className="size-4" />
              </ButtonLink>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setDiagnostic(course.id, null)}>
                <RotateCcw className="size-3.5" /> Start over
              </Button>
            </Card>
          )}

          {progress && (
            <Card className="p-5">
              <p className="text-[13px] font-medium text-ink-3">Your diagnosis</p>
              {roots.length ? (
                <>
                  <h2 className="mt-1 text-[20px] font-semibold leading-snug">
                    {roots.length === 1 ? "One root gap" : `${roots.length} root gaps`} to fix
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {roots.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/courses/${course.id}/learn/${r.id}`}
                          className="pressable flex items-center gap-3 rounded-xl border border-bad/25 bg-bad-soft px-3 py-2.5 hover:border-bad/50"
                        >
                          <Target className="size-4 shrink-0 text-bad-ink" aria-hidden />
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] font-medium">{r.name}</span>
                            <span className="block text-[12px] text-ink-2">Unlocks {descendants(g, r.id).size} concepts</span>
                          </span>
                          <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <h2 className="mt-1 text-[20px] font-semibold">No root gaps — you&rsquo;re solid.</h2>
              )}
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[12.5px] text-ink-2">
                  <span>Mastery</span>
                  <span>
                    {mastered}/{course.concepts.length} solid
                  </span>
                </div>
                <Meter value={mastered / course.concepts.length} tone="good" label="Concepts mastered" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <ButtonLink href={`/courses/${course.id}/report`} variant="secondary">
                  Full report
                </ButtonLink>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Retake the diagnostic? Your current progress for this course will be replaced.")) {
                      resetCourse(course.id);
                      router.push(`/courses/${course.id}/diagnose`);
                    }
                  }}
                >
                  <RotateCcw className="size-3.5" /> Retake
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-0">
            <p className="flex items-center gap-2 border-b border-line px-5 py-3 text-[13px] font-medium">
              <Clock className="size-3.5 text-ink-3" aria-hidden /> Concepts, goals first
            </p>
            <ul className="max-h-[420px] divide-y divide-line overflow-y-auto scrollbar-thin">
              {order.map((id) => {
                const c = g.byId.get(id)!;
                const v = view[id];
                return (
                  <li key={id}>
                    <Link href={`/courses/${course.id}/learn/${id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2">
                      <span className="min-w-0 flex-1">
                        <span className={clsx("block truncate text-[13.5px]", course.targetConceptIds.includes(id) && "font-semibold")}>{c.name}</span>
                        {v && <span className="block font-mono text-[11px] text-ink-3">{Math.round(v.p * 100)}% known</span>}
                      </span>
                      <StatusBadge view={progress || diag?.done ? v : undefined} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
