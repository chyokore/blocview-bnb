import type { LiveAgent } from "./8004scan.ts";
import type { RangePilotCategory } from "./range-pilot-watch-agents.ts";

export const LIVE_MARKETPLACE_CATEGORIES = ["Rebalancing", "Grid Trading", "Yield Optimisation", "Health Factor Monitoring"] as const;
export const CANONICAL_LIVE_AGENT_IDS = new Set([321941, 321995, 322046, 322090]);

const categoryLabels: Record<string, RangePilotCategory> = {
  rebalancing: "Rebalancing",
  "lp rebalancing": "Rebalancing",
  "grid trading": "Grid Trading",
  "yield optimisation": "Yield Optimisation",
  "yield optimization": "Yield Optimisation",
  "health factor monitoring": "Health Factor Monitoring",
};

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

export function classifyMarketplaceAgent(agent: LiveAgent): RangePilotCategory | null {
  const labels = agent.category ? [agent.category, ...agent.capabilities] : agent.capabilities;
  const matches = new Set(labels.map((label) => categoryLabels[normalizeLabel(label)]).filter((category): category is RangePilotCategory => Boolean(category)));
  return matches.size === 1 ? [...matches][0] : null;
}

export function selectExternalMarketplaceAgents(agents: readonly LiveAgent[]): LiveAgent[] {
  const seen = new Set<number>();
  const selected: LiveAgent[] = [];
  for (const agent of agents) {
    if (agent.source !== "8004scan" || agent.chainId !== 56 || !Number.isSafeInteger(agent.tokenId) || !agent.agentId.trim() || !agent.name?.trim()) continue;
    if (CANONICAL_LIVE_AGENT_IDS.has(agent.tokenId) || seen.has(agent.tokenId)) continue;
    const category = classifyMarketplaceAgent(agent);
    if (!category) continue;
    seen.add(agent.tokenId);
    selected.push({ ...agent, category });
  }
  return selected;
}

export function countMarketplaceCategories(agents: readonly LiveAgent[]): Record<RangePilotCategory, number> {
  const counts = Object.fromEntries(LIVE_MARKETPLACE_CATEGORIES.map((category) => [category, 0])) as Record<RangePilotCategory, number>;
  for (const agent of agents) if (agent.category) counts[agent.category] += 1;
  return counts;
}
