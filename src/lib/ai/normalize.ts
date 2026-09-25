import { z } from "zod";
import { breakCycles, buildGraph, sinks } from "../engine/graph";
import {
  LessonSchema,
  type Concept,
  type Lesson,
  type Misconception,
  type Question,
  type TeachBackResult,
} from "../schema";

/**
 * Model output is untrusted: these functions coerce it into valid domain
 * objects, repairing what can be repaired (ids, dangling references, cycles,
 * option order) and dropping what can't.
 */

export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Model returned invalid JSON");
  }
}

export function slug(s: string, fallback = "item"): string {
  const out = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return out || fallback;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Deterministic string hash (FNV-1a) — used for stable option shuffles. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratedGraph {
  title: string;
  subject: string;
  description: string;
  concepts: Concept[];
  misconceptions: Misconception[];
  targetConceptIds: string[];
}

export function normalizeGraph(raw: unknown, fallbackTitle: string): GeneratedGraph {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawConcepts = arr(o.concepts).slice(0, 18) as Record<string, unknown>[];

  // 1. ids: slugged, unique; remember name → id for fuzzy references.
  const byKey = new Map<string, string>();
  const used = new Set<string>();
  const drafts = rawConcepts
    .map((c, i) => {
      const name = str(c.name, 80);
      if (!name) return null;
      let id = slug(str(c.id, 64) || name, `concept-${i + 1}`);
      while (used.has(id)) id = `${id}-${i + 1}`;
      used.add(id);
      for (const key of [str(c.id, 64), name]) if (key) byKey.set(key.toLowerCase(), id);
      byKey.set(id, id);
      return { raw: c, id, name };
    })
    .filter((d): d is NonNullable<typeof d> => !!d);

  const resolve = (ref: unknown): string | undefined => {
    const r = str(ref, 80).toLowerCase();
    return r ? (byKey.get(r) ?? byKey.get(slug(r))) : undefined;
  };

  let concepts: Concept[] = drafts.map((d) => ({
    id: d.id,
    name: d.name,
    summary: str(d.raw.summary, 240) || d.name,
    prerequisites: [...new Set(arr(d.raw.prerequisites).map(resolve).filter((x): x is string => !!x && x !== d.id))].slice(0, 6),
  }));
  if (concepts.length < 2) throw new Error("The model returned too few concepts");

  // 2. acyclic
  concepts = breakCycles(concepts).concepts;

  // 3. misconceptions
  const misUsed = new Set<string>();
  const misconceptions: Misconception[] = [];
  for (const [i, m] of (arr(o.misconceptions) as Record<string, unknown>[]).entries()) {
    const conceptId = resolve(m.conceptId) ?? resolve(m.concept);
    const label = str(m.label, 140);
    if (!conceptId || !label) continue;
    let id = slug(str(m.id, 64) || `${conceptId}-${label}`, `m-${i + 1}`).slice(0, 60);
    while (misUsed.has(id)) id = `${id}-${i}`;
    misUsed.add(id);
    misconceptions.push({ id, conceptId, label, explanation: str(m.explanation, 700) || label });
  }

  // 4. targets: requested ones that exist, else the sinks of the graph.
  const g = buildGraph(concepts);
  let targets = [...new Set(arr(o.targetConceptIds).map(resolve).filter((x): x is string => !!x))];
  const sinkIds = sinks(g);
  targets = targets.filter((t) => sinkIds.includes(t));
  if (!targets.length) targets = sinkIds.slice(0, 3);

  return {
    title: str(o.title, 120) || fallbackTitle,
    subject: str(o.subject, 80) || "General",
    description: str(o.description, 600),
    concepts,
    misconceptions,
    targetConceptIds: targets,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Questions
// ─────────────────────────────────────────────────────────────────────────────

const LETTERS = ["a", "b", "c", "d", "e"];

export function normalizeQuestions(
  raw: unknown,
  conceptIds: string[],
  misconceptionIds: string[],
  idPrefix: string,
): Question[] {
  const o = (raw ?? {}) as Record<string, unknown>;
  const valid = new Set(conceptIds);
  const mis = new Set(misconceptionIds);
  const out: Question[] = [];
  const seenStems = new Set<string>();

  for (const [i, q] of (arr(o.questions) as Record<string, unknown>[]).entries()) {
    const conceptId = str(q.conceptId, 64);
    const stem = str(q.stem, 900);
    if (!valid.has(conceptId) || !stem || seenStems.has(stem.toLowerCase())) continue;

    const rawOpts = arr(q.options).slice(0, 5) as unknown[];
    const opts = rawOpts
      .map((op) =>
        typeof op === "string"
          ? { text: op.trim().slice(0, 300), misconceptionId: undefined as string | undefined }
          : {
              text: str((op as Record<string, unknown>)?.text, 300),
              misconceptionId: str((op as Record<string, unknown>)?.misconceptionId, 64) || undefined,
            },
      )
      .map((op) => ({ ...op, text: op.text.replace(/^\(?[A-Ea-e][).:]\s+/, "") }));
    let correctIndex = typeof q.correctIndex === "number" ? Math.trunc(q.correctIndex) : -1;
    if (correctIndex < 0 && typeof q.correctOptionId === "string") correctIndex = LETTERS.indexOf(q.correctOptionId.toLowerCase());
    if (opts.length < 3 || correctIndex < 0 || correctIndex >= opts.length) continue;
    if (opts.some((op) => !op.text)) continue;
    if (new Set(opts.map((op) => op.text.toLowerCase())).size !== opts.length) continue;

    // Shuffle deterministically so the correct answer isn't always "A".
    const order = opts.map((_, k) => k);
    let seed = hash(stem);
    for (let k = order.length - 1; k > 0; k--) {
      seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) >>> 0;
      const j = seed % (k + 1);
      [order[k], order[j]] = [order[j], order[k]];
    }
    const shuffled = order.map((k) => ({ ...opts[k], isCorrect: k === correctIndex }));

    const d = Number(q.difficulty);
    const difficulty = (d === 1 || d === 2 || d === 3 ? d : 2) as 1 | 2 | 3;
    seenStems.add(stem.toLowerCase());
    out.push({
      id: `${idPrefix}-${conceptId}-${i + 1}-${(hash(stem) % 46656).toString(36)}`,
      conceptId,
      difficulty,
      stem,
      options: shuffled.map((op, k) => ({
        id: LETTERS[k],
        text: op.text,
        ...(!op.isCorrect && op.misconceptionId && mis.has(op.misconceptionId) ? { misconceptionId: op.misconceptionId } : {}),
      })),
      correctOptionId: LETTERS[shuffled.findIndex((op) => op.isCorrect)],
      explanation: str(q.explanation, 900) || "Review the lesson for this concept.",
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lessons & teach-back
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeLesson(raw: unknown): Lesson {
  const o = (raw ?? {}) as Record<string, unknown>;
  const ex = (o.example ?? {}) as Record<string, unknown>;
  const candidate = {
    lesson: str(o.lesson, 1600),
    keyIdeas: arr(o.keyIdeas).map((k) => str(k, 240)).filter(Boolean).slice(0, 5),
    example: {
      problem: str(ex.problem, 600),
      steps: arr(ex.steps).map((k) => str(k, 400)).filter(Boolean).slice(0, 8),
    },
    socratic: arr(o.socratic).map((k) => str(k, 300)).filter(Boolean).slice(0, 4),
  };
  return LessonSchema.parse(candidate);
}

const clamp100 = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : 0;
};

export function scoreTeachBack(accuracy: number, completeness: number, clarity: number) {
  const score = Math.round(0.45 * accuracy + 0.35 * completeness + 0.2 * clarity);
  const verdict: TeachBackResult["verdict"] =
    score >= 80 && accuracy >= 75 ? "mastered" : score >= 55 ? "almost" : "needs-work";
  return { score, verdict };
}

export function normalizeTeachBack(
  raw: unknown,
  keyIdeas: string[],
  misconceptions: { id: string; label: string }[],
): TeachBackResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const toIdea = (v: unknown) => {
    if (typeof v === "number") return keyIdeas[v];
    const s = str(v, 240);
    const n = Number(s);
    return Number.isInteger(n) && keyIdeas[n] ? keyIdeas[n] : s;
  };
  const covered = [...new Set(arr(o.coveredIdeas).map(toIdea).filter(Boolean))].slice(0, 6) as string[];
  const missing = [...new Set(arr(o.missingIdeas).map(toIdea).filter((x) => x && !covered.includes(x as string)))].slice(0, 6) as string[];
  const mis = arr(o.misconceptions)
    .map((m) => {
      const s = str(m, 200);
      return misconceptions.find((x) => x.id === s)?.label ?? s;
    })
    .filter(Boolean)
    .slice(0, 4);
  const accuracy = clamp100(o.accuracy);
  const completeness = clamp100(o.completeness);
  const clarity = clamp100(o.clarity);
  return {
    accuracy,
    completeness,
    clarity,
    ...scoreTeachBack(accuracy, completeness, clarity),
    coveredIdeas: covered,
    missingIdeas: missing,
    misconceptions: mis,
    strength: str(o.strength, 400),
    followUp: str(o.followUp, 400),
  };
}

export const TopicSchema = z.string().trim().min(2).max(160);
