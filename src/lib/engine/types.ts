/** Shared types for the diagnostic engines. All state is plain JSON. */

export interface EngineConfig {
  /** P(known) at or above which a concept counts as mastered. */
  mastered: number;
  /** P(known) at or below which a concept counts as a gap. */
  gap: number;
  maxPerConcept: number;
  /** Questions per concept used to size the budget. */
  budgetPerConcept: number;
  // ── Knowledge-space engine ──
  /** Stop once the most likely diagnosis reaches this posterior probability. */
  stopConfidence: number;
  minQuestions: number;
  /** Prior weight per root gap: favours explanations with fewer root causes. */
  rootPrior: number;
  /** Above this many feasible knowledge states, fall back to the DFS engine. */
  maxStates: number;
  // ── DFS fallback engine ──
  /** Posterior at which inferred (never-asked) knowledge counts as resolved. */
  inferredOk: number;
  /** Weight of the "explaining away" evidence a miss puts on prerequisites. */
  suspicion: number;
  /** Weight with which a success lifts prerequisites (decays with distance). */
  lift: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  mastered: 0.85,
  gap: 0.3,
  maxPerConcept: 4,
  budgetPerConcept: 1.5,
  stopConfidence: 0.9,
  minQuestions: 4,
  rootPrior: 0.3,
  maxStates: 60000,
  inferredOk: 0.78,
  suspicion: 0,
  lift: 0.4,
};

export type ConceptStatus = "unknown" | "queued" | "probing" | "mastered" | "shaky" | "gap";

export interface ConceptState {
  /** Probability the student knows the concept. */
  p: number;
  asked: number;
  correct: number;
  status: ConceptStatus;
  evidence: "none" | "direct" | "inferred";
  /** DFS: prerequisites have already been queued because of a miss */
  descended?: boolean;
  /** how the concept was resolved, for the report */
  verdict?: "root" | "blocked" | "solid" | "shaky" | "inferred";
  blockedBy?: string[];
}

export interface Attempt {
  questionId: string;
  conceptId: string;
  optionId: string;
  correct: boolean;
  guessing: boolean;
  misconceptionId?: string;
  pBefore: number;
  pAfter: number;
  ms: number;
  at: string;
}

export type TraceKind =
  | "start"
  | "next"
  | "correct"
  | "wrong"
  | "misconception"
  | "descend"
  | "infer"
  | "narrow"
  | "confirm"
  | "blocked"
  | "root"
  | "finish";

export interface TraceEvent {
  kind: TraceKind;
  conceptId?: string;
  related?: string[];
  text: string;
}

export interface DiagnosticState {
  version: 2;
  engine: "kst" | "dfs";
  courseId: string;
  cfg: EngineConfig;
  concepts: Record<string, ConceptState>;
  /** DFS frontier; the last element is probed next (unused by KST). */
  stack: string[];
  attempts: Attempt[];
  trace: TraceEvent[];
  currentQuestionId: string | null;
  budget: number;
  done: boolean;
  startedAt: string;
  finishedAt?: string;
  /** KST: number of feasible knowledge states for this course. */
  stateCount?: number;
  /** KST: effective number of explanations still in play (2^entropy). */
  explanations?: number;
  /** Posterior probability of the final (or current best) diagnosis. */
  confidence?: number;
}

export interface AnswerInput {
  questionId: string;
  optionId: string;
  guessing?: boolean;
  ms?: number;
  now?: string;
}
