"use client";

import { Check, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { postJson } from "@/lib/client";
import { useApp } from "@/store/app";

/** Sends a finished diagnostic to the student's class (once per attempt) and says so. */
export function ClassSync({ courseId }: { courseId: string }) {
  const m = useApp((s) => s.memberships[courseId]);
  const diag = useApp((s) => s.diagnostics[courseId]);
  const setMembership = useApp((s) => s.setMembership);
  const [error, setError] = useState<string | null>(null);
  const pending = !!(m && diag?.done && diag.finishedAt && m.sentFor !== diag.finishedAt);

  useEffect(() => {
    if (!pending || !m || !diag) return;
    let alive = true;
    postJson(`/api/classes/${m.code}/students`, { studentId: m.studentId, name: m.name, state: diag })
      .then(() => alive && setMembership(courseId, { ...m, sentFor: diag.finishedAt }))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [pending, m, diag, courseId, setMembership]);

  if (!m || !diag?.done) return null;
  return (
    <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-2" role="status">
      {error ? (
        <span className="text-bad-ink">Couldn&rsquo;t send to {m.className}: {error}</span>
      ) : pending ? (
        <>
          <Users className="size-3.5" aria-hidden /> Sending your result to {m.className}…
        </>
      ) : (
        <>
          <Check className="size-3.5 text-good-ink" aria-hidden /> Result shared with {m.className}
        </>
      )}
    </p>
  );
}
