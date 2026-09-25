import { scoreTeachBack } from "./ai/normalize";
import type { ChatMessage, Lesson, TeachBackResult } from "./schema";

/**
 * Offline fallbacks used when no AI provider is configured (or it fails).
 * They are deliberately simple and clearly labelled in the UI as offline —
 * the product still works end-to-end on a stage with no internet.
 */

const STOP = new Set(
  "the a an and or of to in on at for is are was were be been it its this that these those with as by from into than then so if not no can has have had you your they them their we our he she his her i me my do does did will would should could about which what when where who how why also just only more most very same each every any all both such there here other one two three a's".split(
    " ",
  ),
);

function stem(w: string): string {
  return w.replace(/(ing|ed|es|s|ly)$/u, "");
}

export function keywords(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}²³√±]+/gu) ?? [])
    .filter((w) => (w.length >= 3 || /\d|[²√±]/u.test(w)) && !STOP.has(w))
    .map(stem);
}

function covers(expl: Set<string>, idea: string): number {
  const ks = [...new Set(keywords(idea))];
  if (!ks.length) return 0;
  const hit = ks.filter((k) => expl.has(k) || [...expl].some((e) => e.length >= 4 && k.length >= 4 && (e.startsWith(k) || k.startsWith(e))));
  return hit.length / ks.length;
}

export function offlineTeachBack(explanation: string, keyIdeas: string[]): TeachBackResult & { mode: "offline" } {
  const expl = new Set(keywords(explanation));
  const coverage = keyIdeas.map((k) => covers(expl, k));
  const covered = keyIdeas.filter((_, i) => coverage[i] >= 0.5);
  const missing = keyIdeas.filter((_, i) => coverage[i] < 0.5);
  const words = explanation.trim().split(/\s+/).filter(Boolean).length;
  const hasExample = /\d|for example|e\.g\.|like when|udaharan|उदाहरण|जैसे/i.test(explanation);
  const completeness = Math.round((100 * covered.length) / Math.max(1, keyIdeas.length));
  const clarity = Math.round(Math.min(90, (words < 12 ? 35 : words < 25 ? 55 : words <= 220 ? 70 : 60) + (hasExample ? 15 : 0)));
  // Offline we can't verify correctness, so accuracy is estimated from coverage.
  const accuracy = Math.round(50 + completeness / 2);
  return {
    mode: "offline",
    accuracy,
    completeness,
    clarity,
    ...scoreTeachBack(accuracy, completeness, clarity),
    coveredIdeas: covered,
    missingIdeas: missing,
    misconceptions: [],
    strength: covered.length
      ? `You clearly explained: “${covered[0]}”.`
      : words > 20
        ? "You made a real attempt to put it in your own words — that's where learning starts."
        : "Good start — try writing a few more sentences.",
    followUp: missing.length
      ? `Can you add how this connects to: “${missing[0]}”?`
      : "Great coverage! Can you invent your own example and solve it step by step?",
  };
}

/** A scripted Socratic tutor built from the concept's lesson material. */
export function offlineTutorReply(
  concept: { name: string } & Lesson,
  messages: ChatMessage[],
  misconceptions: { label: string; explanation: string }[],
): string {
  const turn = messages.filter((m) => m.role === "assistant").length;
  const last = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() ?? "";
  const pick = <T,>(xs: T[], i: number) => xs[i % xs.length];

  if (/example|show me|udaharan|उदाहरण|worked/.test(last)) {
    return `Here's a worked example.\n\n**${concept.example.problem}**\n${concept.example.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nWhich step would you have found hardest?`;
  }
  if (/wrong|mistake|galat|गलत|why did|misconception/.test(last) && misconceptions.length) {
    const m = pick(misconceptions, turn);
    return `Your answers suggested this idea: **${m.label}**.\n\n${m.explanation}\n\nCan you explain in your own words why it doesn't work?`;
  }
  if (/simple|explain|samjha|समझा|what is|kya hai|क्या है/.test(last)) {
    return `${concept.lesson}\n\n${pick(concept.socratic, turn)}`;
  }
  if (/quiz|test me|question|practice|pooch|पूछ/.test(last)) {
    return `Try this one: ${pick(concept.socratic, turn + 1)}\n\nTake your time — tell me your reasoning, not just the answer.`;
  }
  if (/don'?t know|idk|no idea|stuck|pata nahi|पता नहीं|confus/.test(last)) {
    return `No problem — let's go one small step at a time. Here's a hint: **${pick(concept.keyIdeas, turn)}**.\n\nWith that in mind: ${pick(concept.socratic, turn)}`;
  }
  const idea = pick(concept.keyIdeas, turn);
  return `Good thinking. Let's check it against the key idea: **${idea}**. Does your reasoning agree with that?\n\nNext: ${pick(concept.socratic, turn + 1)}`;
}
