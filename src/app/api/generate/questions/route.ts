import { generateJson } from "@/lib/ai/provider";
import { hash, normalizeQuestions } from "@/lib/ai/normalize";
import { questionsPrompt } from "@/lib/ai/prompts";
import { errorResponse, rateLimit, readJson } from "@/lib/http";
import { QuestionsRequestSchema } from "@/lib/schema";

export const maxDuration = 60;

/** Stage 2: misconception-tagged MCQs for a batch of up to 6 concepts. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "questions", 30);
    const body = await readJson(req, QuestionsRequestSchema);
    const { system, prompt } = questionsPrompt(body);
    const raw = await generateJson(system, prompt, { temperature: 0.5, maxTokens: 16000 });
    const prefix = `g${(hash(body.courseTitle + Date.now()) % 1679616).toString(36)}`;
    const questions = normalizeQuestions(
      raw,
      body.concepts.map((c) => c.id),
      body.misconceptions.map((m) => m.id),
      prefix,
    );
    return Response.json({ questions });
  } catch (e) {
    return errorResponse(e);
  }
}
