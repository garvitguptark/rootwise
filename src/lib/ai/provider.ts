import "server-only";
import { extractJson } from "./normalize";

/**
 * Provider-agnostic LLM access over plain fetch (no SDK lock-in).
 *
 *   GEMINI_API_KEY                → Google Gemini (default model chain below)
 *   OPENAI_API_KEY [+ OPENAI_BASE_URL, OPENAI_MODEL]
 *                                 → OpenAI or any OpenAI-compatible API
 *   GROQ_API_KEY [+ GROQ_MODEL]   → Groq (OpenAI-compatible)
 *   nothing                       → demo mode (built-in courses + offline tutor)
 *
 * AI_PROVIDER=gemini|openai|groq|demo forces a choice.
 */

export type ProviderName = "gemini" | "openai" | "groq" | "demo";

export interface ProviderInfo {
  name: ProviderName;
  model: string;
  live: boolean;
}

export interface Msg {
  role: "user" | "assistant";
  content: string;
}

export class AIError extends Error {
  constructor(
    message: string,
    public status = 502,
    public retryable = false,
  ) {
    super(message);
  }
}

const GEMINI_DEFAULT_CHAIN = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function geminiKey() {
  return env("GEMINI_API_KEY") ?? env("GOOGLE_API_KEY") ?? env("GOOGLE_GENERATIVE_AI_API_KEY");
}

export function providerInfo(): ProviderInfo {
  const forced = env("AI_PROVIDER")?.toLowerCase() as ProviderName | undefined;
  const pick = (name: ProviderName): ProviderInfo | null => {
    switch (name) {
      case "gemini":
        return geminiKey() ? { name, model: env("GEMINI_MODEL") ?? GEMINI_DEFAULT_CHAIN[0], live: true } : null;
      case "openai":
        return env("OPENAI_API_KEY") ? { name, model: env("OPENAI_MODEL") ?? "gpt-4o-mini", live: true } : null;
      case "groq":
        return env("GROQ_API_KEY") ? { name, model: env("GROQ_MODEL") ?? "llama-3.3-70b-versatile", live: true } : null;
      default:
        return null;
    }
  };
  if (forced === "demo") return { name: "demo", model: "offline", live: false };
  if (forced) {
    const p = pick(forced);
    if (p) return p;
  }
  return pick("gemini") ?? pick("openai") ?? pick("groq") ?? { name: "demo", model: "offline", live: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini
// ─────────────────────────────────────────────────────────────────────────────

function isAuthError(status: number, text: string): boolean {
  return status === 401 || status === 403 || /API[_ ]?key (not valid|invalid)|API_KEY_INVALID|PERMISSION_DENIED/i.test(text);
}

function geminiModels(): string[] {
  const configured = env("GEMINI_MODEL");
  return configured ? [configured, ...GEMINI_DEFAULT_CHAIN.filter((m) => m !== configured)] : GEMINI_DEFAULT_CHAIN;
}

function geminiBody(system: string, messages: Msg[], json: boolean, temperature: number, maxTokens: number, thinking: boolean) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: {
      temperature,
      // Thought tokens count toward this limit, so leave generous headroom.
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: "application/json" } : {}),
      // Gemini 3.x: keep reasoning light for snappy tutoring and generation.
      ...(thinking ? { thinkingConfig: { thinkingLevel: env("GEMINI_THINKING") ?? "low" } } : {}),
    },
  });
}

type GeminiBody = (thinking: boolean) => string;

async function geminiFetch(path: string, body: GeminiBody, signal: AbortSignal): Promise<Response> {
  let lastError: AIError | null = null;
  let lastStatus = 0;
  for (const model of geminiModels()) {
    let thinking = env("GEMINI_THINKING") !== "off";
    for (let attempt = 0; attempt < 2; attempt++) {
      const base = (env("GEMINI_BASE_URL") ?? "https://generativelanguage.googleapis.com").replace(/\/$/, "");
      const res = await fetch(`${base}/v1beta/models/${model}:${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": geminiKey()! },
        body: body(thinking),
        signal,
      });
      if (res.ok) return res;
      const text = await res.text().catch(() => "");
      lastStatus = res.status;
      if (isAuthError(res.status, text)) throw new AIError(`Gemini rejected the API key: ${text.slice(0, 200)}`, 401);
      lastError = new AIError(`Gemini ${model} ${res.status}: ${text.slice(0, 300)}`, res.status === 429 ? 429 : 502, true);
      // Older models reject thinkingLevel — retry the same model without it.
      if (res.status === 400 && thinking && /thinking/i.test(text)) {
        thinking = false;
        continue;
      }
      break;
    }
    // Try the next model on "model not found", quota and transient errors.
    if (![400, 404, 429, 500, 503, 504].includes(lastStatus)) break;
    if (lastStatus === 400 && !/model|not found|unsupported/i.test(lastError?.message ?? "")) break;
  }
  throw lastError ?? new AIError("Gemini request failed");
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI-compatible (OpenAI, Groq, OpenRouter, Together, local vLLM, …)
// ─────────────────────────────────────────────────────────────────────────────

function openaiTarget(name: ProviderName) {
  if (name === "groq") {
    return { base: "https://api.groq.com/openai/v1", key: env("GROQ_API_KEY")!, model: env("GROQ_MODEL") ?? "llama-3.3-70b-versatile" };
  }
  return {
    base: (env("OPENAI_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    key: env("OPENAI_API_KEY")!,
    model: env("OPENAI_MODEL") ?? "gpt-4o-mini",
  };
}

async function openaiFetch(
  name: ProviderName,
  system: string,
  messages: Msg[],
  opts: { json: boolean; stream: boolean; temperature: number; maxTokens: number },
  signal: AbortSignal,
): Promise<Response> {
  const t = openaiTarget(name);
  const res = await fetch(`${t.base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${t.key}` },
    body: JSON.stringify({
      model: t.model,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: opts.stream,
      messages: [{ role: "system", content: system }, ...messages],
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (isAuthError(res.status, text)) throw new AIError(`${name} rejected the API key: ${text.slice(0, 200)}`, 401);
    throw new AIError(`${name} ${res.status}: ${text.slice(0, 300)}`, res.status === 429 ? 429 : 502, true);
  }
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Calls the model in JSON mode; retries once if the output isn't parseable. */
export async function generateJson(
  system: string,
  prompt: string,
  opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<unknown> {
  const info = providerInfo();
  if (!info.live) throw new AIError("No AI provider configured", 503);
  const temperature = opts.temperature ?? 0.4;
  const maxTokens = opts.maxTokens ?? 8192;
  const messages: Msg[] = [{ role: "user", content: prompt }];

  for (let attempt = 0; attempt < 2; attempt++) {
    const signal = AbortSignal.timeout(opts.timeoutMs ?? 55_000);
    let text = "";
    if (info.name === "gemini") {
      const res = await geminiFetch("generateContent", (t) => geminiBody(system, messages, true, temperature, maxTokens, t), signal);
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    } else {
      const res = await openaiFetch(info.name, system, messages, { json: true, stream: false, temperature, maxTokens }, signal);
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      text = data.choices?.[0]?.message?.content ?? "";
    }
    try {
      return extractJson(text);
    } catch {
      if (attempt === 1) throw new AIError("Model returned invalid JSON");
    }
  }
  throw new AIError("Model returned invalid JSON");
}

/** Streams plain text deltas from the model. */
export async function* streamText(
  system: string,
  messages: Msg[],
  opts: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): AsyncGenerator<string> {
  const info = providerInfo();
  if (!info.live) throw new AIError("No AI provider configured", 503);
  const signal = opts.signal ?? AbortSignal.timeout(60_000);
  const temperature = opts.temperature ?? 0.6;
  const maxTokens = opts.maxTokens ?? 1024;

  const res =
    info.name === "gemini"
      ? await geminiFetch("streamGenerateContent?alt=sse", (t) => geminiBody(system, messages, false, temperature, maxTokens, t), signal)
      : await openaiFetch(info.name, system, messages, { json: false, stream: true, temperature, maxTokens }, signal);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const data = JSON.parse(payload);
        const chunk =
          info.name === "gemini"
            ? (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string; thought?: boolean }) => (p.thought ? "" : p.text ?? "")).join("")
            : data.choices?.[0]?.delta?.content ?? "";
        if (chunk) yield chunk;
      } catch {
        // ignore keep-alives / partial lines
      }
    }
  }
}
