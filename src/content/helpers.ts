import type { Difficulty, Question } from "@/lib/schema";

/** [option text, misconception id revealed by picking it] */
export type Opt = [text: string, misconceptionId?: string];

const LETTERS = ["a", "b", "c", "d", "e"] as const;

/** Compact builder for multiple-choice questions. `correct` is a 0-based index. */
export function mcq(
  id: string,
  conceptId: string,
  difficulty: Difficulty,
  stem: string,
  options: Opt[],
  correct: number,
  explanation: string,
): Question {
  return {
    id,
    conceptId,
    difficulty,
    stem,
    options: options.map(([text, misconceptionId], i) => ({
      id: LETTERS[i],
      text,
      ...(misconceptionId && i !== correct ? { misconceptionId } : {}),
    })),
    correctOptionId: LETTERS[correct],
    explanation,
  };
}
