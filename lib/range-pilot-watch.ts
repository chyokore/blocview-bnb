if (typeof window !== "undefined") throw new Error("Range Pilot Watch proof access is server-only.");

const RANGE_PILOT_WATCH_URL = "https://range-pilot-watch.onrender.com";
const LIVE_PROOF_PATH = "/assess_live_range";
const REQUEST_TIMEOUT_MS = 12_000;

export const RANGE_PILOT_WATCH_SOURCE_URL = `${RANGE_PILOT_WATCH_URL}${LIVE_PROOF_PATH}`;
export const FLAGSHIP_PROOF_REQUEST = {
  poolReference: "PancakeSwap V3 WBNB/USDT",
  lowerPrice: 500,
  upperPrice: 1500,
  feeTier: 500,
  userGoal: "Observe whether the current read-only pool spot-state estimate is within the stated range",
} as const;

export type RangePilotWatchRequest = {
  poolReference: string;
  lowerPrice: number;
  upperPrice: number;
  feeTier: 100 | 500 | 2500 | 10000;
  positionReference?: string;
  userGoal?: string;
};

export type RangePilotWatchResponse = {
  rangeStatus: "in_range" | "below_range" | "above_range" | "insufficient_data" | "data_unavailable";
  summary: string;
  observedPrice?: number | null;
  priceBasis?: string;
  feeTier?: number | null;
  poolAddress?: string | null;
  chainId?: number;
  blockNumber?: number;
  liveDataStatus?: "available" | "unavailable";
  dataSource?: string;
  fetchedAt?: string;
  observations?: string[];
  suggestedReviewActions?: string[];
  riskNotes?: string[];
  limitations?: string[];
  evidenceSource?: string;
  generatedAt?: string;
};

export type RangePilotWatchFetchResult =
  | { status: "available" | "degraded"; response: RangePilotWatchResponse; retrievedAt: string }
  | { status: "timeout" | "http-error" | "malformed-json" | "malformed-response" | "unavailable"; reason: string; retrievedAt: string };

type FetchOptions = { fetchImpl?: typeof fetch; timeoutMs?: number; now?: () => Date };
const feeTiers = new Set([100, 500, 2500, 10000]);
const rangeStatuses = new Set(["in_range", "below_range", "above_range", "insufficient_data", "data_unavailable"]);

function finitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function stringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateRangePilotWatchRequest(value: RangePilotWatchRequest) {
  const keys = Object.keys(value);
  const allowed = new Set(["poolReference", "lowerPrice", "upperPrice", "feeTier", "positionReference", "userGoal"]);
  return keys.every((key) => allowed.has(key))
    && typeof value.poolReference === "string" && Boolean(value.poolReference.trim())
    && finitePositive(value.lowerPrice) && finitePositive(value.upperPrice) && value.lowerPrice < value.upperPrice
    && feeTiers.has(value.feeTier)
    && (value.positionReference === undefined || typeof value.positionReference === "string")
    && (value.userGoal === undefined || typeof value.userGoal === "string");
}

export function validateRangePilotWatchResponse(value: unknown): RangePilotWatchResponse | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.rangeStatus !== "string" || !rangeStatuses.has(record.rangeStatus) || typeof record.summary !== "string") return null;
  if (record.liveDataStatus !== undefined && record.liveDataStatus !== "available" && record.liveDataStatus !== "unavailable") return null;
  for (const key of ["observations", "suggestedReviewActions", "riskNotes", "limitations"] as const) {
    if (record[key] !== undefined && !stringList(record[key])) return null;
  }
  const response = record as RangePilotWatchResponse;
  if (response.liveDataStatus === "available") {
    if (response.chainId !== 56 || !finitePositive(response.observedPrice) || !Number.isSafeInteger(response.blockNumber) || (response.blockNumber ?? 0) <= 0) return null;
    if (typeof response.poolAddress !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(response.poolAddress)) return null;
    if (!response.fetchedAt || !Number.isFinite(new Date(response.fetchedAt).valueOf())) return null;
    if (!response.priceBasis || !response.dataSource || !response.evidenceSource) return null;
  }
  return response;
}

export async function fetchRangePilotWatchProof(
  request: RangePilotWatchRequest = FLAGSHIP_PROOF_REQUEST,
  { fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS, now = () => new Date() }: FetchOptions = {},
): Promise<RangePilotWatchFetchResult> {
  const retrievedAt = now().toISOString();
  if (!validateRangePilotWatchRequest(request)) return { status: "unavailable", reason: "BLOCview declined to send an invalid proof request.", retrievedAt };
  try {
    const response = await fetchImpl(RANGE_PILOT_WATCH_SOURCE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(Math.min(Math.max(timeoutMs, 1), REQUEST_TIMEOUT_MS)),
      cache: "no-store",
    });
    if (!response.ok) return { status: "http-error", reason: "The live proof service returned an HTTP error.", retrievedAt };
    let body: unknown;
    try { body = await response.json(); }
    catch { return { status: "malformed-json", reason: "The live proof service returned unreadable JSON.", retrievedAt }; }
    const validated = validateRangePilotWatchResponse(body);
    if (!validated) return { status: "malformed-response", reason: "The live proof response did not match the expected evidence contract.", retrievedAt };
    const available = validated.liveDataStatus === "available"
      && ["in_range", "below_range", "above_range"].includes(validated.rangeStatus);
    return { status: available ? "available" : "degraded", response: validated, retrievedAt };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return name === "AbortError" || name === "TimeoutError"
      ? { status: "timeout", reason: "The live proof request timed out; the free service may be waking from sleep.", retrievedAt }
      : { status: "unavailable", reason: "The live proof service is temporarily unavailable.", retrievedAt };
  }
}
