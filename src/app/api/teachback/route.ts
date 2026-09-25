import { generateJson, providerInfo } from "@/lib/ai/provider";
import { normalizeTeachBack } from "@/lib/ai/normalize";
import { teachBackPrompt } from "@/lib/ai/prompts";
import { errorResponse, rateLimit, readJson } from "@/lib/http";
import { offlineTeachBack } from "@/lib/offline";
import { TeachBackRequestSchema } from "@/lib/schema";

export const maxDuration = 60;

/** Grades a student's own explanation of a concept (Feynman technique). */
export async function POST(req: Request) {
  try {
    rateLimit(req, "teachback", 20);
    const body = await readJson(req, TeachBackRequestSchema);
    if (providerInfo().live) {
      try {
        const { system, prompt } = teachBackPrompt(body);
        const raw = await generateJson(system, prompt, { temperature: 0.2, maxTokens: 4000 });
        return Response.json({ ...normalizeTeachBack(raw, body.concept.keyIdeas, body.misconceptions), mode: "ai" });
      } catch (e) {
        console.error("[teachback] falling back to offline:", e instanceof Error ? e.message : e);
      }
    }
    return Response.json(offlineTeachBack(body.explanation, body.concept.keyIdeas));
  } catch (e) {
    return errorResponse(e);
  }
}
