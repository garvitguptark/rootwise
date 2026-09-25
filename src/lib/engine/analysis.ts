import type { Course, Misconception } from "../schema";
import type { ConceptStatus, DiagnosticState } from "./types";
import { buildGraph, descendants, topoSort } from "./graph";

export interface RootGap {
  conceptId: string;
  /** Concepts that transitively depend on this one. */
  unlocks: string[];
  confidence: "high" | "medium";
  p: number;
}

export interface MisconceptionHit {
  misconception: Misconception;
  count: number;
  /** picked while the student was NOT guessing → a confidently held wrong idea */
  confident: number;
}

export interface DiagnosticReport {
  rootGaps: RootGap[];
  blocked: string[];
  shaky: string[];
  mastered: { direct: string[]; inferred: string[] };
  unassessed: string[];
  misconceptions: MisconceptionHit[];
  stats: {
    questions: number;
    correct: number;
    accuracy: number;
    durationMs: number;
    conceptsCovered: number;
    conceptsTotal: number;
    /** Questions a conventional "test every concept" quiz would have needed. */
    fullTestQuestions: number;
  };
}

export function analyze(state: DiagnosticState, course: Course): DiagnosticReport {
  const g = buildGraph(course.concepts);
  const rootGaps: RootGap[] = [];
  const blocked: string[] = [];
  const shaky: string[] = [];
  const direct: string[] = [];
  const inferred: string[] = [];
  const unassessed: string[] = [];

  for (const id of g.ids) {
    const cs = state.concepts[id];
    if (cs.status === "gap") {
      if (cs.verdict === "blocked") blocked.push(id);
      else
        rootGaps.push({
          conceptId: id,
          unlocks: [...descendants(g, id).keys()],
          confidence: cs.asked >= 2 && cs.p <= 0.2 ? "high" : "medium",
          p: cs.p,
        });
    } else if (cs.status === "shaky") shaky.push(id);
    else if (cs.status === "mastered") (cs.evidence === "direct" ? direct : inferred).push(id);
    else unassessed.push(id);
  }
  rootGaps.sort((a, b) => b.unlocks.length - a.unlocks.length);

  const hits = new Map<string, MisconceptionHit>();
  for (const a of state.attempts) {
    if (!a.misconceptionId) continue;
    const m = course.misconceptions.find((x) => x.id === a.misconceptionId);
    if (!m) continue;
    const h = hits.get(m.id) ?? { misconception: m, count: 0, confident: 0 };
    h.count += 1;
    if (!a.guessing) h.confident += 1;
    hits.set(m.id, h);
  }

  const correct = state.attempts.filter((a) => a.correct).length;
  const started = Date.parse(state.startedAt);
  const ended = state.finishedAt ? Date.parse(state.finishedAt) : Date.now();
  const covered = g.ids.filter((id) => state.concepts[id].status !== "unknown").length;

  return {
    rootGaps,
    blocked,
    shaky,
    mastered: { direct, inferred },
    unassessed,
    misconceptions: [...hits.values()].sort((a, b) => b.confident - a.confident || b.count - a.count),
    stats: {
      questions: state.attempts.length,
      correct,
      accuracy: state.attempts.length ? correct / state.attempts.length : 0,
      durationMs: Math.max(0, ended - started),
      conceptsCovered: covered,
      conceptsTotal: g.ids.length,
      fullTestQuestions: g.ids.length * 2,
    },
  };
}

export type StepKind = "root" | "blocked" | "shaky" | "unassessed";

export interface PathStep {
  conceptId: string;
  kind: StepKind;
  p: number;
  minutes: number;
}

/**
 * Personal study path: every concept that isn't mastered, ordered so that
 * prerequisites always come first (topological order), and — among concepts
 * that are ready at the same time — the ones that unlock the most go first.
 */
export function studyPath(
  course: Course,
  mastery: Record<string, { p: number; status: ConceptStatus; verdict?: string }>,
): PathStep[] {
  const g = buildGraph(course.concepts);
  const impact = new Map(g.ids.map((id) => [id, descendants(g, id).size]));
  const order = topoSort(g, (id) => -(impact.get(id) ?? 0));
  const steps: PathStep[] = [];
  for (const id of order) {
    const m = mastery[id];
    if (!m || m.status === "mastered") continue;
    const kind: StepKind =
      m.status === "gap" ? (m.verdict === "blocked" ? "blocked" : "root") : m.status === "shaky" ? "shaky" : "unassessed";
    steps.push({ conceptId: id, kind, p: m.p, minutes: kind === "root" ? 15 : kind === "blocked" ? 10 : 8 });
  }
  return steps;
}
