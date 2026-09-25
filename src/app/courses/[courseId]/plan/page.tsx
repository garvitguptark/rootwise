"use client";

import clsx from "clsx";
import { ArrowRight, CalendarPlus, Check, ChevronLeft, Coffee, Gauge, Pause, Play, RefreshCw, Repeat, Sparkles, Target, Timer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CourseGate } from "@/components/CourseGate";
import { Badge, Button, ButtonLink, Card, Eyebrow, Meter, PageShell } from "@/components/ui";
import { buildGraph } from "@/lib/engine/graph";
import { buildPlan, fmtMinutes, toICS, type PlanBlock, type PlanMode } from "@/lib/engine/plan";
import type { Course } from "@/lib/schema";
import { useApp, type StoredPlan } from "@/store/app";

export default function PlanPage() {
  const { courseId } = useParams<{ courseId: string }>();
  return <CourseGate courseId={courseId}>{(course) => <Pacer course={course} />}</CourseGate>;
}

const PRESETS = [1, 2, 3, 6, 10];
const SESSIONS = [25, 45, 60];

function Pacer({ course }: { course: Course }) {
  const stored = useApp((s) => s.plans[course.id]);
  const progress = useApp((s) => s.progress[course.id]);
  const setPlan = useApp((s) => s.setPlan);
  const [hours, setHours] = useState(stored ? stored.settings.budgetMinutes / 60 : 3);
  const [mode, setMode] = useState<PlanMode>(stored?.settings.mode ?? "exam");
  const [session, setSession] = useState(stored?.settings.sessionMinutes ?? 45);

  const make = (budgetMinutes: number, pace: number) => {
    const settings = { budgetMinutes, mode, sessionMinutes: session, pace };
    setPlan(course.id, { settings, plan: buildPlan(course, progress, settings), createdAt: new Date().toISOString(), done: {} });
  };

  return (
    <PageShell wide className="pb-20">
      <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" aria-hidden /> {course.title}
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div>
            <Eyebrow>Pace setter</Eyebrow>
            <h1 className="mt-2 font-serif text-[40px] leading-[1.05] tracking-tight">How much time do you have?</h1>
            <p className="mt-2 text-[14.5px] text-ink-2">Rootwise skips what you already know, puts what matters most first, and tells you honestly what to leave out.</p>
          </div>
          <Card className="space-y-5 p-5">
            <fieldset>
              <legend className="text-[13px] font-medium">Time available</legend>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESETS.map((h) => (
                  <button key={h} type="button" aria-pressed={hours === h} onClick={() => setHours(h)} className={clsx("pressable rounded-lg border px-3 py-1.5 font-mono text-[13px]", hours === h ? "border-ink bg-brand text-brand-ink" : "border-line bg-surface hover:bg-surface-2")}>
                    {h}h
                  </button>
                ))}
                <label className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 text-[13px]">
                  <input type="number" min={0.5} max={60} step={0.5} value={hours} onChange={(e) => setHours(Math.max(0.5, Math.min(60, Number(e.target.value) || 0.5)))} className="w-14 bg-transparent py-1.5 font-mono outline-none" aria-label="Hours available" />
                  hours
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-[13px] font-medium">Goal</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([["exam", "Exam mode", "Most marks in the time"], ["mastery", "Mastery mode", "Foundations first, no shortcuts"]] as const).map(([v, t, d]) => (
                  <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)} className={clsx("pressable rounded-xl border p-3 text-left", mode === v ? "border-ink shadow-soft" : "border-line hover:bg-surface-2")}>
                    <span className="block text-[13.5px] font-medium">{t}</span>
                    <span className="block text-[12px] text-ink-3">{d}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-[13px] font-medium">Focus blocks</legend>
              <div className="mt-2 flex gap-1.5">
                {SESSIONS.map((m) => (
                  <button key={m} type="button" aria-pressed={session === m} onClick={() => setSession(m)} className={clsx("pressable flex-1 rounded-lg border py-1.5 font-mono text-[13px]", session === m ? "border-ink bg-brand text-brand-ink" : "border-line hover:bg-surface-2")}>
                    {m} min
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[12px] text-ink-3">A 5-minute break after each block, counted inside your hours.</p>
            </fieldset>
            <Button size="lg" className="w-full" onClick={() => make(Math.round(hours * 60), stored?.settings.pace ?? 1)}>
              <Sparkles className="size-4" /> {stored ? "Re-plan my hours" : "Plan my hours"}
            </Button>
            {!progress && (
              <p className="rounded-xl bg-warn-soft px-3 py-2 text-[12.5px] text-warn-ink">
                No diagnostic yet, so this plan assumes you know nothing.{" "}
                <Link href={`/courses/${course.id}/diagnose`} className="font-semibold underline">
                  Take the 10-minute diagnostic
                </Link>{" "}
                to skip what you already know.
              </p>
            )}
          </Card>
        </div>
        <div className="min-w-0">{stored ? <PlanView course={course} stored={stored} onReplan={make} /> : <EmptyState />}</div>
      </div>
    </PageShell>
  );
}

function EmptyState() {
  return (
    <Card className="grid h-full min-h-[320px] place-items-center p-10 text-center">
      <div>
        <Gauge className="mx-auto size-8 text-ink-3" aria-hidden />
        <p className="mt-3 font-serif text-[26px]">Your plan will appear here</p>
        <p className="mt-1 text-[14px] text-ink-2">Pick your hours and a goal, then press Plan my hours.</p>
      </div>
    </Card>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function PlanView({ course, stored, onReplan }: { course: Course; stored: StoredPlan; onReplan: (budget: number, pace: number) => void }) {
  const progress = useApp((s) => s.progress[course.id]);
  const startBlock = useApp((s) => s.startBlock);
  const finishBlock = useApp((s) => s.finishBlock);
  const g = useMemo(() => buildGraph(course.concepts), [course]);
  const name = (id?: string) => (id ? g.byId.get(id)?.name ?? id : "");
  const { plan, settings, done, active } = stored;
  const now = useNow(!!active);
  const started = Date.parse(stored.createdAt);
  const clock = (min: number) => new Date(started + min * 60000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const label = (b: PlanBlock) =>
    b.kind === "learn" ? `Learn · ${name(b.conceptId)}` : b.kind === "practice" ? `Practise · ${name(b.conceptId)}` : b.kind === "review" ? "Mixed review of today’s concepts" : "Break";

  const work = plan.blocks.filter((b) => b.kind !== "break");
  const doneBlocks = work.filter((b) => b.id in done);
  const spent = doneBlocks.reduce((a, b) => a + done[b.id], 0);
  const plannedDone = doneBlocks.reduce((a, b) => a + b.minutes, 0);
  const next = work.find((b) => !(b.id in done));
  const current = active ? plan.blocks.find((b) => b.id === active.id) : undefined;
  const elapsed = active ? (now - Date.parse(active.startedAt)) / 1000 : 0;
  const remaining = current ? current.minutes * 60 - elapsed : 0;
  const drift = plannedDone - spent;
  // Learned pace from real block times (clamped), used when re-planning.
  const learnedPace = plannedDone >= 15 ? Math.min(2, Math.max(0.5, spent / plannedDone)) : settings.pace;
  const saved = progress ? plan.scratchMinutes - plan.neededMinutes : 0;
  const mm = (s: number) => `${s < 0 ? "−" : ""}${Math.floor(Math.abs(s) / 60)}:${String(Math.floor(Math.abs(s) % 60)).padStart(2, "0")}`;

  const exportIcs = () => {
    const ics = toICS(plan, new Date(started), (b) => `${label(b)} (${course.title})`);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `rootwise-plan-${course.id}.ics` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] text-ink-3">
              {fmtMinutes(settings.budgetMinutes)} · {settings.mode === "exam" ? "Exam mode" : "Mastery mode"} · {settings.sessionMinutes}-min blocks
            </p>
            <h2 className="mt-1 font-serif text-[30px] leading-tight">
              {plan.chosen.length === 0
                ? plan.known.length === course.concepts.length
                  ? "You already know all of it."
                  : "Not enough time for a full concept."
                : plan.skipped.length === 0
                  ? `Everything fits, with ${fmtMinutes(plan.spareMinutes)} to spare.`
                  : `Ready for ${Math.round(plan.coverage * 100)}% of the ${settings.mode === "exam" ? "exam weightage" : "course"}.`}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportIcs} disabled={!work.length}>
              <CalendarPlus className="size-3.5" /> Add to calendar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onReplan(Math.max(30, settings.budgetMinutes - spent), learnedPace)} title="Re-plan with your remaining time, current progress and real pace">
              <RefreshCw className="size-3.5" /> Re-plan
            </Button>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Ready for", `${Math.round(plan.coverage * 100)}%`, settings.mode === "exam" ? "of the weightage" : "of the concepts"],
            ["Study time", fmtMinutes(plan.plannedMinutes), `${plan.chosen.length} concepts`],
            ["Already known", `${plan.known.length}`, "concepts skipped"],
            ["Diagnostic saved", saved > 0 ? fmtMinutes(saved) : "—", saved > 0 ? "vs. studying everything" : "take it to skip topics"],
          ].map(([k, v, sub]) => (
            <div key={k} className="rounded-xl border border-line p-3">
              <dt className="text-[12px] text-ink-3">{k}</dt>
              <dd className="mt-1 font-mono text-[22px] font-semibold leading-none">{v}</dd>
              <dd className="mt-1 text-[11.5px] text-ink-3">{sub}</dd>
            </div>
          ))}
        </dl>
        {plan.skipped.length > 0 && (
          <div className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-[13.5px] text-warn-ink">
            <p className="font-semibold">Honest triage: leave these for later</p>
            <p className="mt-0.5">
              {plan.skipped
                .slice(0, 4)
                .map((s) => `${name(s.conceptId)} (~${fmtMinutes(s.minutes)}${settings.mode === "exam" ? `, weight ${s.weight}` : ""})`)
                .join(" · ")}
              {plan.skipped.length > 4 ? ` · +${plan.skipped.length - 4} more` : ""}. Everything needs {fmtMinutes(plan.neededMinutes)} in total.
            </p>
          </div>
        )}
      </Card>

      {work.length > 0 && (
        <Card className={clsx("p-5", current && "border-ink")}>
          {current ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid size-20 shrink-0 place-items-center rounded-full bg-brand font-mono text-[18px] font-semibold text-brand-ink" role="timer" aria-live="off">
                {mm(remaining)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-ink-3">Now · planned {current.minutes} min</p>
                <p className="text-[18px] font-semibold">{label(current)}</p>
                <p className={clsx("text-[12.5px]", remaining < 0 ? "text-bad-ink" : "text-ink-3")}>{remaining < 0 ? "Over time — wrap up or re-plan." : "Stay on this one thing until the timer ends."}</p>
              </div>
              <div className="flex gap-2">
                {current.conceptId && (
                  <ButtonLink href={`/courses/${course.id}/learn/${current.conceptId}`} variant="secondary">
                    Open <ArrowRight className="size-4" />
                  </ButtonLink>
                )}
                <Button onClick={() => finishBlock(course.id, current.id)}>
                  <Check className="size-4" /> Done
                </Button>
              </div>
            </div>
          ) : next ? (
            <div className="flex flex-wrap items-center gap-4">
              <Timer className="size-6 text-ink-3" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-ink-3">Up next · {next.minutes} min</p>
                <p className="text-[17px] font-semibold">{label(next)}</p>
                {doneBlocks.length > 0 && (
                  <p className={clsx("text-[12.5px]", drift >= 0 ? "text-good-ink" : "text-warn-ink")}>
                    {drift >= 0 ? `${drift} min ahead of plan` : `${-drift} min behind plan — Re-plan uses your real pace`}
                  </p>
                )}
              </div>
              <Button size="lg" onClick={() => startBlock(course.id, next.id)}>
                <Play className="size-4" /> Start focus block
              </Button>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[15px] font-medium text-good-ink">
              <Check className="size-4" /> Plan complete. Re-plan to use any time you have left.
            </p>
          )}
        </Card>
      )}

      <Card className="p-0">
        <p className="border-b border-line px-5 py-3 text-[13px] font-medium">Your timeline</p>
        <ol className="divide-y divide-line">
          {plan.blocks.map((b) => {
            const isDone = b.id in done;
            const isActive = active?.id === b.id;
            const root = b.conceptId && progress?.[b.conceptId]?.verdict === "root";
            return (
              <li key={b.id} className={clsx("flex items-center gap-3 px-5 py-2.5", b.kind === "break" && "bg-surface-2/60", isActive && "bg-accent-soft/60")}>
                <span className="w-16 shrink-0 font-mono text-[11.5px] text-ink-3">{clock(b.start)}</span>
                <span className={clsx("flex size-6 shrink-0 items-center justify-center rounded-full", isDone ? "bg-good-soft text-good-ink" : "bg-surface-2 text-ink-3")}>
                  {isDone ? <Check className="size-3.5" /> : b.kind === "break" ? <Coffee className="size-3.5" /> : b.kind === "review" ? <Repeat className="size-3.5" /> : isActive ? <Pause className="size-3.5" /> : <Target className="size-3.5" />}
                </span>
                <span className={clsx("min-w-0 flex-1 truncate text-[14px]", b.kind === "break" && "text-ink-3", isDone && "text-ink-3 line-through")}>
                  {b.conceptId && b.kind !== "break" ? (
                    <Link href={`/courses/${course.id}/learn/${b.conceptId}`} className="hover:underline">
                      {label(b)}
                    </Link>
                  ) : (
                    label(b)
                  )}
                </span>
                {root && <Badge tone="bad">Root gap</Badge>}
                <span className="w-14 shrink-0 text-right font-mono text-[12px] text-ink-3">{b.minutes} min</span>
              </li>
            );
          })}
        </ol>
        <div className="border-t border-line px-5 py-3">
          <Meter value={work.length ? doneBlocks.length / work.length : 0} tone="good" label="Plan progress" />
          <p className="mt-1.5 text-[12px] text-ink-3">
            {doneBlocks.length}/{work.length} blocks done
          </p>
        </div>
      </Card>
    </div>
  );
}
