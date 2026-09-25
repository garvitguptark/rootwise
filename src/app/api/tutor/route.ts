import { providerInfo, streamText, type Msg } from "@/lib/ai/provider";
import { tutorSystem } from "@/lib/ai/prompts";
import { errorResponse, rateLimit, readJson } from "@/lib/http";
import { offlineTutorReply } from "@/lib/offline";
import { TutorRequestSchema } from "@/lib/schema";

export const maxDuration = 60;

const textHeaders = (mode: "ai" | "offline") => ({
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-rootwise-mode": mode,
});

/** Gemini/OpenAI want alternating turns that start with the user. */
function toTurns(messages: Msg[]): Msg[] {
  const out: Msg[] = [];
  for (const m of messages) {
    if (!m.content.trim()) continue;
    const last = out.at(-1);
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else out.push({ ...m });
  }
  if (out[0]?.role === "assistant") out.unshift({ role: "user", content: "(The student opened the tutor.)" });
  return out;
}

/** Socratic tutor. Streams plain text; falls back to the offline tutor. */
export async function POST(req: Request) {
  let body;
  try {
    rateLimit(req, "tutor", 40);
    body = await readJson(req, TutorRequestSchema);
  } catch (e) {
    return errorResponse(e);
  }
  const offline = () =>
    new Response(offlineTutorReply(body.concept, body.messages, body.misconceptions), { headers: textHeaders("offline") });

  if (!providerInfo().live) return offline();

  const iterator = streamText(tutorSystem(body), toTurns(body.messages), { temperature: 0.6, maxTokens: 2000 });
  let first: IteratorResult<string>;
  try {
    // Pull the first chunk before committing to a streamed response, so that
    // provider errors can still fall back to the offline tutor.
    first = await iterator.next();
  } catch (e) {
    console.error("[tutor] falling back to offline:", e instanceof Error ? e.message : e);
    return offline();
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value));
        for await (const chunk of { [Symbol.asyncIterator]: () => iterator }) controller.enqueue(encoder.encode(chunk));
      } catch (e) {
        console.error("[tutor] stream interrupted:", e instanceof Error ? e.message : e);
        controller.enqueue(encoder.encode("\n\n(The connection dropped — please send that again.)"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: textHeaders("ai") });
}
