import type { LiveAgent } from "./8004scan";

export const RANGE_PILOT_REGISTRY = "eip155:56:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

export type RangePilotCategory = "Rebalancing" | "Grid Trading" | "Yield Optimisation" | "Health Factor Monitoring";
export type RangePilotLiveAgent = LiveAgent & {
  source: "range-pilot-watch";
  registry: typeof RANGE_PILOT_REGISTRY;
  category: RangePilotCategory;
  registrationUrl: string;
  documentationUrl: string;
  healthUrl: string;
  assessmentUrl: string;
  assessmentMode: "external-read-only-handoff";
  indexingStatus: "indexing pending";
};

const origin = "https://range-pilot-watch.onrender.com";
function record(tokenId: number, name: string, category: RangePilotCategory, slug: string, description: string, retrievedAt: string): RangePilotLiveAgent {
  return {
    source: "range-pilot-watch",
    chainId: 56,
    network: "BNB Chain",
    tokenId,
    agentId: `${RANGE_PILOT_REGISTRY}:${tokenId}`,
    name,
    description,
    capabilities: [category],
    registry: RANGE_PILOT_REGISTRY,
    registryAddress: RANGE_PILOT_REGISTRY.split(":")[2],
    category,
    registrationUrl: `${origin}/erc8004/${slug}.json`,
    documentationUrl: `${origin}/docs/agents/${slug}.html`,
    healthUrl: `${origin}/health`,
    assessmentUrl: `${origin}/agents/${slug}/assess`,
    assessmentMode: "external-read-only-handoff",
    indexingStatus: "indexing pending",
    retrievedAt,
    retrievalTimestampBasis: "local-fallback",
  };
}

export function listRangePilotLiveAgents(now = new Date()): readonly RangePilotLiveAgent[] {
  const retrievedAt = now.toISOString();
  return [
    record(321941, "RangeRebalance Lens", "Rebalancing", "range-rebalance", "Read-only PancakeSwap V3 position-range assessment; it does not rebalance or execute.", retrievedAt),
    record(321995, "GridBand Observer", "Grid Trading", "grid-band", "Read-only placement of an allowlisted PancakeSwap V3 pool tick in a caller-declared grid; it provides no buy or sell signals.", retrievedAt),
    record(322046, "Venus Yield Lens", "Yield Optimisation", "venus-yield", "Read-only comparison of displayed supply rates and stored values for two allowlisted Venus markets; it makes no allocation recommendation.", retrievedAt),
    record(322090, "Venus Borrow Buffer Watch", "Health Factor Monitoring", "venus-borrow-buffer", "Read-only Venus account-liquidity observation; it is not continuous monitoring or a liquidation prediction.", retrievedAt),
  ];
}

export function getRangePilotLiveAgent(chainId: number, tokenId: number, now = new Date()) {
  return chainId === 56 ? listRangePilotLiveAgents(now).find((agent) => agent.tokenId === tokenId) ?? null : null;
}

export function isRangePilotLiveAgent(agent: LiveAgent): agent is RangePilotLiveAgent {
  return agent.source === "range-pilot-watch";
}
