"use client";

import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import type { Course } from "@/lib/schema";
import { useCourse, useHydrated } from "@/store/app";
import { ButtonLink, PageShell, Skeleton } from "./ui";

/** Waits for persisted state, resolves the course, and handles "not found". */
export function CourseGate({ courseId, children }: { courseId: string; children: (course: Course) => ReactNode }) {
  const hydrated = useHydrated();
  const course = useCourse(courseId);
  if (!hydrated) {
    return (
      <PageShell>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-4 w-96 max-w-full" />
        <Skeleton className="mt-8 h-[420px] w-full" />
      </PageShell>
    );
  }
  if (!course) {
    return (
      <PageShell className="flex flex-col items-center py-24 text-center">
        <SearchX className="size-8 text-ink-3" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl">Course not found</h1>
        <p className="mt-2 max-w-sm text-ink-2">
          Generated courses live in this browser only. It may have been created on another device or removed.
        </p>
        <ButtonLink href="/courses" className="mt-6">
          Browse courses
        </ButtonLink>
      </PageShell>
    );
  }
  return <>{children(course)}</>;
}
