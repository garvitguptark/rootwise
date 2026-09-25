import type { Course } from "../schema";
import { DIAGNOSTIC_PARAMS, PRIOR, paramsFor, softUpdate, update } from "./bkt";
import { ctx, defaultBudget, list, pct, pickQuestion, usedQuestionIds } from "./common";
import { ancestors, descendants, type ConceptGraph } from "./graph";
import {
  DEFAULT_CONFIG,
  type AnswerInput,
  type ConceptState,
  type DiagnosticState,
  type EngineConfig,
} from "./types";

/**
 * Root-cause diagnostic — depth-first fallback engine.
 *
 * Used when a course graph is too wide for exact knowledge-space inference.
 *
 * Instead of asking every question, the engine starts at the course's goal
 * concepts and walks *down* the prerequisite graph only where the student
 * struggles — a depth-first search guided by Bayesian Knowledge Tracing.
 *
 *  • Correct answer  → belief in the concept rises; evidence propagates to
 *                      its prerequisites (you can't factorise without integer
 *                      arithmetic), so solid foundations are rarely asked.
 *  • Wrong answer    → the prerequisites become suspects ("explaining away"
 *                      lowers their belief) and are probed next.
 *  • A failed concept whose prerequisites are all fine is a ROOT GAP
 *    (confirmed with a second, easier question). A failed concept with a
 *    failed prerequisite is BLOCKED — a symptom, not the cause.
 *
 * All state is plain JSON so it can be persisted and resumed.
 */

export function startDfs(
  course: Course,
  opts: { budget?: number; now?: string; config?: Partial<EngineConfig> } = {},
): DiagnosticState {
  const { g, name } = ctx(course);
  const cfg = { ...DEFAULT_CONFIG, ...opts.config };
  const concepts: Record<string, ConceptState> = {};
  for (const id of g.ids) concepts[id] = { p: PRIOR, asked: 0, correct: 0, status: "unknown", evidence: "none" };

  const targets = course.targetConceptIds.filter((t) => g.byId.has(t));
  // First target is probed first → push in reverse.
  const stack = [...targets].reverse();
  for (const t of targets) concepts[t].status = "queued";

  const state: DiagnosticState = {
    version: 2,
    engine: "dfs",
    courseId: course.id,
    cfg,
    concepts,
    stack,
    attempts: [],
    trace: [
      {
        kind: "start",
        related: targets,
        text: `Starting at the goal${targets.length > 1 ? "s" : ""}: ${list(targets.map(name))}. If you've got ${
          targets.length > 1 ? "them" : "it"
        }, everything underneath can be skipped.`,
      },
    ],
    currentQuestionId: null,
    budget: opts.budget ?? defaultBudget(course, cfg),
    done: false,
    startedAt: opts.now ?? new Date().toISOString(),
  };
  return advance(state, course);
}

function isResolved(cs: ConceptState, cfg: EngineConfig): boolean {
  if (cs.evidence === "direct") return cs.status === "mastered" || cs.status === "gap" || cs.status === "shaky";
  return cs.p >= cfg.inferredOk;
}

function pushTop(state: DiagnosticState, id: string) {
  state.stack = state.stack.filter((s) => s !== id);
  state.stack.push(id);
}

/**
 * Decide what to do with the concept on top of the stack.
 * Returns "ask" when it needs another question, otherwise resolves/descends.
 */
function settle(state: DiagnosticState, course: Course, id: string): "ask" | "resolved" | "descended" {
  const { g, name } = ctx(course);
  const { cfg } = state;
  const cs = state.concepts[id];
  const prereqs = g.prereqs.get(id) ?? [];
  const used = usedQuestionIds(state);
  const hasMore = cs.asked < cfg.maxPerConcept && !!pickQuestion(course, id, cs.p, used);

  if (cs.asked === 0) {
    if (isResolved(cs, cfg)) return "resolved";
    if (hasMore) return "ask";
    return "resolved";
  }

  if (cs.p >= cfg.mastered) {
    cs.status = "mastered";
    cs.verdict = "solid";
    return "resolved";
  }

  const missed = cs.asked > cs.correct;
  const open = prereqs.filter((p) => !isResolved(state.concepts[p], cfg));

  if (missed && open.length && !cs.descended) {
    cs.descended = true;
    cs.status = "probing";
    // Probe the most suspicious prerequisite first (lowest belief, then deepest).
    const order = [...open].sort(
      (a, b) => state.concepts[b].p - state.concepts[a].p || ancestors(g, a).size - ancestors(g, b).size,
    );
    for (const p of order) {
      pushTop(state, p);
      if (state.concepts[p].status === "unknown" || state.concepts[p].status === "mastered") {
        state.concepts[p].status = "queued";
      }
    }
    const probeOrder = [...order].reverse();
    state.trace.push({
      kind: "descend",
      conceptId: id,
      related: probeOrder,
      text: `Missed ${name(id)}. Tracing down to its foundation${probeOrder.length > 1 ? "s" : ""}: ${list(probeOrder.map(name))}.`,
    });
    return "descended";
  }

  const gapPrereqs = prereqs.filter((p) => state.concepts[p].status === "gap");

  if (cs.p <= cfg.gap) {
    if (gapPrereqs.length) {
      cs.status = "gap";
      cs.verdict = "blocked";
      cs.blockedBy = gapPrereqs;
      state.trace.push({
        kind: "blocked",
        conceptId: id,
        related: gapPrereqs,
        text: `${name(id)} is a symptom, not the cause — it's blocked by ${list(gapPrereqs.map(name))}.`,
      });
      return "resolved";
    }
    if (cs.asked < 2 && hasMore) {
      state.trace.push({
        kind: "confirm",
        conceptId: id,
        text: prereqs.length
          ? `Foundations under ${name(id)} look fine. Double-checking ${name(id)} itself.`
          : `Double-checking ${name(id)} with an easier question.`,
      });
      return "ask";
    }
    cs.status = "gap";
    cs.verdict = "root";
    const unlocks = descendants(g, id).size;
    state.trace.push({
      kind: "root",
      conceptId: id,
      text: `Root gap found: ${name(id)}.${unlocks ? ` Fixing it unlocks ${unlocks} concept${unlocks > 1 ? "s" : ""} built on it.` : ""}`,
    });
    return "resolved";
  }

  // Uncertain middle ground: gather more evidence if we can.
  if (hasMore) return "ask";
  if (cs.p >= 0.5) {
    cs.status = "shaky";
    cs.verdict = "shaky";
  } else {
    cs.status = "gap";
    cs.verdict = gapPrereqs.length ? "blocked" : "root";
    if (gapPrereqs.length) cs.blockedBy = gapPrereqs;
  }
  return "resolved";
}

/** Moves the search forward to the next question (or finishes). */
function advance(state: DiagnosticState, course: Course): DiagnosticState {
  if (state.attempts.length >= state.budget) return finish(state, course);
  let guard = 0;
  while (state.stack.length && guard++ < 500) {
    const top = state.stack[state.stack.length - 1];
    const res = settle(state, course, top);
    if (res === "ask") {
      const cs = state.concepts[top];
      const q = pickQuestion(course, top, cs.p, usedQuestionIds(state), {
        preferEasy: cs.asked >= 1 && cs.asked > cs.correct,
      });
      if (q) {
        if (cs.status !== "probing") cs.status = "probing";
        state.currentQuestionId = q.id;
        return state;
      }
      state.stack.pop();
    } else if (res === "resolved") {
      state.stack.pop();
    }
    // "descended" → prerequisites were pushed on top; loop again.
  }
  return finish(state, course);
}

/** Reducer: returns a new state with the answer applied. */
export function answerDfs(prev: DiagnosticState, course: Course, input: AnswerInput): DiagnosticState {
  if (prev.done) return prev;
  const state: DiagnosticState = structuredClone(prev);
  const { g, name } = ctx(course);
  const { cfg } = state;
  const q = course.questions.find((x) => x.id === input.questionId);
  if (!q) throw new Error(`Unknown question ${input.questionId}`);
  const option = q.options.find((o) => o.id === input.optionId);
  if (!option) throw new Error(`Unknown option ${input.optionId}`);

  const correct = option.id === q.correctOptionId;
  const params = paramsFor(DIAGNOSTIC_PARAMS, {
    guessing: input.guessing,
    difficulty: q.difficulty,
    optionCount: q.options.length,
  });
  const cs = state.concepts[q.conceptId];
  const pBefore = cs.p;
  cs.p = update(cs.p, correct, params);
  cs.asked += 1;
  if (correct) cs.correct += 1;
  cs.evidence = "direct";

  state.attempts.push({
    questionId: q.id,
    conceptId: q.conceptId,
    optionId: option.id,
    correct,
    guessing: !!input.guessing,
    misconceptionId: correct ? undefined : option.misconceptionId,
    pBefore,
    pAfter: cs.p,
    ms: input.ms ?? 0,
    at: input.now ?? new Date().toISOString(),
  });

  if (correct) {
    state.trace.push({ kind: "correct", conceptId: q.conceptId, text: `Correct on ${name(q.conceptId)} — confidence ${pct(cs.p)}.` });
    // Success on a concept is evidence its prerequisites are known too.
    const lifted: string[] = [];
    for (const [a, d] of ancestors(g, q.conceptId)) {
      const as = state.concepts[a];
      const weight = (input.guessing ? cfg.lift * 0.5 : cfg.lift) ** d * (as.evidence === "direct" ? 0.5 : 1);
      const before = as.p;
      as.p = softUpdate(as.p, true, weight, params);
      if (as.evidence === "none") as.evidence = "inferred";
      if (as.evidence === "inferred" && as.p >= cfg.inferredOk && before < cfg.inferredOk) {
        as.status = "mastered";
        as.verdict = "inferred";
        lifted.push(a);
      }
    }
    if (lifted.length) {
      state.trace.push({
        kind: "infer",
        conceptId: q.conceptId,
        related: lifted,
        text: `Skipping ${list(lifted.map(name))} — ${lifted.length > 1 ? "they're" : "it's"} almost certainly solid if you got that right.`,
      });
    }
  } else {
    state.trace.push({ kind: "wrong", conceptId: q.conceptId, text: `Missed ${name(q.conceptId)} — confidence ${pct(cs.p)}.` });
    if (option.misconceptionId) {
      const m = course.misconceptions.find((x) => x.id === option.misconceptionId);
      if (m) {
        state.trace.push({ kind: "misconception", conceptId: m.conceptId, text: `That answer is a classic sign of: “${m.label}”.` });
      }
    }
    // Explaining away: a miss makes each untested prerequisite a suspect.
    if (cfg.suspicion > 0) {
      for (const [a, d] of ancestors(g, q.conceptId)) {
        const as = state.concepts[a];
        if (as.evidence === "direct") continue;
        as.p = softUpdate(as.p, false, cfg.suspicion ** d, params);
        if (as.evidence === "none") as.evidence = "inferred";
        if (as.status === "mastered" && as.p < cfg.inferredOk) {
          as.status = "unknown";
          as.verdict = undefined;
        }
      }
    }
    // Failing a concept makes the untested concepts built on it less likely.
    for (const [dId, d] of descendants(g, q.conceptId)) {
      const ds = state.concepts[dId];
      if (ds.evidence === "direct") continue;
      ds.p = softUpdate(ds.p, false, 0.35 ** d, params);
      if (ds.evidence === "none") ds.evidence = "inferred";
    }
  }

  state.currentQuestionId = null;
  return advance(state, course);
}

/** Ends the diagnostic early (e.g. the student clicks "finish now"). */
export function finishDfs(prev: DiagnosticState, course: Course): DiagnosticState {
  return finish(structuredClone(prev), course);
}

function finish(state: DiagnosticState, course: Course): DiagnosticState {
  if (state.done) return state;
  const { g, name } = ctx(course);
  const { cfg } = state;
  // Resolve anything still pending using the current beliefs.
  for (const id of g.ids) {
    const cs = state.concepts[id];
    if (cs.evidence !== "direct") continue;
    if (cs.status === "mastered" || cs.status === "gap" || cs.status === "shaky") continue;
    cs.status = cs.p >= cfg.mastered ? "mastered" : cs.p <= cfg.gap ? "gap" : "shaky";
    cs.verdict = cs.status === "mastered" ? "solid" : cs.status === "shaky" ? "shaky" : undefined;
  }
  // Classify direct gaps as root vs blocked, then infer the untested concepts.
  for (const id of topoOrder(g)) {
    const cs = state.concepts[id];
    const gapPrereqs = (g.prereqs.get(id) ?? []).filter((p) => state.concepts[p].status === "gap");
    if (cs.evidence === "direct") {
      if (cs.status === "gap") {
        cs.verdict = gapPrereqs.length ? "blocked" : "root";
        cs.blockedBy = gapPrereqs.length ? gapPrereqs : undefined;
      }
      continue;
    }
    if (gapPrereqs.length) {
      cs.status = "gap";
      cs.verdict = "blocked";
      cs.blockedBy = gapPrereqs;
    } else if (cs.p >= 0.65) {
      cs.status = "mastered";
      cs.verdict = "inferred";
    } else {
      cs.status = "unknown";
      cs.verdict = undefined;
    }
  }
  state.stack = [];
  state.currentQuestionId = null;
  state.done = true;
  state.finishedAt = state.attempts.at(-1)?.at ?? new Date().toISOString();
  const roots = g.ids.filter((id) => state.concepts[id].verdict === "root");
  state.trace.push({
    kind: "finish",
    related: roots,
    text: roots.length
      ? `Diagnosis complete in ${state.attempts.length} questions. Root gap${roots.length > 1 ? "s" : ""}: ${list(roots.map(name))}.`
      : `Diagnosis complete in ${state.attempts.length} questions. No root gaps — you're ready for harder material.`,
  });
  return state;
}

function topoOrder(g: ConceptGraph): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    for (const p of g.prereqs.get(id) ?? []) visit(p);
    out.push(id);
  };
  g.ids.forEach(visit);
  return out;
}
