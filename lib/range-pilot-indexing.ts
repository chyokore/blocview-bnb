import "server-only";

import { getLiveAgent } from "./8004scan";
import { listRangePilotLiveAgents, mergeRangePilotIndexedAgent, type RangePilotLiveAgent } from "./range-pilot-watch-agents";

export async function resolveRangePilotLiveAgents(now = new Date()): Promise<RangePilotLiveAgent[]> {
  const registrations = [...listRangePilotLiveAgents(now)];
  const indexed = await Promise.all(registrations.map((agent) => getLiveAgent(agent.chainId, agent.tokenId)));
  return registrations.map((agent, index) => mergeRangePilotIndexedAgent(agent, indexed[index]));
}
