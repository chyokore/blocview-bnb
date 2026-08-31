export const ASSESSMENT_ENDPOINTS = {
  321941: "https://range-pilot-watch.onrender.com/agents/range-rebalance/assess",
  321995: "https://range-pilot-watch.onrender.com/agents/grid-band/assess",
  322046: "https://range-pilot-watch.onrender.com/agents/venus-yield/assess",
  322090: "https://range-pilot-watch.onrender.com/agents/venus-borrow-buffer/assess",
} as const;

export type AssessmentTokenId = keyof typeof ASSESSMENT_ENDPOINTS;

type JsonRecord = Record<string, unknown>;

function exactKeys(record: JsonRecord, allowed: readonly string[]) {
  return Object.keys(record).every((key) => allowed.includes(key));
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isAssessmentTokenId(value: number): value is AssessmentTokenId {
  return Object.hasOwn(ASSESSMENT_ENDPOINTS, value);
}

export function validateAssessmentRequest(tokenId: AssessmentTokenId, value: unknown): JsonRecord | null {
  if (!isRecord(value)) return null;
  if (tokenId === 321941) {
    if (!exactKeys(value, ["tokenId"]) || typeof value.tokenId !== "string" || !/^[1-9]\d*$/.test(value.tokenId)) return null;
    return { tokenId: value.tokenId };
  }
  if (tokenId === 321995) {
    if (!exactKeys(value, ["poolId", "boundaries"]) || value.poolId !== "WBNB-USDT-500" || !Array.isArray(value.boundaries)) return null;
    const boundaries = value.boundaries;
    if (boundaries.length < 2 || boundaries.length > 101) return null;
    if (!boundaries.every((tick) => Number.isSafeInteger(tick) && Number(tick) >= -8_388_608 && Number(tick) <= 8_388_607 && Number(tick) % 10 === 0)) return null;
    if (!boundaries.every((tick, index) => index === 0 || Number(boundaries[index - 1]) < Number(tick))) return null;
    return { poolId: value.poolId, boundaries: [...boundaries] };
  }
  if (tokenId === 322046) {
    if (!exactKeys(value, ["assetId", "markets"]) || value.assetId !== "usd-stablecoins") return null;
    const markets = value.markets === undefined ? ["core-vUSDC", "core-vUSDT"] : value.markets;
    if (!Array.isArray(markets) || markets.length < 1 || markets.length > 2) return null;
    if (!markets.every((market) => market === "core-vUSDC" || market === "core-vUSDT") || new Set(markets).size !== markets.length) return null;
    return { assetId: value.assetId, markets: [...markets] };
  }
  if (!exactKeys(value, ["accountAddress", "warningRatio"]) || typeof value.accountAddress !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(value.accountAddress)) return null;
  const warningRatio = value.warningRatio === undefined ? "1.25" : value.warningRatio;
  if (typeof warningRatio !== "string" || !/^\d+(?:\.\d+)?$/.test(warningRatio)) return null;
  const ratio = Number(warningRatio);
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 3) return null;
  return { accountAddress: value.accountAddress, warningRatio };
}
