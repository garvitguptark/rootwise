import { CourseSchema, type Course } from "./schema";
import { buildGraph, topoSort } from "./engine/graph";

/**
 * Semantic checks on top of the Zod schema: ids are unique, every reference
 * resolves, the prerequisite graph is acyclic, and each concept can actually
 * be assessed. Returns human-readable problems (empty = valid).
 */
export function validateCourse(input: unknown): { course?: Course; problems: string[] } {
  const parsed = CourseSchema.safeParse(input);
  if (!parsed.success) {
    return { problems: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const course = parsed.data;
  const problems: string[] = [];
  const conceptIds = new Set<string>();
  for (const c of course.concepts) {
    if (conceptIds.has(c.id)) problems.push(`duplicate concept id ${c.id}`);
    conceptIds.add(c.id);
  }
  for (const c of course.concepts) {
    for (const p of c.prerequisites) if (!conceptIds.has(p)) problems.push(`${c.id}: unknown prerequisite ${p}`);
  }
  for (const t of course.targetConceptIds) if (!conceptIds.has(t)) problems.push(`unknown target ${t}`);

  const misIds = new Set<string>();
  for (const m of course.misconceptions) {
    if (misIds.has(m.id)) problems.push(`duplicate misconception id ${m.id}`);
    misIds.add(m.id);
    if (!conceptIds.has(m.conceptId)) problems.push(`misconception ${m.id}: unknown concept ${m.conceptId}`);
  }

  const qIds = new Set<string>();
  const perConcept = new Map<string, number>();
  for (const q of course.questions) {
    if (qIds.has(q.id)) problems.push(`duplicate question id ${q.id}`);
    qIds.add(q.id);
    if (!conceptIds.has(q.conceptId)) problems.push(`question ${q.id}: unknown concept ${q.conceptId}`);
    perConcept.set(q.conceptId, (perConcept.get(q.conceptId) ?? 0) + 1);
    const optIds = new Set(q.options.map((o) => o.id));
    if (optIds.size !== q.options.length) problems.push(`question ${q.id}: duplicate option ids`);
    if (!optIds.has(q.correctOptionId)) problems.push(`question ${q.id}: correct option missing`);
    const texts = new Set(q.options.map((o) => o.text.trim().toLowerCase()));
    if (texts.size !== q.options.length) problems.push(`question ${q.id}: duplicate option text`);
    for (const o of q.options) {
      if (o.misconceptionId && !misIds.has(o.misconceptionId)) {
        problems.push(`question ${q.id}: unknown misconception ${o.misconceptionId}`);
      }
      if (o.misconceptionId && o.id === q.correctOptionId) problems.push(`question ${q.id}: correct option tagged`);
    }
  }
  for (const id of conceptIds) {
    if ((perConcept.get(id) ?? 0) < 2) problems.push(`concept ${id} has fewer than 2 questions`);
  }
  try {
    topoSort(buildGraph(course.concepts));
  } catch {
    problems.push("prerequisite graph has a cycle");
  }
  return { course, problems };
}
