"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { builtinCourses } from "@/content";
import { PRACTICE_PARAMS, paramsFor, update, type BktParams } from "@/lib/engine/bkt";
import { buildGraph } from "@/lib/engine/graph";
import type { Plan, PlanSettings } from "@/lib/engine/plan";
import type { ConceptStatus, DiagnosticState } from "@/lib/engine/types";
import type { ChatMessage, Course, LanguageCode, Lesson, TeachBackResult } from "@/lib/schema";

/**
 * Client state, persisted to localStorage. Rootwise needs no account: a
 * student's courses, diagnostics and progress live on their own device.
 */

export interface ConceptProgress {
  p: number;
  status: ConceptStatus;
  verdict?: "root" | "blocked" | "solid" | "shaky" | "inferred";
  practiced: number;
  bestTeachBack?: number;
  updatedAt: string;
}

export interface TeachBackAttempt {
  at: string;
  explanation: string;
  result: TeachBackResult & { mode?: "ai" | "offline" };
}

export interface Settings {
  language: LanguageCode;
  readable: boolean;
  textScale: 1 | 1.125 | 1.25;
  theme: "system" | "light" | "dark";
  autoRead: boolean;
}

export interface StoredPlan {
  settings: PlanSettings;
  plan: Plan;
  createdAt: string;
  /** block id → actual minutes spent */
  done: Record<string, number>;
  active?: { id: string; startedAt: string };
}

export interface TeacherClass {
  code: string;
  teacherKey: string;
  name: string;
  courseId: string;
  createdAt: string;
}

export interface Membership {
  code: string;
  className: string;
  studentId: string;
  name: string;
  /** finishedAt of the diagnostic last sent to the class */
  sentFor?: string;
}

type Key = `${string}:${string}`;
export const key = (courseId: string, conceptId: string): Key => `${courseId}:${conceptId}`;

interface State {
  courses: Course[];
  diagnostics: Record<string, DiagnosticState>;
  progress: Record<string, Record<string, ConceptProgress>>;
  lessons: Record<Key, Lesson>;
  chats: Record<Key, ChatMessage[]>;
  teachbacks: Record<Key, TeachBackAttempt[]>;
  settings: Settings;
  plans: Record<string, StoredPlan>;
  classes: TeacherClass[];
  memberships: Record<string, Membership>;

  addClass: (c: TeacherClass) => void;
  setMembership: (courseId: string, m: Membership | null) => void;

  setPlan: (courseId: string, p: StoredPlan | null) => void;
  startBlock: (courseId: string, blockId: string) => void;
  finishBlock: (courseId: string, blockId: string) => void;
  addCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  addQuestions: (courseId: string, questions: Course["questions"]) => void;
  setLesson: (courseId: string, conceptId: string, lesson: Lesson) => void;
  setDiagnostic: (courseId: string, d: DiagnosticState | null) => void;
  recordPractice: (courseId: string, conceptId: string, correct: boolean, opts: { difficulty: 1 | 2 | 3; optionCount: number }) => ConceptProgress;
  recordTeachBack: (courseId: string, conceptId: string, attempt: TeachBackAttempt) => void;
  setChat: (courseId: string, conceptId: string, messages: ChatMessage[]) => void;
  updateSettings: (s: Partial<Settings>) => void;
  resetCourse: (courseId: string) => void;
}

function statusFor(p: number): ConceptStatus {
  return p >= 0.85 ? "mastered" : p <= 0.3 ? "gap" : "shaky";
}

/** Recomputes root/blocked verdicts after progress changes. */
function withVerdicts(course: Course | undefined, prog: Record<string, ConceptProgress>) {
  if (!course) return prog;
  const g = buildGraph(course.concepts);
  const out = { ...prog };
  for (const id of g.ids) {
    const cp = out[id];
    if (!cp) continue;
    if (cp.status === "gap") {
      const blocked = (g.prereqs.get(id) ?? []).some((p) => out[p]?.status === "gap");
      out[id] = { ...cp, verdict: blocked ? "blocked" : "root" };
    } else if (cp.status === "mastered") {
      out[id] = { ...cp, verdict: cp.verdict === "inferred" && cp.practiced === 0 && !cp.bestTeachBack ? "inferred" : "solid" };
    } else if (cp.status === "shaky") {
      out[id] = { ...cp, verdict: "shaky" };
    }
  }
  return out;
}

const TEACHBACK_EVIDENCE: BktParams = { slip: 0.08, guess: 0.15, transit: 0.15 };

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      courses: [],
      diagnostics: {},
      progress: {},
      lessons: {},
      chats: {},
      teachbacks: {},
      settings: { language: "en", readable: false, textScale: 1, theme: "system", autoRead: false },
      plans: {},
      classes: [],
      memberships: {},

      addClass: (c) => set((s) => ({ classes: [c, ...s.classes.filter((x) => x.code !== c.code)] })),
      setMembership: (courseId, m) =>
        set((s) => {
          const memberships = { ...s.memberships };
          if (m) memberships[courseId] = m;
          else delete memberships[courseId];
          return { memberships };
        }),

      setPlan: (courseId, p) =>
        set((s) => {
          const plans = { ...s.plans };
          if (p) plans[courseId] = p;
          else delete plans[courseId];
          return { plans };
        }),
      startBlock: (courseId, blockId) =>
        set((s) => {
          const p = s.plans[courseId];
          return p ? { plans: { ...s.plans, [courseId]: { ...p, active: { id: blockId, startedAt: new Date().toISOString() } } } } : {};
        }),
      finishBlock: (courseId, blockId) =>
        set((s) => {
          const p = s.plans[courseId];
          if (!p) return {};
          const spent = p.active?.id === blockId ? Math.max(1, Math.round((Date.now() - Date.parse(p.active.startedAt)) / 60000)) : 0;
          return { plans: { ...s.plans, [courseId]: { ...p, active: undefined, done: { ...p.done, [blockId]: spent } } } };
        }),

      addCourse: (c) => set((s) => ({ courses: [c, ...s.courses.filter((x) => x.id !== c.id)] })),
      removeCourse: (id) =>
        set((s) => {
          const { [id]: _d, ...diagnostics } = s.diagnostics;
          const { [id]: _p, ...progress } = s.progress;
          void _d;
          void _p;
          return { courses: s.courses.filter((c) => c.id !== id), diagnostics, progress };
        }),
      addQuestions: (courseId, questions) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, questions: [...c.questions, ...questions.filter((q) => !c.questions.some((x) => x.id === q.id))] }
              : c,
          ),
        })),
      setLesson: (courseId, conceptId, lesson) => set((s) => ({ lessons: { ...s.lessons, [key(courseId, conceptId)]: lesson } })),

      setDiagnostic: (courseId, d) =>
        set((s) => {
          const diagnostics = { ...s.diagnostics };
          const progress = { ...s.progress };
          if (!d) {
            delete diagnostics[courseId];
            return { diagnostics };
          }
          diagnostics[courseId] = d;
          // A finished diagnostic (re)initialises the learning progress.
          if (d.done && (!s.diagnostics[courseId]?.done || s.diagnostics[courseId]?.finishedAt !== d.finishedAt)) {
            const now = new Date().toISOString();
            progress[courseId] = Object.fromEntries(
              Object.entries(d.concepts).map(([id, c]) => [
                id,
                { p: c.p, status: c.status === "unknown" ? "shaky" : c.status, verdict: c.verdict, practiced: 0, updatedAt: now },
              ]),
            ) as Record<string, ConceptProgress>;
          }
          return { diagnostics, progress };
        }),

      recordPractice: (courseId, conceptId, correct, opts) => {
        const course = findCourse(courseId, get().courses);
        const current = get().progress[courseId]?.[conceptId] ?? { p: 0.5, status: "shaky" as ConceptStatus, practiced: 0, updatedAt: "" };
        const p = update(current.p, correct, paramsFor(PRACTICE_PARAMS, opts));
        const next: ConceptProgress = { ...current, p, status: statusFor(p), practiced: current.practiced + 1, updatedAt: new Date().toISOString() };
        set((s) => ({
          progress: { ...s.progress, [courseId]: withVerdicts(course, { ...(s.progress[courseId] ?? {}), [conceptId]: next }) },
        }));
        return get().progress[courseId][conceptId];
      },

      recordTeachBack: (courseId, conceptId, attempt) => {
        const course = findCourse(courseId, get().courses);
        set((s) => {
          const k = key(courseId, conceptId);
          const current = s.progress[courseId]?.[conceptId] ?? { p: 0.5, status: "shaky" as ConceptStatus, practiced: 0, updatedAt: "" };
          // A strong explanation is strong evidence of understanding (and teaching is learning).
          const r = attempt.result;
          const trusted = r.mode !== "offline";
          let p = current.p;
          if (r.verdict === "mastered") p = update(p, true, trusted ? TEACHBACK_EVIDENCE : PRACTICE_PARAMS);
          else if (r.verdict === "needs-work" && trusted) p = update(p, false, TEACHBACK_EVIDENCE);
          const next: ConceptProgress = {
            ...current,
            p,
            status: statusFor(p),
            bestTeachBack: Math.max(current.bestTeachBack ?? 0, r.score),
            updatedAt: attempt.at,
          };
          return {
            teachbacks: { ...s.teachbacks, [k]: [attempt, ...(s.teachbacks[k] ?? [])].slice(0, 10) },
            progress: { ...s.progress, [courseId]: withVerdicts(course, { ...(s.progress[courseId] ?? {}), [conceptId]: next }) },
          };
        });
      },

      setChat: (courseId, conceptId, messages) => set((s) => ({ chats: { ...s.chats, [key(courseId, conceptId)]: messages.slice(-40) } })),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetCourse: (courseId) =>
        set((s) => {
          const strip = <T,>(rec: Record<string, T>) =>
            Object.fromEntries(Object.entries(rec).filter(([k]) => !k.startsWith(`${courseId}:`))) as Record<Key, T>;
          const { [courseId]: _d, ...diagnostics } = s.diagnostics;
          const { [courseId]: _p, ...progress } = s.progress;
          void _d;
          void _p;
          return { diagnostics, progress, chats: strip(s.chats), teachbacks: strip(s.teachbacks) };
        }),
    }),
    {
      name: "rootwise:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        courses: s.courses,
        diagnostics: s.diagnostics,
        progress: s.progress,
        lessons: s.lessons,
        chats: s.chats,
        teachbacks: s.teachbacks,
        settings: s.settings,
        plans: s.plans,
        classes: s.classes,
        memberships: s.memberships,
      }),
    },
  ),
);

export function findCourse(id: string, userCourses: Course[]): Course | undefined {
  return builtinCourses.find((c) => c.id === id) ?? userCourses.find((c) => c.id === id);
}

/** True once persisted state has been loaded from localStorage. */
export function useHydrated(): boolean {
  // The server snapshot is `false`, so the first client render matches the
  // server HTML; React then re-renders with the hydrated store.
  return useSyncExternalStore(
    (cb) => useApp.persist.onFinishHydration(cb),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}

/** A course (built-in or generated) with lazily generated lessons merged in. */
export function useCourse(id: string): Course | undefined {
  const courses = useApp((s) => s.courses);
  const lessons = useApp((s) => s.lessons);
  const base = findCourse(id, courses);
  if (!base || base.source === "builtin") return base;
  return mergeLessons(base, lessons);
}

const mergeCache = new WeakMap<Course, { lessons: Record<Key, Lesson>; merged: Course }>();
function mergeLessons(course: Course, lessons: Record<Key, Lesson>): Course {
  const hit = mergeCache.get(course);
  if (hit && hit.lessons === lessons) return hit.merged;
  const merged: Course = {
    ...course,
    concepts: course.concepts.map((c) => ({ ...c, ...(lessons[key(course.id, c.id)] ?? {}) })),
  };
  mergeCache.set(course, { lessons, merged });
  return merged;
}
