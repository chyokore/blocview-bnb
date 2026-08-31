if (typeof window !== "undefined") throw new Error("PancakeSwap V3 pool access is server-only.");

const BSC_RPC_URL = "https://bsc-rpc.publicnode.com";
const REQUEST_TIMEOUT_MS = 10_000;

export const PANCAKESWAP_V3_POOL_ALLOWLIST = {
  chainId: 56,
  network: "BNB Chain",
  pair: "WBNB / USDT",
  poolId: "WBNB-USDT-500",
  address: "0x36696169C63e42cd08ce11f5deeBbCeBae652050",
  factory: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
  token0: "0x55d398326f99059fF775485246999027B3197955",
  token1: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  fee: 500,
  tickSpacing: 10,
} as const;

const SELECTORS = {
  factory: "0xc45a0155",
  token0: "0x0dfe1681",
  token1: "0xd21220a7",
  fee: "0xddca3f43",
  tickSpacing: "0xd0c93a7c",
  slot0: "0x3850c7bd",
  liquidity: "0x1a686502",
} as const;

type VerificationCheck = { expected: string | number | boolean; observed: string | number | boolean | null; matches: boolean };
type PoolVerification = {
  status: "verified" | "mismatch";
  checks: Record<"chainId" | "poolCode" | "poolAddress" | "factory" | "token0" | "token1" | "fee" | "tickSpacing", VerificationCheck>;
};

export type PancakeSwapV3PoolEvidence = {
  source: "pancakeswap-v3";
  evidenceBasis: "First-party BLOCview read of PancakeSwap V3";
  chainId: 56;
  network: "BNB Chain";
  pair: "WBNB / USDT";
  pool: { address: string; factory: string; token0: string; token1: string; fee: number; tickSpacing: number };
  state: { sqrtPriceX96: string; tick: number; liquidity: string };
  block: { number: number; timestamp: string };
  verification: PoolVerification;
  observedAt: string;
};

export type PancakeSwapV3ReadResult =
  | { status: "verified" | "mismatch"; evidence: PancakeSwapV3PoolEvidence }
  | { status: "unavailable" | "malformed"; reason: string; observedAt: string };

type RpcRequest = { jsonrpc: "2.0"; id: number; method: string; params: unknown[] };
type RpcResponse = { jsonrpc?: unknown; id?: unknown; result?: unknown; error?: unknown };
type ReadOptions = { fetchImpl?: typeof fetch; now?: () => Date; timeoutMs?: number };

class MalformedRpcError extends Error {}

function normalizeAddress(value: string) { return value.toLowerCase(); }
function isHex(value: unknown): value is string { return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value); }

function decodeWord(value: unknown, index = 0): string {
  if (!isHex(value)) throw new MalformedRpcError("RPC result was not hexadecimal.");
  const body = value.slice(2);
  const start = index * 64;
  const word = body.slice(start, start + 64);
  if (word.length !== 64) throw new MalformedRpcError("RPC result was shorter than expected.");
  return word;
}

function decodeAddress(value: unknown): string {
  const word = decodeWord(value);
  if (!/^0{24}[0-9a-fA-F]{40}$/.test(word)) throw new MalformedRpcError("RPC address result was malformed.");
  return `0x${word.slice(24)}`;
}

function decodeUint(value: unknown, index = 0): bigint { return BigInt(`0x${decodeWord(value, index)}`); }

function decodeSafeUint(value: unknown): number {
  const decoded = decodeUint(value);
  if (decoded > BigInt(Number.MAX_SAFE_INTEGER)) throw new MalformedRpcError("RPC integer exceeded the safe numeric range.");
  return Number(decoded);
}

export function decodeSignedInt24Word(value: unknown, index = 0): number {
  const decoded = BigInt.asIntN(24, decodeUint(value, index));
  return Number(decoded);
}

export function decodeSlot0(value: unknown) {
  const sqrtPriceX96 = decodeUint(value, 0);
  const tick = decodeSignedInt24Word(value, 1);
  if (sqrtPriceX96 <= BigInt(0) || tick < -8_388_608 || tick > 8_388_607) throw new MalformedRpcError("slot0 returned invalid state.");
  return { sqrtPriceX96: sqrtPriceX96.toString(), tick };
}

async function rpcBatch(fetchImpl: typeof fetch, requests: RpcRequest[], timeoutMs: number): Promise<Map<number, unknown>> {
  const response = await fetchImpl(BSC_RPC_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(requests),
    signal: AbortSignal.timeout(Math.min(Math.max(timeoutMs, 1), REQUEST_TIMEOUT_MS)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("RPC request failed.");
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new MalformedRpcError("RPC returned unreadable JSON."); }
  if (!Array.isArray(body)) throw new MalformedRpcError("RPC batch response was malformed.");
  const responses = new Map<number, unknown>();
  for (const item of body as RpcResponse[]) {
    if (!item || item.jsonrpc !== "2.0" || !Number.isSafeInteger(item.id) || item.error !== undefined || !("result" in item)) throw new MalformedRpcError("RPC response item was malformed.");
    responses.set(Number(item.id), item.result);
  }
  if (requests.some((request) => !responses.has(request.id))) throw new MalformedRpcError("RPC response omitted a requested result.");
  return responses;
}

function request(id: number, method: string, params: unknown[] = []): RpcRequest { return { jsonrpc: "2.0", id, method, params }; }

export async function readPancakeSwapV3PoolEvidence({ fetchImpl = fetch, now = () => new Date(), timeoutMs = REQUEST_TIMEOUT_MS }: ReadOptions = {}): Promise<PancakeSwapV3ReadResult> {
  const observedAt = now().toISOString();
  try {
    const head = await rpcBatch(fetchImpl, [request(1, "eth_chainId"), request(2, "eth_blockNumber")], timeoutMs);
    const chainHex = head.get(1);
    const blockHex = head.get(2);
    if (!isHex(chainHex) || !isHex(blockHex)) throw new MalformedRpcError("Chain or block response was malformed.");
    const chainId = Number(BigInt(chainHex));
    const blockNumberBig = BigInt(blockHex);
    if (!Number.isSafeInteger(chainId) || blockNumberBig > BigInt(Number.MAX_SAFE_INTEGER)) throw new MalformedRpcError("Chain or block number was invalid.");
    const blockNumber = Number(blockNumberBig);
    const target = PANCAKESWAP_V3_POOL_ALLOWLIST.address;
    const pinned = await rpcBatch(fetchImpl, [
      request(10, "eth_getCode", [target, blockHex]),
      request(11, "eth_getBlockByNumber", [blockHex, false]),
      ...Object.values(SELECTORS).map((data, index) => request(20 + index, "eth_call", [{ to: target, data }, blockHex])),
    ], timeoutMs);
    const code = pinned.get(10);
    const block = pinned.get(11);
    if ((code !== "0x" && !isHex(code)) || !block || typeof block !== "object" || !isHex((block as { timestamp?: unknown }).timestamp)) throw new MalformedRpcError("Code or block timestamp response was malformed.");
    if (code === "0x" || /^0x0*$/.test(code)) return { status: "unavailable", reason: "The allowlisted PancakeSwap V3 pool bytecode was unavailable at the pinned block.", observedAt };
    const timestampSeconds = BigInt((block as { timestamp: string }).timestamp);
    if (timestampSeconds > BigInt(Number.MAX_SAFE_INTEGER)) throw new MalformedRpcError("Block timestamp was invalid.");
    const timestamp = new Date(Number(timestampSeconds) * 1_000);
    if (!Number.isFinite(timestamp.valueOf())) throw new MalformedRpcError("Block timestamp was invalid.");

    const factory = decodeAddress(pinned.get(20));
    const token0 = decodeAddress(pinned.get(21));
    const token1 = decodeAddress(pinned.get(22));
    const fee = decodeSafeUint(pinned.get(23));
    const tickSpacing = decodeSignedInt24Word(pinned.get(24));
    let slot0: ReturnType<typeof decodeSlot0>;
    try { slot0 = decodeSlot0(pinned.get(25)); }
    catch { return { status: "malformed", reason: "The PancakeSwap V3 slot0 response was malformed.", observedAt }; }
    let liquidity: bigint;
    try { liquidity = decodeUint(pinned.get(26)); }
    catch { return { status: "malformed", reason: "The PancakeSwap V3 liquidity response was malformed.", observedAt }; }
    const expected = PANCAKESWAP_V3_POOL_ALLOWLIST;
    const checks: PoolVerification["checks"] = {
      chainId: { expected: expected.chainId, observed: chainId, matches: chainId === expected.chainId },
      poolCode: { expected: true, observed: code !== "0x" && !/^0x0*$/.test(code), matches: code !== "0x" && !/^0x0*$/.test(code) },
      poolAddress: { expected: expected.address, observed: target, matches: normalizeAddress(target) === normalizeAddress(expected.address) },
      factory: { expected: expected.factory, observed: factory, matches: normalizeAddress(factory) === normalizeAddress(expected.factory) },
      token0: { expected: expected.token0, observed: token0, matches: normalizeAddress(token0) === normalizeAddress(expected.token0) },
      token1: { expected: expected.token1, observed: token1, matches: normalizeAddress(token1) === normalizeAddress(expected.token1) },
      fee: { expected: expected.fee, observed: fee, matches: fee === expected.fee },
      tickSpacing: { expected: expected.tickSpacing, observed: tickSpacing, matches: tickSpacing === expected.tickSpacing },
    };
    const status = Object.values(checks).every((check) => check.matches) ? "verified" : "mismatch";
    const evidence: PancakeSwapV3PoolEvidence = {
      source: "pancakeswap-v3",
      evidenceBasis: "First-party BLOCview read of PancakeSwap V3",
      chainId: 56,
      network: expected.network,
      pair: expected.pair,
      pool: { address: target, factory, token0, token1, fee, tickSpacing },
      state: { ...slot0, liquidity: liquidity.toString() },
      block: { number: blockNumber, timestamp: timestamp.toISOString() },
      verification: { status, checks },
      observedAt,
    };
    return { status, evidence };
  } catch (error) {
    return error instanceof MalformedRpcError
      ? { status: "malformed", reason: "The BNB Chain RPC returned malformed pool evidence.", observedAt }
      : { status: "unavailable", reason: "BLOCview's PancakeSwap V3 read is temporarily unavailable.", observedAt };
  }
}
