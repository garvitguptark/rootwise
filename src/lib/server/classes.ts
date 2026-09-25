import "server-only";
import { builtinCourses } from "@/content";
import { HttpError } from "@/lib/http";
import type { Course } from "@/lib/schema";
import { getJson } from "./store";

export interface ClassRecord {
  code: string;
  name: string;
  courseId: string;
  /** Stored only for AI-generated courses; built-in courses are resolved by id. */
  course?: Course;
  teacherKey: string;
  createdAt: string;
}

export interface StudentRecord {
  name: string;
  state: unknown;
  submittedAt: string;
}

export const classKey = (code: string) => `class:${code}`;
export const studentsKey = (code: string) => `class:${code}:students`;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I
export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function normalizeCode(raw: string): string {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new HttpError(400, "bad_code", "Class codes have 6 letters and digits.");
  return code;
}

export async function loadClass(code: string): Promise<ClassRecord> {
  const rec = await getJson<ClassRecord>(classKey(code));
  if (!rec) throw new HttpError(404, "no_class", "No class with that code. Check it with your teacher.");
  return rec;
}

export function courseFor(rec: ClassRecord): Course {
  const course = rec.course ?? builtinCourses.find((c) => c.id === rec.courseId);
  if (!course) throw new HttpError(404, "no_course", "This class's course is no longer available.");
  return course;
}
