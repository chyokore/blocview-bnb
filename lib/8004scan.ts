import "server-only";

import type { Agent } from "@/data/agents";

const API_BASE_URL = "https://8004scan.io/api/v1/public";
const BNB_CHAIN_ID = 56;

type ApiMeta = { timestamp?: string };
type ApiResponse<T> = { success?: boolean; data?: T; meta?: ApiMeta };
type ScanAgent = { agent_id?: string; token_id?: number; chain_id?: number; name?: string; description?: string; owner_address?: string; supported_protocols?: string[]; total_score?: number; star_count?: number; total_feedbacks?: number; created_at?: string };
type ScanFeedback = { id?: string; score?: number; comment?: string; created_at?: string };

export type VerifiedAgentData = {
  source: "8004scan"; chainId: 56; network: "BNB Chain"; tokenId: number; agentId: string; name: string;
  description?: string; ownerAddress?: string; capabilities: string[];
  reputation?: { score?: number; stars?: number; feedbackCount?: number };
  feedback: Array<{ id: string; score?: number; comment?: string; createdAt?: string }>;
  registeredAt?: string; lastVerifiedAt: string;
};
export type ScanAvailability = "available" | "unavailable" | "not-configured";

function getApiKey() { return process.env.SCAN8004_API_KEY?.trim(); }

async function request<T>(path: string): Promise<ApiResponse<T> | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(5000), next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as ApiResponse<T>;
  } catch { return null; }
}

export async function getScanAvailability(): Promise<ScanAvailability> {
  if (!getApiKey()) return "not-configured";
  const result = await request<unknown[]>("/chains");
  return result?.success ? "available" : "unavailable";
}

export async function getVerifiedAgent(agent: Agent): Promise<VerifiedAgentData | null> {
  const query = new URLSearchParams({ q: agent.name, chainId: String(BNB_CHAIN_ID), limit: "10" });
  const search = await request<ScanAgent[]>(`/agents/search?${query}`);
  const match = search?.data?.find((candidate) => candidate.chain_id === BNB_CHAIN_ID && candidate.name?.trim().toLowerCase() === agent.name.toLowerCase());
  if (!match?.token_id || !match.name) return null;
  const [detail, feedbacks] = await Promise.all([
    request<ScanAgent>(`/agents/${BNB_CHAIN_ID}/${match.token_id}`),
    request<ScanFeedback[]>(`/feedbacks?chainId=${BNB_CHAIN_ID}&tokenId=${match.token_id}&limit=5`),
  ]);
  const record = detail?.data ?? match;
  if (record.chain_id !== BNB_CHAIN_ID || record.token_id !== match.token_id) return null;
  return {
    source: "8004scan", chainId: BNB_CHAIN_ID, network: "BNB Chain", tokenId: match.token_id,
    agentId: record.agent_id ?? `${BNB_CHAIN_ID}:${match.token_id}`, name: record.name ?? match.name,
    description: record.description, ownerAddress: record.owner_address, capabilities: record.supported_protocols ?? [],
    reputation: { score: record.total_score, stars: record.star_count, feedbackCount: record.total_feedbacks },
    feedback: (feedbacks?.data ?? []).map((item, index) => ({ id: item.id ?? `${match.token_id}-${index}`, score: item.score, comment: item.comment, createdAt: item.created_at })),
    registeredAt: record.created_at,
    lastVerifiedAt: detail?.meta?.timestamp ?? search?.meta?.timestamp ?? new Date().toISOString(),
  };
}
