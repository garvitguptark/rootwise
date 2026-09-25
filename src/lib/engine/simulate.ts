import type { Course } from "../schema";
import { answer, currentQuestion, startDiagnostic, type DiagnosticState, type EngineConfig } from "./diagnostic";
import { buildGraph, descendants } from "./graph";

/** Small, fast, seedable PRNG (mulberry32) so simulations are reproducible. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SyntheticStudent {
  /** Concepts the student truly doesn't know. */
  unknown: Set<string>;
  /** Unknown concepts none of whose prerequisites are unknown. */
  trueRoots: string[];
}

/**
 * A student with `gapCount` independent knowledge holes. Not knowing a
 * concept means not knowing anything built on it, so the unknown set is the
 * holes plus all their descendants.
 */
export function syntheticStudent(course: Course, rand: () => number, gapCount: number): SyntheticStudent {
  const g = buildGraph(course.concepts);
  const pool = [...g.ids];
  const holes: string[] = [];
  for (let i = 0; i < gapCount && pool.length; i++) {
    holes.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  const unknown = new Set<string>();
  for (const h of holes) {
    unknown.add(h);
    for (const d of descendants(g, h).keys()) unknown.add(d);
  }
  const trueRoots = [...unknown].filter((id) => !(g.prereqs.get(id) ?? []).some((p) => unknown.has(p)));
  return { unknown, trueRoots };
}

export interface SimOptions {
  slip?: number;
  /** Probability a student who doesn't know a concept marks "I'm guessing". */
  honestGuessRate?: number;
  config?: Partial<EngineConfig>;
}

/** Runs the real diagnostic engine against a simulated student. */
export function simulateDiagnostic(
  course: Course,
  student: SyntheticStudent,
  rand: () => number,
  opts: SimOptions = {},
): DiagnosticState {
  const slip = opts.slip ?? 0.1;
  const honest = opts.honestGuessRate ?? 0.3;
  let state = startDiagnostic(course, { now: "2026-01-01T00:00:00.000Z", config: opts.config });
  let guard = 0;
  while (!state.done && guard++ < 100) {
    const q = currentQuestion(state, course);
    if (!q) break;
    const knows = !student.unknown.has(q.conceptId);
    const wrongOptions = q.options.filter((o) => o.id !== q.correctOptionId);
    let optionId: string;
    let guessing = false;
    if (knows) {
      optionId = rand() < slip ? wrongOptions[Math.floor(rand() * wrongOptions.length)].id : q.correctOptionId;
    } else {
      guessing = rand() < honest;
      // Students who don't know an idea usually hold a specific wrong one:
      // favour misconception-tagged distractors.
      const tagged = wrongOptions.filter((o) => o.misconceptionId);
      const r = rand();
      if (r < 1 / q.options.length) optionId = q.correctOptionId;
      else if (tagged.length && r < 0.8) optionId = tagged[Math.floor(rand() * tagged.length)].id;
      else optionId = wrongOptions[Math.floor(rand() * wrongOptions.length)].id;
    }
    state = answer(state, course, { questionId: q.id, optionId, guessing, ms: 20000 + rand() * 40000 });
  }
  return state;
}

export interface BenchmarkResult {
  runs: number;
  rootRecall: number;
  rootPrecision: number;
  exactMatch: number;
  avgQuestions: number;
  maxQuestions: number;
  fullTestQuestions: number;
}

export function benchmark(course: Course, runs = 1000, seed = 42, opts: SimOptions = {}): BenchmarkResult {
  const rand = rng(seed);
  let tp = 0;
  let fn = 0;
  let fp = 0;
  let exact = 0;
  let totalQ = 0;
  let maxQ = 0;
  for (let i = 0; i < runs; i++) {
    const r = rand();
    const gaps = r < 0.1 ? 0 : r < 0.7 ? 1 : 2;
    const student = syntheticStudent(course, rand, gaps);
    const state = simulateDiagnostic(course, student, rand, opts);
    const found = Object.entries(state.concepts)
      .filter(([, c]) => c.status === "gap" && c.verdict === "root")
      .map(([id]) => id);
    const truth = new Set(student.trueRoots);
    const hit = found.filter((f) => truth.has(f)).length;
    tp += hit;
    fp += found.length - hit;
    fn += truth.size - hit;
    if (hit === truth.size && found.length === truth.size) exact++;
    totalQ += state.attempts.length;
    maxQ = Math.max(maxQ, state.attempts.length);
  }
  return {
    runs,
    rootRecall: tp / Math.max(1, tp + fn),
    rootPrecision: tp / Math.max(1, tp + fp),
    exactMatch: exact / runs,
    avgQuestions: totalQ / runs,
    maxQuestions: maxQ,
    fullTestQuestions: course.concepts.length * 2,
  };
}

/**
 * Baseline for comparison: a conventional fixed test that asks `perConcept`
 * questions on EVERY concept, marks a concept known when at least half of its
 * answers are correct, and calls an unknown concept a root gap when all of its
 * prerequisites were marked known.
 */
export function benchmarkFixedTest(course: Course, perConcept = 2, runs = 1000, seed = 42, slip = 0.1): BenchmarkResult {
  const rand = rng(seed);
  const g = buildGraph(course.concepts);
  let tp = 0;
  let fn = 0;
  let fp = 0;
  let exact = 0;
  for (let i = 0; i < runs; i++) {
    const r = rand();
    const gaps = r < 0.1 ? 0 : r < 0.7 ? 1 : 2;
    const student = syntheticStudent(course, rand, gaps);
    const known = new Set<string>();
    for (const id of g.ids) {
      let right = 0;
      const qs = course.questions.filter((q) => q.conceptId === id).slice(0, perConcept);
      for (const q of qs) {
        const p = student.unknown.has(id) ? 1 / q.options.length : 1 - slip;
        if (rand() < p) right++;
      }
      // Ties count as known — the more generous rule for the baseline.
      if (right * 2 >= qs.length) known.add(id);
    }
    const found = g.ids.filter((id) => !known.has(id) && (g.prereqs.get(id) ?? []).every((p) => known.has(p)));
    const truth = new Set(student.trueRoots);
    const hit = found.filter((f) => truth.has(f)).length;
    tp += hit;
    fp += found.length - hit;
    fn += truth.size - hit;
    if (hit === truth.size && found.length === truth.size) exact++;
  }
  return {
    runs,
    rootRecall: tp / Math.max(1, tp + fn),
    rootPrecision: tp / Math.max(1, tp + fp),
    exactMatch: exact / runs,
    avgQuestions: g.ids.length * perConcept,
    maxQuestions: g.ids.length * perConcept,
    fullTestQuestions: g.ids.length * perConcept,
  };
}
