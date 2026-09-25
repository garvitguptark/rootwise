"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { language } from "@/lib/languages";

/**
 * Browser speech (Web Speech API): read-aloud for low-literacy and visually
 * impaired learners, and dictation so students can explain out loud in their
 * own language. Degrades gracefully where unsupported.
 */

const noop = () => () => {};

export function useSpeechSupport() {
  const tts = useSyncExternalStore(noop, () => "speechSynthesis" in window, () => false);
  const stt = useSyncExternalStore(
    noop,
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );
  return { tts, stt };
}

function pickVoice(tag: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const lang = tag.split("-")[0];
  return (
    voices.find((v) => v.lang === tag) ??
    voices.find((v) => v.lang.startsWith(lang)) ??
    (lang === "en" ? voices.find((v) => v.lang.startsWith("en")) : undefined)
  );
}

/** Makes maths symbols speakable. */
function speakable(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/²/g, " squared")
    .replace(/³/g, " cubed")
    .replace(/√/g, " root of ")
    .replace(/±/g, " plus or minus ")
    .replace(/−/g, " minus ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/≤/g, " less than or equal to ")
    .replace(/≥/g, " greater than or equal to ")
    .replace(/Ω/g, " ohms")
    .replace(/µ/g, " micro");
}

export function useReadAloud(lang: string) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = useCallback(
    (id: string, text: string) => {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }
      const tag = language(lang).speech;
      const u = new SpeechSynthesisUtterance(speakable(text));
      u.lang = tag;
      const v = pickVoice(tag);
      if (v) u.voice = v;
      u.rate = 0.95;
      u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
      u.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      synth.speak(u);
    },
    [lang, speakingId],
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  return { speak, stop, speakingId };
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

export function useDictation(lang: string, onText: (finalText: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<RecognitionLike | null>(null);
  const cb = useRef(onText);
  useEffect(() => {
    cb.current = onText;
  }, [onText]);
  useEffect(() => () => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => RecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => RecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const r = new Ctor();
    r.lang = language(lang).speech;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) cb.current(res[0].transcript.trim());
        else live += res[0].transcript;
      }
      setInterim(live);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Microphone permission was denied." : `Voice input stopped (${e.error}).`);
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  }, [lang]);

  const stop = useCallback(() => rec.current?.stop(), []);
  return { listening, interim, error, start, stop };
}
