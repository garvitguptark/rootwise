import type { Course, Question } from "../schema";
import { answerDfs, finishDfs, startDfs } from "./dfs";
import { answerKst, finishKst, startKst } from "./kst";
import type { AnswerInput, DiagnosticState, EngineConfig } from "./types";

export * from "./types";
export { defaultBudget, pickQuestion } from "./common";

/**
 * Public API of the diagnostic. Uses exact knowledge-space inference when the
 * course graph is small enough (almost always), otherwise the depth-first
 * BKT engine.
 */
export function startDiagnostic(
  course: Course,
  opts: { budget?: number; now?: string; config?: Partial<EngineConfig>; engine?: "kst" | "dfs" } = {},
): DiagnosticState {
  if (opts.engine !== "dfs") {
    const s = startKst(course, opts);
    if (s) return s;
  }
  return startDfs(course, opts);
}

export function answer(state: DiagnosticState, course: Course, input: AnswerInput): DiagnosticState {
  return state.engine === "kst" ? answerKst(state, course, input) : answerDfs(state, course, input);
}

export function finishNow(state: DiagnosticState, course: Course): DiagnosticState {
  if (state.done) return state;
  return state.engine === "kst" ? finishKst(state, course) : finishDfs(state, course);
}

export function currentQuestion(state: DiagnosticState, course: Course): Question | undefined {
  return state.currentQuestionId ? course.questions.find((q) => q.id === state.currentQuestionId) : undefined;
}
