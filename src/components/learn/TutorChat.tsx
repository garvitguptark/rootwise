"use client";

import clsx from "clsx";
import { ArrowUp, Mic, MicOff, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDictation, useReadAloud, useSpeechSupport } from "@/hooks/useSpeech";
import type { ChatMessage, ConceptWithLesson, Course, Misconception, TutorRequest } from "@/lib/schema";
import { useApp } from "@/store/app";
import { LogoMark } from "../Logo";
import { Badge, RichText } from "../ui";

interface Props {
  course: Course;
  concept: ConceptWithLesson;
  isRoot: boolean;
  misconceptions: Misconception[];
  recentMistakes: TutorRequest["recentMistakes"];
  language: TutorRequest["language"];
  /** Text to pre-fill the input with (e.g. a follow-up from teach-back). */
  initialInput?: string;
}

const CHIPS = ["Explain it simply", "Show me an example", "Why was my answer wrong?", "Quiz me"];

export function TutorChat({ course, concept, isRoot, misconceptions, recentMistakes, language, initialInput }: Props) {
  const stored = useApp((s) => s.chats[`${course.id}:${concept.id}`]);
  const setChat = useApp((s) => s.setChat);
  const greeting = useMemo<ChatMessage>(
    () => ({
      role: "assistant",
      content: isRoot
        ? `Your diagnostic traced your mistakes back to **${concept.name}** — so that's where we start. No marks here, just thinking out loud together.\n\n${concept.socratic[0]}`
        : `Let's work on **${concept.name}** together. I'll ask questions rather than lecture — answer in your own words.\n\n${concept.socratic[0]}`,
    }),
    [concept, isRoot],
  );
  const messages = useMemo(() => (stored?.length ? stored : [greeting]), [stored, greeting]);
  const [input, setInput] = useState(initialInput ?? "");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<"ai" | "offline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { tts, stt } = useSpeechSupport();
  const { speak, speakingId } = useReadAloud(language);
  const dictation = useDictation(language, (t) => setInput((v) => (v ? `${v} ${t}` : t)));

  const lastLength = messages.at(-1)?.content.length;
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, lastLength]);

  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;
      setError(null);
      setInput("");
      dictation.stop();
      const history: ChatMessage[] = [...messages, { role: "user", content }];
      setChat(course.id, concept.id, history);
      setStreaming(true);
      const ctrl = new AbortController();
      abort.current = ctrl;
      const body: TutorRequest = {
        courseTitle: course.title,
        level: course.level,
        language,
        concept: { id: concept.id, name: concept.name, lesson: concept.lesson, keyIdeas: concept.keyIdeas, example: concept.example, socratic: concept.socratic },
        prerequisites: concept.prerequisites.map((p) => course.concepts.find((c) => c.id === p)?.name ?? p),
        misconceptions: misconceptions.slice(0, 6).map((m) => ({ label: m.label, explanation: m.explanation })),
        recentMistakes: recentMistakes.slice(0, 4),
        messages: history.slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      };
      let reply = "";
      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
          throw new Error(data?.error?.message ?? "The tutor couldn't respond. Please try again.");
        }
        setMode((res.headers.get("x-rootwise-mode") as "ai" | "offline") ?? null);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setChat(course.id, concept.id, [...history, { role: "assistant", content: reply }]);
        }
        if (!reply.trim()) throw new Error("The tutor returned an empty reply. Please try again.");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
        if (!reply.trim()) setChat(course.id, concept.id, history);
      } finally {
        setStreaming(false);
        abort.current = null;
      }
    },
    [course, concept, language, messages, misconceptions, recentMistakes, setChat, streaming, dictation],
  );

  const lastIsUser = messages.at(-1)?.role === "user";

  return (
    <div className="flex h-[min(680px,calc(100dvh-220px))] min-h-[460px] flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <p className="text-[13px] font-medium">Socratic tutor</p>
        {mode === "offline" && (
          <Badge title="No AI key on the server — using the built-in guided tutor">Offline tutor</Badge>
        )}
        {mode === "ai" && <Badge tone="good">AI</Badge>}
        <button
          type="button"
          onClick={() => {
            abort.current?.abort();
            setChat(course.id, concept.id, []);
            setError(null);
          }}
          className="pressable ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          <RotateCcw className="size-3" /> New chat
        </button>
      </div>

      <div ref={scroller} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex gap-2.5", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && <LogoMark className="mt-0.5 size-6 shrink-0" />}
            <div
              className={clsx(
                "group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed",
                m.role === "user" ? "rounded-br-md bg-brand text-brand-ink" : "rounded-tl-md bg-surface-2 text-ink",
              )}
            >
              {m.role === "assistant" ? <RichText text={m.content} /> : <p className="whitespace-pre-line">{m.content}</p>}
              {m.role === "assistant" && tts && m.content && !(streaming && i === messages.length - 1) && (
                <button
                  type="button"
                  onClick={() => speak(`m${i}`, m.content)}
                  className="absolute -right-8 top-1 rounded-md p-1 text-ink-3 opacity-0 transition-opacity hover:text-ink focus:opacity-100 group-hover:opacity-100"
                  aria-label={speakingId === `m${i}` ? "Stop reading" : "Read aloud"}
                >
                  {speakingId === `m${i}` ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {streaming && lastIsUser && (
          <div className="flex gap-2.5">
            <LogoMark className="mt-0.5 size-6 shrink-0" />
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3.5" aria-label="Tutor is thinking">
              <span className="typing-dot size-1.5 rounded-full bg-ink-3" />
              <span className="typing-dot size-1.5 rounded-full bg-ink-3" />
              <span className="typing-dot size-1.5 rounded-full bg-ink-3" />
            </div>
          </div>
        )}
        {error && (
          <p className="rounded-xl border border-bad/30 bg-bad-soft px-3 py-2 text-[13px] text-bad-ink" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              disabled={streaming}
              onClick={() => send(c)}
              className="pressable shrink-0 rounded-full border border-line-2 px-3 py-1 text-[12.5px] text-ink-2 hover:border-ink-3 hover:text-ink disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-2 rounded-2xl border border-line-2 bg-surface p-1.5 focus-within:border-ink-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            ref={inputRef}
            value={dictation.listening && dictation.interim ? `${input} ${dictation.interim}`.trim() : input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            autoFocus={!!initialInput}
            placeholder={dictation.listening ? "Listening…" : "Type your thinking…"}
            aria-label="Message the tutor (any language)"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[14.5px] outline-none placeholder:text-ink-3 focus-visible:outline-none"
          />
          {stt && (
            <button
              type="button"
              onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
              className={clsx(
                "pressable flex size-10 shrink-0 items-center justify-center rounded-xl",
                dictation.listening ? "bg-bad text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
              aria-label={dictation.listening ? "Stop voice input" : "Speak your answer"}
              aria-pressed={dictation.listening}
            >
              {dictation.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          )}
          {streaming ? (
            <button
              type="button"
              onClick={() => abort.current?.abort()}
              className="pressable flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-ink"
              aria-label="Stop"
            >
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="pressable flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink disabled:opacity-35"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </form>
        {dictation.error && <p className="mt-1.5 text-[12px] text-bad-ink">{dictation.error}</p>}
      </div>
    </div>
  );
}
