"use client";

import clsx from "clsx";
import { ArrowRight, Check, ChevronLeft, ClipboardCopy, Clock, Lightbulb, Printer, Target, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CourseGate } from "@/components/CourseGate";
import { KnowledgeGraph, StatusLegend } from "@/components/KnowledgeGraph";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge, Button, ButtonLink, Card, Eyebrow, Meter, PageShell } from "@/components/ui";
import { analyze, studyPath } from "@/lib/engine/analysis";
import { buildGraph } from "@/lib/engine/graph";
import type { Course } from "@/lib/schema";
import { useApp } from "@/store/app";

export default function ReportPage() {
  const { courseId } = useParams<{ courseId: string }>();
  return <CourseGate courseId={courseId}>{(course) => <Report course={course} />}</CourseGate>;
}

const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

function Report({ course }: { course: Course }) {
  const diag = useApp((s) => s.diagnostics[course.id]);
  const progress = useApp((s) => s.progress[course.id]);
  const [copied, setCopied] = useState(false);
  const g = useMemo(() => buildGraph(course.concepts), [course]);

  if (!diag?.done || !progress) {
    return (
      <PageShell className="py-24 text-center">
        <h1 className="font-serif text-3xl">No report yet</h1>
        <p className="mt-2 text-ink-2">Take the diagnostic first — it takes about 10 minutes.</p>
        <ButtonLink href={`/courses/${course.id}/diagnose`} className="mt-6">
          Start diagnostic <ArrowRight className="size-4" />
        </ButtonLink>
      </PageShell>
    );
  }

  const report = analyze(diag, course);
  const path = studyPath(course, progress);
  const name = (id: string) => g.byId.get(id)?.name ?? id;
  const primary = report.rootGaps[0];
  const fixedRoots = report.rootGaps.filter((r) => progress[r.conceptId]?.status === "mastered");

  const summaryText = [
    `Rootwise diagnostic — ${course.title}`,
    report.rootGaps.length ? `Root gap(s): ${report.rootGaps.map((r) => name(r.conceptId)).join(", ")}` : "No root gaps found.",
    report.misconceptions.length ? `Misconceptions: ${report.misconceptions.map((m) => m.misconception.label).join("; ")}` : "",
    `Questions: ${report.stats.questions} · Accuracy ${Math.round(report.stats.accuracy * 100)}% · Confidence ${Math.round((diag.confidence ?? 0) * 100)}%`,
    `Study path: ${path.slice(0, 6).map((p, i) => `${i + 1}. ${name(p.conceptId)}`).join("  ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <PageShell wide className="pb-20">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
          <ChevronLeft className="size-4" aria-hidden /> {course.title}
        </Link>
        <div className="ml-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(summaryText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? <Check className="size-3.5" /> : <ClipboardCopy className="size-3.5" />} {copied ? "Copied" : "Copy for my teacher"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Save as PDF
          </Button>
        </div>
      </div>

      {/* Headline */}
      <header className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <Eyebrow>Diagnostic report · {course.title}</Eyebrow>
          {primary ? (
            <h1 className="mt-3 font-serif text-[42px] leading-[1.03] tracking-tight sm:text-[56px]">
              The real gap is <em className="text-bad-ink">{name(primary.conceptId)}</em>
              {report.rootGaps.length > 1 && <span className="text-ink-2"> (+{report.rootGaps.length - 1} more)</span>}.
            </h1>
          ) : (
            <h1 className="mt-3 font-serif text-[42px] leading-[1.03] tracking-tight sm:text-[56px]">No root gaps — you&rsquo;re solid.</h1>
          )}
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">
            {primary
              ? `It sits beneath ${primary.unlocks.length} concept${primary.unlocks.length === 1 ? "" : "s"} in this course, so fixing it first is the fastest way to make everything above it click. ${
                  report.blocked.length ? `${report.blocked.length} concept${report.blocked.length > 1 ? "s look" : " looks"} weak only because of it.` : ""
                }`
              : "Every concept looks solid or very likely solid. Use practice on the goal concepts to push further."}
          </p>
          {fixedRoots.length > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-good-soft px-3 py-1 text-[13px] font-medium text-good-ink">
              <Check className="size-3.5" /> Fixed since the diagnostic: {fixedRoots.map((r) => name(r.conceptId)).join(", ")}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {[
            ["Questions", `${report.stats.questions}`, `vs ${report.stats.fullTestQuestions} for a full test`],
            ["Confidence", `${Math.round((diag.confidence ?? 0) * 100)}%`, "posterior probability"],
            ["Accuracy", `${Math.round(report.stats.accuracy * 100)}%`, `${report.stats.correct} correct`],
            ["Time", fmtTime(report.stats.durationMs), `${report.stats.conceptsCovered}/${report.stats.conceptsTotal} concepts mapped`],
          ].map(([k, v, sub]) => (
            <div key={k} className="rounded-2xl border border-line bg-surface p-4">
              <dt className="text-[12px] text-ink-3">{k}</dt>
              <dd className="mt-1 font-mono text-[24px] font-semibold leading-none">{v}</dd>
              <dd className="mt-1.5 text-[11.5px] text-ink-3">{sub}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Map */}
      <Card className="mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <p className="text-[13px] font-medium">Where you stand now</p>
          <StatusLegend />
        </div>
        <div className="grain p-3 sm:p-5">
          <KnowledgeGraph course={course} view={progress} />
        </div>
      </Card>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Study path */}
        <section>
          <h2 className="font-serif text-[30px] leading-tight">Your study path</h2>
          <p className="mt-1 text-[14px] text-ink-2">Prerequisites first; among those, whatever unlocks the most.</p>
          {path.length ? (
            <ol className="mt-4 space-y-2.5">
              {path.map((step, i) => {
                const kindLabel = { root: "Root gap", blocked: "Blocked", shaky: "Shaky", unassessed: "Check" }[step.kind];
                return (
                  <li key={step.conceptId}>
                    <Link
                      href={`/courses/${course.id}/learn/${step.conceptId}`}
                      className={clsx(
                        "pressable flex items-center gap-4 rounded-2xl border bg-surface p-4 hover:shadow-card",
                        i === 0 ? "border-ink shadow-soft" : "border-line",
                      )}
                    >
                      <span
                        className={clsx(
                          "flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold",
                          i === 0 ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-2",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{name(step.conceptId)}</span>
                        <span className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3">
                          <Badge tone={step.kind === "root" || step.kind === "blocked" ? "bad" : step.kind === "shaky" ? "warn" : "neutral"}>{kindLabel}</Badge>
                          <Clock className="size-3" aria-hidden /> ~{step.minutes} min · {Math.round(step.p * 100)}% now
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-ink-3" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Card className="mt-4 p-5 text-[14px] text-ink-2">Everything is solid. Try practice questions on the goal concepts.</Card>
          )}
        </section>

        {/* Misconceptions */}
        <section>
          <h2 className="font-serif text-[30px] leading-tight">Misconceptions spotted</h2>
          <p className="mt-1 text-[14px] text-ink-2">The specific wrong ideas your answers revealed — often the real thing to unlearn.</p>
          {report.misconceptions.length ? (
            <ul className="mt-4 space-y-2.5">
              {report.misconceptions.map((m) => (
                <li key={m.misconception.id} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="flex items-start gap-2 text-[15px] font-medium">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn-ink" aria-hidden />
                    {m.misconception.label}
                  </p>
                  <p className="mt-1.5 pl-6 text-[13.5px] leading-relaxed text-ink-2">{m.misconception.explanation}</p>
                  <p className="mt-2 pl-6 font-mono text-[11px] text-ink-3">
                    in {name(m.misconception.conceptId)} · seen {m.count}× {m.confident < m.count ? `(${m.count - m.confident} while guessing)` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="mt-4 p-5 text-[14px] text-ink-2">No specific misconceptions detected.</Card>
          )}
        </section>
      </div>

      {/* Answer review */}
      <section className="print-break mt-10">
        <details className="group rounded-2xl border border-line bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[15px] font-medium">
            Review every answer ({diag.attempts.length})
            <span className="text-[13px] text-ink-3 group-open:hidden">Show</span>
            <span className="hidden text-[13px] text-ink-3 group-open:inline">Hide</span>
          </summary>
          <ol className="divide-y divide-line border-t border-line">
            {diag.attempts.map((a, i) => {
              const q = course.questions.find((x) => x.id === a.questionId);
              if (!q) return null;
              const chosen = q.options.find((o) => o.id === a.optionId);
              const correct = q.options.find((o) => o.id === q.correctOptionId);
              return (
                <li key={i} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[28px_1fr_auto] sm:items-start sm:gap-3">
                  <span className={clsx("flex size-6 items-center justify-center rounded-md", a.correct ? "bg-good-soft text-good-ink" : "bg-bad-soft text-bad-ink")}>
                    {a.correct ? <Check className="size-3.5" aria-label="Correct" /> : <X className="size-3.5" aria-label="Wrong" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px]">{q.stem}</p>
                    <p className="mt-1 text-[12.5px] text-ink-2">
                      You chose <strong className="font-medium">{chosen?.text}</strong>
                      {!a.correct && (
                        <>
                          {" "}· correct: <strong className="font-medium text-good-ink">{correct?.text}</strong>
                        </>
                      )}
                      {a.guessing && <span className="text-warn-ink"> · marked as a guess</span>}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-ink-3">{name(q.conceptId)}</span>
                </li>
              );
            })}
          </ol>
        </details>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-[30px] leading-tight">All concepts</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-surface-2 text-[12px] text-ink-3">
              <tr>
                <th className="px-4 py-2.5 font-medium">Concept</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Known</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {course.concepts.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5">
                    <Link href={`/courses/${course.id}/learn/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge view={progress[c.id]} />
                  </td>
                  <td className="hidden w-48 px-4 py-2.5 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Meter value={progress[c.id]?.p ?? 0} tone={progress[c.id]?.status === "mastered" ? "good" : progress[c.id]?.status === "gap" ? "bad" : "warn"} label={`${c.name} mastery`} />
                      <span className="w-9 text-right font-mono text-[11.5px] text-ink-3">{Math.round((progress[c.id]?.p ?? 0) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {primary && (
        <div className="no-print mt-10 flex flex-col items-start gap-4 rounded-3xl bg-brand p-7 text-brand-ink sm:flex-row sm:items-center">
          <Target className="size-6 shrink-0" aria-hidden />
          <div>
            <p className="font-serif text-[26px] leading-tight">Start with {name(primary.conceptId)}.</p>
            <p className="text-[14px] opacity-70">A short lesson, a Socratic tutor, then explain it back. About 15 minutes.</p>
          </div>
          <ButtonLink href={`/courses/${course.id}/learn/${primary.conceptId}`} variant="secondary" size="lg" className="sm:ml-auto">
            Fix it now <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      )}
    </PageShell>
  );
}
