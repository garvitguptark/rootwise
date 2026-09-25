import type { Course } from "../schema";
import { ancestors, buildGraph, descendants, topoSort } from "./graph";
import type { ConceptStatus } from "./types";

/**
 * Pace setter: turns "I have N hours" into a study plan.
 *
 * Every concept the student doesn't know yet costs minutes and is worth
 * value (exam weightage, or foundational impact in mastery mode). Learning a
 * concept requires its unknown prerequisites, so we pick greedy "bundles"
 * (concept + missing prerequisites) by value per minute until the time runs
 * out — a precedence-constrained knapsack heuristic — then order the picks
 * prerequisites-first and slice them into focus blocks with breaks.
 */

export type PlanMode = "exam" | "mastery";
export type Mastery = Record<string, { p: number; status: ConceptStatus; verdict?: string }>;

export interface PlanSettings {
  budgetMinutes: number;
  mode: PlanMode;
  /** Focus block length before a 5-minute break. */
  sessionMinutes: number;
  /** >1 means slower than the default estimates (learned from actual block times). */
  pace: number;
}

export interface PlanBlock {
  id: string;
  kind: "learn" | "practice" | "review" | "break";
  conceptId?: string;
  minutes: number;
  /** minutes from the plan start */
  start: number;
}

export interface Plan {
  blocks: PlanBlock[];
  chosen: string[];
  skipped: { conceptId: string; minutes: number; weight: number }[];
  known: string[];
  /** share of the course value (weightage or concepts) ready after the plan */
  coverage: number;
  /** study minutes to learn everything not yet known */
  neededMinutes: number;
  /** study minutes a student who knew nothing would need */
  scratchMinutes: number;
  plannedMinutes: number;
  spareMinutes: number;
}

const BASE: Record<Course["level"], number> = { school: 20, college: 30, general: 25 };
const BREAK = 5;

export const weightOf = (course: Course, id: string) =>
  course.concepts.find((c) => c.id === id)?.weight ?? (course.targetConceptIds.includes(id) ? 3 : 1);

/** Minutes to learn (and practise) one concept given how well it is known. */
export function estimateMinutes(course: Course, m: Mastery[string] | undefined, pace = 1): number {
  if (m?.status === "mastered") return 0;
  const base = BASE[course.level] ?? 25;
  const known = m ? Math.min(m.p, 0.65) : 0;
  return Math.max(10, Math.round((base * (1 - known) * pace) / 5) * 5);
}

export function buildPlan(course: Course, mastery: Mastery | undefined, s: PlanSettings): Plan {
  const g = buildGraph(course.concepts);
  const cost = new Map(g.ids.map((id) => [id, estimateMinutes(course, mastery?.[id], s.pace)]));
  const need = g.ids.filter((id) => cost.get(id)! > 0);
  const known = g.ids.filter((id) => cost.get(id) === 0);
  const impact = new Map(g.ids.map((id) => [id, descendants(g, id).size]));
  const value = (id: string) => (s.mode === "exam" ? weightOf(course, id) : 1 + impact.get(id)!);

  // Breaks come out of the same hours; keep ~10% for a closing review when there's room.
  const withBreaks = Math.floor((s.budgetMinutes * s.sessionMinutes) / (s.sessionMinutes + BREAK));
  const reviewMin = s.budgetMinutes >= 90 ? Math.max(10, Math.round((withBreaks * 0.1) / 5) * 5) : 0;
  let left = withBreaks - reviewMin;

  const chosen = new Set<string>();
  for (;;) {
    let best: { ids: string[]; cost: number; ratio: number } | null = null;
    for (const id of need) {
      if (chosen.has(id)) continue;
      const ids = [id, ...[...ancestors(g, id).keys()].filter((a) => cost.get(a)! > 0 && !chosen.has(a))];
      const c = ids.reduce((t, x) => t + cost.get(x)!, 0);
      if (c > left) continue;
      const ratio = ids.reduce((t, x) => t + value(x), 0) / c;
      if (!best || ratio > best.ratio + 1e-9 || (Math.abs(ratio - best.ratio) < 1e-9 && c < best.cost)) best = { ids, cost: c, ratio };
    }
    if (!best) break;
    best.ids.forEach((x) => chosen.add(x));
    left -= best.cost;
  }

  // Prerequisites first; among ready concepts, root gaps, then whatever unlocks the most.
  const order = topoSort(g, (id) => (mastery?.[id]?.status === "gap" ? -1000 : 0) - impact.get(id)!).filter((id) => chosen.has(id));
  const blocks: PlanBlock[] = [];
  let t = 0;
  let focus = 0;
  const push = (b: Omit<PlanBlock, "id" | "start">) => {
    if (b.kind !== "break" && focus > 0 && focus + b.minutes > s.sessionMinutes) {
      blocks.push({ id: `break-${blocks.length}`, kind: "break", minutes: BREAK, start: t });
      t += BREAK;
      focus = 0;
    }
    blocks.push({ ...b, id: `${b.kind}-${b.conceptId ?? blocks.length}`, start: t });
    t += b.minutes;
    focus += b.minutes;
  };
  for (const id of order) {
    const total = cost.get(id)!;
    const practice = Math.max(5, Math.round((total * 0.35) / 5) * 5);
    push({ kind: "learn", conceptId: id, minutes: total - practice });
    push({ kind: "practice", conceptId: id, minutes: practice });
  }
  if (order.length && reviewMin) push({ kind: "review", minutes: reviewMin });

  const totalValue = g.ids.reduce((a, id) => a + (s.mode === "exam" ? weightOf(course, id) : 1), 0);
  const readyValue = [...known, ...order].reduce((a, id) => a + (s.mode === "exam" ? weightOf(course, id) : 1), 0);
  const plannedMinutes = blocks.filter((b) => b.kind !== "break").reduce((a, b) => a + b.minutes, 0);
  const neededMinutes = need.reduce((a, id) => a + cost.get(id)!, 0);

  return {
    blocks,
    chosen: order,
    skipped: need.filter((id) => !chosen.has(id)).map((id) => ({ conceptId: id, minutes: cost.get(id)!, weight: weightOf(course, id) })),
    known,
    coverage: totalValue ? readyValue / totalValue : 1,
    neededMinutes,
    scratchMinutes: g.ids.reduce((a) => a + estimateMinutes(course, undefined, s.pace), 0),
    plannedMinutes,
    spareMinutes: Math.max(0, s.budgetMinutes - t),
  };
}

export const fmtMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`;
};

/** iCalendar export with floating local times, one event per non-break block. */
export function toICS(plan: Plan, start: Date, label: (b: PlanBlock) => string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp = fmt(new Date());
  const events = plan.blocks
    .filter((b) => b.kind !== "break")
    .map((b, i) => {
      const s = new Date(start.getTime() + b.start * 60000);
      const e = new Date(s.getTime() + b.minutes * 60000);
      return ["BEGIN:VEVENT", `UID:rootwise-${stamp}-${i}@rootwise`, `DTSTAMP:${stamp}`, `DTSTART:${fmt(s)}`, `DTEND:${fmt(e)}`, `SUMMARY:${label(b).replace(/[,;\\]/g, " ")}`, "END:VEVENT"].join("\r\n");
    });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rootwise//Pace setter//EN", ...events, "END:VCALENDAR", ""].join("\r\n");
}
