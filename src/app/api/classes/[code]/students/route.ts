import { errorResponse, HttpError, rateLimit, readJson } from "@/lib/http";
import { ClassSubmitSchema } from "@/lib/schema";
import { courseFor, loadClass, normalizeCode, studentsKey } from "@/lib/server/classes";
import { hlen, hset } from "@/lib/server/store";

export const dynamic = "force-dynamic";

const MAX_STUDENTS = 200;

/** A student submits (or re-submits) their finished diagnostic to the class. */
export async function POST(req: Request, ctx: RouteContext<"/api/classes/[code]/students">) {
  try {
    rateLimit(req, "class-submit", 30);
    const code = normalizeCode((await ctx.params).code);
    const rec = await loadClass(code);
    const body = await readJson(req, ClassSubmitSchema, 120_000);
    const course = courseFor(rec);
    if (body.state.courseId !== course.id) throw new HttpError(400, "wrong_course", "That diagnostic is for a different course.");
    const known = new Set(course.concepts.map((c) => c.id));
    if (!Object.keys(body.state.concepts).every((id) => known.has(id))) throw new HttpError(400, "wrong_course", "Diagnostic doesn't match the course.");
    if ((await hlen(studentsKey(code))) >= MAX_STUDENTS) throw new HttpError(409, "class_full", "This class is full.");
    await hset(studentsKey(code), body.studentId, { name: body.name, state: body.state, submittedAt: new Date().toISOString() });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
