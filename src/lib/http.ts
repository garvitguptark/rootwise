import "server-only";
import type { z } from "zod";
import { AIError } from "./ai/provider";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) {
    return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  }
  if (e instanceof AIError) {
    console.error("[ai]", e.message);
    const status = e.status === 429 ? 429 : e.status === 503 ? 503 : 502;
    const code = e.status === 429 ? "rate_limited" : e.status === 503 ? "ai_unavailable" : e.status === 401 ? "ai_auth" : "ai_error";
    const message = {
      rate_limited: "The AI provider is rate-limiting us. Please wait a few seconds and try again.",
      ai_unavailable: "No AI key is configured on this server, so only the built-in courses are available.",
      ai_auth: "The server's AI key was rejected by the provider. The site owner needs to check GEMINI_API_KEY / OPENAI_API_KEY.",
      ai_error: "The AI provider didn't respond properly. Please try again.",
    }[code];
    return Response.json({ error: { code, message } }, { status });
  }
  console.error("[api]", e);
  return Response.json({ error: { code: "internal", message: "Something went wrong." } }, { status: 500 });
}

/** Reads and validates a JSON body with a size cap. */
export async function readJson<T extends z.ZodType>(req: Request, schema: T, maxBytes = 64_000): Promise<z.infer<T>> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new HttpError(413, "too_large", "Request body is too large.");
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "too_large", "Request body is too large.");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, "bad_json", "Request body must be JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new HttpError(400, "invalid_request", `${issue.path.join(".") || "body"}: ${issue.message}`);
  }
  return parsed.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Best-effort in-memory rate limiting (per server instance). Protects the AI
// key from casual abuse; use a shared store (e.g. Upstash) for strict limits.
// ─────────────────────────────────────────────────────────────────────────────

const buckets = new Map<string, number[]>();

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
  );
}

export function rateLimit(req: Request, scope: string, limit: number, windowMs = 60_000) {
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    throw new HttpError(429, "rate_limited", "Too many requests — please slow down for a minute.");
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
}
