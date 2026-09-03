import type { LiveAgent } from "./8004scan";

export type EvidenceState = "Available" | "Declared only" | "Not available";
export type FreshnessClassification = "Fresh" | "Recent" | "Stale" | "Unknown";

export type EvidenceArea = {
  key: "identity" | "capabilities" | "reputation" | "activity" | "permissions";
  label: string;
  state: EvidenceState;
  basis: "Registry record" | "Declared by agent" | "Returned by source" | "Not available from this record";
  reason: string;
};

export type EvidenceRecord = {
  source: {
    name: "8004scan" | "RangePilotWatch public registration";
    identifier: string;
    url: string;
  };
  identity: {
    network: "BNB Chain";
    chainId: 56;
    tokenId: number;
    agentId: string;
    contractAddress?: string;
  };
  retrieval: {
    retrievedAt: string;
    timestampBasis: "source-provided" | "local-fallback";
    freshness: FreshnessClassification;
    freshnessReason: string;
  };
  declaredCapabilities: string[];
  reputation?: {
    score?: number;
    stars?: number;
    feedbackCount?: number;
    basis: "Returned by source";
  };
  areas: EvidenceArea[];
  coverage: { available: number; total: number };
  missingEvidence: string[];
};

const FRESH_MAX_MS = 15 * 60 * 1_000;
const RECENT_MAX_MS = 6 * 60 * 60 * 1_000;

export function resolveRetrievalTimestamp(sourceTimestamp: string | undefined, now = new Date()) {
  if (sourceTimestamp && Number.isFinite(new Date(sourceTimestamp).valueOf())) return { retrievedAt: sourceTimestamp, retrievalTimestampBasis: "source-provided" as const };
  return { retrievedAt: now.toISOString(), retrievalTimestampBasis: "local-fallback" as const };
}

export function classifyFreshness(retrievedAt: string, now = new Date()): Pick<EvidenceRecord["retrieval"], "freshness" | "freshnessReason"> {
  const timestamp = new Date(retrievedAt).valueOf();
  const age = now.valueOf() - timestamp;
  if (!Number.isFinite(timestamp) || age < 0) return { freshness: "Unknown", freshnessReason: "The retrieval timestamp is invalid or in the future." };
  if (age <= FRESH_MAX_MS) return { freshness: "Fresh", freshnessReason: "Retrieved no more than 15 minutes ago." };
  if (age <= RECENT_MAX_MS) return { freshness: "Recent", freshnessReason: "Retrieved more than 15 minutes and no more than 6 hours ago." };
  return { freshness: "Stale", freshnessReason: "Retrieved more than 6 hours ago; refresh before relying on this record." };
}

export function deriveEvidenceRecord(agent: LiveAgent, now = new Date()): EvidenceRecord {
  const isPending = agent.indexingStatus === "indexing pending";
  const hasReputation = agent.reputation?.score !== undefined || agent.reputation?.stars !== undefined || agent.reputation?.feedbackCount !== undefined;
  const areas: EvidenceArea[] = [
    { key: "identity", label: "Registry identity", state: "Available", basis: "Registry record", reason: isPending ? "The public registration JSON declares this token ID and BSC ERC-8004 registry identity; 8004scan indexing is pending." : "Chain ID, token ID, and agent ID were returned or normalized from the 8004scan response." },
    { key: "capabilities", label: "Capabilities", state: agent.capabilities.length ? "Declared only" : "Not available", basis: agent.capabilities.length ? "Declared by agent" : "Not available from this record", reason: agent.capabilities.length ? "Capability labels are declarations in the registry record and have not been tested by BLOCview." : "No capability labels were returned in this record." },
    { key: "reputation", label: "Reputation", state: hasReputation ? "Available" : "Not available", basis: hasReputation ? "Returned by source" : "Not available from this record", reason: hasReputation ? "At least one reputation field was returned by 8004scan; BLOCview has not independently audited its basis." : isPending ? "No reputation evidence is available while 8004scan indexing is pending." : "No score, stars, or feedback count was returned." },
    { key: "activity", label: "Activity / validation", state: "Not available", basis: "Not available from this record", reason: isPending ? "The registration document supplies no reputation, activity, or independent validation evidence; 8004scan indexing is pending." : "This normalized registry record contains no activity or validation evidence." },
    { key: "permissions", label: "Permissions / controls", state: "Not available", basis: "Not available from this record", reason: "This normalized registry record contains no wallet permissions, spend caps, session expiry, revocation controls, or payment terms." },
  ];
  const freshness = classifyFreshness(agent.retrievedAt, now);
  return {
    source: isPending
      ? { name: "RangePilotWatch public registration", identifier: `${RANGE_PILOT_WATCH_REGISTRY_ID(agent.registryAddress)}:${agent.tokenId}`, url: agent.registrationUrl! }
      : { name: "8004scan", identifier: `8004scan:bsc:${agent.tokenId}`, url: `https://8004scan.io/agents/bsc/${agent.tokenId}` },
    identity: { network: agent.network, chainId: agent.chainId, tokenId: agent.tokenId, agentId: agent.agentId, ...(agent.registryAddress ? { contractAddress: agent.registryAddress } : {}) },
    retrieval: { retrievedAt: agent.retrievedAt, timestampBasis: agent.retrievalTimestampBasis, ...freshness },
    declaredCapabilities: [...agent.capabilities],
    reputation: hasReputation ? { ...agent.reputation, basis: "Returned by source" } : undefined,
    areas,
    coverage: { available: areas.filter((area) => area.state !== "Not available").length, total: areas.length },
    missingEvidence: [
      ...(agent.registryAddress ? [] : ["Contract address is not available from this normalized record."]),
      ...areas.filter((area) => area.state === "Not available").map((area) => area.reason),
    ],
  };
}

function RANGE_PILOT_WATCH_REGISTRY_ID(address: string | undefined) {
  return `eip155:56:${address ?? "registry-address-unavailable"}`;
}
