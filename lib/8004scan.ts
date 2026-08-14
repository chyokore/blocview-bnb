import "server-only";

import type { Agent } from "@/data/agents";

const API_BASE_URL = "https://8004scan.io/api/v1/public";
export const BNB_CHAIN_ID = 56;
const REQUEST_TIMEOUT_MS = 5_000;

type Pagination = { page?: number; limit?: number; total?: number; hasMore?: boolean };
type ApiMeta = { timestamp?: string; pagination?: Pagination };
type ApiResponse<T> = { success?: boolean; data?: T; meta?: ApiMeta };
type ScanAgent = {
  id?: string;
  agent_id?: string;
  token_id?: number;
  chain_id?: number;
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
  source: "8004scan";
  chainId: 56;
  network: "BNB Chain";
  tokenId: number;
  agentId: string;
  name?: string;
  description?: string;
  capabilities: string[];
  reputation?: { score?: number; stars?: number; feedbackCount?: number };
  registeredAt?: string;
  lastVerifiedAt: string;
};

export type VerifiedAgentData = LiveAgent & {
  name: string;
  ownerAddress?: string;
  feedback: Array<{ id: string; score?: number; comment?: string; createdAt?: string }>;
};

export type ScanAvailability = "available" | "unavailable" | "not-configured";
export type LiveAgentsResult =
  | { status: "ok"; agents: LiveAgent[]; page: number; limit: number; total?: number; hasMore: boolean; verifiedAt: string }
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

function mapLiveAgent(record: ScanAgent, verifiedAt: string): LiveAgent | null {
  if (record.chain_id !== BNB_CHAIN_ID || !isFiniteInteger(record.token_id)) return null;
  return {
    source: "8004scan",
    chainId: BNB_CHAIN_ID,
    network: "BNB Chain",
    tokenId: record.token_id,
    agentId: typeof record.agent_id === "string" && record.agent_id.trim() ? record.agent_id : `${BNB_CHAIN_ID}:${record.token_id}`,
    name: typeof record.name === "string" && record.name.trim() ? record.name.trim() : undefined,
    description: typeof record.description === "string" && record.description.trim() ? record.description.trim() : undefined,
    capabilities: Array.isArray(record.supported_protocols) ? record.supported_protocols.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [],
    reputation: {
      score: typeof record.total_score === "number" ? record.total_score : undefined,
      stars: isFiniteInteger(record.star_count) ? record.star_count : undefined,
      feedbackCount: isFiniteInteger(record.total_feedbacks) ? record.total_feedbacks : undefined,
    },
    registeredAt: typeof record.created_at === "string" ? record.created_at : undefined,
    lastVerifiedAt: verifiedAt,
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
  const verifiedAt = response.meta?.timestamp ?? new Date().toISOString();
  const agents = response.data.map((record) => mapLiveAgent(record, verifiedAt)).filter((agent): agent is LiveAgent => Boolean(agent));
  const pagination = response.meta?.pagination;
  return {
    status: "ok",
    agents,
    page: pagination?.page ?? safePage,
    limit: pagination?.limit ?? safeLimit,
    total: pagination?.total,
    hasMore: pagination?.hasMore === true,
    verifiedAt,
  };
}

export async function getLiveAgent(chainId: number, tokenId: number): Promise<LiveAgent | null> {
  if (chainId !== BNB_CHAIN_ID || !isFiniteInteger(tokenId)) return null;
  const response = await request<ScanAgent>(`/agents/${chainId}/${tokenId}`);
  if (!response?.success || !response.data) return null;
  return mapLiveAgent(response.data, response.meta?.timestamp ?? new Date().toISOString());
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
  if (!isFiniteInteger(match?.token_id) || !match?.name) return null;
  const [detail, feedbacks] = await Promise.all([
    request<ScanAgent>(`/agents/${BNB_CHAIN_ID}/${match.token_id}`),
    request<ScanFeedback[]>(`/feedbacks?chainId=${BNB_CHAIN_ID}&tokenId=${match.token_id}&limit=5`),
  ]);
  const record = detail?.data ?? match;
  const live = mapLiveAgent(record, detail?.meta?.timestamp ?? search?.meta?.timestamp ?? new Date().toISOString());
  if (!live?.name) return null;
  return {
    ...live,
    name: live.name,
    ownerAddress: record.owner_address,
    feedback: (feedbacks?.data ?? []).map((item, index) => ({ id: item.id ?? `${match.token_id}-${index}`, score: item.score, comment: item.comment, createdAt: item.created_at })),
  };
}
