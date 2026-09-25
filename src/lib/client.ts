"use client";

import type { Course, Lesson } from "./schema";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError("Couldn't reach the server. Check your connection.", 0);
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status})`, res.status, data?.error?.code);
  }
  return (await res.json()) as T;
}

export function lessonRequest(course: Course, conceptId: string, language: string) {
  const c = course.concepts.find((x) => x.id === conceptId)!;
  const names = new Map(course.concepts.map((x) => [x.id, x.name]));
  return {
    courseTitle: course.title,
    level: course.level,
    audience: course.audience || undefined,
    language,
    concept: { id: c.id, name: c.name, summary: c.summary },
    prerequisites: c.prerequisites.map((p) => names.get(p) ?? p),
    misconceptions: course.misconceptions.filter((m) => m.conceptId === c.id).map((m) => m.label).slice(0, 6),
  };
}

export type { Lesson };
