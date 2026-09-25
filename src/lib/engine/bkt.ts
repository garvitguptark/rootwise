/**
 * Bayesian Knowledge Tracing (Corbett & Anderson, 1994).
 *
 * Each concept has a latent binary state: learned or not. We keep
 * P(learned) and update it after every observed answer:
 *
 *   correct:  P(L|✓) = P(L)(1−S) / [P(L)(1−S) + (1−P(L))G]
 *   wrong:    P(L|✗) = P(L)S     / [P(L)S     + (1−P(L))(1−G)]
 *   learning: P(L)'  = P(L|obs) + (1 − P(L|obs))·T
 *
 * S = slip (knows it but answers wrong), G = guess (doesn't know it but
 * answers right), T = chance of learning from the attempt itself.
 */

export interface BktParams {
  slip: number;
  guess: number;
  transit: number;
}

/** During a diagnostic nothing is taught, so T = 0. */
export const DIAGNOSTIC_PARAMS: BktParams = { slip: 0.1, guess: 0.22, transit: 0 };

/** During practice the student gets feedback after every answer, so T > 0. */
export const PRACTICE_PARAMS: BktParams = { slip: 0.1, guess: 0.22, transit: 0.12 };

export const PRIOR = 0.5;

const clamp = (p: number) => Math.min(0.995, Math.max(0.005, p));

export function posterior(p: number, correct: boolean, params: BktParams): number {
  const { slip, guess } = params;
  const num = correct ? p * (1 - slip) : p * slip;
  const den = correct ? p * (1 - slip) + (1 - p) * guess : p * slip + (1 - p) * (1 - guess);
  return den === 0 ? p : num / den;
}

export function update(p: number, correct: boolean, params: BktParams): number {
  const post = posterior(p, correct, params);
  return clamp(post + (1 - post) * params.transit);
}

/**
 * Evidence-strength adjustments:
 *  - A student who says they are guessing gets less credit for a right
 *    answer (a higher effective guess rate).
 *  - Harder questions are less guessable; easier ones are more slip-prone
 *    to fail on if the student really knows the idea.
 */
export function paramsFor(
  base: BktParams,
  opts: { guessing?: boolean; difficulty?: 1 | 2 | 3; optionCount?: number },
): BktParams {
  const n = opts.optionCount ?? 4;
  let guess = Math.max(base.guess, 1 / n - 0.03);
  let slip = base.slip;
  if (opts.difficulty === 3) {
    guess *= 0.8;
    slip *= 1.3;
  } else if (opts.difficulty === 1) {
    slip *= 0.7;
  }
  if (opts.guessing) guess = Math.max(guess, 0.6);
  return { ...base, guess: Math.min(guess, 0.9), slip: Math.min(slip, 0.3) };
}

/**
 * Soft evidence: moves `p` toward the full BKT update by `weight` ∈ [0,1].
 * Used to propagate evidence through the prerequisite graph.
 */
export function softUpdate(p: number, correct: boolean, weight: number, params: BktParams): number {
  const full = posterior(p, correct, params);
  return clamp(p + (full - p) * weight);
}

/** Binary entropy in bits — how uncertain we are about a concept. */
export function entropy(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}
