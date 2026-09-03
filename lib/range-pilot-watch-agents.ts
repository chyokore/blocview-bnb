import type { LiveAgent } from "./8004scan";

export const RANGE_PILOT_REGISTRY = "eip155:56:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;

export type RangePilotCategory = "Rebalancing" | "Grid Trading" | "Yield Optimisation" | "Health Factor Monitoring";
export type RangePilotLiveAgent = LiveAgent & {
  source: "range-pilot-watch" | "8004scan";
  registry: typeof RANGE_PILOT_REGISTRY;
  category: RangePilotCategory;
  registrationUrl: string;
  documentationUrl: string;
  healthUrl: string;
  assessmentUrl: string;
  assessmentMode: "external-read-only-handoff";
  indexingStatus?: "indexing pending";
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
    healthUrl: `${origin}/agents/${slug}/health`,
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
    record(321941, "RangeRebalance Lens", "Rebalancing", "range-rebalance", "Checks whether a public PancakeSwap V3 position is in range. It does not rebalance or execute.", retrievedAt),
    record(321995, "GridBand Observer", "Grid Trading", "grid-band", "Places the current tick for an approved PancakeSwap V3 pool within a grid supplied by the caller. It does not provide buy or sell signals.", retrievedAt),
    record(322046, "Venus Yield Lens", "Yield Optimisation", "venus-yield", "Compares displayed supply rates and stored values for two approved Venus markets. It does not recommend an allocation.", retrievedAt),
    record(322090, "Venus Borrow Buffer Watch", "Health Factor Monitoring", "venus-borrow-buffer", "Observes Venus account liquidity at one moment in time. It is not continuous monitoring or a liquidation prediction.", retrievedAt),
  ];
}

export function getRangePilotLiveAgent(chainId: number, tokenId: number, now = new Date()) {
  return chainId === 56 ? listRangePilotLiveAgents(now).find((agent) => agent.tokenId === tokenId) ?? null : null;
}

export function isRangePilotLiveAgent(agent: LiveAgent): agent is RangePilotLiveAgent {
  return agent.registryAddress?.toLowerCase() === RANGE_PILOT_REGISTRY.split(":")[2].toLowerCase();
}

export function isRangePilotIndexingPending(agent: RangePilotLiveAgent) {
  return agent.indexingStatus === "indexing pending";
}

export function mergeRangePilotIndexedAgent(registration: RangePilotLiveAgent, indexed: LiveAgent | null): RangePilotLiveAgent {
  if (!indexed || indexed.chainId !== registration.chainId || indexed.tokenId !== registration.tokenId) return registration;
  return {
    ...registration,
    ...indexed,
    category: registration.category,
    registry: registration.registry,
    registryAddress: registration.registryAddress,
    registrationUrl: registration.registrationUrl,
    documentationUrl: registration.documentationUrl,
    healthUrl: registration.healthUrl,
    assessmentUrl: registration.assessmentUrl,
    assessmentMode: registration.assessmentMode,
    indexingStatus: undefined,
  };
}
