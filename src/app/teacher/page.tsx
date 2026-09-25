"use client";

import clsx from "clsx";
import { Check, ClipboardCopy, FlaskConical, Info, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { builtinCourses } from "@/content";
import { Badge, Button, Card, Eyebrow, PageShell, Skeleton, Tabs } from "@/components/ui";
import { simulateCohort, summarize, type CohortStudent } from "@/lib/cohort";
import { buildGraph, descendants, topoSort } from "@/lib/engine/graph";
import type { ConceptState } from "@/lib/engine/types";
import type { Course } from "@/lib/schema";
import { postJson } from "@/lib/client";
import { useApp, useHydrated, type TeacherClass } from "@/store/app";

export default function TeacherPage() {
  const hydrated = useHydrated();
  const userCourses = useApp((s) => s.courses);
  const classes = useApp((s) => s.classes);
  const courses = useMemo(() => [...builtinCourses, ...userCourses.filter((c) => c.questions.length)], [userCourses]);
  const [view, setView] = useState<string | null>(null); // class code, "demo", or null = first class / create
  const active = view === "demo" ? null : (classes.find((c) => c.code === view) ?? (view === null ? classes[0] : undefined));
  const showDemo = view === "demo";

  return (
    <PageShell wide className="pb-20">
      <div>
        <Eyebrow>Teacher dashboard</Eyebrow>
        <h1 className="mt-2 font-serif text-[40px] leading-tight tracking-tight sm:text-[48px]">Where your class really breaks</h1>
      </div>
      {!hydrated ? (
        <Skeleton className="mt-8 h-[640px]" />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {classes.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setView(c.code)}
                aria-pressed={active?.code === c.code && !showDemo}
                className={clsx("pressable rounded-xl border px-3 py-1.5 text-[13px]", active?.code === c.code && !showDemo ? "border-ink bg-brand text-brand-ink" : "border-line bg-surface hover:bg-surface-2")}
              >
                {c.name} <span className="font-mono opacity-70">{c.code}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setView("new")}
              aria-pressed={view === "new" || (!classes.length && !showDemo)}
              className={clsx("pressable inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px]", view === "new" || (!classes.length && !showDemo) ? "border-ink bg-brand text-brand-ink" : "border-dashed border-line-2 hover:bg-surface-2")}
            >
              <Plus className="size-3.5" /> New class
            </button>
            <button
              type="button"
              onClick={() => setView("demo")}
              aria-pressed={showDemo}
              className={clsx("pressable ml-auto inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px]", showDemo ? "border-ink bg-brand text-brand-ink" : "border-line text-ink-2 hover:bg-surface-2")}
            >
              <FlaskConical className="size-3.5" /> Demo class
            </button>
          </div>
          {showDemo ? (
            <DemoClass courses={courses} />
          ) : active ? (
            <LiveClass key={active.code} cls={active} />
          ) : (
            <CreateClass courses={courses} onCreated={(code) => setView(code)} />
          )}
        </>
      )}
    </PageShell>
  );
}

function CreateClass({ courses, onCreated }: { courses: Course[]; onCreated: (code: string) => void }) {
  const addClass = useApp((s) => s.addClass);
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = async () => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await postJson<{ code: string; teacherKey: string }>("/api/classes", {
        name: name.trim(),
        courseId,
        ...(course.source === "generated" ? { course } : {}),
      });
      addClass({ code: res.code, teacherKey: res.teacherKey, name: name.trim(), courseId, createdAt: new Date().toISOString() });
      onCreated(res.code);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="mt-6 max-w-xl p-6">
      <h2 className="text-[20px] font-semibold">Create a class</h2>
      <p className="mt-1 text-[14px] text-ink-2">
        Students join with a 6-character code, take the diagnostic, and their results appear here live — grouped by root gap.
      </p>
      <label className="mt-5 block text-[13px] font-medium" htmlFor="class-name">
        Class name
      </label>
      <input
        id="class-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        placeholder="e.g. 10-B Mathematics"
        className="mt-1.5 h-11 w-full rounded-xl border border-line-2 bg-surface px-3 text-[15px] outline-none focus:border-ink"
      />
      <label className="mt-4 block text-[13px] font-medium" htmlFor="class-course">
        Course
      </label>
      <select
        id="class-course"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-line-2 bg-surface px-3 text-[15px] outline-none focus:border-ink"
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title} {c.audience ? `· ${c.audience}` : ""}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[12px] text-ink-3">
        Need a different topic? <Link href="/courses/new" className="underline">Build a course with AI</Link> first — it will appear here.
      </p>
      {error && <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">{error}</p>}
      <Button size="lg" className="mt-5 w-full" disabled={busy || !name.trim() || !courseId} onClick={create}>
        {busy ? "Creating…" : "Create class"}
      </Button>
    </Card>
  );
}

interface LiveData {
  name: string;
  course: Course;
  students: { id: string; name: string; state: CohortStudent["state"]; submittedAt: string }[];
}

function LiveClass({ cls }: { cls: TeacherClass }) {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/classes/${cls.code}?key=${encodeURIComponent(cls.teacherKey)}`, { cache: "no-store" })
        .then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw new Error(j?.error?.message ?? `Error ${r.status}`);
          if (alive) {
            setData(j as LiveData);
            setError(null);
          }
        })
        .catch((e: Error) => alive && setError(e.message));
    load();
    const t = setInterval(load, 8000);
    Promise.resolve().then(() => alive && setOrigin(window.location.origin));
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [cls.code, cls.teacherKey]);
  const link = `${origin}/join/${cls.code}`;
  const students: CohortStudent[] = useMemo(() => (data?.students ?? []).map((s) => ({ id: s.id, name: s.name, state: s.state })), [data]);

  return (
    <div className="mt-6">
      <Card className="flex flex-wrap items-center gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-ink-3">Students join at</p>
          <p className="truncate font-mono text-[15px]">{link}</p>
        </div>
        <div className="rounded-xl bg-brand px-4 py-2 font-mono text-[24px] font-semibold tracking-[0.2em] text-brand-ink" aria-label={`Class code ${cls.code}`}>
          {cls.code}
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(`Join "${cls.name}" on Rootwise: ${link} (code ${cls.code})`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />} {copied ? "Copied" : "Copy invite"}
        </Button>
      </Card>
      {error && <p className="mt-4 rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad-ink">{error}</p>}
      {!data ? (
        !error && <Skeleton className="mt-6 h-[420px]" />
      ) : students.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <Users className="mx-auto size-8 text-ink-3" aria-hidden />
          <p className="mt-3 font-serif text-[26px]">Waiting for students</p>
          <p className="mt-1 text-[14px] text-ink-2">
            Share the code. Each student&rsquo;s result appears here as soon as they finish the {data.course.title} diagnostic. This page refreshes itself.
          </p>
        </Card>
      ) : (
        <Dashboard course={data.course} students={students} />
      )}
    </div>
  );
}

function DemoClass({ courses }: { courses: Course[] }) {
  const [courseId, setCourseId] = useState(courses[0].id);
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const mine = useApp((s) => s.diagnostics[course.id]);
  const cohort = useMemo(() => simulateCohort(course), [course]);
  const students: CohortStudent[] = useMemo(
    () => (mine?.done ? [{ id: "you", name: "You", state: mine, isYou: true }, ...cohort] : cohort),
    [cohort, mine],
  );
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="flex max-w-3xl flex-1 items-start gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink-2">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold text-ink">Demo class, clearly simulated:</strong> 32 synthetic students with hidden gaps took the real
            adaptive diagnostic. Create a class to see your real students instead.
          </span>
        </p>
        {courses.length > 1 && <Tabs value={course.id} onChange={setCourseId} items={courses.slice(0, 5).map((c) => ({ value: c.id, label: c.title }))} className="max-w-full overflow-x-auto" />}
      </div>
      <Dashboard key={course.id} course={course} students={students} />
    </>
  );
}

function cellStyle(c: ConceptState | undefined) {
  if (!c) return { className: "bg-unknown-soft", label: "Not assessed" };
  if (c.status === "gap" && c.verdict === "root") return { className: "bg-bad", label: "Root gap" };
  if (c.status === "gap")
    return {
      className: "bg-bad-soft [background-image:repeating-linear-gradient(135deg,transparent_0_3px,color-mix(in_oklab,var(--bad)_35%,transparent)_3px_4.5px)]",
      label: "Blocked",
    };
  if (c.status === "shaky") return { className: "bg-warn", label: "Shaky" };
  if (c.status === "mastered") return c.verdict === "inferred" ? { className: "bg-good/45", label: "Solid (inferred)" } : { className: "bg-good", label: "Solid" };
  return { className: "bg-unknown-soft", label: "Not assessed" };
}

function Dashboard({ course, students }: { course: Course; students: CohortStudent[] }) {
  const summary = useMemo(() => summarize(course, students), [course, students]);
  const g = useMemo(() => buildGraph(course.concepts), [course]);
  const order = useMemo(() => topoSort(g), [g]);
  const name = (id: string) => g.byId.get(id)?.name ?? id;
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;
  const [copied, setCopied] = useState<string | null>(null);

  const primaryRoot = (s: CohortStudent) => {
    const roots = Object.entries(s.state.concepts).filter(([, c]) => c.status === "gap" && c.verdict === "root");
    roots.sort((a, b) => descendants(g, b[0]).size - descendants(g, a[0]).size);
    return roots[0]?.[0];
  };
  const sorted = [...students].sort((a, b) => {
    if (a.isYou) return -1;
    if (b.isYou) return 1;
    const ra = primaryRoot(a);
    const rb = primaryRoot(b);
    return (ra ? order.indexOf(ra) : 999) - (rb ? order.indexOf(rb) : 999) || a.name.localeCompare(b.name);
  });
  const top = summary.rootCounts[0];
  const maxCount = Math.max(1, ...summary.rootCounts.map((r) => r.students.length));

  const planFor = (conceptId: string, ids: string[]) => {
    const c = g.byId.get(conceptId)!;
    return [
      `Reteach group: ${c.name} (${ids.length} students)`,
      `Students: ${ids.map(studentName).join(", ")}`,
      c.lesson ? `Core idea: ${c.lesson}` : `Core idea: ${c.summary}`,
      c.socratic?.[0] ? `Open with: ${c.socratic[0]}` : "",
      c.example ? `Worked example: ${c.example.problem}` : "",
      `Then assign: Rootwise practice + teach-back on "${c.name}".`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  return (
    <div className="mt-8 space-y-8">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Students diagnosed", `${students.length}`, "in about 10 minutes each"],
          ["Median questions", `${summary.medianQuestions}`, `instead of ${course.concepts.length * 3} for a full test`],
          ["Have a root gap", `${Math.round((summary.withRootGap / students.length) * 100)}%`, `${summary.withRootGap} students`],
          ["Biggest blocker", top ? name(top.conceptId) : "None", top ? `${top.students.length} students · unlocks ${descendants(g, top.conceptId).size} concepts` : "class is solid"],
        ].map(([k, v, sub]) => (
          <Card key={k} className="p-4">
            <dt className="text-[12px] text-ink-3">{k}</dt>
            <dd className="mt-1.5 line-clamp-2 text-[20px] font-semibold leading-tight sm:text-[24px]">{v}</dd>
            <dd className="mt-1 truncate text-[12px] text-ink-3">{sub}</dd>
          </Card>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <h2 className="text-[16px] font-semibold">Root gaps across the class</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">Number of students whose diagnosis traced back to each concept</p>
          <ul className="mt-5 space-y-3">
            {summary.rootCounts.map((r) => (
              <li key={r.conceptId} className="group grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-[13px] sm:grid-cols-[minmax(0,200px)_1fr_auto]">
                <span className="truncate text-ink-2" title={name(r.conceptId)}>
                  {name(r.conceptId)}
                </span>
                <span className="relative h-4" title={r.students.map(studentName).join(", ")}>
                  <span
                    className={clsx("absolute inset-y-0 left-0 rounded-r-[4px] rounded-l-[2px] transition-[width] duration-700", r === top ? "bg-bad" : "bg-bad/55")}
                    style={{ width: `${(r.students.length / maxCount) * 100}%` }}
                  />
                </span>
                <span className="w-20 text-right font-mono text-[12px] text-ink">
                  {r.students.length} student{r.students.length > 1 ? "s" : ""}
                </span>
              </li>
            ))}
            {!summary.rootCounts.length && <li className="text-[14px] text-ink-2">No root gaps found — the class is solid.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-[16px] font-semibold">Misconceptions spreading</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">Specific wrong ideas revealed by students&rsquo; chosen answers</p>
          <ul className="mt-5 space-y-3.5">
            {summary.misconceptions.slice(0, 6).map((m) => {
              const mis = course.misconceptions.find((x) => x.id === m.id);
              if (!mis) return null;
              return (
                <li key={m.id}>
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                    <span className="min-w-0">
                      {mis.label} <span className="text-[12px] text-ink-3">· {name(mis.conceptId)}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[12px]">
                      {m.students}/{students.length}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-warn" style={{ width: `${(m.students / students.length) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-[16px] font-semibold">Class knowledge map</h2>
            <p className="text-[13px] text-ink-3">Students × concepts, foundations on the left → goals on the right. Grouped by root gap.</p>
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-2" aria-label="Legend">
            {[
              ["bg-good", "Solid"],
              ["bg-good/45", "Solid (inferred)"],
              ["bg-warn", "Shaky"],
              ["bg-bad", "Root gap"],
              [cellStyle({ status: "gap", verdict: "blocked" } as ConceptState).className, "Blocked"],
              ["bg-unknown-soft", "Not assessed"],
            ].map(([cls, label]) => (
              <li key={label} className="flex items-center gap-1.5">
                <span className={clsx("size-3 rounded-[3px]", cls)} aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-x-auto scrollbar-thin p-5">
          <table className="border-separate border-spacing-[3px] text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface text-left align-bottom font-medium text-ink-3" scope="col">
                  Student
                </th>
                {order.map((id) => (
                  <th key={id} scope="col" className="h-36 w-7 align-bottom font-normal text-ink-2">
                    <span className="inline-block max-h-36 truncate [writing-mode:vertical-rl] rotate-180 text-left" title={name(id)}>
                      {name(id)}
                    </span>
                  </th>
                ))}
                <th scope="col" className="pl-3 text-left align-bottom font-medium text-ink-3">
                  Root gap
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const root = primaryRoot(s);
                return (
                  <tr key={s.id}>
                    <th scope="row" className={clsx("sticky left-0 z-10 bg-surface pr-3 text-left font-normal whitespace-nowrap", s.isYou ? "font-semibold text-accent-ink" : "text-ink-2")}>
                      {s.name}
                    </th>
                    {order.map((id) => {
                      const c = s.state.concepts[id];
                      const st = cellStyle(c);
                      return (
                        <td key={id} className="p-0">
                          <span
                            className={clsx("block size-7 rounded-[5px]", st.className, s.isYou && "ring-1 ring-accent ring-offset-1 ring-offset-surface")}
                            title={`${s.name} · ${name(id)}: ${st.label} (${Math.round((c?.p ?? 0) * 100)}%)`}
                            aria-label={`${s.name}, ${name(id)}: ${st.label}`}
                            role="img"
                          />
                        </td>
                      );
                    })}
                    <td className="pl-3 whitespace-nowrap text-ink-2">{root ? name(root) : <span className="text-ink-3">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <section>
        <h2 className="flex items-center gap-2 font-serif text-[32px] leading-tight">
          <Users className="size-6" aria-hidden /> Tomorrow&rsquo;s plan: small groups by root gap
        </h2>
        <p className="mt-1 text-[14px] text-ink-2">Re-teaching the chapter reaches nobody. Ten focused minutes on each group&rsquo;s actual gap does.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.rootCounts.slice(0, 3).map((r, i) => {
            const c = g.byId.get(r.conceptId)!;
            const plan = planFor(r.conceptId, r.students);
            return (
              <Card key={r.conceptId} className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <Badge tone={i === 0 ? "bad" : "neutral"}>Group {String.fromCharCode(65 + i)}</Badge>
                  <span className="font-mono text-[12px] text-ink-3">{r.students.length} students · 10 min</span>
                </div>
                <h3 className="mt-3 text-[18px] font-semibold">{c.name}</h3>
                <p className="mt-1 text-[13.5px] text-ink-2">
                  Unlocks {descendants(g, c.id).size} concepts. {c.socratic?.[0] ? `Open with: “${c.socratic[0]}”` : c.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.students.map((id) => (
                    <span key={id} className={clsx("rounded-md px-1.5 py-0.5 text-[11.5px]", id === "you" ? "bg-accent-soft text-accent-ink" : "bg-surface-2 text-ink-2")}>
                      {studentName(id)}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex gap-2 pt-5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(plan);
                      setCopied(r.conceptId);
                      setTimeout(() => setCopied(null), 1600);
                    }}
                  >
                    {copied === r.conceptId ? <Check className="size-3.5" /> : <ClipboardCopy className="size-3.5" />} {copied === r.conceptId ? "Copied" : "Copy lesson plan"}
                  </Button>
                  <Link href={`/courses/${course.id}/learn/${c.id}`} className="inline-flex items-center px-2 text-[13px] text-ink-2 hover:text-ink">
                    Preview lesson →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
        <p className="mt-6 flex items-start gap-2 text-[12.5px] text-ink-3">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Privacy: students appear only under the name they typed, and results are visible only with this device&rsquo;s private teacher key.
        </p>
      </section>
    </div>
  );
}
