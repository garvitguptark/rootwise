import { providerInfo } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

/** Tells the client whether live AI is available (never exposes keys). */
export function GET() {
  const info = providerInfo();
  return Response.json({ live: info.live, provider: info.name, model: info.live ? info.model : null });
}
