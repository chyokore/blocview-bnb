import type { PancakeSwapV3PoolEvidence, PancakeSwapV3ReadResult } from "./pancakeswap-v3";

type ExternalObservation = { poolAddress?: string; currentTick?: number; blockNumber?: number; observedAt?: string };
export type GridBandCrossCheck = { status: "consistent" | "divergent" | "unavailable"; reason: string; external?: ExternalObservation };

export type GridBandReceipt = {
  kind: "gridband-first-party-receipt";
  mode: "read-only-on-chain-observation";
  status: "completed";
  request: { poolId: "WBNB-USDT-500"; boundaries: number[] };
  pancakeSwap: PancakeSwapV3PoolEvidence;
  assessment: { currentTick: number; placement: { kind: "below_declared_grid" | "within_declared_grid" | "above_declared_grid"; bandIndex?: number }; boundariesBasis: "caller-supplied" };
  externalCrossCheck: GridBandCrossCheck;
  limitations: string[];
};

function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }

export function extractRangePilotGridObservation(value: unknown): ExternalObservation | null {
  const root = record(value);
  const result = record(root?.result ?? value);
  const assessment = record(result?.assessment);
  const evidence = record(result?.evidence);
  const block = record(evidence?.block);
  const contracts = record(evidence?.contractAddresses);
  const currentTick = assessment?.currentTick;
  const poolAddress = contracts?.pool;
  if (!Number.isSafeInteger(currentTick) || typeof poolAddress !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(poolAddress)) return null;
  return {
    currentTick: Number(currentTick),
    poolAddress,
    blockNumber: Number.isSafeInteger(block?.number) ? Number(block?.number) : undefined,
    observedAt: typeof evidence?.observedAt === "string" && Number.isFinite(new Date(evidence.observedAt).valueOf()) ? evidence.observedAt : undefined,
  };
}

export function crossCheckGridBand(firstParty: PancakeSwapV3PoolEvidence, externalValue: unknown): GridBandCrossCheck {
  const external = extractRangePilotGridObservation(externalValue);
  if (!external) return { status: "unavailable", reason: "RangePilotWatch did not return a comparable pool observation." };
  if (external.poolAddress?.toLowerCase() !== firstParty.pool.address.toLowerCase()) return { status: "divergent", reason: "RangePilotWatch returned a different pool address.", external };
  const blockDelta = external.blockNumber === undefined ? undefined : Math.abs(external.blockNumber - firstParty.block.number);
  const tickDelta = Math.abs((external.currentTick ?? firstParty.state.tick) - firstParty.state.tick);
  if (blockDelta === 0 && tickDelta !== 0) return { status: "divergent", reason: "The sources returned different ticks for the same block.", external };
  if (blockDelta !== undefined && blockDelta <= 5 && tickDelta > 100) return { status: "divergent", reason: "The ticks differ by more than 100 within five BNB Chain blocks.", external };
  return { status: "consistent", reason: blockDelta === 0 ? "The pool address, block, and tick agree." : "The pool address agrees and the different-block ticks are not materially contradictory.", external };
}

export function placeTick(boundaries: number[], tick: number): GridBandReceipt["assessment"]["placement"] {
  if (tick < boundaries[0]) return { kind: "below_declared_grid" };
  if (tick >= boundaries[boundaries.length - 1]) return { kind: "above_declared_grid" };
  const bandIndex = boundaries.findIndex((upper, index) => index > 0 && tick < upper) - 1;
  return { kind: "within_declared_grid", bandIndex };
}

export function composeGridBandReceipt(request: { poolId: "WBNB-USDT-500"; boundaries: number[] }, firstParty: PancakeSwapV3ReadResult, externalValue: unknown): GridBandReceipt | null {
  if (firstParty.status !== "verified") return null;
  return {
    kind: "gridband-first-party-receipt",
    mode: "read-only-on-chain-observation",
    status: "completed",
    request,
    pancakeSwap: firstParty.evidence,
    assessment: { currentTick: firstParty.evidence.state.tick, placement: placeTick(request.boundaries, firstParty.evidence.state.tick), boundariesBasis: "caller-supplied" },
    externalCrossCheck: crossCheckGridBand(firstParty.evidence, externalValue),
    limitations: [
      "Point-in-time pool evidence can become stale immediately after the pinned block.",
      "The caller supplied the grid boundaries. They are not an LP position or a strategy recommendation.",
      "No wallet, signing, swap, transaction, approval, liquidity modification, payment, or execution is performed.",
    ],
  };
}
