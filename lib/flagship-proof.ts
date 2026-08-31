import type { LiveAgent } from "./8004scan.ts";
import { classifyFreshness, type FreshnessClassification } from "./evidence.ts";
import { RANGE_PILOT_WATCH_SOURCE_URL, type RangePilotWatchFetchResult } from "./range-pilot-watch.ts";

export type FlagshipProof = {
  kind: "standalone-live-service-proof";
  registryMapping: null;
  service: { name: "Range Pilot Watch"; endpoint: string; scope: "WBNB/USDT · BSC mainnet" };
  status: "Available" | "Degraded" | "Timed out" | "Unavailable";
  rangeStatus?: string;
  chainObserved: { chainId?: number; blockNumber?: number; poolAddress?: string; observedPrice?: number; priceBasis?: string };
  sourceTimestamp?: string;
  blocviewRetrievedAt: string;
  freshness: FreshnessClassification;
  freshnessReason: string;
  observations: string[];
  missingEvidence: string[];
  limitations: string[];
  sourceEvidence?: string;
};

// Normalized live records do not retain service URLs or owner-controlled linkage.
// An exact name alone is not sufficient to claim an ERC-8004 association.
export function resolveRangePilotWatchRegistryMapping(agents: LiveAgent[]): null {
  void agents;
  return null;
}

const unsupported = [
  "Profitability or returns",
  "An executable price or oracle-quality guarantee",
  "Historical reliability or strategy quality",
  "Custody, permissions, or execution capability",
  "Independent safety validation",
];

export function composeFlagshipProof(result: RangePilotWatchFetchResult, now = new Date()): FlagshipProof {
  if ("reason" in result) {
    return {
      kind: "standalone-live-service-proof",
      registryMapping: null,
      service: { name: "Range Pilot Watch", endpoint: RANGE_PILOT_WATCH_SOURCE_URL, scope: "WBNB/USDT · BSC mainnet" },
      status: result.status === "timeout" ? "Timed out" : "Unavailable",
      chainObserved: {},
      blocviewRetrievedAt: result.retrievedAt,
      freshness: "Unknown",
      freshnessReason: "No valid source timestamp was available.",
      observations: [],
      missingEvidence: [result.reason, "No chain observation was accepted for this attempt.", ...unsupported],
      limitations: ["Registry identity evidence remains separate and unchanged.", "Service failure is not evidence that the service or an agent is unsafe."],
    };
  }
  const response = result.response;
  const timestamp = response.fetchedAt;
  const freshness = timestamp ? classifyFreshness(timestamp, now) : { freshness: "Unknown" as const, freshnessReason: "The service response did not include fetchedAt." };
  const missing = [
    ...(!timestamp ? ["Source/service timestamp was not returned."] : []),
    ...(!response.blockNumber ? ["Block number was not returned."] : []),
    ...(!response.observedPrice ? ["Observed spot-state estimate was not returned."] : []),
    ...(!response.poolAddress ? ["Pool address was not returned."] : []),
    ...unsupported,
  ];
  return {
    kind: "standalone-live-service-proof",
    registryMapping: null,
    service: { name: "Range Pilot Watch", endpoint: RANGE_PILOT_WATCH_SOURCE_URL, scope: "WBNB/USDT · BSC mainnet" },
    status: result.status === "available" ? "Available" : "Degraded",
    rangeStatus: response.rangeStatus,
    chainObserved: {
      chainId: response.chainId,
      blockNumber: response.blockNumber,
      poolAddress: response.poolAddress ?? undefined,
      observedPrice: response.observedPrice ?? undefined,
      priceBasis: response.priceBasis,
    },
    sourceTimestamp: timestamp,
    blocviewRetrievedAt: result.retrievedAt,
    ...freshness,
    observations: response.observations ?? [],
    missingEvidence: missing,
    limitations: response.limitations ?? [],
    sourceEvidence: response.evidenceSource,
  };
}
