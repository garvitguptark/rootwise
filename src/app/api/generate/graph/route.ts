import { generateJson } from "@/lib/ai/provider";
import { normalizeGraph } from "@/lib/ai/normalize";
import { graphPrompt } from "@/lib/ai/prompts";
import { errorResponse, rateLimit, readJson } from "@/lib/http";
import { GraphRequestSchema } from "@/lib/schema";

export const maxDuration = 60;

/** Stage 1 of course generation: the prerequisite graph + misconceptions. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "graph", 6);
    const body = await readJson(req, GraphRequestSchema, 40_000);
    const { system, prompt } = graphPrompt(body);
    const raw = await generateJson(system, prompt, { temperature: 0.3, maxTokens: 12000 });
    return Response.json(normalizeGraph(raw, body.topic));
  } catch (e) {
    return errorResponse(e);
  }
}
