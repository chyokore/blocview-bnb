import type { LiveAgent } from "./8004scan";
import { deriveEvidenceRecord, type EvidenceRecord } from "./evidence.ts";

export type ComparisonCriterion = "capability-match" | "evidence-coverage" | "retrieval-freshness" | "reputation-availability";

export type ComparedRecord = {
  agent: LiveAgent;
  evidence: EvidenceRecord;
  score: number;
  matchedRequirements: string[];
  unmatchedRequirements: string[];
  weightedReasons: Array<{ criterion: ComparisonCriterion; points: number; explanation: string }>;
  disqualifiers: string[];
  unknowns: string[];
};

export type LiveComparisonResult = {
  requirements: string[];
  records: [ComparedRecord, ComparedRecord];
  outcome: "recommended" | "no-clear-best-fit";
  recommendedAgentId?: string;
  headline: string;
  runnerUpExplanation: string;
  decisionSupportNotice: string;
};

export function parseRequirements(input: string | string[]): string[] {
  const values = Array.isArray(input) ? input : input.split(",");
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))].slice(0, 8);
}

function capabilityMatches(requirement: string, capabilities: string[]) {
  return capabilities.some((capability) => {
    const normalized = capability.trim().toLowerCase();
    return normalized === requirement || normalized.includes(requirement) || requirement.includes(normalized);
  });
}

function freshnessPoints(freshness: EvidenceRecord["retrieval"]["freshness"]) {
  if (freshness === "Fresh") return 2;
  if (freshness === "Recent") return 1;
  return 0;
}

function compareRecord(agent: LiveAgent, requirements: string[], now: Date): ComparedRecord {
  const evidence = deriveEvidenceRecord(agent, now);
  const matchedRequirements = requirements.filter((requirement) => capabilityMatches(requirement, evidence.declaredCapabilities));
  const unmatchedRequirements = requirements.filter((requirement) => !matchedRequirements.includes(requirement));
  const capabilityPoints = matchedRequirements.length * 4;
  const coveragePoints = evidence.coverage.available;
  const retrievalPoints = freshnessPoints(evidence.retrieval.freshness);
  const reputationPoints = evidence.reputation ? 1 : 0;
  const disqualifiers: string[] = [];
  if (requirements.length && matchedRequirements.length === 0) disqualifiers.push("No declared capability matches the stated requirements.");
  if (!evidence.declaredCapabilities.length) disqualifiers.push("No declared capabilities are available from this record.");
  if (evidence.retrieval.freshness === "Stale") disqualifiers.push("The registry record is stale under BLOCview's retrieval-age rule.");
  if (evidence.retrieval.freshness === "Unknown") disqualifiers.push("Retrieval freshness cannot be classified.");
  return {
    agent,
    evidence,
    score: capabilityPoints + coveragePoints + retrievalPoints + reputationPoints,
    matchedRequirements,
    unmatchedRequirements,
    weightedReasons: [
      { criterion: "capability-match", points: capabilityPoints, explanation: `${matchedRequirements.length} of ${requirements.length} stated requirements match declared capability labels (4 points each).` },
      { criterion: "evidence-coverage", points: coveragePoints, explanation: `${evidence.coverage.available} of ${evidence.coverage.total} evidence areas are covered (1 point each).` },
      { criterion: "retrieval-freshness", points: retrievalPoints, explanation: `${evidence.retrieval.freshness} retrieval classification (${retrievalPoints} points).` },
      { criterion: "reputation-availability", points: reputationPoints, explanation: evidence.reputation ? "Reputation fields were returned by the source (1 point; not independently validated)." : "No reputation fields were returned (0 points)." },
    ],
    disqualifiers,
    unknowns: evidence.missingEvidence,
  };
}

export function compareLiveAgents(left: LiveAgent, right: LiveAgent, requirementInput: string | string[], now = new Date()): LiveComparisonResult {
  const requirements = parseRequirements(requirementInput);
  const records: [ComparedRecord, ComparedRecord] = [compareRecord(left, requirements, now), compareRecord(right, requirements, now)];
  const [first, second] = records;
  const difference = Math.abs(first.score - second.score);
  const noCapabilitySignal = requirements.length > 0 && first.matchedRequirements.length === 0 && second.matchedRequirements.length === 0;
  const inconclusive = requirements.length === 0 || difference < 2 || noCapabilitySignal;
  const winner = first.score > second.score ? first : second;
  const runnerUp = winner === first ? second : first;
  return {
    requirements,
    records,
    outcome: inconclusive ? "no-clear-best-fit" : "recommended",
    recommendedAgentId: inconclusive ? undefined : winner.agent.agentId,
    headline: inconclusive ? "No clear best fit" : `${winner.agent.name ?? `ERC-8004 #${winner.agent.tokenId}`} is the better-evidenced fit for these stated requirements`,
    runnerUpExplanation: inconclusive
      ? `The records are within ${difference} weighted point${difference === 1 ? "" : "s"}, or neither matches a stated capability requirement. The available evidence does not support a clear preference.`
      : `${runnerUp.agent.name ?? `ERC-8004 #${runnerUp.agent.tokenId}`} is the runner-up with ${runnerUp.score} points versus ${winner.score}; review its unmatched requirements and evidence gaps before deciding.`,
    decisionSupportNotice: "This deterministic comparison is decision support only—not verification, endorsement, investment advice, or evidence of reliability, safety, performance, activity, or permission controls.",
  };
}
