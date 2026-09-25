import type { Course } from "@/lib/schema";
import { circuits } from "./circuits";
import { quadratics } from "./quadratics";

export const builtinCourses: Course[] = [quadratics, circuits];

export function getBuiltinCourse(id: string): Course | undefined {
  return builtinCourses.find((c) => c.id === id);
}

export const DEMO_COURSE_ID = quadratics.id;
