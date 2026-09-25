import { builtinCourses } from "@/content";
import { validateCourse } from "@/lib/course-validation";
import { errorResponse, HttpError, rateLimit, readJson } from "@/lib/http";
import { ClassCreateSchema } from "@/lib/schema";
import { classKey, newCode, type ClassRecord } from "@/lib/server/classes";
import { getJson, setJson } from "@/lib/server/store";

export const dynamic = "force-dynamic";

/** Teacher creates a class for one course. Returns the join code and a private teacher key. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "class-create", 10);
    const body = await readJson(req, ClassCreateSchema, 400_000);
    const builtin = builtinCourses.some((c) => c.id === body.courseId);
    if (!builtin) {
      if (!body.course || body.course.id !== body.courseId) throw new HttpError(400, "course_required", "Send the generated course with the class.");
      const { problems } = validateCourse(body.course);
      if (problems.length) throw new HttpError(400, "invalid_course", `Course failed validation: ${problems[0]}`);
    }
    let code = newCode();
    for (let i = 0; i < 5 && (await getJson(classKey(code))); i++) code = newCode();
    const rec: ClassRecord = {
      code,
      name: body.name,
      courseId: body.courseId,
      ...(builtin ? {} : { course: body.course }),
      teacherKey: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await setJson(classKey(code), rec);
    return Response.json({ code, teacherKey: rec.teacherKey }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
