import { generateJson } from "@/lib/ai/provider";
import { normalizeLesson } from "@/lib/ai/normalize";
import { lessonPrompt } from "@/lib/ai/prompts";
import { errorResponse, rateLimit, readJson } from "@/lib/http";
import { LessonRequestSchema } from "@/lib/schema";

export const maxDuration = 60;

/** Lazily generates the teaching material for one concept of a generated course. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "lesson", 30);
    const body = await readJson(req, LessonRequestSchema);
    const { system, prompt } = lessonPrompt(body);
    const raw = await generateJson(system, prompt, { temperature: 0.5, maxTokens: 4000 });
    return Response.json(normalizeLesson(raw));
  } catch (e) {
    return errorResponse(e);
  }
}
