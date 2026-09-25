"use client";

import clsx from "clsx";
import { AlertTriangle, Check, MessageCircleQuestion, Mic, MicOff, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useDictation, useSpeechSupport } from "@/hooks/useSpeech";
import { postJson } from "@/lib/client";
import type { ConceptWithLesson, Course, Misconception, TeachBackRequest, TeachBackResult } from "@/lib/schema";
import { useApp, type TeachBackAttempt } from "@/store/app";
import { Badge, Button, Meter, Spinner } from "../ui";

function ScoreRing({ score, verdict }: { score: number; verdict: TeachBackResult["verdict"] }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const color = verdict === "mastered" ? "var(--good)" : verdict === "almost" ? "var(--warn)" : "var(--bad)";
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 900ms var(--ease-out)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[24px] font-semibold leading-none">{score}</span>
        <span className="text-[10.5px] text-ink-3">/ 100</span>
      </div>
    </div>
  );
}

const VERDICT = {
  mastered: { label: "You can teach this.", tone: "good" as const },
  almost: { label: "Nearly there.", tone: "warn" as const },
  "needs-work": { label: "Not quite yet.", tone: "bad" as const },
};

export function TeachBack({
  course,
  concept,
  misconceptions,
  language,
  onAskTutor,
}: {
  course: Course;
  concept: ConceptWithLesson;
  misconceptions: Misconception[];
  language: TeachBackRequest["language"];
  onAskTutor: (text: string) => void;
}) {
  const history = useApp((s) => s.teachbacks[`${course.id}:${concept.id}`]);
  const recordTeachBack = useApp((s) => s.recordTeachBack);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest: TeachBackAttempt | undefined = history?.[0];
  const [showResult, setShowResult] = useState(!!latest);
  const { stt } = useSpeechSupport();
  const dictation = useDictation(language, (t) => setText((v) => (v ? `${v} ${t}` : t)));
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function submit() {
    if (!text.trim()) return;
    dictation.stop();
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<TeachBackResult & { mode?: "ai" | "offline" }>("/api/teachback", {
        language,
        level: course.level,
        concept: { name: concept.name, lesson: concept.lesson, keyIdeas: concept.keyIdeas },
        misconceptions: misconceptions.map((m) => ({ id: m.id, label: m.label })).slice(0, 12),
        explanation: text.trim(),
      } satisfies TeachBackRequest);
      recordTeachBack(course.id, concept.id, { at: new Date().toISOString(), explanation: text.trim(), result });
      setShowResult(true);
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (showResult && latest) {
    const r = latest.result;
    const v = VERDICT[r.verdict];
    return (
      <div className="enter p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <ScoreRing score={r.score} verdict={r.verdict} />
          <div className="min-w-0">
            <Badge tone={v.tone}>{r.verdict === "mastered" ? "Mastery evidence recorded" : r.verdict === "almost" ? "Almost" : "Needs work"}</Badge>
            <p className="mt-2 font-serif text-[26px] leading-tight">{v.label}</p>
            {r.mode === "offline" && <p className="mt-1 text-[12px] text-ink-3">Offline estimate (keyword-based). Add an AI key for full grading.</p>}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["Accuracy", r.accuracy],
              ["Completeness", r.completeness],
              ["Clarity", r.clarity],
            ] as const
          ).map(([k, val]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-[12px] text-ink-2">
                <span>{k}</span>
                <span className="font-mono">{val}</span>
              </div>
              <Meter value={val / 100} tone={val >= 75 ? "good" : val >= 50 ? "warn" : "bad"} label={k} />
            </div>
          ))}
        </div>

        {r.strength && (
          <p className="mt-6 flex gap-2 text-[14.5px] leading-relaxed">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-good-ink" aria-hidden /> {r.strength}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[12.5px] font-semibold text-good-ink">What you nailed</p>
            <ul className="mt-2 space-y-1.5">
              {r.coveredIdeas.length ? (
                r.coveredIdeas.map((k) => (
                  <li key={k} className="flex gap-2 text-[13.5px] text-ink-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-good" aria-hidden /> {k}
                  </li>
                ))
              ) : (
                <li className="text-[13px] text-ink-3">No key ideas yet — that&rsquo;s okay.</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-bad-ink">What&rsquo;s missing</p>
            <ul className="mt-2 space-y-1.5">
              {r.missingIdeas.length ? (
                r.missingIdeas.map((k) => (
                  <li key={k} className="flex gap-2 text-[13.5px] text-ink-2">
                    <X className="mt-0.5 size-3.5 shrink-0 text-bad" aria-hidden /> {k}
                  </li>
                ))
              ) : (
                <li className="text-[13px] text-ink-3">Nothing — complete coverage.</li>
              )}
            </ul>
          </div>
        </div>

        {r.misconceptions.length > 0 && (
          <div className="mt-5 rounded-xl border border-warn/40 bg-warn-soft/60 p-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-warn-ink">
              <AlertTriangle className="size-4" aria-hidden /> Watch out
            </p>
            <ul className="mt-1.5 list-disc pl-9 text-[13.5px] text-ink-2">
              {r.misconceptions.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {r.followUp && (
          <div className="mt-5 rounded-xl bg-surface-2 p-4">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-2">
              <MessageCircleQuestion className="size-4" aria-hidden /> Think about this next
            </p>
            <p className="mt-1.5 text-[14.5px]">{r.followUp}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => onAskTutor(`About your question — "${r.followUp}" — here's what I think: `)}>
              Discuss with the tutor
            </Button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowResult(false)}>Try again</Button>
          {history && history.length > 1 && (
            <p className="text-[12px] text-ink-3">
              Previous scores: {history.slice(1, 6).map((h) => h.result.score).join(" · ")}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6">
      <p className="font-serif text-[26px] leading-tight">Teach it back</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
        Explain <strong className="font-semibold text-ink">{concept.name}</strong> to a friend who missed the class — in your own words, in any
        language. Use an example. If you can teach it, you&rsquo;ve learnt it.
      </p>
      <div className="mt-4 rounded-2xl border border-line-2 bg-surface focus-within:border-ink-3">
        <textarea
          value={dictation.listening && dictation.interim ? `${text} ${dictation.interim}`.trim() : text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={dictation.listening ? "Listening… speak naturally" : "Start with the big idea, then give an example…"}
          aria-label="Your explanation"
          className="block w-full resize-y rounded-2xl bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-ink-3 focus-visible:outline-none"
        />
        <div className="flex items-center gap-2 border-t border-line px-3 py-2">
          {stt && (
            <button
              type="button"
              onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
              className={clsx(
                "pressable inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-medium",
                dictation.listening ? "bg-bad text-white" : "bg-surface-2 text-ink-2 hover:text-ink",
              )}
              aria-pressed={dictation.listening}
            >
              {dictation.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              {dictation.listening ? "Stop" : "Explain out loud"}
            </button>
          )}
          <span className="ml-auto font-mono text-[11.5px] text-ink-3">{words} words</span>
        </div>
      </div>
      {dictation.error && <p className="mt-2 text-[12.5px] text-bad-ink">{dictation.error}</p>}
      {error && (
        <p className="mt-3 rounded-xl border border-bad/30 bg-bad-soft px-3 py-2 text-[13px] text-bad-ink" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <Button size="lg" onClick={submit} disabled={loading || words < 3}>
          {loading ? <Spinner /> : null} {loading ? "Reading your explanation…" : "Get feedback"}
        </Button>
        {latest && (
          <button type="button" className="text-[13px] text-ink-3 hover:text-ink" onClick={() => setShowResult(true)}>
            See last result ({latest.result.score})
          </button>
        )}
      </div>
    </div>
  );
}
