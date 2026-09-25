import type { Course, Question } from "../schema";
import { DIAGNOSTIC_PARAMS, paramsFor, type BktParams } from "./bkt";
import { ctx, defaultBudget, list, pct, pickQuestion, usedQuestionIds } from "./common";
import { ancestors, descendants, topoSort } from "./graph";
import {
  DEFAULT_CONFIG,
  type AnswerInput,
  type ConceptState,
  type DiagnosticState,
  type EngineConfig,
} from "./types";

/**
 * Knowledge-Space diagnostic (Doignon & Falmagne's Knowledge Space Theory —
 * the model behind ALEKS — with Bayesian updating).
 *
 * A student's knowledge state is a set of concepts that is closed under
 * prerequisites: you can't know Factorising without knowing Integer signs.
 * We enumerate every such feasible state (usually a few dozen to a few
 * thousand), keep an exact posterior over them, and after every answer ask
 * the question with the highest expected information gain — effectively a
 * noisy binary search over the prerequisite graph.
 *
 * A state's ROOT GAPS are the unknown concepts whose prerequisites are all
 * known (the "outer fringe" in KST terms). The prior favours explanations
 * with fewer root causes (Occam's razor): P(state) ∝ rootPrior^|roots|.
 */

export interface KstModel {
  ids: string[];
  bit: Map<string, number>;
  /** known-concept bitmask of each feasible state */
  states: Int32Array;
  /** root-gap bitmask of each feasible state */
  roots: Int32Array;
  logPrior: Float64Array;
}

const modelCache = new WeakMap<Course, Map<string, KstModel | null>>();

function popcount(x: number): number {
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

/** Enumerates feasible knowledge states; returns null if there are too many. */
export function buildKst(course: Course, cfg: EngineConfig = DEFAULT_CONFIG): KstModel | null {
  const key = `${cfg.maxStates}:${cfg.rootPrior}`;
  let perCourse = modelCache.get(course);
  if (!perCourse) modelCache.set(course, (perCourse = new Map()));
  if (perCourse.has(key)) return perCourse.get(key)!;

  const { g } = ctx(course);
  if (g.ids.length > 30) {
    perCourse.set(key, null);
    return null;
  }
  const bit = new Map(g.ids.map((id, i) => [id, i]));
  const pre = g.ids.map((id) => g.prereqs.get(id)!.reduce((m, p) => m | (1 << bit.get(p)!), 0));
  const order = topoSort(g).map((id) => bit.get(id)!);

  const states: number[] = [];
  let overflow = false;
  const rec = (i: number, mask: number) => {
    if (overflow) return;
    if (i === order.length) {
      states.push(mask);
      if (states.length > cfg.maxStates) overflow = true;
      return;
    }
    const b = order[i];
    rec(i + 1, mask);
    if ((mask & pre[b]) === pre[b]) rec(i + 1, mask | (1 << b));
  };
  rec(0, 0);
  if (overflow) {
    perCourse.set(key, null);
    return null;
  }

  const n = g.ids.length;
  const roots = new Int32Array(states.length);
  const logPrior = new Float64Array(states.length);
  const lq = Math.log(cfg.rootPrior);
  states.forEach((mask, s) => {
    let r = 0;
    for (let b = 0; b < n; b++) {
      if (!(mask & (1 << b)) && (mask & pre[b]) === pre[b]) r |= 1 << b;
    }
    roots[s] = r;
    logPrior[s] = popcount(r) * lq;
  });
  const model: KstModel = { ids: g.ids, bit, states: Int32Array.from(states), roots, logPrior };
  perCourse.set(key, model);
  return model;
}

function paramsForQuestion(q: Question, guessing?: boolean): BktParams {
  return paramsFor(DIAGNOSTIC_PARAMS, { guessing, difficulty: q.difficulty, optionCount: q.options.length });
}

/** Exact posterior over feasible states given all attempts so far. */
export function posterior(model: KstModel, course: Course, attempts: DiagnosticState["attempts"]): Float64Array {
  const log = Float64Array.from(model.logPrior);
  for (const a of attempts) {
    const q = course.questions.find((x) => x.id === a.questionId);
    if (!q) continue;
    const { slip, guess } = paramsForQuestion(q, a.guessing);
    const b = 1 << model.bit.get(a.conceptId)!;
    const lKnown = Math.log(a.correct ? 1 - slip : slip);
    const lUnknown = Math.log(a.correct ? guess : 1 - guess);
    for (let s = 0; s < log.length; s++) log[s] += model.states[s] & b ? lKnown : lUnknown;
  }
  let max = -Infinity;
  for (const v of log) if (v > max) max = v;
  let z = 0;
  const p = new Float64Array(log.length);
  for (let s = 0; s < log.length; s++) z += p[s] = Math.exp(log[s] - max);
  for (let s = 0; s < p.length; s++) p[s] /= z;
  return p;
}

export function marginals(model: KstModel, post: Float64Array): number[] {
  const m = new Array<number>(model.ids.length).fill(0);
  for (let s = 0; s < post.length; s++) {
    const mask = model.states[s];
    for (let b = 0; b < m.length; b++) if (mask & (1 << b)) m[b] += post[s];
  }
  return m.map((x) => Math.min(0.999, Math.max(0.001, x)));
}

function h(p: number): number {
  return p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

/** Mutual information (bits) between the answer to one question and the knowledge state. */
export function informationGain(pKnown: number, params: BktParams): number {
  const pCorrect = pKnown * (1 - params.slip) + (1 - pKnown) * params.guess;
  return h(pCorrect) - (pKnown * h(params.slip) + (1 - pKnown) * h(params.guess));
}

function summarize(model: KstModel, post: Float64Array) {
  let best = 0;
  let entropy = 0;
  for (let s = 0; s < post.length; s++) {
    if (post[s] > post[best]) best = s;
    if (post[s] > 0) entropy -= post[s] * Math.log2(post[s]);
  }
  return { best, confidence: post[best], explanations: Math.max(1, Math.round(2 ** entropy)) };
}

export function startKst(
  course: Course,
  opts: { budget?: number; now?: string; config?: Partial<EngineConfig> } = {},
): DiagnosticState | null {
  const cfg = { ...DEFAULT_CONFIG, ...opts.config };
  const model = buildKst(course, cfg);
  if (!model) return null;
  const { g } = ctx(course);
  const concepts: Record<string, ConceptState> = {};
  for (const id of g.ids) concepts[id] = { p: 0.5, asked: 0, correct: 0, status: "unknown", evidence: "none" };
  const state: DiagnosticState = {
    version: 2,
    engine: "kst",
    courseId: course.id,
    cfg,
    concepts,
    stack: [],
    attempts: [],
    trace: [
      {
        kind: "start",
        text: `There are ${model.states.length} possible profiles of what you know here. Each answer rules some out, and every question is picked to tell me the most.`,
      },
    ],
    currentQuestionId: null,
    budget: opts.budget ?? defaultBudget(course, cfg),
    done: false,
    startedAt: opts.now ?? new Date().toISOString(),
    stateCount: model.states.length,
    explanations: model.states.length,
  };
  refresh(state, course, model, posterior(model, course, []));
  return advance(state, course, model);
}

/**
 * Writes marginals and live statuses into state.concepts. A concept that was
 * never asked is only shown as solid/gap when an answer actually implies it
 * (a success above it, or a miss below it) — not merely because of the prior.
 */
function refresh(state: DiagnosticState, course: Course, model: KstModel, post: Float64Array) {
  const m = marginals(model, post);
  const { cfg } = state;
  const { g } = ctx(course);
  const asked = [...new Set(state.attempts.map((a) => a.conceptId))];
  const below = new Set(asked.flatMap((id) => [...ancestors(g, id).keys()]));
  const above = new Set(asked.flatMap((id) => [...descendants(g, id).keys()]));
  model.ids.forEach((id, b) => {
    const cs = state.concepts[id];
    cs.p = m[b];
    const direct = cs.asked > 0;
    if (!direct) cs.evidence = below.has(id) || above.has(id) ? "inferred" : "none";
    if (cs.p >= cfg.mastered && (direct || below.has(id))) {
      cs.status = "mastered";
      cs.verdict = direct ? "solid" : "inferred";
    } else if (cs.p <= 1 - cfg.mastered && (direct || above.has(id))) {
      cs.status = "gap";
      cs.verdict = undefined;
    } else {
      cs.status = direct ? "probing" : "unknown";
      cs.verdict = undefined;
    }
  });
  const sum = summarize(model, post);
  state.confidence = sum.confidence;
  state.explanations = sum.explanations;
  return { m, ...sum };
}

function advance(state: DiagnosticState, course: Course, model: KstModel, post?: Float64Array): DiagnosticState {
  const { cfg } = state;
  const { name } = ctx(course);
  post ??= posterior(model, course, state.attempts);
  const { confidence } = summarize(model, post);
  const n = state.attempts.length;
  if (n >= state.budget || (n >= cfg.minQuestions && confidence >= cfg.stopConfidence)) {
    return finish(state, course, model, post);
  }
  const used = usedQuestionIds(state);
  const m = marginals(model, post);
  let bestQ: Question | undefined;
  let bestGain = 0;
  let bestConcept = "";
  model.ids.forEach((id, b) => {
    const cs = state.concepts[id];
    if (cs.asked >= cfg.maxPerConcept) return;
    const q = pickQuestion(course, id, m[b], used);
    if (!q) return;
    const gain = informationGain(m[b], paramsForQuestion(q));
    if (gain > bestGain + 1e-9) {
      bestGain = gain;
      bestQ = q;
      bestConcept = id;
    }
  });
  if (!bestQ || bestGain < 0.02) return finish(state, course, model, post);

  state.currentQuestionId = bestQ.id;
  state.concepts[bestConcept].status = "probing";
  const prev = state.trace.at(-1);
  if (!(prev?.kind === "next" && prev.conceptId === bestConcept)) {
    state.trace.push({
      kind: "next",
      conceptId: bestConcept,
      text:
        n === 0
          ? `Starting with ${name(bestConcept)} — its answer splits the possibilities most evenly.`
          : `Next: ${name(bestConcept)} — the most informative question right now.`,
    });
  }
  return state;
}

export function answerKst(prev: DiagnosticState, course: Course, input: AnswerInput): DiagnosticState {
  if (prev.done) return prev;
  const model = buildKst(course, prev.cfg);
  if (!model) throw new Error("Knowledge space unavailable for this course");
  const state: DiagnosticState = structuredClone(prev);
  const { name, g } = ctx(course);
  const q = course.questions.find((x) => x.id === input.questionId);
  if (!q) throw new Error(`Unknown question ${input.questionId}`);
  const option = q.options.find((o) => o.id === input.optionId);
  if (!option) throw new Error(`Unknown option ${input.optionId}`);
  const correct = option.id === q.correctOptionId;

  const before = Object.fromEntries(Object.entries(state.concepts).map(([id, c]) => [id, c.p]));
  const statusBefore = Object.fromEntries(Object.entries(state.concepts).map(([id, c]) => [id, c.status]));
  const explanationsBefore = state.explanations ?? model.states.length;
  const cs = state.concepts[q.conceptId];
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
    pBefore: before[q.conceptId],
    pAfter: before[q.conceptId],
    ms: input.ms ?? 0,
    at: input.now ?? new Date().toISOString(),
  });

  const post = posterior(model, course, state.attempts);
  refresh(state, course, model, post);
  state.attempts.at(-1)!.pAfter = cs.p;

  state.trace.push({
    kind: correct ? "correct" : "wrong",
    conceptId: q.conceptId,
    text: `${correct ? "Correct on" : "Missed"} ${name(q.conceptId)} — now ${pct(cs.p)} likely you know it.`,
  });
  if (!correct && option.misconceptionId) {
    const mis = course.misconceptions.find((x) => x.id === option.misconceptionId);
    if (mis) {
      state.trace.push({ kind: "misconception", conceptId: mis.conceptId, text: `That answer is a classic sign of: “${mis.label}”.` });
    }
  }
  // Narrate what the answer implied about concepts that were NOT asked.
  const nowSolid = g.ids.filter((id) => id !== q.conceptId && statusBefore[id] !== "mastered" && state.concepts[id].status === "mastered");
  const nowWeak = g.ids.filter((id) => id !== q.conceptId && statusBefore[id] !== "gap" && state.concepts[id].status === "gap");
  if (nowSolid.length) {
    state.trace.push({
      kind: "infer",
      conceptId: q.conceptId,
      related: nowSolid,
      text: `So ${list(nowSolid.map(name))} ${nowSolid.length > 1 ? "are" : "is"} almost certainly solid — no need to ask.`,
    });
  }
  if (nowWeak.length) {
    state.trace.push({
      kind: "descend",
      conceptId: q.conceptId,
      related: nowWeak,
      text: `Anything built on it is shaky too: ${list(nowWeak.map(name))}.`,
    });
  }
  if ((state.explanations ?? 0) < explanationsBefore) {
    state.trace.push({
      kind: "narrow",
      text: `Narrowed down: ~${explanationsBefore} → ~${state.explanations} plausible explanations.`,
    });
  }
  state.currentQuestionId = null;
  return advance(state, course, model, post);
}

export function finishKst(prev: DiagnosticState, course: Course): DiagnosticState {
  const model = buildKst(course, prev.cfg);
  if (!model) throw new Error("Knowledge space unavailable for this course");
  return finish(structuredClone(prev), course, model, posterior(model, course, prev.attempts));
}

function finish(state: DiagnosticState, course: Course, model: KstModel, post: Float64Array): DiagnosticState {
  if (state.done) return state;
  const { g, name } = ctx(course);
  const { m, best, confidence } = refresh(state, course, model, post);
  const known = model.states[best];
  const rootMask = model.roots[best];
  model.ids.forEach((id, b) => {
    const cs = state.concepts[id];
    if (known & (1 << b)) {
      cs.status = m[b] >= 0.65 ? "mastered" : "shaky";
      cs.verdict = cs.status === "shaky" ? "shaky" : cs.asked ? "solid" : "inferred";
      cs.blockedBy = undefined;
    } else if (rootMask & (1 << b)) {
      cs.status = "gap";
      cs.verdict = "root";
      cs.blockedBy = undefined;
    } else {
      cs.status = "gap";
      cs.verdict = "blocked";
      cs.blockedBy = (g.prereqs.get(id) ?? []).filter((p) => !(known & (1 << model.bit.get(p)!)));
    }
  });
  state.currentQuestionId = null;
  state.done = true;
  state.confidence = confidence;
  state.finishedAt = state.attempts.at(-1)?.at ?? new Date().toISOString();
  const roots = model.ids.filter((_, b) => rootMask & (1 << b));
  for (const r of roots) {
    const unlocks = descendants(g, r).size;
    state.trace.push({
      kind: "root",
      conceptId: r,
      text: `Root gap: ${name(r)}.${unlocks ? ` Fixing it unlocks ${unlocks} concept${unlocks > 1 ? "s" : ""} built on it.` : ""}`,
    });
  }
  state.trace.push({
    kind: "finish",
    related: roots,
    text: roots.length
      ? `Diagnosis complete in ${state.attempts.length} questions (${pct(confidence)} confident).`
      : `Diagnosis complete in ${state.attempts.length} questions — no gaps found (${pct(confidence)} confident).`,
  });
  return state;
}
