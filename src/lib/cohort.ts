import { hash } from "./ai/normalize";
import { buildGraph, descendants, layers } from "./engine/graph";
import { rng, simulateDiagnostic, type SyntheticStudent } from "./engine/simulate";
import type { DiagnosticState } from "./engine/types";
import type { Course } from "./schema";

/**
 * A synthetic class for the teacher dashboard demo. Every student is run
 * through the REAL diagnostic engine; the dashboard only shows what the
 * engine found, never the hidden ground truth.
 */

const FIRST = [
  "Aarav", "Diya", "Vivaan", "Ananya", "Aditya", "Ishita", "Arjun", "Saanvi", "Kabir", "Myra", "Rohan", "Anika",
  "Reyansh", "Kavya", "Vihaan", "Aadhya", "Krish", "Meera", "Sai", "Riya", "Ayaan", "Tara", "Dhruv", "Nisha",
  "Karthik", "Pooja", "Farhan", "Sneha", "Rahul", "Zoya", "Harsh", "Lakshmi", "Nikhil", "Divya", "Yash", "Fatima",
];
const LAST = "SKPMRNDGTVBAJC";

export interface CohortStudent {
  id: string;
  name: string;
  state: DiagnosticState;
  isYou?: boolean;
}

export function simulateCohort(course: Course, size = 32): CohortStudent[] {
  const rand = rng(hash(course.id));
  const g = buildGraph(course.concepts);
  const layer = layers(g);
  // Classes share blind spots: weight early/foundational concepts higher and
  // pick one "class hotspot" that many students missed in earlier years.
  const weights = g.ids.map((id) => 1 + descendants(g, id).size * 0.25 + (layer.get(id)! <= 1 ? 1 : 0));
  const hotspot = g.ids.filter((id) => layer.get(id) === 1)[Math.floor(rand() * Math.max(1, g.ids.filter((id) => layer.get(id) === 1).length))] ?? g.ids[0];
  weights[g.ids.indexOf(hotspot)] += 6;
  const total = weights.reduce((a, b) => a + b, 0);
  const pickWeighted = () => {
    let r = rand() * total;
    for (let i = 0; i < g.ids.length; i++) {
      r -= weights[i];
      if (r <= 0) return g.ids[i];
    }
    return g.ids.at(-1)!;
  };

  const students: CohortStudent[] = [];
  for (let i = 0; i < size; i++) {
    const r = rand();
    const holes = r < 0.12 ? 0 : r < 0.72 ? 1 : 2;
    const picked = new Set<string>();
    while (picked.size < holes) picked.add(pickWeighted());
    const unknown = new Set<string>();
    for (const h of picked) {
      unknown.add(h);
      for (const d of descendants(g, h).keys()) unknown.add(d);
    }
    const student: SyntheticStudent = {
      unknown,
      trueRoots: [...unknown].filter((id) => !(g.prereqs.get(id) ?? []).some((p) => unknown.has(p))),
    };
    const state = simulateDiagnostic(course, student, rand);
    students.push({ id: `s${i}`, name: `${FIRST[i % FIRST.length]} ${LAST[Math.floor(rand() * LAST.length)]}.`, state });
  }
  return students;
}

export interface CohortSummary {
  rootCounts: { conceptId: string; students: string[] }[];
  misconceptions: { id: string; students: number }[];
  avgMastery: Record<string, number>;
  medianQuestions: number;
  withRootGap: number;
}

export function summarize(course: Course, students: CohortStudent[]): CohortSummary {
  const roots = new Map<string, string[]>();
  const mis = new Map<string, Set<string>>();
  const sums: Record<string, number> = {};
  for (const s of students) {
    for (const [id, c] of Object.entries(s.state.concepts)) {
      sums[id] = (sums[id] ?? 0) + c.p;
      if (c.status === "gap" && c.verdict === "root") roots.set(id, [...(roots.get(id) ?? []), s.id]);
    }
    for (const a of s.state.attempts) {
      if (!a.misconceptionId) continue;
      if (!mis.has(a.misconceptionId)) mis.set(a.misconceptionId, new Set());
      mis.get(a.misconceptionId)!.add(s.id);
    }
  }
  const qs = students.map((s) => s.state.attempts.length).sort((a, b) => a - b);
  return {
    rootCounts: [...roots.entries()].map(([conceptId, ss]) => ({ conceptId, students: ss })).sort((a, b) => b.students.length - a.students.length),
    misconceptions: [...mis.entries()].map(([id, set]) => ({ id, students: set.size })).sort((a, b) => b.students - a.students),
    avgMastery: Object.fromEntries(course.concepts.map((c) => [c.id, (sums[c.id] ?? 0) / Math.max(1, students.length)])),
    medianQuestions: qs.length ? qs[Math.floor(qs.length / 2)] : 0,
    withRootGap: students.filter((s) => Object.values(s.state.concepts).some((c) => c.status === "gap" && c.verdict === "root")).length,
  };
}
