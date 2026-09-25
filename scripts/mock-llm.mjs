#!/usr/bin/env node
/**
 * A tiny OpenAI-compatible mock LLM for local testing and CI — exercises the
 * full AI pipeline (graph → questions → lessons → tutor streaming →
 * teach-back grading) without an API key.
 *
 *   node scripts/mock-llm.mjs            # listens on :4010
 *   OPENAI_API_KEY=mock OPENAI_BASE_URL=http://localhost:4010/v1 npm run dev
 *   GEMINI_API_KEY=mock GEMINI_BASE_URL=http://localhost:4010 npm run dev
 *
 * The Gemini mock deliberately 404s on the first default model and rejects
 * `thinkingConfig` on the second, to exercise the provider's fallbacks.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 4010);

const GRAPH = {
  title: "Photosynthesis",
  subject: "Biology",
  description: "How plants turn light, water and carbon dioxide into food.",
  targetConceptIds: ["limiting-factors", "photosynthesis-equation"],
  concepts: [
    { id: "energy-forms", name: "Forms of energy", summary: "Light and chemical energy and how one converts to another.", prerequisites: [] },
    { id: "cells", name: "Plant cells", summary: "Cell parts, including chloroplasts.", prerequisites: [] },
    { id: "gas-exchange", name: "Gas exchange", summary: "How gases enter and leave leaves through stomata.", prerequisites: [] },
    { id: "chlorophyll", name: "Chlorophyll", summary: "The green pigment that absorbs light.", prerequisites: ["cells", "energy-forms"] },
    { id: "raw-materials", name: "Raw materials", summary: "Carbon dioxide and water as inputs.", prerequisites: ["gas-exchange"] },
    { id: "photosynthesis-equation", name: "The word equation", summary: "Carbon dioxide + water → glucose + oxygen, using light.", prerequisites: ["chlorophyll", "raw-materials"] },
    { id: "glucose-use", name: "Uses of glucose", summary: "Respiration, starch, cellulose.", prerequisites: ["photosynthesis-equation"] },
    { id: "limiting-factors", name: "Limiting factors", summary: "Light, CO₂ and temperature limit the rate.", prerequisites: ["photosynthesis-equation"] },
  ],
  misconceptions: [
    { id: "food-from-soil", conceptId: "raw-materials", label: "Thinks plants get their food from the soil", explanation: "Plants make glucose themselves; soil provides water and minerals, not food." },
    { id: "night-photosynthesis", conceptId: "limiting-factors", label: "Thinks photosynthesis continues at night", explanation: "Without light there is no energy input, so photosynthesis stops." },
    { id: "chlorophyll-energy", conceptId: "chlorophyll", label: "Thinks chlorophyll is a source of energy", explanation: "Chlorophyll absorbs light energy; it isn't consumed as fuel." },
  ],
};

function questionsFor(prompt) {
  const block = prompt.split("<concepts>")[1]?.split("</concepts>")[0] ?? "";
  const ids = [...block.matchAll(/^- ([a-z0-9-]+):/gm)].map((m) => m[1]);
  const questions = ids.flatMap((id) =>
    [1, 2, 2, 3].map((d, i) => ({
      conceptId: id,
      difficulty: d,
      stem: `Mock question ${i + 1} about ${id}: which statement is correct?`,
      options: [
        { text: `The correct statement about ${id}` },
        { text: `A common wrong idea about ${id}`, misconceptionId: "food-from-soil" },
        { text: `Another distractor for ${id}` },
        { text: `A fourth option for ${id}` },
      ],
      correctIndex: 0,
      explanation: `Because that's how ${id} works.`,
    })),
  );
  return { questions };
}

const LESSON = {
  lesson: "Plants capture light energy with chlorophyll and use it to turn carbon dioxide and water into glucose, releasing oxygen.",
  keyIdeas: ["Light energy is absorbed by chlorophyll", "Carbon dioxide and water are the raw materials", "Glucose and oxygen are the products"],
  example: { problem: "Why does a plant kept in the dark lose mass?", steps: ["No light means no photosynthesis.", "It still respires, using up stored glucose."] },
  socratic: ["Where does the mass of a tree come from?", "What would happen to a plant with no light?", "Why are leaves thin and flat?"],
};

function teachback(prompt) {
  const words = (prompt.split("<explanation>")[1] ?? "").split(/\s+/).filter(Boolean).length;
  const good = words > 25;
  return {
    accuracy: good ? 88 : 55,
    completeness: good ? 80 : 35,
    clarity: good ? 85 : 50,
    coveredIdeas: good ? [0, 1] : [0],
    missingIdeas: good ? [2] : [1, 2],
    misconceptions: good ? [] : ["food-from-soil"],
    strength: good ? "You connected the inputs to the energy source clearly." : "You started with the right idea.",
    followUp: "What happens to the oxygen the plant produces?",
  };
}

function reply(system, prompt) {
  if (/prerequisite knowledge graph/i.test(prompt)) return GRAPH;
  if (/multiple-choice questions for EACH concept/i.test(prompt)) return questionsFor(prompt);
  if (/"lesson": 3–5 plain sentences/.test(prompt)) return LESSON;
  if (/Feynman/.test(system)) return teachback(prompt);
  return { ok: true };
}

const TUTOR = "Good start! Let's think about it step by step. **Where does the energy come from** in the first place? Tell me in your own words.";

async function gemini(req, res, body) {
  const [, model, method] = req.url.match(/models\/([^:]+):(\w+)/) ?? [];
  const data = JSON.parse(body);
  if (model === "gemini-3.5-flash") {
    res.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ error: { message: `models/${model} is not found` } }));
    return;
  }
  if (model === "gemini-flash-latest" && data.generationConfig?.thinkingConfig) {
    res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: { message: 'Invalid JSON payload received. Unknown name "thinkingConfig"' } }));
    return;
  }
  const system = data.systemInstruction?.parts?.[0]?.text ?? "";
  const prompt = data.contents.filter((c) => c.role === "user").at(-1)?.parts?.[0]?.text ?? "";
  await new Promise((r) => setTimeout(r, 200));
  if (method === "streamGenerateContent") {
    res.writeHead(200, { "content-type": "text/event-stream" });
    for (const word of TUTOR.split(/(?<= )/)) {
      res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: word }] } }] })}\r\n\r\n`);
      await new Promise((r) => setTimeout(r, 25));
    }
    res.end();
    return;
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply(system, prompt)) }] } }] }));
}

createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  if (req.method === "POST" && req.url?.startsWith("/v1beta/models/")) return gemini(req, res, body);
  if (req.method !== "POST" || !req.url?.endsWith("/chat/completions")) {
    res.writeHead(404).end();
    return;
  }
  const data = JSON.parse(body);
  const system = data.messages.find((m) => m.role === "system")?.content ?? "";
  const prompt = data.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  await new Promise((r) => setTimeout(r, 250));
  if (data.stream) {
    res.writeHead(200, { "content-type": "text/event-stream" });
    for (const word of TUTOR.split(/(?<= )/)) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: word } }] })}\n\n`);
      await new Promise((r) => setTimeout(r, 25));
    }
    res.end("data: [DONE]\n\n");
    return;
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply(system, prompt)) } }] }));
}).listen(PORT, () => console.log(`mock LLM on http://localhost:${PORT}/v1`));
