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
const sharedMissing = ["8004scan reputation and activity evidence", "Independent validation or audit evidence", "Evidence about permissions, custody, and operating controls"];
const sharedSignals = { erc8004Identity: true, documentation: true, healthEndpoint: true, liveAssessment: true, onchainEvidence: false, pinnedBlock: false, externalCrossCheck: false, indexedReputation: false } as const;

const details: Record<number, Detail> = {
  321941: {
    bestFor: "Checking whether a declared PancakeSwap V3 LP position is currently in range.", observes: "The range state for an LP NFT token ID supplied by the caller. A public identifier does not establish ownership.", supportedInput: "A PancakeSwap V3 position token ID.", activationMode: "Read only assessment", protocol: "PancakeSwap V3", evidenceSource: "RangePilotWatch registration, documentation, health, and assessment endpoints", evidenceFreshness: "Health is checked when opened, and the assessment is checked when run. The comparison page does not claim a current snapshot.", onchainEvidence: { state: "PARTIAL", detail: "The external assessment reports position evidence. BLOCview does not independently pin or verify it here." }, categoryEvidence: "Observation of an LP position's range", safety: sharedSafety, limitation: "A single range check is not continuous monitoring, proof of ownership, or evidence of performance.", unsupportedAction: "Does not rebalance, approve, add, remove, or move liquidity.", missingEvidence: sharedMissing, signals: { ...sharedSignals },
  },
  321995: {
    bestFor: "Placing a verified PancakeSwap V3 pool tick within grid boundaries supplied by the caller.", observes: "The WBNB/USDT pool state and grid placement at one moment in time. It does not inspect an LP NFT.", supportedInput: "The approved WBNB-USDT-500 pool and strictly increasing tick boundaries.", activationMode: "Read only assessment", protocol: "PancakeSwap V3", evidenceSource: "BLOCview's first party BSC read, with RangePilotWatch as a separate cross check", evidenceFreshness: "Evidence from a pinned block is created only when an assessment runs.", onchainEvidence: { state: "VERIFIED", detail: "BLOCview verifies the approved pool identity and its state at one pinned block. RangePilotWatch provides a separate cross check." }, categoryEvidence: "Pool tick, liquidity, block timestamp, grid placement, and external consistency", safety: sharedSafety, limitation: "Pool state changes after the pinned block. Grid boundaries supplied by the caller are not a strategy recommendation.", unsupportedAction: "Does not inspect an LP NFT, create orders, trade, swap, rebalance, or execute a grid strategy.", missingEvidence: sharedMissing, signals: { ...sharedSignals, onchainEvidence: true, pinnedBlock: true, externalCrossCheck: true },
  },
  322046: {
    bestFor: "Comparing displayed supply rate evidence across two approved Venus stablecoin markets.", observes: "Stored values and displayed supply rates for approved Venus markets.", supportedInput: "usd-stablecoins with one or both approved core-vUSDC and core-vUSDT markets.", activationMode: "Read only assessment", protocol: "Venus Protocol", evidenceSource: "RangePilotWatch registration, documentation, health, and assessment endpoints", evidenceFreshness: "Health is checked when opened, and the assessment is checked when run. The comparison page does not claim a current snapshot.", onchainEvidence: { state: "PARTIAL", detail: "The external assessment reports Venus market evidence. BLOCview does not independently pin or verify it here." }, categoryEvidence: "Supply rate comparison for approved markets", safety: sharedSafety, limitation: "Displayed rates can change and do not establish realised, guaranteed, or optimal yield, suitability, or future returns.", unsupportedAction: "Does not allocate, deposit, supply, withdraw, move, or recommend funds.", missingEvidence: sharedMissing, signals: { ...sharedSignals },
  },
  322090: {
    bestFor: "Checking the current borrow buffer for a Venus account supplied by the caller.", observes: "Venus account liquidity at one moment in time, compared with a warning ratio set by the caller.", supportedInput: "A public BSC account address and warning ratio from 1.00 to 3.00.", activationMode: "Read only assessment", protocol: "Venus Protocol", evidenceSource: "RangePilotWatch registration, documentation, health, and assessment endpoints", evidenceFreshness: "Health is checked when opened, and the assessment is checked when run. The comparison page does not claim a current snapshot.", onchainEvidence: { state: "PARTIAL", detail: "The external assessment reports account liquidity evidence. BLOCview does not independently pin or verify it here." }, categoryEvidence: "Account liquidity and a warning buffer defined by the caller", safety: sharedSafety, limitation: "A single assessment is not continuous monitoring, a liquidation prediction, or a guarantee that liquidation will be prevented.", unsupportedAction: "Does not repay, borrow, supply, withdraw, move collateral, liquidate, or move funds.", missingEvidence: sharedMissing, signals: { ...sharedSignals },
  },
};

export function normalizeComparisonIds(input: string | string[] | undefined): number[] {
  const values = Array.isArray(input) ? input : (input ?? "").split(",");
  const allowed = new Set(listRangePilotLiveAgents().map((agent) => agent.tokenId));
  return [...new Set(values.map((value) => Number(String(value).trim())).filter((value) => Number.isSafeInteger(value) && allowed.has(value)))].slice(0, LIVE_COMPARISON_MAX);
}

export function buildLiveComparison(ids: number[], now = new Date(), agents: readonly RangePilotLiveAgent[] = listRangePilotLiveAgents(now)): LiveAgentComparisonRecord[] {
  const selected = new Set(normalizeComparisonIds(ids.map(String)));
  return agents.filter((agent) => selected.has(agent.tokenId)).map((agent) => {
    const detail = details[agent.tokenId];
    const indexedReputation = agent.source === "8004scan" && (agent.reputation?.score !== undefined || agent.reputation?.stars !== undefined || agent.reputation?.feedbackCount !== undefined);
    const signals = { ...detail.signals, indexedReputation };
    const missingEvidence = indexedReputation ? detail.missingEvidence.filter((item) => !item.startsWith("8004scan reputation")) : detail.missingEvidence;
    return { agent, ...detail, signals, missingEvidence, coverage: { available: Object.values(signals).filter(Boolean).length, total: Object.keys(signals).length } };
  });
}
