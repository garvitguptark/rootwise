"use client";

import clsx from "clsx";
import { ArrowRight, Check, FileUp, KeyRound, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { Button, ButtonLink, Card, Eyebrow, Meter, PageShell, Spinner } from "@/components/ui";
import { useAIStatus } from "@/hooks/useAIStatus";
import { slug, type GeneratedGraph } from "@/lib/ai/normalize";
import { ApiError, postJson } from "@/lib/client";
import { validateCourse } from "@/lib/course-validation";
import { buildKst } from "@/lib/engine/kst";
import { LANGUAGES } from "@/lib/languages";
import type { Course, GraphRequest, LanguageCode, Level, Question, QuestionsRequest } from "@/lib/schema";
import { useApp } from "@/store/app";

const EXAMPLES: { topic: string; level: Level; audience: string }[] = [
  { topic: "Laws of motion", level: "school", audience: "CBSE Class 9" },
  { topic: "Photosynthesis", level: "school", audience: "Class 10 Biology" },
  { topic: "Recursion", level: "college", audience: "B.Tech CSE Year 1" },
  { topic: "Op-amp circuits", level: "college", audience: "B.Tech ECE Year 2" },
  { topic: "Percentages and profit & loss", level: "general", audience: "Competitive exams" },
];

type Phase = "form" | "graph" | "questions" | "checking" | "ready" | "error";

async function pool<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

export default function NewCoursePage() {
  const router = useRouter();
  const ai = useAIStatus();
  const settings = useApp((s) => s.settings);
  const addCourse = useApp((s) => s.addCourse);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level>("school");
  const [audience, setAudience] = useState("");
  const [language, setLanguage] = useState<LanguageCode>(settings.language);
  const [syllabus, setSyllabus] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [graph, setGraph] = useState<GeneratedGraph | null>(null);
  const [batches, setBatches] = useState({ done: 0, total: 0, questions: 0 });
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = phase === "graph" || phase === "questions" || phase === "checking";
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setElapsed(Math.round((performance.now() - startedAt.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [busy]);

  async function generate() {
    setError(null);
    setGraph(null);
    setCourse(null);
    startedAt.current = performance.now();
    setElapsed(0);
    setPhase("graph");
    try {
      const req: GraphRequest = { topic: topic.trim(), level, audience: audience.trim() || undefined, syllabus: syllabus.trim() || undefined, language };
      const g = await postJson<GeneratedGraph>("/api/generate/graph", req);
      setGraph(g);
      setPhase("questions");

      const names = new Map(g.concepts.map((c) => [c.id, c.name]));
      const chunks: GeneratedGraph["concepts"][] = [];
      for (let i = 0; i < g.concepts.length; i += 3) chunks.push(g.concepts.slice(i, i + 3));
      setBatches({ done: 0, total: chunks.length, questions: 0 });

      const makeReq = (chunk: GeneratedGraph["concepts"]): QuestionsRequest => ({
        courseTitle: g.title,
        level,
        audience: audience.trim() || undefined,
        language,
        concepts: chunk.map((c) => ({ id: c.id, name: c.name, summary: c.summary, prerequisites: c.prerequisites.map((p) => names.get(p) ?? p) })),
        misconceptions: g.misconceptions.map((m) => ({ id: m.id, conceptId: m.conceptId, label: m.label })).slice(0, 40),
        perConcept: 4,
        avoid: [],
      });
      const fetchChunk = async (chunk: GeneratedGraph["concepts"]) => {
        let qs: Question[] = [];
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const res = await postJson<{ questions: Question[] }>("/api/generate/questions", makeReq(chunk));
            qs = [...qs, ...res.questions];
            const thin = chunk.filter((c) => qs.filter((q) => q.conceptId === c.id).length < 2);
            if (!thin.length) break;
            chunk = thin;
          } catch (e) {
            if (attempt === 1 || (e instanceof ApiError && e.status === 503)) throw e;
          }
        }
        setBatches((b) => ({ ...b, done: b.done + 1, questions: b.questions + qs.length }));
        return qs;
      };
      const results = await pool(chunks, 3, fetchChunk);

      setPhase("checking");
      const draft: Course = {
        id: `${slug(g.title, "course")}-${Date.now().toString(36)}`,
        title: g.title,
        subject: g.subject,
        level,
        audience: audience.trim(),
        description: g.description || `A diagnostic course on ${topic}.`,
        language,
        concepts: g.concepts,
        misconceptions: g.misconceptions,
        questions: results.flat(),
        targetConceptIds: g.targetConceptIds,
        source: "generated",
        createdAt: new Date().toISOString(),
      };
      // Drop concepts that ended up with no questions at all (rare) rather than fail.
      const assessable = new Set(draft.questions.map((q) => q.conceptId));
      const { course: valid, problems } = validateCourse(draft);
      const hard = problems.filter((p) => !p.includes("fewer than 2 questions"));
      if (!valid || hard.length) throw new Error(`The generated course didn't pass validation: ${hard.slice(0, 3).join("; ")}`);
      if (assessable.size < Math.ceil(valid.concepts.length * 0.6)) throw new Error("Too few questions were generated. Please try again.");
      buildKst(valid); // warm the knowledge-space model
      await new Promise((r) => setTimeout(r, 500));
      addCourse(valid);
      setCourse(valid);
      setPhase("ready");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  const draftCourse = useMemo<Course | null>(
    () =>
      graph && {
        id: "draft",
        title: graph.title,
        subject: graph.subject,
        level,
        audience,
        description: graph.description,
        language,
        concepts: graph.concepts,
        misconceptions: graph.misconceptions,
        questions: [],
        targetConceptIds: graph.targetConceptIds,
        source: "generated",
        createdAt: "",
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only rebuild when a new graph arrives
    [graph],
  );
  const aiDown = ai !== null && !ai.live;
  const canSubmit = topic.trim().length >= 2 && !busy && !aiDown;

  return (
    <PageShell wide>
      <Eyebrow>New course</Eyebrow>
      <h1 className="mt-2 font-serif text-[40px] leading-tight tracking-tight sm:text-[48px]">Any syllabus → a diagnostic in a minute</h1>
      <p className="mt-2 max-w-2xl text-ink-2">
        Rootwise asks the AI for a prerequisite map, the common misconceptions, and misconception-tagged questions — then validates everything
        before the engine uses it.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card className="p-5 sm:p-6">
          {aiDown && (
            <div className="mb-5 flex gap-3 rounded-xl border border-warn/40 bg-warn-soft/70 p-4 text-[13.5px]">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-warn-ink" aria-hidden />
              <div>
                <p className="font-semibold text-ink">Demo mode — no AI key on this server</p>
                <p className="mt-1 text-ink-2">
                  Add a free <code className="font-mono text-[12.5px]">GEMINI_API_KEY</code> to generate courses. The built-in courses work fully offline.
                </p>
                <Link href="/courses" className="mt-2 inline-block font-medium text-ink underline underline-offset-2">
                  Use a ready-made course →
                </Link>
              </div>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) void generate();
            }}
            className="space-y-5"
          >
            <fieldset disabled={busy || aiDown} className="space-y-5 disabled:opacity-60">
              <div>
                <label htmlFor="topic" className="text-[13px] font-medium">
                  Topic
                </label>
                <input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={160}
                  placeholder="e.g. Trigonometric ratios"
                  className="mt-1.5 h-11 w-full rounded-xl border border-line-2 bg-surface px-3.5 text-[15px] outline-none placeholder:text-ink-3 focus:border-ink-3"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.topic}
                      type="button"
                      onClick={() => {
                        setTopic(ex.topic);
                        setLevel(ex.level);
                        setAudience(ex.audience);
                      }}
                      className="pressable rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 hover:border-ink-3 hover:text-ink"
                    >
                      {ex.topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[13px] font-medium">Level</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2 p-1">
                    {(["school", "college", "general"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLevel(l)}
                        aria-pressed={level === l}
                        className={clsx("pressable rounded-lg py-1.5 text-[13px] capitalize", level === l ? "bg-surface text-ink shadow-soft" : "text-ink-3")}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="audience" className="text-[13px] font-medium">
                    Class / programme <span className="font-normal text-ink-3">(optional)</span>
                  </label>
                  <input
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. CBSE Class 10"
                    className="mt-1.5 h-10 w-full rounded-xl border border-line-2 bg-surface px-3 text-[14px] outline-none placeholder:text-ink-3 focus:border-ink-3"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="language" className="text-[13px] font-medium">
                  Language of questions & lessons
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-line-2 bg-surface px-3 text-[14px] outline-none focus:border-ink-3"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.native} {l.code !== "en" ? `(${l.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="syllabus" className="text-[13px] font-medium">
                    Syllabus or notes <span className="font-normal text-ink-3">(optional)</span>
                  </label>
                  <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink">
                    <FileUp className="size-3.5" /> Upload .txt / .md
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.markdown,text/plain,text/markdown"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setSyllabus((await f.text()).slice(0, 12000));
                      e.target.value = "";
                    }}
                  />
                </div>
                <textarea
                  id="syllabus"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value.slice(0, 12000))}
                  rows={6}
                  placeholder="Paste unit outlines, learning outcomes or chapter headings. Rootwise will anchor the map to them."
                  className="mt-1.5 w-full resize-y rounded-xl border border-line-2 bg-surface px-3.5 py-2.5 text-[14px] leading-relaxed outline-none placeholder:text-ink-3 focus:border-ink-3"
                />
                <p className="mt-1 text-right font-mono text-[11px] text-ink-3">{syllabus.length.toLocaleString()} / 12,000</p>
              </div>
            </fieldset>

            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              {busy ? <Spinner /> : <Wand2 className="size-4" />} {busy ? "Building your course…" : "Build course"}
            </Button>
          </form>
        </Card>

        <div className="min-w-0">
          {phase === "form" ? (
            <Card className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <Sparkles className="size-7 text-ink-3" aria-hidden />
              <p className="mt-4 font-serif text-[26px] leading-tight">Your prerequisite map will appear here</p>
              <p className="mt-2 max-w-sm text-[14px] text-ink-2">
                Usually 10–14 concepts, from forgotten foundations to the goal skills, with 3–4 diagnostic questions each.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <ol className="grid gap-px border-b border-line bg-line sm:grid-cols-3">
                {[
                  { k: "graph", label: "Mapping prerequisites", sub: graph ? `${graph.concepts.length} concepts · ${graph.misconceptions.length} misconceptions` : "Finding the hidden foundations" },
                  { k: "questions", label: "Writing questions", sub: batches.total ? `${batches.questions} questions · batch ${batches.done}/${batches.total}` : "Misconception-tagged MCQs" },
                  { k: "checking", label: "Validating", sub: course ? `${buildKst(course)?.states.length ?? "–"} knowledge states` : "Answer keys, cycles, coverage" },
                ].map((s, i) => {
                  const order = ["graph", "questions", "checking", "ready"];
                  const cur = phase === "error" ? -1 : order.indexOf(phase);
                  const state = cur > i ? "done" : cur === i ? "active" : "todo";
                  return (
                    <li key={s.k} className="flex items-start gap-3 bg-surface px-4 py-3">
                      <span
                        className={clsx(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                          state === "done" ? "bg-good text-white" : state === "active" ? "bg-accent-soft text-accent" : "bg-surface-2 text-ink-3",
                        )}
                      >
                        {state === "done" ? <Check className="size-3" /> : state === "active" ? <Spinner className="size-3" /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">{s.label}</span>
                        <span className="block truncate text-[11.5px] text-ink-3">{s.sub}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              {phase === "questions" && batches.total > 0 && <Meter value={batches.done / batches.total} className="rounded-none" label="Question generation" />}
              <div className="grain min-h-[360px] p-3 sm:p-5">
                {draftCourse ? (
                  <KnowledgeGraph
                    course={draftCourse}
                    appearing
                    label={`Generated prerequisite map for ${draftCourse.title}`}
                  />
                ) : phase === "error" ? null : (
                  <div className="flex h-[340px] flex-col items-center justify-center gap-3 text-ink-3">
                    <Spinner className="size-6" />
                    <p className="text-[13px]">Thinking about what students need to know first… {elapsed}s</p>
                  </div>
                )}
                {phase === "error" && (
                  <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
                    <p className="font-medium text-bad-ink">Something went wrong</p>
                    <p className="max-w-md text-[14px] text-ink-2">{error}</p>
                    <Button variant="secondary" onClick={() => void generate()}>
                      Try again
                    </Button>
                  </div>
                )}
              </div>
              {phase === "ready" && course && (
                <div className="enter flex flex-col gap-3 border-t border-line p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-serif text-[24px] leading-tight">{course.title} is ready.</p>
                    <p className="text-[13px] text-ink-2">
                      {course.concepts.length} concepts · {course.questions.length} questions · built in {elapsed}s
                    </p>
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <ButtonLink href={`/courses/${course.id}`} variant="secondary">
                      View map
                    </ButtonLink>
                    <Button onClick={() => router.push(`/courses/${course.id}/diagnose`)}>
                      Start diagnostic <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
