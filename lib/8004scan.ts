import "server-only";

import type { Agent } from "@/data/agents";
import { resolveRetrievalTimestamp } from "@/lib/evidence";

const API_BASE_URL = "https://8004scan.io/api/v1/public";
export const BNB_CHAIN_ID = 56;
const REQUEST_TIMEOUT_MS = 5_000;

type Pagination = { page?: number; limit?: number; total?: number; hasMore?: boolean };
type ApiMeta = { timestamp?: string; pagination?: Pagination };
type ApiResponse<T> = { success?: boolean; data?: T; meta?: ApiMeta };
type ScanAgent = {
  id?: string;
  agent_id?: string;
  token_id?: number | string;
  chain_id?: number | string;
  name?: string;
  description?: string;
  owner_address?: string;
  supported_protocols?: string[];
  total_score?: number;
  star_count?: number;
  total_feedbacks?: number;
  created_at?: string;
};
type ScanFeedback = { id?: string; score?: number; comment?: string; created_at?: string };

export type LiveAgent = {
  source: "8004scan" | "range-pilot-watch";
  chainId: 56;
  network: "BNB Chain";
  tokenId: number;
  agentId: string;
  name?: string;
  description?: string;
  capabilities: string[];
  reputation?: { score?: number; stars?: number; feedbackCount?: number };
  registeredAt?: string;
  retrievedAt: string;
  retrievalTimestampBasis: "source-provided" | "local-fallback";
  category?: "Rebalancing" | "Grid Trading" | "Yield Optimisation" | "Health Factor Monitoring";
  registryAddress?: string;
  registrationUrl?: string;
  documentationUrl?: string;
  healthUrl?: string;
  assessmentUrl?: string;
  indexingStatus?: "indexing pending";
};

export type VerifiedAgentData = LiveAgent & {
  name: string;
  ownerAddress?: string;
  feedback: Array<{ id: string; score?: number; comment?: string; createdAt?: string }>;
};

export type ScanAvailability = "available" | "unavailable" | "not-configured";
export type LiveAgentsResult =
  | { status: "ok"; agents: LiveAgent[]; page: number; limit: number; total?: number; hasMore: boolean; retrievedAt: string; retrievalTimestampBasis: "source-provided" | "local-fallback" }
  | { status: "not-configured"; agents: [] }
  | { status: "unavailable"; agents: [] }
  | { status: "malformed"; agents: [] };

function getApiKey() {
  return process.env.SCAN8004_API_KEY?.trim();
}

async function request<T>(path: string): Promise<ApiResponse<T> | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseIdentifier(value: unknown): number | null {
  if (isFiniteInteger(value)) return value;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return isFiniteInteger(parsed) ? parsed : null;
}

function mapLiveAgent(record: ScanAgent, retrieval: ReturnType<typeof resolveRetrievalTimestamp>): LiveAgent | null {
  const chainId = parseIdentifier(record.chain_id);
  const tokenId = parseIdentifier(record.token_id);
  if (chainId !== BNB_CHAIN_ID || tokenId === null) return null;
  return {
    source: "8004scan",
    chainId: BNB_CHAIN_ID,
    network: "BNB Chain",
    tokenId,
    agentId: typeof record.agent_id === "string" && record.agent_id.trim() ? record.agent_id : `${BNB_CHAIN_ID}:${tokenId}`,
    name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : undefined,
    description: typeof record.description === "string" && record.description.trim() ? record.description.trim() : undefined,
    capabilities: Array.isArray(record.supported_protocols) ? record.supported_protocols.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [],
    reputation: {
      score: typeof record.total_score === "number" ? record.total_score : undefined,
      stars: isFiniteInteger(record.star_count) ? record.star_count : undefined,
      feedbackCount: isFiniteInteger(record.total_feedbacks) ? record.total_feedbacks : undefined,
    },
    registeredAt: typeof record.created_at === "string" ? record.created_at : undefined,
    ...retrieval,
  };
}

export async function listLiveAgents(page = 1, limit = 20): Promise<LiveAgentsResult> {
  if (!getApiKey()) return { status: "not-configured", agents: [] };
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isSafeInteger(limit) ? Math.min(100, Math.max(1, limit)) : 20;
  const query = new URLSearchParams({
    chainId: String(BNB_CHAIN_ID),
    page: String(safePage),
    limit: String(safeLimit),
    sortBy: "created_at",
    sortOrder: "desc",
    isTestnet: "false",
  });
  const response = await request<ScanAgent[]>(`/agents?${query}`);
  if (!response) return { status: "unavailable", agents: [] };
  if (!response.success || !Array.isArray(response.data)) return { status: "malformed", agents: [] };
  const retrieval = resolveRetrievalTimestamp(response.meta?.timestamp);
  const agents = response.data.map((record) => mapLiveAgent(record, retrieval)).filter((agent): agent is LiveAgent => Boolean(agent));
  const pagination = response.meta?.pagination;
  return {
    status: "ok",
    agents,
    page: pagination?.page ?? safePage,
    limit: pagination?.limit ?? safeLimit,
    total: pagination?.total,
    hasMore: pagination?.hasMore === true,
    ...retrieval,
  };
}

export async function getLiveAgent(chainId: number, tokenId: number): Promise<LiveAgent | null> {
  if (chainId !== BNB_CHAIN_ID || !isFiniteInteger(tokenId)) return null;
  const response = await request<ScanAgent>(`/agents/${chainId}/${tokenId}`);
  if (!response?.success || !response.data) return null;
  return mapLiveAgent(response.data, resolveRetrievalTimestamp(response.meta?.timestamp));
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
  const tokenId = parseIdentifier(match?.token_id);
  if (tokenId === null || !match?.name) return null;
  const [detail, feedbacks] = await Promise.all([
    request<ScanAgent>(`/agents/${BNB_CHAIN_ID}/${tokenId}`),
    request<ScanFeedback[]>(`/feedbacks?chainId=${BNB_CHAIN_ID}&tokenId=${tokenId}&limit=5`),
  ]);
  const record = detail?.data ?? match;
  const live = mapLiveAgent(record, resolveRetrievalTimestamp(detail?.meta?.timestamp ?? search?.meta?.timestamp));
  if (!live?.name) return null;
  return {
    ...live,
    name: live.name,
    ownerAddress: record.owner_address,
    feedback: (feedbacks?.data ?? []).map((item, index) => ({ id: item.id ?? `${tokenId}-${index}`, score: item.score, comment: item.comment, createdAt: item.created_at })),
  };
}
