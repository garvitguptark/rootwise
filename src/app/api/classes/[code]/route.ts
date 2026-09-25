import { errorResponse, rateLimit } from "@/lib/http";
import { courseFor, loadClass, normalizeCode, studentsKey, type StudentRecord } from "@/lib/server/classes";
import { hgetall, hlen } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/**
 * Public: class name + course (what a joining student needs).
 * With ?key=<teacherKey>: also every student's diagnostic, for the dashboard.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/classes/[code]">) {
  try {
    rateLimit(req, "class-read", 120);
    const code = normalizeCode((await ctx.params).code);
    const rec = await loadClass(code);
    const key = new URL(req.url).searchParams.get("key");
    const base = { code, name: rec.name, courseId: rec.courseId, course: courseFor(rec), createdAt: rec.createdAt };
    if (!key) return Response.json({ ...base, studentCount: await hlen(studentsKey(code)) });
    if (key !== rec.teacherKey) return Response.json({ error: { code: "forbidden", message: "Wrong teacher key." } }, { status: 403 });
    const students = await hgetall<StudentRecord>(studentsKey(code));
    return Response.json({
      ...base,
      students: Object.entries(students)
        .map(([id, s]) => ({ id, name: s.name, state: s.state, submittedAt: s.submittedAt }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
