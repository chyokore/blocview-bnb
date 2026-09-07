import type { LiveAgent } from "./8004scan.ts";
import type { RangePilotCategory } from "./range-pilot-watch-agents.ts";

export const LIVE_MARKETPLACE_CATEGORIES = ["Rebalancing", "Grid Trading", "Yield Optimisation", "Health Factor Monitoring"] as const;
export const LIVE_MARKETPLACE_INTERFACES = ["Web", "A2A", "MCP"] as const;
export const CANONICAL_LIVE_AGENT_IDS = new Set([321941, 321995, 322046, 322090]);
export type MarketplaceInterface = (typeof LIVE_MARKETPLACE_INTERFACES)[number];

const categoryLabels: Record<string, RangePilotCategory> = {
  rebalancing: "Rebalancing",
  "lp rebalancing": "Rebalancing",
  "grid trading": "Grid Trading",
  "yield optimisation": "Yield Optimisation",
  "yield optimization": "Yield Optimisation",
  "health factor monitoring": "Health Factor Monitoring",
};

const interfaceLabels: Record<string, MarketplaceInterface> = { web: "Web", a2a: "A2A", mcp: "MCP" };
const placeholderNames = /^(?:unknown|unnamed|untitled|n\/?a|none|demo|test)(?:[\s_-]+(?:agent|record|identity|\d+))?$/i;
const placeholderDescriptions = /^(?:unknown|none|n\/?a|no description|description unavailable|test|demo)[.!]?$/i;

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

export function classifyMarketplaceAgent(agent: LiveAgent): RangePilotCategory | null {
  const labels = agent.category ? [agent.category, ...agent.capabilities] : agent.capabilities;
  const matches = new Set(labels.map((label) => categoryLabels[normalizeLabel(label)]).filter((category): category is RangePilotCategory => Boolean(category)));
  return matches.size === 1 ? [...matches][0] : null;
}

export function classifyMarketplaceInterface(agent: LiveAgent): MarketplaceInterface | null {
  const matches = new Set(agent.capabilities.map((label) => interfaceLabels[normalizeLabel(label)]).filter((value): value is MarketplaceInterface => Boolean(value)));
  return matches.size === 1 ? [...matches][0] : null;
}

export function hasUsableMarketplaceName(value: string | undefined): value is string {
  const name = value?.trim();
  return Boolean(name && /[a-z0-9]/i.test(name) && !placeholderNames.test(name));
}

export function hasMeaningfulMarketplaceDescription(value: string | undefined): value is string {
  const description = value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return Boolean(description && description.length >= 16 && /[a-z0-9]+\s+[a-z0-9]+/i.test(description) && !placeholderDescriptions.test(description));
}

export function selectExternalMarketplaceAgents(agents: readonly LiveAgent[]): LiveAgent[] {
  const seen = new Set<number>();
  const selected: LiveAgent[] = [];
  for (const agent of agents) {
    if (agent.source !== "8004scan" || agent.chainId !== 56 || !Number.isSafeInteger(agent.tokenId) || agent.tokenId < 0 || !agent.agentId.trim()) continue;
    if (!hasUsableMarketplaceName(agent.name) || !hasMeaningfulMarketplaceDescription(agent.description)) continue;
    if (CANONICAL_LIVE_AGENT_IDS.has(agent.tokenId) || seen.has(agent.tokenId)) continue;
    const interfaceType = classifyMarketplaceInterface(agent);
    if (!interfaceType) continue;
    seen.add(agent.tokenId);
    selected.push({ ...agent, interfaceType, category: undefined });
  }
  return selected;
}

export function countMarketplaceInterfaces(agents: readonly LiveAgent[]): Record<MarketplaceInterface, number> {
  const counts = Object.fromEntries(LIVE_MARKETPLACE_INTERFACES.map((interfaceType) => [interfaceType, 0])) as Record<MarketplaceInterface, number>;
  for (const agent of agents) if (agent.interfaceType) counts[agent.interfaceType] += 1;
  return counts;
}

export function countMarketplaceCategories(agents: readonly LiveAgent[]): Record<RangePilotCategory, number> {
  const counts = Object.fromEntries(LIVE_MARKETPLACE_CATEGORIES.map((category) => [category, 0])) as Record<RangePilotCategory, number>;
  for (const agent of agents) if (agent.category) counts[agent.category] += 1;
  return counts;
}
