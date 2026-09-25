"use client";

import clsx from "clsx";
import { Check, Gamepad2, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { useState } from "react";
import { useReadAloud, useSpeechSupport } from "@/hooks/useSpeech";
import { Button, Card } from "../ui";

/** Rounds: the first mirrors the diagnostic question most students miss (10, −7). */
export const PRODUCT_SUM_ROUNDS: [product: number, sum: number][] = [
  [10, -7],
  [12, 7],
  [-18, 3],
  [-24, -5],
  [36, -13],
];

export function tilesFor(product: number): number[] {
  const n = Math.abs(product);
  const ds: number[] = [];
  for (let d = 1; d <= Math.min(n, 12); d++) if (n % d === 0) ds.push(d);
  return [...ds.map((d) => -d), ...ds].sort((a, b) => a - b);
}

const fmt = (n: number) => (n < 0 ? `−${-n}` : `${n}`);

/**
 * A game for product–sum pairs: pick two tiles, watch product and sum update
 * live, and get told exactly which condition fails — sign errors included.
 */
export function ProductSumGame({
  mistake,
  language,
  onRound,
}: {
  mistake?: { stem: string; chosen: string };
  language: string;
  onRound: (firstTry: boolean) => void;
}) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(false);
  const { tts } = useSpeechSupport();
  const { speak, speakingId } = useReadAloud(language);
  const finished = round >= PRODUCT_SUM_ROUNDS.length;
  const [P, S] = PRODUCT_SUM_ROUNDS[Math.min(round, PRODUCT_SUM_ROUNDS.length - 1)];
  const tiles = tilesFor(P);
  const values = picked.map((i) => tiles[i]);
  const prod = values.length === 2 ? values[0] * values[1] : null;
  const sum = values.length === 2 ? values[0] + values[1] : null;
  const instruction = `Find two numbers that multiply to ${P} and add to ${S}.`;

  const hint =
    prod === null || solved
      ? null
      : prod === P && sum === -S
        ? "Right numbers, wrong signs — flip both signs. A positive product with a negative sum means both are negative."
        : prod === P
          ? P < 0
            ? "The product works. Now the larger number must take the sign of the sum."
            : "The product works, the sum doesn't. Try another factor pair."
          : prod === -P
            ? `The signs don't match: a ${P > 0 ? "positive" : "negative"} product needs ${P > 0 ? "same" : "opposite"} signs.`
            : "Check the product first — list the factor pairs.";

  // `picked` holds tile indices (the same number can appear as two tiles only via ±).
  const pick = (idx: number) => {
    if (solved) return;
    const next = picked.includes(idx) ? picked.filter((x) => x !== idx) : picked.length >= 2 ? [idx] : [...picked, idx];
    setPicked(next);
    if (next.length !== 2) return;
    const [a, b] = next.map((i) => tiles[i]);
    if (a * b === P && a + b === S) {
      setSolved(true);
      if (misses === 0) setScore((x) => x + 1);
      onRound(misses === 0);
    } else setMisses((m) => m + 1);
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    setPicked([]);
    setMisses(0);
    setSolved(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-2/60 px-5 py-3">
        <Gamepad2 className="size-4 text-accent-ink" aria-hidden />
        <p className="text-[13px] font-semibold">Play: the product–sum game</p>
        <span className="ml-auto font-mono text-[12px] text-ink-3">
          {finished ? "done" : `round ${round + 1}/${PRODUCT_SUM_ROUNDS.length}`} · score {score}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        {mistake && round === 0 && (
          <p className="mb-4 rounded-xl border border-bad/25 bg-bad-soft px-4 py-3 text-[13.5px] text-bad-ink">
            In your diagnostic you answered <strong>“{mistake.chosen}”</strong> to “{mistake.stem}”. Round 1 is that exact question — watch what the signs do.
          </p>
        )}
        {finished ? (
          <div className="text-center">
            <p className="font-serif text-[30px]">
              {score}/{PRODUCT_SUM_ROUNDS.length} on the first try
            </p>
            <p className="mt-1 text-[14px] text-ink-2">Every round counted as evidence — check how your map moved.</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setRound(0);
                setScore(0);
                setPicked([]);
                setSolved(false);
                setMisses(0);
              }}
            >
              <RotateCcw className="size-4" /> Play again
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[18px] font-medium">
                Multiply to <span className="font-mono text-accent-ink">{fmt(P)}</span>, add to <span className="font-mono text-accent-ink">{fmt(S)}</span>
              </p>
              {tts && (
                <button type="button" onClick={() => speak("game", instruction)} className="pressable inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-ink-3 hover:bg-surface-2" aria-label="Read the question aloud">
                  {speakingId === "game" ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />} Listen
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Number tiles — pick two">
              {tiles.map((n, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={picked.includes(i)}
                  onClick={() => pick(i)}
                  className={clsx(
                    "pressable h-12 min-w-12 rounded-xl border px-3 font-mono text-[17px] font-semibold",
                    picked.includes(i) ? (solved ? "border-good bg-good-soft text-good-ink" : "border-ink bg-brand text-brand-ink") : "border-line bg-surface hover:bg-surface-2",
                  )}
                >
                  {fmt(n)}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-live="polite">
              {[
                ["Product", prod, P],
                ["Sum", sum, S],
              ].map(([k, v, target]) => (
                <div key={k as string} className={clsx("flex items-center justify-between rounded-xl border px-4 py-2.5", v === null ? "border-line" : v === target ? "border-good/40 bg-good-soft" : "border-bad/30 bg-bad-soft")}>
                  <span className="text-[13px] text-ink-2">
                    {k}: {values.length === 2 ? `${fmt(values[0])} ${k === "Product" ? "×" : "+"} ${values[1] < 0 ? `(${fmt(values[1])})` : fmt(values[1])}` : "pick two tiles"}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[15px] font-semibold">
                    {v === null ? "—" : fmt(v as number)}
                    {v !== null && (v === target ? <Check className="size-4 text-good-ink" /> : <X className="size-4 text-bad-ink" />)}
                  </span>
                </div>
              ))}
            </div>
            {hint && <p className="mt-3 text-[13.5px] font-medium text-warn-ink">{hint}</p>}
            {solved && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-[14px] font-medium text-good-ink">
                  {fmt(values[0])} and {fmt(values[1])} ✓ {misses === 0 ? "First try!" : `Got it after ${misses} ${misses === 1 ? "miss" : "misses"}.`}
                </p>
                <Button onClick={nextRound} className="ml-auto">
                  {round + 1 < PRODUCT_SUM_ROUNDS.length ? "Next round" : "Finish"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
