import { describe, expect, it } from "vitest";
import { quadratics } from "../src/content/quadratics";
import { ancestors, buildGraph } from "../src/lib/engine/graph";
import { buildPlan, toICS, type Mastery } from "../src/lib/engine/plan";

const g = buildGraph(quadratics.concepts);
// Knows the foundations, has a root gap at factor-pairs.
const mastery: Mastery = Object.fromEntries(
  quadratics.concepts.map((c) => [c.id, ["integers", "squares", "expand", "linear", "zero-product"].includes(c.id) ? { p: 0.95, status: "mastered" as const } : c.id === "factor-pairs" ? { p: 0.1, status: "gap" as const } : { p: 0.4, status: "shaky" as const }]),
);

describe("pace setter", () => {
  it("fits the budget, skips known concepts and keeps prerequisites first", () => {
    for (const budget of [30, 60, 120, 240, 600]) {
      for (const mode of ["exam", "mastery"] as const) {
        const plan = buildPlan(quadratics, mastery, { budgetMinutes: budget, mode, sessionMinutes: 45, pace: 1 });
        const end = plan.blocks.reduce((a, b) => Math.max(a, b.start + b.minutes), 0);
        expect(end).toBeLessThanOrEqual(budget);
        expect(plan.chosen.some((id) => mastery[id].status === "mastered")).toBe(false);
        plan.chosen.forEach((id, i) => {
          for (const a of ancestors(g, id).keys()) {
            if (mastery[a].status === "mastered") continue;
            expect(plan.chosen.indexOf(a)).toBeGreaterThanOrEqual(0);
            expect(plan.chosen.indexOf(a)).toBeLessThan(i);
          }
        });
      }
    }
  });

  it("covers everything with enough time and triages honestly without it", () => {
    const big = buildPlan(quadratics, mastery, { budgetMinutes: 1000, mode: "exam", sessionMinutes: 45, pace: 1 });
    expect(big.skipped).toHaveLength(0);
    expect(big.coverage).toBe(1);
    const small = buildPlan(quadratics, mastery, { budgetMinutes: 60, mode: "exam", sessionMinutes: 45, pace: 1 });
    expect(small.skipped.length).toBeGreaterThan(0);
    expect(small.coverage).toBeLessThan(1);
    expect(big.scratchMinutes).toBeGreaterThan(big.neededMinutes);
  });

  it("mastery mode starts with the root gap", () => {
    const plan = buildPlan(quadratics, mastery, { budgetMinutes: 120, mode: "mastery", sessionMinutes: 45, pace: 1 });
    expect(plan.chosen[0]).toBe("factor-pairs");
  });

  it("exports a valid calendar", () => {
    const plan = buildPlan(quadratics, mastery, { budgetMinutes: 120, mode: "exam", sessionMinutes: 25, pace: 1 });
    const ics = toICS(plan, new Date(2026, 8, 25, 19, 0), (b) => b.kind);
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART:20260925T190000");
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(plan.blocks.filter((b) => b.kind !== "break").length);
  });
});
