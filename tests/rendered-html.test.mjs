import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveEvidenceRecord, resolveRetrievalTimestamp } from "../lib/evidence.ts";
import { buildLiveComparison, normalizeComparisonIds } from "../lib/live-comparison.ts";
import {
  fetchRangePilotWatchProof,
  FLAGSHIP_PROOF_REQUEST,
  RANGE_PILOT_WATCH_SOURCE_URL,
  validateRangePilotWatchRequest,
  validateRangePilotWatchResponse,
} from "../lib/range-pilot-watch.ts";
import { composeFlagshipProof, resolveRangePilotWatchRegistryMapping } from "../lib/flagship-proof.ts";
import { listRangePilotLiveAgents, mergeRangePilotIndexedAgent, RANGE_PILOT_REGISTRY } from "../lib/range-pilot-watch-agents.ts";
import { ASSESSMENT_ENDPOINTS, validateAssessmentRequest } from "../lib/range-pilot-assessments.ts";
import { composeGridBandReceipt, crossCheckGridBand, placeTick } from "../lib/gridband-evidence.ts";
import { decodeSignedInt24Word, decodeSlot0, PANCAKESWAP_V3_POOL_ALLOWLIST, readPancakeSwapV3PoolEvidence } from "../lib/pancakeswap-v3.ts";

function liveAgent(overrides = {}) {
  return {
    source: "8004scan",
    chainId: 56,
    network: "BNB Chain",
    tokenId: 42,
    agentId: "56:42",
    name: "Registry Agent",
    capabilities: ["example-capability"],
    reputation: { score: 8, feedbackCount: 3 },
    registeredAt: "2026-08-01T00:00:00.000Z",
    retrievedAt: "2026-08-31T10:00:00.000Z",
    retrievalTimestampBasis: "source-provided",
    ...overrides,
  };
}

function serviceResponse(overrides = {}) {
  return {
    rangeStatus: "in_range",
    summary: "The read-only spot-state estimate is inside the stated range.",
    observedPrice: 685.97,
    priceBasis: "Read from PancakeSwap V3 pool slot0 state on BSC; calculated locally from sqrtPriceX96",
    feeTier: 500,
    poolAddress: "0x36696169c63e42cd08ce11f5deebbcebae652050",
    chainId: 56,
    blockNumber: 119120063,
    liveDataStatus: "available",
    dataSource: "Official BSC public RPC + PancakeSwap V3 factory/pool state",
    fetchedAt: "2026-08-31T10:00:00.000Z",
    observations: ["Fixed pair: WBNB/USDT."],
    suggestedReviewActions: [],
    riskNotes: [],
    limitations: ["No wallet, signing, or transaction capability is present."],
    evidenceSource: "Read-only BSC state at block 119120063.",
    generatedAt: "2026-08-31T10:00:00.000Z",
    ...overrides,
  };
}

function jsonFetch(body, status = 200) {
  return async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const rpcWord = (value) => BigInt.asUintN(256, BigInt(value)).toString(16).padStart(64, "0");
const rpcAddress = (value) => `0x${"0".repeat(24)}${value.slice(2).toLowerCase()}`;
const rpcUint = (value) => `0x${rpcWord(value)}`;
const rpcSlot0 = (sqrtPriceX96, tick) => `0x${rpcWord(sqrtPriceX96)}${rpcWord(tick)}`;

function verifiedRpcFetch(overrides = {}) {
  let call = 0;
  const values = {
    chainId: "0x38",
    blockNumber: "0x071a1200",
    code: "0x60006000",
    timestamp: "0x68b46b20",
    factory: rpcAddress(PANCAKESWAP_V3_POOL_ALLOWLIST.factory),
    token0: rpcAddress(PANCAKESWAP_V3_POOL_ALLOWLIST.token0),
    token1: rpcAddress(PANCAKESWAP_V3_POOL_ALLOWLIST.token1),
    fee: rpcUint(500),
    tickSpacing: rpcUint(10),
    slot0: rpcSlot0(123456789012345678901234567890n, -65411),
    liquidity: rpcUint(1267650600228229401496703205376n),
    ...overrides,
  };
  return async (_url, init) => {
    call += 1;
    const requests = JSON.parse(String(init.body));
    if (call === 1) return Response.json(requests.map((request) => ({ jsonrpc: "2.0", id: request.id, result: request.id === 1 ? values.chainId : values.blockNumber })));
    const results = new Map([
      [10, values.code], [11, { number: values.blockNumber, timestamp: values.timestamp }],
      [20, values.factory], [21, values.token0], [22, values.token1], [23, values.fee], [24, values.tickSpacing], [25, values.slot0], [26, values.liquidity],
    ]);
    return Response.json(requests.map((request) => ({ jsonrpc: "2.0", id: request.id, result: results.get(request.id) })));
  };
}

function externalGridObservation({ currentTick = -65411, blockNumber = 119149056, pool = PANCAKESWAP_V3_POOL_ALLOWLIST.address, observedAt = "2026-08-31T12:00:00.000Z" } = {}) {
  return { result: { assessment: { currentTick }, evidence: { block: { number: blockNumber }, contractAddresses: { pool }, observedAt } } };
}

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders BLOCview instead of the obsolete starter screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>BLOCview: Understand onchain AI agents<\/title>/i);
  assert.match(html, /Built for the BNB Chain agent economy/i);
  assert.match(html, /Explore demo strategies/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|react-loading-skeleton/i);
});

test("homepage copy is human, complete, and free of an em dash in the hero message", async () => {
  const response = await render();
  const html = await response.text();
  const heroCopy = "Discover real BSC agents, see what the evidence supports, and compare what is known and unknown. BLOCview never asks for wallet access.";
  assert.match(html, new RegExp(heroCopy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(heroCopy, /—/);
  for (const stage of ["Find", "Compare", "Verify", "Test", "Continue"]) assert.match(html, new RegExp(`>${stage}<`));
});

test("all four live profiles retain accurate read only assessment and no execution copy", async () => {
  for (const tokenId of [321941, 321995, 322046, 322090]) {
    const response = await render(`/live-agents/56/${tokenId}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Run read only assessment/i);
    assert.match(html, /No wallet connection/i);
    assert.match(html, /No transaction is submitted/i);
  }
});

test("local strategy cards are explicitly demo-only and never registry-verified", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /BLOCview Demo/i);
  assert.match(html, /Illustrative strategy profiles/i);
  assert.match(html, /These are not live ERC-8004 records/i);
  assert.match(html, /Demo preview|Demo monitoring/i);
  assert.doesNotMatch(html, /class="agent-card"[^>]*>[\s\S]*?class="source-badge verified"/i);
  assert.doesNotMatch(html, /<span class="status"><i><\/i>Live<\/span>/i);
});

test("live-agent unavailable states stay visibly separate from demo records", async () => {
  const [page, errorBoundary] = await Promise.all([
    readFile(new URL("../app/live-agents/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/live-agents/error.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Live data is not configured/);
  assert.match(page, /No live BNB agents returned/);
  assert.match(page, /8004scan is temporarily unavailable/);
  assert.match(page, /No demo records are shown in its place/);
  assert.match(page, /No demo records are substituted/);
  assert.match(errorBoundary, /Live discovery could not load/);
  assert.match(errorBoundary, /No demo records were substituted/);
});

test("derives registry evidence without operational inferences", () => {
  const evidence = deriveEvidenceRecord(liveAgent(), new Date("2026-08-31T10:05:00.000Z"));

  assert.deepEqual(evidence.identity, { network: "BNB Chain", chainId: 56, tokenId: 42, agentId: "56:42" });
  assert.equal(evidence.source.url, "https://8004scan.io/agents/bsc/42");
  assert.equal(evidence.retrieval.freshness, "Fresh");
  assert.equal(evidence.areas.find((area) => area.key === "capabilities")?.basis, "Declared by agent");
  assert.equal(evidence.reputation?.basis, "Returned by source");
  assert.equal(evidence.areas.find((area) => area.key === "activity")?.state, "Not available");
  assert.equal(evidence.areas.find((area) => area.key === "permissions")?.state, "Not available");
});

test("discloses missing evidence and labels a local timestamp fallback", () => {
  assert.deepEqual(resolveRetrievalTimestamp(undefined, new Date("2026-08-31T01:00:00.000Z")), {
    retrievedAt: "2026-08-31T01:00:00.000Z",
    retrievalTimestampBasis: "local-fallback",
  });
  assert.deepEqual(resolveRetrievalTimestamp("not-a-date", new Date("2026-08-31T01:00:00.000Z")), {
    retrievedAt: "2026-08-31T01:00:00.000Z",
    retrievalTimestampBasis: "local-fallback",
  });
  const evidence = deriveEvidenceRecord(liveAgent({
    capabilities: [],
    reputation: undefined,
    retrievedAt: "2026-08-31T01:00:00.000Z",
    retrievalTimestampBasis: "local-fallback",
  }), new Date("2026-08-31T10:00:00.000Z"));

  assert.equal(evidence.retrieval.timestampBasis, "local-fallback");
  assert.equal(evidence.retrieval.freshness, "Stale");
  assert.deepEqual(evidence.coverage, { available: 1, total: 5 });
  assert.ok(evidence.missingEvidence.some((reason) => reason.includes("Contract address")));
  assert.ok(evidence.missingEvidence.some((reason) => reason.includes("No capability labels")));
  assert.ok(evidence.missingEvidence.some((reason) => reason.includes("No score, stars, or feedback count")));
});

test("normalizes shareable live-only comparison IDs", () => {
  assert.deepEqual(normalizeComparisonIds("321995,321941,321995,range-pilot,999999,322046,322090,321995"), [321995, 321941, 322046, 322090]);
  assert.deepEqual(normalizeComparisonIds("range-pilot,grid-sentinel"), []);
});

test("builds canonical two-agent and four-agent comparisons without counting unavailable signals", () => {
  const two = buildLiveComparison([321941, 321995], new Date("2026-08-31T10:05:00.000Z"));
  const four = buildLiveComparison([321941, 321995, 322046, 322090], new Date("2026-08-31T10:05:00.000Z"));
  assert.deepEqual(two.map((record) => record.agent.name), ["RangeRebalance Lens", "GridBand Observer"]);
  assert.equal(four.length, 4);
  assert.deepEqual(four.map((record) => record.agent.tokenId), [321941, 321995, 322046, 322090]);
  assert.equal(two[0].coverage.available, 4);
  assert.equal(two[1].coverage.available, 7);
  assert.equal(two[0].signals.indexedReputation, false);
  assert.ok(two.every((record) => record.missingEvidence.some((item) => item.includes("reputation"))));
});

test("keeps comparison truthful, live-only, actionable, and free of execution controls", async () => {
  const [route, component, model, list, response, fourResponse] = await Promise.all([
    readFile(new URL("../app/compare/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LiveAgentComparison.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/live-comparison.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/LiveAgentList.tsx", import.meta.url), "utf8"),
    render("/compare?agents=321995,321941"),
    render("/compare?agents=321941,321995,322046,322090"),
  ]);
  const liveComparisonSource = `${route}\n${component}\n${model}`;
  const [html, fourHtml] = await Promise.all([response.text(), fourResponse.text()]);

  assert.doesNotMatch(liveComparisonSource, /from ["']@\/data\/agents|ActivationModal|return30d|30-day return|APY|TVL/i);
  assert.doesNotMatch(liveComparisonSource, /Highly Trusted|Low Risk|Safe Agent|guaranteed profit|best performing|\d+\s*\/\s*100/i);
  assert.doesNotMatch(liveComparisonSource, /Connect wallet|Sign transaction|Send transaction|Pay now|Execute strategy/i);
  assert.match(component, /Evidence Coverage shows how many verification signals are available/);
  assert.match(component, /Run read only assessment/);
  assert.match(liveComparisonSource, /BLOCview verifies the approved pool identity and its state at one pinned block/);
  assert.match(list, /selected\.length >= 4/);
  assert.match(list, /pathname: "\/compare"/);
  for (const name of ["RangeRebalance Lens", "GridBand Observer"]) assert.match(html, new RegExp(name));
  for (const name of ["RangeRebalance Lens", "GridBand Observer", "Venus Yield Lens", "Venus Borrow Buffer Watch"]) assert.match(fourHtml, new RegExp(name));
  assert.match(html, /What is still unknown/);
  assert.doesNotMatch(html, /Range Pilot|Grid Sentinel|Yield Navigator|Health Guard/);
});

test("invalid, duplicate, over-limit, and demo IDs render safely", async () => {
  const invalid = await (await render("/compare?agents=range-pilot,999999")).text();
  const normalized = buildLiveComparison(normalizeComparisonIds("321941,321941,321995,322046,322090,999999"));
  assert.match(invalid, /Select 2–4 live agents/);
  assert.equal(normalized.length, 4);
});

test("legacy live comparison preserves valid selected identities", async () => {
  const route = await readFile(new URL("../app/live-agents/compare/page.tsx", import.meta.url), "utf8");
  assert.match(route, /useSearchParams/);
  assert.match(route, /\^56:\(\\d\+\)\$/);
  assert.match(route, /`\/compare\?agents=\$\{ids\}`/);
  assert.match(route, /router\.replace\(target\)/);
});

test("rendered pages preserve provenance and no-action safety messaging", async () => {
  const [homeResponse, liveResponse] = await Promise.all([render(), render("/live-agents")]);
  const [home, live] = await Promise.all([homeResponse.text(), liveResponse.text()]);

  for (const html of [home, live]) {
    assert.match(html, /Demo strategy information is illustrative/i);
    assert.match(html, /registry identity and provenance come from 8004scan when configured/i);
    assert.match(html, /missing evidence is disclosed, not invented/i);
    assert.match(html, /No wallet connection, signing, or transactions/i);
  }
  assert.match(live, /Live data is not configured|8004scan is temporarily unavailable/i);
  assert.match(live, /Demo strategies remain available and clearly labelled|No demo records are shown in its place/i);
});

test("surfaces exactly four RangePilotWatch categories and truthfully falls back when indexing cannot be checked", async () => {
  const agents = listRangePilotLiveAgents(new Date("2026-08-31T10:00:00.000Z"));
  assert.equal(agents.length, 4);
  assert.deepEqual(agents.map((agent) => agent.tokenId), [321941, 321995, 322046, 322090]);
  assert.deepEqual(new Set(agents.map((agent) => agent.category)), new Set(["Rebalancing", "Grid Trading", "Yield Optimisation", "Health Factor Monitoring"]));
  for (const agent of agents) {
    assert.equal(agent.indexingStatus, "indexing pending");
    assert.equal(agent.registry, RANGE_PILOT_REGISTRY);
    assert.match(agent.registrationUrl, /\/erc8004\/.+\.json$/);
    assert.match(agent.documentationUrl, /\/docs\/agents\/.+\.html$/);
    assert.equal(agent.healthUrl, agent.assessmentUrl.replace(/\/assess$/, "/health"));
    assert.match(agent.assessmentUrl, /\/agents\/.+\/assess$/);
    assert.equal(agent.assessmentMode, "external-read-only-handoff");
  }
  const response = await render("/live-agents");
  const html = await response.text();
  assert.match(html, /RangePilotWatch agents/);
  assert.match(html, /8004scan indexing confirmed for[\s\S]*0[\s\S]*of 4/i);
  assert.match(html, /Some indexing evidence unavailable/i);
  for (const agent of agents) assert.match(html, new RegExp(agent.name));
});

test("pending-agent activation remains an external read-only no-transaction handoff", async () => {
  const [response, route, form, proxy] = await Promise.all([
    render("/live-agents/56/321941"),
    readFile(new URL("../app/live-agents/[chainId]/[tokenId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ReadOnlyAssessment.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/range-pilot-watch/agents/[tokenId]/assess/route.ts", import.meta.url), "utf8"),
  ]);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Evidence checkpoint/i);
  assert.match(html, /View documentation/);
  assert.match(html, /Check health/);
  assert.match(html, /Run read only assessment/);
  assert.match(html, /read only assessment/i);
  assert.match(html, /does not connect a wallet, request a signature or payment, submit a transaction, or execute a strategy/i);
  assert.match(html, /not investment advice/i);
  assert.doesNotMatch(`${route}\n${form}\n${proxy}`, /sendTransaction|eth_sendTransaction|walletConnect|privateKey|signer\./i);
  assert.doesNotMatch(route, /href=\{agent\.assessmentUrl\}/);
  assert.match(proxy, /method:\s*"POST"/);
  assert.match(proxy, /ASSESSMENT_ENDPOINTS\[(?:tokenId|assessmentTokenId)\]/);
});

test("safe activation is an evidence checkpoint with explicit completion and continuation semantics", async () => {
  const [home, profile, assessment, comparison] = await Promise.all([
    (await render("/")).text(),
    (await render("/live-agents/56/321995")).text(),
    readFile(new URL("../components/ReadOnlyAssessment.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LiveAgentComparison.tsx", import.meta.url), "utf8"),
  ]);
  for (const stage of ["Find", "Compare", "Verify", "Test", "Continue"]) assert.match(home, new RegExp(`>${stage}<`));
  assert.match(home, /evidence checkpoint before you continue to an agent or source/i);
  assert.match(profile, /Before you run the assessment/i);
  assert.match(profile, /What happens/i);
  assert.match(profile, /What does not happen/i);
  assert.match(profile, /Run read only assessment/i);
  assert.match(assessment, /Assessment complete\. No execution occurred\./);
  assert.match(assessment, /Evidence checkpoint complete/);
  assert.match(assessment, /Review evidence/);
  assert.match(assessment, /View registration/);
  assert.match(assessment, /View documentation/);
  assert.match(assessment, /Check health/);
  assert.match(assessment, /BLOCview does not provide an execution action/i);
  assert.match(comparison, /Assessment mode/);
  assert.match(comparison, /Evidence Coverage shows how many verification signals are available/);
});

test("final activation polish preserves evidence counts, explicit unknowns, and agent-specific boundaries", async () => {
  const records = buildLiveComparison([321941, 321995, 322046, 322090]);
  assert.deepEqual(records.map((record) => record.coverage.available), [4, 7, 4, 4]);
  assert.ok(records.every((record) => record.coverage.total === 8));
  assert.ok(records.every((record) => record.activationMode === "Read only assessment"));
  assert.match(records[0].observes, /does not establish ownership/i);
  assert.match(records[0].unsupportedAction, /Does not rebalance/i);
  assert.match(records[1].unsupportedAction, /Does not inspect an LP NFT/i);
  assert.match(records[2].limitation, /guaranteed, or optimal yield/i);
  assert.match(records[3].limitation, /guarantee that liquidation will be prevented/i);
  const comparison = await (await render("/compare?agents=321941,321995,322046,322090")).text();
  assert.match(comparison, /Historical performance: Not established/i);
  assert.match(comparison, /Execution permissions: Not applicable to the BLOCview read only assessment/i);
  assert.doesNotMatch(comparison, /className=.*trust-score|security score|profitability score|Hire agent|Trade now|Connect wallet|Sign transaction|Pay now/i);
});

test("uses exact per-agent health and assessment endpoints", () => {
  const agents = listRangePilotLiveAgents(new Date("2026-08-31T12:00:00.000Z"));
  const slugs = ["range-rebalance", "grid-band", "venus-yield", "venus-borrow-buffer"];
  agents.forEach((agent, index) => {
    assert.equal(agent.healthUrl, `https://range-pilot-watch.onrender.com/agents/${slugs[index]}/health`);
    assert.equal(agent.assessmentUrl, ASSESSMENT_ENDPOINTS[agent.tokenId]);
  });
});

test("assessment validation permits only the four documented read-only request shapes", () => {
  assert.deepEqual(validateAssessmentRequest(321941, { tokenId: "12345" }), { tokenId: "12345" });
  assert.deepEqual(validateAssessmentRequest(321995, { poolId: "WBNB-USDT-500", boundaries: [-100000, 0, 100000] }), { poolId: "WBNB-USDT-500", boundaries: [-100000, 0, 100000] });
  assert.deepEqual(validateAssessmentRequest(322046, { assetId: "usd-stablecoins" }), { assetId: "usd-stablecoins", markets: ["core-vUSDC", "core-vUSDT"] });
  assert.deepEqual(validateAssessmentRequest(322090, { accountAddress: `0x${"1".repeat(40)}` }), { accountAddress: `0x${"1".repeat(40)}`, warningRatio: "1.25" });
  assert.equal(validateAssessmentRequest(321941, { tokenId: "12345", rpcUrl: "https://example.invalid" }), null);
  assert.equal(validateAssessmentRequest(321995, { poolId: "WBNB-USDT-500", boundaries: [0, 0] }), null);
  assert.equal(validateAssessmentRequest(322046, { assetId: "usd-stablecoins", markets: ["unsupported"] }), null);
  assert.equal(validateAssessmentRequest(322090, { accountAddress: `0x${"1".repeat(40)}`, warningRatio: "4" }), null);
});

test("accepts a valid available flagship response and composes chain-observed evidence", async () => {
  const result = await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, {
    fetchImpl: jsonFetch(serviceResponse()),
    now: () => new Date("2026-08-31T10:01:00.000Z"),
  });
  assert.equal(result.status, "available");
  const proof = composeFlagshipProof(result, new Date("2026-08-31T10:01:00.000Z"));
  assert.equal(proof.status, "Available");
  assert.equal(proof.registryMapping, null);
  assert.equal(proof.chainObserved.chainId, 56);
  assert.equal(proof.chainObserved.blockNumber, 119120063);
  assert.equal(proof.chainObserved.observedPrice, 685.97);
  assert.equal(proof.freshness, "Fresh");
});

test("treats insufficient and unavailable service bodies as degraded, never successful by HTTP alone", async () => {
  for (const rangeStatus of ["insufficient_data", "data_unavailable"]) {
    const result = await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, {
      fetchImpl: jsonFetch(serviceResponse({
        rangeStatus,
        liveDataStatus: "unavailable",
        observedPrice: null,
        blockNumber: undefined,
        poolAddress: null,
        fetchedAt: undefined,
      })),
    });
    assert.equal(result.status, "degraded");
    const proof = composeFlagshipProof(result);
    assert.equal(proof.status, "Degraded");
    assert.equal(proof.chainObserved.observedPrice, undefined);
    assert.equal(proof.freshness, "Unknown");
    assert.ok(proof.missingEvidence.some((item) => item.includes("timestamp")));
    assert.ok(proof.missingEvidence.some((item) => item.includes("Block number")));
  }
});

test("sanitizes timeout, HTTP failure, malformed JSON, and malformed response failures", async () => {
  const timeoutFetch = async (_url, init) => await new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("timed out", "TimeoutError")));
  });
  const malformedJsonFetch = async () => new Response("{", { status: 200 });
  const cases = [
    await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, { fetchImpl: timeoutFetch, timeoutMs: 1 }),
    await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, { fetchImpl: jsonFetch({}, 503) }),
    await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, { fetchImpl: malformedJsonFetch }),
    await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, { fetchImpl: jsonFetch({ rangeStatus: "in_range" }) }),
  ];
  assert.deepEqual(cases.map((item) => item.status), ["timeout", "http-error", "malformed-json", "malformed-response"]);
  for (const item of cases) {
    assert.ok("reason" in item);
    assert.doesNotMatch(item.reason, /stack|token|secret|exception/i);
  }
});

test("rejects incomplete available evidence and discloses stale or missing evidence conservatively", async () => {
  assert.equal(validateRangePilotWatchResponse(serviceResponse({ blockNumber: undefined })), null);
  assert.equal(validateRangePilotWatchResponse(serviceResponse({ observedPrice: null })), null);
  assert.equal(validateRangePilotWatchResponse(serviceResponse({ poolAddress: null })), null);
  assert.equal(validateRangePilotWatchResponse(serviceResponse({ fetchedAt: undefined })), null);
  const result = await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, { fetchImpl: jsonFetch(serviceResponse({ fetchedAt: "2026-08-30T00:00:00.000Z" })) });
  const proof = composeFlagshipProof(result, new Date("2026-08-31T10:00:00.000Z"));
  assert.equal(proof.freshness, "Stale");
  assert.ok(proof.missingEvidence.some((item) => item.includes("Profitability")));
  assert.ok(proof.missingEvidence.some((item) => item.includes("safety")));
});

test("enforces the fixed service boundary and rejects arbitrary request fields", async () => {
  assert.equal(RANGE_PILOT_WATCH_SOURCE_URL, "https://range-pilot-watch.onrender.com/assess_live_range");
  assert.equal(validateRangePilotWatchRequest({ ...FLAGSHIP_PROOF_REQUEST, rpcUrl: "https://example.invalid" }), false);
  assert.equal(validateRangePilotWatchRequest({ ...FLAGSHIP_PROOF_REQUEST, walletAddress: "0x0" }), false);
  assert.equal(validateRangePilotWatchRequest({ ...FLAGSHIP_PROOF_REQUEST, observedPrice: 700 }), false);
  let requestedUrl = "";
  let requestBody = {};
  await fetchRangePilotWatchProof(FLAGSHIP_PROOF_REQUEST, { fetchImpl: async (url, init) => {
    requestedUrl = String(url);
    requestBody = JSON.parse(String(init.body));
    return jsonFetch(serviceResponse())();
  } });
  assert.equal(requestedUrl, RANGE_PILOT_WATCH_SOURCE_URL);
  assert.deepEqual(Object.keys(requestBody).sort(), ["feeTier", "lowerPrice", "poolReference", "upperPrice", "userGoal"]);
});

test("does not fabricate registry linkage or change readiness and comparison semantics", () => {
  assert.equal(resolveRangePilotWatchRegistryMapping([liveAgent({ name: "Range Pilot Watch" })]), null);
  const comparison = buildLiveComparison([321995, 322046], new Date("2026-08-31T10:05:00.000Z"));
  assert.deepEqual(comparison.map((record) => record.agent.tokenId), [321995, 322046]);
  assert.ok(comparison.every((record) => record.agent.source === "range-pilot-watch"));
});

test("flagship UI is standalone, has no demo fallback, and introduces no action controls or unsupported claims", async () => {
  const [component, route, page, client, comparison] = await Promise.all([
    readFile(new URL("../components/FlagshipLiveProof.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/range-pilot-watch/proof/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/live-agents/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/range-pilot-watch.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/live-comparison.ts", import.meta.url), "utf8"),
  ]);
  const source = `${component}\n${route}\n${client}`;
  assert.match(component, /separate read only observation/i);
  assert.match(component, /not an 8004scan registration/i);
  assert.match(component, /will not retry automatically or substitute demo data/i);
  assert.match(component, /What BLOCview observed/);
  assert.match(component, /What this does not prove/);
  assert.match(component, /Supplemental readiness evidence only/);
  assert.match(page, /FlagshipLiveProof/);
  assert.doesNotMatch(source, /connect wallet|sign transaction|activate agent|sendTransaction|eth_send|private key/i);
  assert.doesNotMatch(source, /guaranteed profit|safe agent|verified performance|best performing/i);
  assert.doesNotMatch(comparison, /Range Pilot Watch|flagship|live proof/i);
});

test("pending first-party source contains exactly the four verified identities and categories", () => {
  const agents = listRangePilotLiveAgents(new Date("2026-08-31T12:00:00.000Z"));
  assert.deepEqual(agents.map((agent) => agent.tokenId), [321941, 321995, 322046, 322090]);
  assert.deepEqual(agents.map((agent) => agent.category), ["Rebalancing", "Grid Trading", "Yield Optimisation", "Health Factor Monitoring"]);
  assert.ok(agents.every((agent) => agent.registry === RANGE_PILOT_REGISTRY));
  assert.ok(agents.every((agent) => agent.indexingStatus === "indexing pending"));
  assert.ok(agents.every((agent) => agent.documentationUrl && agent.healthUrl.endsWith("/health") && agent.assessmentUrl.endsWith("/assess")));
});

test("an exact indexed record enriches its canonical first-party agent without replacing assessment controls", () => {
  const registration = listRangePilotLiveAgents(new Date("2026-08-31T12:00:00.000Z"))[1];
  const indexed = liveAgent({
    tokenId: 321995,
    agentId: "56:0x8004a169fb4a3325136eb29fa0ceb6d2e539a432:321995",
    name: "GridBand Observer",
    capabilities: ["Web"],
    reputation: { score: 0, stars: 0, feedbackCount: 0 },
  });
  const merged = mergeRangePilotIndexedAgent(registration, indexed);
  assert.equal(merged.source, "8004scan");
  assert.equal(merged.indexingStatus, undefined);
  assert.equal(merged.assessmentUrl, registration.assessmentUrl);
  assert.equal(merged.registrationUrl, registration.registrationUrl);
  assert.equal(merged.category, "Grid Trading");
  assert.equal(merged.agentId, indexed.agentId);

  const [comparison] = buildLiveComparison([321995], new Date("2026-08-31T12:00:00.000Z"), [merged]);
  assert.equal(comparison.signals.indexedReputation, true);
  assert.equal(comparison.coverage.available, 8);
  assert.ok(!comparison.missingEvidence.some((item) => item.startsWith("8004scan reputation")));
});

test("pending agents render separately with truthful indexing and activation boundaries", async () => {
  const [listResponse, detailResponse] = await Promise.all([render("/live-agents"), render("/live-agents/56/321941")]);
  const [list, detail] = await Promise.all([listResponse.text(), detailResponse.text()]);
  for (const name of ["RangeRebalance Lens", "GridBand Observer", "Venus Yield Lens", "Venus Borrow Buffer Watch"]) assert.match(list, new RegExp(name));
  assert.match(list, /8004scan indexing confirmed for[\s\S]*0[\s\S]*of 4/i);
  assert.match(list, /Some indexing evidence unavailable/i);
  assert.match(detail, /Public ERC-8004 registration JSON/i);
  assert.match(detail, /View documentation/);
  assert.match(detail, /Check health/);
  assert.match(detail, /Run read only assessment/);
  assert.match(detail, /No wallet connection/i);
  assert.match(detail, /No transaction is submitted/i);
  assert.match(detail, /not investment advice/i);
  assert.doesNotMatch(detail, /Connect wallet|Sign transaction|Execute strategy|Send transaction/i);
});

test("reads and verifies the allowlisted PancakeSwap V3 pool at one pinned block", async () => {
  const result = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch(), now: () => new Date("2026-08-31T12:01:00.000Z") });
  assert.equal(result.status, "verified");
  assert.equal(result.evidence.verification.status, "verified");
  assert.equal(result.evidence.verification.checks.factory.matches, true);
  assert.equal(result.evidence.verification.checks.token0.matches, true);
  assert.equal(result.evidence.verification.checks.token1.matches, true);
  assert.equal(result.evidence.verification.checks.fee.matches, true);
  assert.equal(result.evidence.verification.checks.tickSpacing.matches, true);
  assert.equal(result.evidence.pool.factory.toLowerCase(), PANCAKESWAP_V3_POOL_ALLOWLIST.factory.toLowerCase());
  assert.equal(result.evidence.pool.token0.toLowerCase(), PANCAKESWAP_V3_POOL_ALLOWLIST.token0.toLowerCase());
  assert.equal(result.evidence.pool.token1.toLowerCase(), PANCAKESWAP_V3_POOL_ALLOWLIST.token1.toLowerCase());
  assert.equal(result.evidence.pool.fee, 500);
  assert.equal(result.evidence.pool.tickSpacing, 10);
  assert.equal(result.evidence.state.tick, -65411);
  assert.equal(result.evidence.state.sqrtPriceX96, "123456789012345678901234567890");
  assert.equal(result.evidence.state.liquidity, "1267650600228229401496703205376");
  assert.equal(result.evidence.block.number, 119149056);
  assert.equal(result.evidence.block.timestamp, "2025-08-31T15:32:48.000Z");
});

test("decodes signed negative slot0 ticks and preserves large uint values", () => {
  const encoded = rpcSlot0(123456789012345678901234567890n, -65411);
  assert.equal(decodeSignedInt24Word(`0x${rpcWord(-65411)}`), -65411);
  assert.deepEqual(decodeSlot0(encoded), { sqrtPriceX96: "123456789012345678901234567890", tick: -65411 });
});

test("rejects pool identity mismatch instead of producing verified evidence", async () => {
  const result = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch({ factory: rpcAddress(`0x${"1".repeat(40)}`) }) });
  assert.equal(result.status, "mismatch");
  assert.equal(result.evidence.verification.status, "mismatch");
  assert.equal(result.evidence.verification.checks.factory.matches, false);
});

test("sanitizes malformed RPC responses and RPC failures", async () => {
  const malformed = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch({ slot0: "0x01" }) });
  const unavailable = await readPancakeSwapV3PoolEvidence({ fetchImpl: async () => new Response("unavailable", { status: 503 }) });
  assert.deepEqual([malformed.status, unavailable.status], ["malformed", "unavailable"]);
  assert.match(malformed.reason, /malformed pool evidence|slot0 response was malformed/i);
  assert.match(unavailable.reason, /temporarily unavailable/i);
  assert.doesNotMatch(`${malformed.reason} ${unavailable.reason}`, /stack|rpc url|exception|publicnode/i);
});

test("requires a valid pinned block timestamp", async () => {
  const result = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch({ timestamp: "not-hex" }) });
  assert.equal(result.status, "malformed");
});

test("surfaces missing pool code and malformed critical state explicitly", async () => {
  const noCode = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch({ code: "0x" }) });
  const badSlot0 = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch({ slot0: "0x01" }) });
  const badLiquidity = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch({ liquidity: "0x01" }) });
  assert.equal(noCode.status, "unavailable");
  assert.match(noCode.reason, /bytecode was unavailable/i);
  assert.equal(badSlot0.status, "malformed");
  assert.match(badSlot0.reason, /slot0 response/i);
  assert.equal(badLiquidity.status, "malformed");
  assert.match(badLiquidity.reason, /liquidity response/i);
});

test("derives GridBand placement from the verified first-party tick", async () => {
  const firstParty = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch() });
  const receipt = composeGridBandReceipt({ poolId: "WBNB-USDT-500", boundaries: [-100000, 0, 100000] }, firstParty, externalGridObservation());
  assert.equal(receipt.assessment.currentTick, -65411);
  assert.deepEqual(receipt.assessment.placement, { kind: "within_declared_grid", bandIndex: 0 });
  assert.deepEqual(placeTick([-100000, 0, 100000], -100001), { kind: "below_declared_grid" });
  assert.deepEqual(placeTick([-100000, 0, 100000], 100000), { kind: "above_declared_grid" });
  assert.equal(receipt.assessment.boundariesBasis, "caller-supplied");
});

test("cross-checks RangePilotWatch conservatively across different blocks", async () => {
  const firstParty = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch() });
  const evidence = firstParty.evidence;
  assert.equal(crossCheckGridBand(evidence, externalGridObservation()).status, "consistent");
  assert.equal(crossCheckGridBand(evidence, externalGridObservation({ blockNumber: evidence.block.number, currentTick: evidence.state.tick + 1 })).status, "divergent");
  assert.equal(crossCheckGridBand(evidence, externalGridObservation({ blockNumber: evidence.block.number + 2, currentTick: evidence.state.tick + 101 })).status, "divergent");
  assert.equal(crossCheckGridBand(evidence, null).status, "unavailable");
});

test("first-party GridBand evidence succeeds when the external service is unavailable", async () => {
  const firstParty = await readPancakeSwapV3PoolEvidence({ fetchImpl: verifiedRpcFetch() });
  const receipt = composeGridBandReceipt({ poolId: "WBNB-USDT-500", boundaries: [-100000, 0, 100000] }, firstParty, null);
  assert.equal(receipt.status, "completed");
  assert.equal(receipt.pancakeSwap.verification.status, "verified");
  assert.equal(receipt.externalCrossCheck.status, "unavailable");
});

test("first-party PancakeSwap reader remains server-only and strictly allowlisted", async () => {
  const [reader, route, component, packageJson] = await Promise.all([
    readFile(new URL("../lib/pancakeswap-v3.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/range-pilot-watch/agents/[tokenId]/assess/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/ReadOnlyAssessment.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(reader, /typeof window !== "undefined"[\s\S]*server-only/);
  assert.match(reader, /eth_chainId|eth_blockNumber|eth_getCode|eth_getBlockByNumber|eth_call/);
  for (const selector of ["0xc45a0155", "0x0dfe1681", "0xd21220a7", "0xddca3f43", "0xd0c93a7c", "0x3850c7bd", "0x1a686502"]) assert.match(reader, new RegExp(selector));
  assert.match(reader, /0x36696169C63e42cd08ce11f5deeBbCeBae652050/);
  assert.doesNotMatch(`${reader}\n${route}`, /eth_sendTransaction|sendTransaction|writeContract|privateKey|walletConnect|approve\(|swap\(|mint\(|burn\(|collect\(/i);
  assert.doesNotMatch(component, /rpcUrl|contractAddress|calldata|functionSelector/i);
  assert.doesNotMatch(packageJson, /ethers|viem|web3|pancakeswap-sdk/i);
  assert.match(route, /readPancakeSwapV3PoolEvidence/);
});

test("GridBand evidence never falls back to demo data", async () => {
  const [route, model] = await Promise.all([
    readFile(new URL("../app/api/range-pilot-watch/agents/[tokenId]/assess/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/gridband-evidence.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(`${route}\n${model}`, /from ["']@\/data\/agents|Range Pilot|Grid Sentinel|demo fallback/i);
  assert.match(route, /verification-failed/);
  assert.match(route, /evidence-unavailable/);
});
