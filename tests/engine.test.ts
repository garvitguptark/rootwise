import { describe, expect, it } from "vitest";
import { circuits } from "@/content/circuits";
import { builtinCourses } from "@/content";
import { quadratics } from "@/content/quadratics";
import { validateCourse } from "@/lib/course-validation";
import { analyze, studyPath } from "@/lib/engine/analysis";
import { DIAGNOSTIC_PARAMS, PRACTICE_PARAMS, entropy, posterior, update } from "@/lib/engine/bkt";
import { answer, currentQuestion, finishNow, startDiagnostic } from "@/lib/engine/diagnostic";
import { ancestors, breakCycles, buildGraph, descendants, layers, sinks, topoSort } from "@/lib/engine/graph";
import { buildKst, informationGain } from "@/lib/engine/kst";
import { benchmark, benchmarkFixedTest, rng, simulateDiagnostic, syntheticStudent } from "@/lib/engine/simulate";
import type { Course } from "@/lib/schema";

describe("built-in content", () => {
  for (const course of builtinCourses) {
    it(`${course.id} is a valid, acyclic course`, () => {
      const { problems } = validateCourse(course);
      expect(problems).toEqual([]);
    });
    it(`${course.id} tags most wrong options with a misconception`, () => {
      const wrong = course.questions.flatMap((q) => q.options.filter((o) => o.id !== q.correctOptionId));
      const tagged = wrong.filter((o) => o.misconceptionId).length;
      expect(tagged / wrong.length).toBeGreaterThan(0.6);
    });
    it(`${course.id} has at least 4 questions per concept`, () => {
      for (const c of course.concepts) {
        expect(course.questions.filter((q) => q.conceptId === c.id).length).toBeGreaterThanOrEqual(4);
      }
    });
  }
});

describe("graph", () => {
  const g = buildGraph(quadratics.concepts);
  it("finds ancestors and descendants with distances", () => {
    expect(ancestors(g, "factorise").get("integers")).toBe(2);
    expect(descendants(g, "integers").has("word-problems")).toBe(true);
    expect(descendants(g, "word-problems").size).toBe(0);
  });
  it("topologically sorts prerequisites first", () => {
    const order = topoSort(g);
    for (const c of quadratics.concepts) {
      for (const p of c.prerequisites) expect(order.indexOf(p)).toBeLessThan(order.indexOf(c.id));
    }
  });
  it("identifies sinks and layers", () => {
    expect(sinks(g).sort()).toEqual(["discriminant", "word-problems"]);
    const l = layers(g);
    expect(l.get("integers")).toBe(0);
    expect(l.get("word-problems")).toBe(5);
  });
  it("breaks cycles in generated graphs", () => {
    const concepts = quadratics.concepts.slice(0, 3).map((c) => ({ ...c, prerequisites: [] as string[] }));
    concepts[0].prerequisites = [concepts[2].id];
    concepts[1].prerequisites = [concepts[0].id];
    concepts[2].prerequisites = [concepts[1].id, "missing"];
    const { concepts: fixed, removed } = breakCycles(concepts);
    expect(removed.length).toBe(1);
    expect(() => topoSort(buildGraph(fixed))).not.toThrow();
  });
});

describe("Bayesian Knowledge Tracing", () => {
  it("raises belief after a correct answer and lowers it after a wrong one", () => {
    expect(update(0.5, true, DIAGNOSTIC_PARAMS)).toBeGreaterThan(0.5);
    expect(update(0.5, false, DIAGNOSTIC_PARAMS)).toBeLessThan(0.5);
  });
  it("matches the closed-form posterior", () => {
    const { slip, guess } = DIAGNOSTIC_PARAMS;
    expect(posterior(0.5, true, DIAGNOSTIC_PARAMS)).toBeCloseTo((0.5 * (1 - slip)) / (0.5 * (1 - slip) + 0.5 * guess));
  });
  it("applies learning (transit) in practice mode", () => {
    expect(update(0.3, false, PRACTICE_PARAMS)).toBeGreaterThan(update(0.3, false, DIAGNOSTIC_PARAMS));
  });
  it("entropy peaks at 0.5", () => {
    expect(entropy(0.5)).toBeCloseTo(1);
    expect(entropy(0.99)).toBeLessThan(0.1);
  });
});

describe("knowledge space", () => {
  it("enumerates only prerequisite-closed states", () => {
    const model = buildKst(quadratics)!;
    const g = buildGraph(quadratics.concepts);
    expect(model.states.length).toBeGreaterThan(10);
    for (const mask of model.states) {
      for (const id of g.ids) {
        if (!(mask & (1 << model.bit.get(id)!))) continue;
        for (const p of g.prereqs.get(id)!) expect(mask & (1 << model.bit.get(p)!)).toBeTruthy();
      }
    }
  });
  it("information gain is highest for uncertain concepts", () => {
    expect(informationGain(0.5, DIAGNOSTIC_PARAMS)).toBeGreaterThan(informationGain(0.95, DIAGNOSTIC_PARAMS));
  });
  it("falls back to the DFS engine for very wide graphs", () => {
    const wide: Course = {
      ...quadratics,
      id: "wide",
      concepts: quadratics.concepts.map((c) => ({ ...c, prerequisites: [] })),
    };
    const s = startDiagnostic(wide, { config: { maxStates: 100 } });
    expect(s.engine).toBe("dfs");
    expect(currentQuestion(s, wide)).toBeDefined();
  });
});

function runStudent(course: Course, unknown: Set<string>) {
  let s = startDiagnostic(course, { now: "2026-01-01T00:00:00Z" });
  let guard = 0;
  while (!s.done && guard++ < 50) {
    const q = currentQuestion(s, course)!;
    const wrong = q.options.find((o) => o.id !== q.correctOptionId && o.misconceptionId) ?? q.options.find((o) => o.id !== q.correctOptionId)!;
    s = answer(s, course, { questionId: q.id, optionId: unknown.has(q.conceptId) ? wrong.id : q.correctOptionId });
  }
  return s;
}

describe("diagnostic", () => {
  it("finds the root gap of a deterministic student with a hole in integer signs", () => {
    const g = buildGraph(quadratics.concepts);
    const unknown = new Set(["integers", ...descendants(g, "integers").keys()]);
    const s = runStudent(quadratics, unknown);
    const report = analyze(s, quadratics);
    expect(report.rootGaps.map((r) => r.conceptId)).toEqual(["integers"]);
    expect(report.blocked).toContain("word-problems");
    expect(report.stats.questions).toBeLessThan(quadratics.questions.length / 2);
    expect(report.misconceptions.length).toBeGreaterThan(0);
  });

  it("reports no gaps for a student who knows everything, quickly", () => {
    const s = runStudent(circuits, new Set());
    const report = analyze(s, circuits);
    expect(report.rootGaps).toEqual([]);
    expect(s.attempts.length).toBeLessThanOrEqual(10);
  });

  it("never asks more than its budget and never repeats a question", () => {
    const rand = rng(5);
    for (let i = 0; i < 50; i++) {
      const st = simulateDiagnostic(circuits, syntheticStudent(circuits, rand, 2), rand);
      expect(st.done).toBe(true);
      expect(st.attempts.length).toBeLessThanOrEqual(st.budget);
      expect(new Set(st.attempts.map((a) => a.questionId)).size).toBe(st.attempts.length);
    }
  });

  it("can be finished early and still produce a coherent report", () => {
    let s = startDiagnostic(quadratics);
    const q = currentQuestion(s, quadratics)!;
    s = answer(s, quadratics, { questionId: q.id, optionId: q.correctOptionId });
    s = finishNow(s, quadratics);
    expect(s.done).toBe(true);
    expect(() => analyze(s, quadratics)).not.toThrow();
  });

  it("state survives a JSON round-trip (persistence)", () => {
    let s = startDiagnostic(quadratics);
    s = JSON.parse(JSON.stringify(s));
    const q = currentQuestion(s, quadratics)!;
    expect(() => answer(s, quadratics, { questionId: q.id, optionId: q.correctOptionId })).not.toThrow();
  });

  it("beats a fixed 3-question-per-concept test on simulated students", () => {
    for (const course of builtinCourses) {
      const adaptive = benchmark(course, 300, 99);
      const fixed = benchmarkFixedTest(course, 3, 300, 99);
      expect(adaptive.exactMatch).toBeGreaterThan(0.7);
      expect(adaptive.exactMatch).toBeGreaterThan(fixed.exactMatch);
      expect(adaptive.avgQuestions).toBeLessThan(fixed.avgQuestions / 2);
    }
  });

  it("orders the study path so prerequisites come first", () => {
    const g = buildGraph(quadratics.concepts);
    const unknown = new Set(["expand", ...descendants(g, "expand").keys()]);
    const s = runStudent(quadratics, unknown);
    const path = studyPath(quadratics, s.concepts);
    expect(path[0].conceptId).toBe("expand");
    expect(path[0].kind).toBe("root");
    const idx = (id: string) => path.findIndex((p) => p.conceptId === id);
    expect(idx("standard-form")).toBeGreaterThan(idx("expand"));
  });
});
