import { getAgent } from "@/data/agents";
import { getVerifiedAgent } from "@/lib/8004scan";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const agent = getAgent((await params).slug);
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });
  const verified = await getVerifiedAgent(agent);
  return Response.json({ source: verified ? "8004scan" : "demo", verified }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=240" } });
}
