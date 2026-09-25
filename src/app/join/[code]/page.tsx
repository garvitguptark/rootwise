"use client";

import { ArrowRight, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Eyebrow, PageShell, Skeleton } from "@/components/ui";
import type { Course } from "@/lib/schema";
import { findCourse, useApp, useHydrated } from "@/store/app";

interface ClassInfo {
  code: string;
  name: string;
  courseId: string;
  course: Course;
  studentCount: number;
}

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const addCourse = useApp((s) => s.addCourse);
  const courses = useApp((s) => s.courses);
  const setMembership = useApp((s) => s.setMembership);
  const [info, setInfo] = useState<ClassInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/classes/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error?.message ?? `Error ${r.status}`);
        if (alive) setInfo(j as ClassInfo);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [code]);

  const join = () => {
    if (!info || !name.trim()) return;
    if (!findCourse(info.courseId, courses)) addCourse(info.course);
    setMembership(info.courseId, { code: info.code, className: info.name, studentId: crypto.randomUUID(), name: name.trim() });
    router.push(`/courses/${info.courseId}/diagnose`);
  };

  return (
    <PageShell className="max-w-lg py-16">
      <Eyebrow>Join a class</Eyebrow>
      {error ? (
        <Card className="mt-4 p-6">
          <p className="font-medium">Couldn&rsquo;t open this class</p>
          <p className="mt-1 text-[14px] text-ink-2">{error}</p>
        </Card>
      ) : !info || !hydrated ? (
        <Skeleton className="mt-4 h-64" />
      ) : (
        <Card className="mt-4 p-6">
          <h1 className="font-serif text-[34px] leading-tight">{info.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-[14px] text-ink-2">
            <Users className="size-4" aria-hidden /> {info.course.title} · {info.studentCount} joined so far
          </p>
          <p className="mt-4 text-[14px] text-ink-2">
            You&rsquo;ll take a short adaptive diagnostic. Your teacher sees which concepts you&rsquo;re missing, so the next lesson fixes the real gap.
          </p>
          <label htmlFor="student-name" className="mt-5 block text-[13px] font-medium">
            Your name, as your teacher knows you
          </label>
          <input
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            maxLength={60}
            autoFocus
            className="mt-1.5 h-11 w-full rounded-xl border border-line-2 bg-surface px-3 text-[15px] outline-none focus:border-ink"
          />
          <Button size="lg" className="mt-5 w-full" disabled={!name.trim()} onClick={join}>
            Join and start <ArrowRight className="size-4" />
          </Button>
        </Card>
      )}
    </PageShell>
  );
}
