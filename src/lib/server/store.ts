import "server-only";

/**
 * Tiny persistence layer for classes.
 *
 * Production: Redis over Upstash's REST API (plain fetch, no SDK). Vercel's
 * Storage tab → Upstash Redis injects KV_REST_API_URL / KV_REST_API_TOKEN.
 * Without those it falls back to process memory, which is fine for local
 * development but does not survive serverless restarts — /api/status reports
 * which mode is active so the UI can say so.
 */

const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const storageMode: "redis" | "memory" = URL_ && TOKEN ? "redis" : "memory";

const TTL = 60 * 60 * 24 * 120; // classes expire after 120 days

type Mem = { kv: Map<string, string>; hashes: Map<string, Map<string, string>> };
const mem: Mem = ((globalThis as { __rootwiseMem?: Mem }).__rootwiseMem ??= { kv: new Map(), hashes: new Map() });

async function redis<T>(...cmd: (string | number)[]): Promise<T> {
  const res = await fetch(URL_!, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`storage ${res.status}`);
  const data = (await res.json()) as { result: T; error?: string };
  if (data.error) throw new Error(`storage: ${data.error}`);
  return data.result;
}

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = storageMode === "redis" ? await redis<string | null>("GET", key) : (mem.kv.get(key) ?? null);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function setJson(key: string, value: unknown): Promise<void> {
  const raw = JSON.stringify(value);
  if (storageMode === "redis") await redis("SET", key, raw, "EX", TTL);
  else mem.kv.set(key, raw);
}

export async function hset(key: string, field: string, value: unknown): Promise<void> {
  const raw = JSON.stringify(value);
  if (storageMode === "redis") {
    await redis("HSET", key, field, raw);
    await redis("EXPIRE", key, TTL);
  } else {
    if (!mem.hashes.has(key)) mem.hashes.set(key, new Map());
    mem.hashes.get(key)!.set(field, raw);
  }
}

export async function hgetall<T>(key: string): Promise<Record<string, T>> {
  if (storageMode === "redis") {
    const flat = (await redis<string[] | null>("HGETALL", key)) ?? [];
    const out: Record<string, T> = {};
    for (let i = 0; i + 1 < flat.length; i += 2) out[flat[i]] = JSON.parse(flat[i + 1]) as T;
    return out;
  }
  return Object.fromEntries([...(mem.hashes.get(key) ?? new Map()).entries()].map(([k, v]) => [k, JSON.parse(v) as T]));
}

export async function hlen(key: string): Promise<number> {
  if (storageMode === "redis") return redis<number>("HLEN", key);
  return mem.hashes.get(key)?.size ?? 0;
}
