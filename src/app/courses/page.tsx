"use client";

import clsx from "clsx";
import { ArrowRight, BookOpen, CircuitBoard, Plus, Sigma, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { builtinCourses } from "@/content";
import { buttonClass, Eyebrow, Meter, PageShell, Skeleton } from "@/components/ui";
import type { Course } from "@/lib/schema";
import { useApp, useHydrated } from "@/store/app";

const ICONS: Record<string, typeof Sigma> = { "quadratics-cbse10": Sigma, "dc-circuits-btech": CircuitBoard };

export default function CoursesPage() {
  const hydrated = useHydrated();
  const userCourses = useApp((s) => s.courses);
  return (
    <PageShell wide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Your library</Eyebrow>
          <h1 className="mt-2 font-serif text-[40px] leading-tight tracking-tight sm:text-[48px]">Pick a course, find your gaps</h1>
          <p className="mt-2 max-w-xl text-ink-2">Each course is a prerequisite map. The diagnostic takes about 10 minutes and tells you exactly where to start.</p>
        </div>
        <Link href="/courses/new" className={buttonClass("primary", "md")}>
          <Plus className="size-4" /> New course from syllabus
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-[13px] font-medium text-ink-3">Ready-made courses</h2>
        <div className="stagger mt-3 grid gap-4 md:grid-cols-2">
          {builtinCourses.map((c) => (hydrated ? <CourseCard key={c.id} course={c} /> : <Skeleton key={c.id} className="h-[210px]" />))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[13px] font-medium text-ink-3">Made by you</h2>
        {!hydrated ? (
          <Skeleton className="mt-3 h-[120px]" />
        ) : userCourses.length ? (
          <div className="stagger mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {userCourses.map((c) => (
              <CourseCard key={c.id} course={c} removable />
            ))}
          </div>
        ) : (
          <Link
            href="/courses/new"
            className="pressable mt-3 flex items-center gap-4 rounded-2xl border border-dashed border-line-2 p-6 text-ink-2 hover:border-ink-3 hover:text-ink"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-medium text-ink">Turn any syllabus into a diagnostic course</span>
              <span className="block text-[14px]">Paste a syllabus, notes or just a topic — Rootwise maps it and writes the questions.</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden />
          </Link>
        )}
      </section>
    </PageShell>
  );
}

function CourseCard({ course, removable }: { course: Course; removable?: boolean }) {
  const diag = useApp((s) => s.diagnostics[course.id]);
  const progress = useApp((s) => s.progress[course.id]);
  const removeCourse = useApp((s) => s.removeCourse);
  const Icon = ICONS[course.id] ?? BookOpen;
  const values = progress ? Object.values(progress) : [];
  const mastered = values.filter((v) => v.status === "mastered").length;
  const roots = values.filter((v) => v.status === "gap" && v.verdict === "root").length;
  const inProgress = diag && !diag.done;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft transition-shadow duration-200 hover:shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
            {course.audience || course.subject} · {course.concepts.length} concepts
          </p>
          <h3 className="mt-0.5 text-[19px] font-semibold leading-snug">
            <Link href={`/courses/${course.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
              {course.title}
            </Link>
          </h3>
        </div>
        {removable && (
          <button
            type="button"
            onClick={() => confirm(`Delete “${course.title}” and its progress?`) && removeCourse(course.id)}
            className="relative z-10 ml-auto rounded-lg p-1.5 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-bad-ink focus:opacity-100 group-hover:opacity-100"
            aria-label={`Delete ${course.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-[14px] text-ink-2">{course.description}</p>
      <div className="mt-auto pt-5">
        {progress ? (
          <>
            <div className="mb-2 flex items-center justify-between text-[12.5px]">
              <span className="text-ink-2">
                {mastered}/{course.concepts.length} solid
                {roots > 0 && <span className="ml-2 font-medium text-bad-ink">· {roots} root gap{roots > 1 ? "s" : ""} to fix</span>}
              </span>
              <span className="font-medium text-ink">Continue →</span>
            </div>
            <Meter value={mastered / course.concepts.length} tone="good" label="Concepts mastered" />
          </>
        ) : (
          <p className={clsx("flex items-center justify-between text-[13px]", inProgress ? "text-accent-ink" : "text-ink-3")}>
            <span>{inProgress ? `Diagnostic in progress · ${diag.attempts.length} answered` : "Not diagnosed yet · ~10 min"}</span>
            <span className="font-medium text-ink">{inProgress ? "Resume →" : "Start →"}</span>
          </p>
        )}
      </div>
    </div>
  );
}
