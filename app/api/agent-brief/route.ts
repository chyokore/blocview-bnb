import OpenAI from "openai";
import { getAgent } from "@/data/agents";
import { getVerifiedAgent } from "@/lib/8004scan";

const MODEL = "gpt-4o-mini";
const COOLDOWN_MS = 60_000;
const lastRequestByAgent = new Map<string, number>();
const briefSchema = { type: "object", additionalProperties: false, required: ["summary", "designedToDo", "maySuit", "tradeoffsAndRisks", "questionsBeforeActivation", "dataBasis"], properties: { summary: { type: "string" }, designedToDo: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 }, maySuit: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 }, tradeoffsAndRisks: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }, questionsBeforeActivation: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }, dataBasis: { type: "array", minItems: 1, maxItems: 8, items: { type: "object", additionalProperties: false, required: ["point", "basis"], properties: { point: { type: "string" }, basis: { type: "string", enum: ["BLOCview demo data", "Verified 8004scan data"] } } } } } } as const;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY?.trim()) return Response.json({ error: "AI Agent Brief is not configured." }, { status: 503 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Expected a JSON request." }, { status: 415 });
  let slug: unknown;
  try { slug = (JSON.parse(await request.text()) as { slug?: unknown }).slug; }
  catch { return Response.json({ error: "Invalid JSON request." }, { status: 400 }); }
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(slug)) return Response.json({ error: "Invalid agent slug." }, { status: 400 });
  const agent = getAgent(slug);
  if (!agent) return Response.json({ error: "Agent not found." }, { status: 404 });
  const now = Date.now();
  const remaining = COOLDOWN_MS - (now - (lastRequestByAgent.get(slug) ?? 0));
  if (remaining > 0) return Response.json({ error: "Please wait before generating another brief.", retryAfterSeconds: Math.ceil(remaining / 1000) }, { status: 429, headers: { "Retry-After": String(Math.ceil(remaining / 1000)) } });
  lastRequestByAgent.set(slug, now);
  try {
    const verified = await getVerifiedAgent(agent);
    const source = { demo: { name: agent.name, description: agent.longDescription, category: agent.category, riskLevel: agent.risk, strategy: agent.strategy, protocol: agent.protocol, suitability: agent.suitability, feeIllustrative: agent.fee, controls: agent.controls, performanceNotice: "All BLOCview returns, capital/TVL, fees, status, and activity are illustrative demo data." }, verified8004scan: verified ? { name: verified.name, network: verified.network, agentId: verified.agentId, description: verified.description, capabilities: verified.capabilities, reputation: verified.reputation, registeredAt: verified.registeredAt, lastVerifiedAt: verified.lastVerifiedAt } : null, verificationNotice: verified ? "Verified 8004scan fields are identity, capability, reputation, and registration context only." : "Verified external 8004scan data was unavailable or unmatched." };
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 12_000, maxRetries: 0 });
    const response = await client.responses.create({ model: MODEL, max_output_tokens: 700, instructions: "Write a concise neutral agent brief using only the supplied JSON. Use 'may suit', 'consider', and 'based on the information shown'. Do not give financial advice, predict prices, guarantee returns, rank agents, or call an agent safe/best. Never present demo returns, TVL, fees, status, or activity as verified. If verified8004scan is null, explicitly state that external verification was unavailable. Every dataBasis item must accurately label its source. Do not use external knowledge or tools.", input: JSON.stringify(source), text: { format: { type: "json_schema", name: "agent_brief", strict: true, schema: briefSchema } } }, { signal: AbortSignal.timeout(13_000) });
    return Response.json({ brief: JSON.parse(response.output_text) as unknown, model: MODEL, generatedAt: new Date().toISOString(), verifiedExternalData: Boolean(verified) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "The brief could not be generated right now. No activation occurred and no funds moved." }, { status: 502 }); }
}
