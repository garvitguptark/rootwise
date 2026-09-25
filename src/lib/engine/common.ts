import type { Course, Question } from "../schema";
import { buildGraph, type ConceptGraph } from "./graph";
import { DEFAULT_CONFIG, type DiagnosticState, type EngineConfig } from "./types";

export type Ctx = { course: Course; g: ConceptGraph; name: (id: string) => string };

const ctxCache = new WeakMap<Course, Ctx>();

/** Graph + name lookup for a course, memoised per course object. */
export function ctx(course: Course): Ctx {
  let c = ctxCache.get(course);
  if (!c) {
    const g = buildGraph(course.concepts);
    c = { course, g, name: (id) => g.byId.get(id)?.name ?? id };
    ctxCache.set(course, c);
  }
  return c;
}

export const pct = (p: number) => `${Math.round(p * 100)}%`;

export const list = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

export function usedQuestionIds(state: DiagnosticState): Set<string> {
  return new Set(state.attempts.map((a) => a.questionId));
}

export function defaultBudget(course: Course, cfg: EngineConfig = DEFAULT_CONFIG): number {
  return Math.min(24, Math.max(8, Math.ceil(course.concepts.length * cfg.budgetPerConcept)));
}

/**
 * Picks an unused question for a concept, matching difficulty to the current
 * belief: easy when the student is probably struggling, hard when they
 * probably know it (hard questions are less guessable, so they discriminate
 * better at the top end).
 */
export function pickQuestion(
  course: Course,
  conceptId: string,
  p: number,
  used: Set<string>,
  opts: { preferEasy?: boolean } = {},
): Question | undefined {
  const pool = course.questions.filter((q) => q.conceptId === conceptId && !used.has(q.id));
  if (!pool.length) return undefined;
  const target = opts.preferEasy ? 1 : p < 0.35 ? 1 : p > 0.65 ? 3 : 2;
  return [...pool].sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target))[0];
}
