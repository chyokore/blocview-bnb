import type { RangePilotLiveAgent } from "./range-pilot-watch-agents.ts";
import { listRangePilotLiveAgents } from "./range-pilot-watch-agents.ts";

export const LIVE_COMPARISON_MIN = 2;
export const LIVE_COMPARISON_MAX = 4;
export type ComparisonEvidenceState = "VERIFIED" | "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "NOT APPLICABLE" | "INDEXING PENDING";
export type EvidenceSignal = "erc8004Identity" | "documentation" | "healthEndpoint" | "liveAssessment" | "onchainEvidence" | "pinnedBlock" | "externalCrossCheck" | "indexedReputation";

export type LiveAgentComparisonRecord = {
  agent: RangePilotLiveAgent;
  bestFor: string;
  observes: string;
  supportedInput: string;
  activationMode: string;
  protocol: string;
  evidenceSource: string;
  evidenceFreshness: string;
  onchainEvidence: { state: ComparisonEvidenceState; detail: string };
  categoryEvidence: string;
  safety: { readOnly: true; walletRequired: false; signatureRequired: false; transactionCapability: false; custody: string; fundMovement: false; externalExecution: false };
  limitation: string;
  unsupportedAction: string;
  missingEvidence: string[];
  signals: Record<EvidenceSignal, boolean>;
  coverage: { available: number; total: number };
};

type Detail = Omit<LiveAgentComparisonRecord, "agent" | "coverage">;
const sharedSafety = { readOnly: true, walletRequired: false, signatureRequired: false, transactionCapability: false, custody: "Not established by the registration evidence", fundMovement: false, externalExecution: false } as const;
const sharedMissing = ["8004scan reputation and activity evidence", "Independent validation or audit evidence", "Permission, custody, and operating-control evidence"];
const sharedSignals = { erc8004Identity: true, documentation: true, healthEndpoint: true, liveAssessment: true, onchainEvidence: false, pinnedBlock: false, externalCrossCheck: false, indexedReputation: false } as const;

const details: Record<number, Detail> = {
  321941: {
    bestFor: "Checking whether a declared PancakeSwap V3 LP position is currently in range.", observes: "Position-range state for a caller-supplied LP NFT token ID.", supportedInput: "A PancakeSwap V3 position token ID.", activationMode: "Bounded external read-only assessment", protocol: "PancakeSwap V3", evidenceSource: "RangePilotWatch registration, documentation, health, and assessment endpoints", evidenceFreshness: "Health and assessment are checked only when opened or run; no comparison-page snapshot is claimed.", onchainEvidence: { state: "PARTIAL", detail: "The external assessment declares read-only position evidence; BLOCview does not independently pin or verify it here." }, categoryEvidence: "LP-position range observation", safety: sharedSafety, limitation: "A point-in-time range check is not continuous monitoring and does not establish performance.", unsupportedAction: "Does not rebalance, approve, add, remove, or move liquidity.", missingEvidence: sharedMissing, signals: { ...sharedSignals },
  },
  321995: {
    bestFor: "Placing a verified PancakeSwap V3 pool tick within caller-declared grid boundaries.", observes: "Live point-in-time WBNB/USDT pool state and grid placement.", supportedInput: "Allowlisted WBNB-USDT-500 pool plus strictly increasing tick boundaries.", activationMode: "Bounded BLOCview read-only assessment", protocol: "PancakeSwap V3", evidenceSource: "First-party BLOCview BSC read with RangePilotWatch cross-check", evidenceFreshness: "Pinned-block point-in-time evidence is created only when an assessment is run.", onchainEvidence: { state: "VERIFIED", detail: "First-party BLOCview verification of the allowlisted pool identity and pinned-block state; RangePilotWatch is a secondary cross-check." }, categoryEvidence: "Pool tick, liquidity, block timestamp, grid placement, and external consistency state", safety: sharedSafety, limitation: "Pool state changes after the pinned block, and caller-supplied grid boundaries are not a strategy recommendation.", unsupportedAction: "Does not create orders, trade, swap, rebalance, or execute a grid strategy.", missingEvidence: sharedMissing, signals: { ...sharedSignals, onchainEvidence: true, pinnedBlock: true, externalCrossCheck: true },
  },
  322046: {
    bestFor: "Comparing displayed supply-rate evidence across two allowlisted Venus stablecoin markets.", observes: "Stored values and displayed supply rates for allowlisted Venus markets.", supportedInput: "usd-stablecoins with one or both allowlisted core-vUSDC and core-vUSDT markets.", activationMode: "Bounded external read-only assessment", protocol: "Venus Protocol", evidenceSource: "RangePilotWatch registration, documentation, health, and assessment endpoints", evidenceFreshness: "Health and assessment are checked only when opened or run; no comparison-page snapshot is claimed.", onchainEvidence: { state: "PARTIAL", detail: "The external assessment declares read-only Venus market evidence; BLOCview does not independently pin or verify it here." }, categoryEvidence: "Allowlisted market supply-rate comparison", safety: sharedSafety, limitation: "Displayed rates can change and do not establish realised yield, suitability, or future returns.", unsupportedAction: "Does not allocate, supply, withdraw, or recommend funds.", missingEvidence: sharedMissing, signals: { ...sharedSignals },
  },
  322090: {
    bestFor: "Checking a caller-supplied Venus account's current borrow-buffer condition.", observes: "Point-in-time Venus account-liquidity evidence against a caller-set warning ratio.", supportedInput: "A public BSC account address and warning ratio from 1.00 to 3.00.", activationMode: "Bounded external read-only assessment", protocol: "Venus Protocol", evidenceSource: "RangePilotWatch registration, documentation, health, and assessment endpoints", evidenceFreshness: "Health and assessment are checked only when opened or run; no comparison-page snapshot is claimed.", onchainEvidence: { state: "PARTIAL", detail: "The external assessment declares read-only account-liquidity evidence; BLOCview does not independently pin or verify it here." }, categoryEvidence: "Account-liquidity and caller-defined warning-buffer observation", safety: sharedSafety, limitation: "A single assessment is not continuous monitoring or a liquidation prediction.", unsupportedAction: "Does not repay, borrow, supply, withdraw, liquidate, or move funds.", missingEvidence: sharedMissing, signals: { ...sharedSignals },
  },
};

export function normalizeComparisonIds(input: string | string[] | undefined): number[] {
  const values = Array.isArray(input) ? input : (input ?? "").split(",");
  const allowed = new Set(listRangePilotLiveAgents().map((agent) => agent.tokenId));
  return [...new Set(values.map((value) => Number(String(value).trim())).filter((value) => Number.isSafeInteger(value) && allowed.has(value)))].slice(0, LIVE_COMPARISON_MAX);
}

export function buildLiveComparison(ids: number[], now = new Date()): LiveAgentComparisonRecord[] {
  const selected = new Set(normalizeComparisonIds(ids.map(String)));
  return listRangePilotLiveAgents(now).filter((agent) => selected.has(agent.tokenId)).map((agent) => {
    const detail = details[agent.tokenId];
    return { agent, ...detail, coverage: { available: Object.values(detail.signals).filter(Boolean).length, total: Object.keys(detail.signals).length } };
  });
}
