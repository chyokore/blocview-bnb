import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveEvidenceRecord, resolveRetrievalTimestamp } from "../lib/evidence.ts";
import { compareLiveAgents } from "../lib/live-comparison.ts";
import {
  fetchRangePilotWatchProof,
  FLAGSHIP_PROOF_REQUEST,
  RANGE_PILOT_WATCH_SOURCE_URL,
  validateRangePilotWatchRequest,
  validateRangePilotWatchResponse,
} from "../lib/range-pilot-watch.ts";
import { composeFlagshipProof, resolveRangePilotWatchRegistryMapping } from "../lib/flagship-proof.ts";
import { listRangePilotLiveAgents, RANGE_PILOT_REGISTRY } from "../lib/range-pilot-watch-agents.ts";
import { ASSESSMENT_ENDPOINTS, validateAssessmentRequest } from "../lib/range-pilot-assessments.ts";

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
  assert.match(html, /<title>BLOCview — Understand onchain AI agents<\/title>/i);
  assert.match(html, /Built for the BNB Chain agent economy/i);
  assert.match(html, /Explore demo strategies/i);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|react-loading-skeleton/i);
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

test("deterministically prioritises declared capability matches", () => {
  const left = liveAgent({ agentId: "56:42", tokenId: 42, name: "Trading Record", capabilities: ["grid trading", "market data"] });
  const right = liveAgent({ agentId: "56:43", tokenId: 43, name: "Storage Record", capabilities: ["data storage"] });
  const result = compareLiveAgents(left, right, "grid trading", new Date("2026-08-31T10:05:00.000Z"));

  assert.equal(result.outcome, "recommended");
  assert.equal(result.recommendedAgentId, "56:42");
  assert.deepEqual(result.records[0].matchedRequirements, ["grid trading"]);
  assert.equal(result.records[0].weightedReasons.find((reason) => reason.criterion === "capability-match")?.points, 4);
});

test("returns no clear best fit for a tie or absent capability signal", () => {
  const left = liveAgent({ agentId: "56:42", tokenId: 42, capabilities: ["analytics"] });
  const right = liveAgent({ agentId: "56:43", tokenId: 43, capabilities: ["analytics"] });
  const tied = compareLiveAgents(left, right, "analytics", new Date("2026-08-31T10:05:00.000Z"));
  const noSignal = compareLiveAgents(left, right, "trading", new Date("2026-08-31T10:05:00.000Z"));

  assert.equal(tied.outcome, "no-clear-best-fit");
  assert.equal(tied.recommendedAgentId, undefined);
  assert.equal(noSignal.outcome, "no-clear-best-fit");
  assert.match(noSignal.runnerUpExplanation, /neither matches/i);
});

test("surfaces missing evidence and stale-record disqualifiers", () => {
  const stale = liveAgent({ agentId: "56:42", tokenId: 42, capabilities: [], reputation: undefined, retrievedAt: "2026-08-30T00:00:00.000Z" });
  const fresh = liveAgent({ agentId: "56:43", tokenId: 43, capabilities: ["monitoring"], retrievedAt: "2026-08-31T10:00:00.000Z" });
  const result = compareLiveAgents(stale, fresh, "monitoring", new Date("2026-08-31T10:05:00.000Z"));

  assert.equal(result.recommendedAgentId, "56:43");
  assert.ok(result.records[0].disqualifiers.some((item) => item.includes("stale")));
  assert.ok(result.records[0].disqualifiers.some((item) => item.includes("No declared capabilities")));
  assert.ok(result.records[0].unknowns.some((item) => item.includes("No score, stars, or feedback count")));
});

test("keeps live comparison separate from demo and execution flows", async () => {
  const [route, component, model, list, response] = await Promise.all([
    readFile(new URL("../app/live-agents/compare/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LiveAgentComparison.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/live-comparison.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/LiveAgentList.tsx", import.meta.url), "utf8"),
    render("/live-agents/compare"),
  ]);
  const liveComparisonSource = `${route}\n${component}\n${model}`;
  const html = await response.text();

  assert.doesNotMatch(liveComparisonSource, /from ["']@\/data\/agents|ActivationModal|return30d|30-day return|APY|TVL/i);
  assert.doesNotMatch(liveComparisonSource, /connect wallet|sign transaction|activate agent/i);
  assert.match(component, /Demo strategies and illustrative metrics are excluded/);
  assert.match(route, /No demo data was substituted/);
  assert.match(list, /selected\.length >= 2/);
  assert.match(list, /\/live-agents\/compare/);
  assert.match(html, /Select two different live registry records/);
  assert.match(html, /Demo strategies cannot be added to this comparison/);
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

test("surfaces exactly four RangePilotWatch categories with indexing pending", async () => {
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
  assert.match(html, /8004scan status:[\s\S]*indexing pending/i);
  assert.match(html, /Not indexed or rated by 8004scan/i);
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
  assert.match(html, /Reviewed external handoff/i);
  assert.match(html, /Documentation/);
  assert.match(html, /Agent service health/);
  assert.match(html, /Run one read-only assessment/);
  assert.match(html, /read-only assessment/i);
  assert.match(html, /No wallet connection, signing, transaction, execution, or payment occurs/i);
  assert.match(html, /not investment advice/i);
  assert.doesNotMatch(`${route}\n${form}\n${proxy}`, /sendTransaction|eth_sendTransaction|walletConnect|privateKey|signer\./i);
  assert.doesNotMatch(route, /href=\{agent\.assessmentUrl\}/);
  assert.match(proxy, /method:\s*"POST"/);
  assert.match(proxy, /ASSESSMENT_ENDPOINTS\[tokenId\]/);
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
  const before = compareLiveAgents(
    liveAgent({ agentId: "56:42", tokenId: 42, capabilities: ["monitoring"] }),
    liveAgent({ agentId: "56:43", tokenId: 43, capabilities: ["storage"] }),
    "monitoring",
    new Date("2026-08-31T10:05:00.000Z"),
  );
  assert.equal(before.records[0].score, 10);
  assert.equal(before.records[1].score, 6);
  assert.equal(before.recommendedAgentId, "56:42");
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
  assert.match(component, /standalone read-only observation/i);
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

test("pending agents render separately with truthful indexing and activation boundaries", async () => {
  const [listResponse, detailResponse] = await Promise.all([render("/live-agents"), render("/live-agents/56/321941")]);
  const [list, detail] = await Promise.all([listResponse.text(), detailResponse.text()]);
  for (const name of ["RangeRebalance Lens", "GridBand Observer", "Venus Yield Lens", "Venus Borrow Buffer Watch"]) assert.match(list, new RegExp(name));
  assert.match(list, /8004scan status:[\s\S]*indexing pending/i);
  assert.match(list, /not indexed or rated by 8004scan/i);
  assert.match(detail, /Public ERC-8004 registration JSON/i);
  assert.match(detail, /Documentation/);
  assert.match(detail, /Agent service health/);
  assert.match(detail, /Run one read-only assessment/);
  assert.match(detail, /No wallet connection, signing, transaction, execution, or payment/i);
  assert.match(detail, /not investment advice/i);
  assert.doesNotMatch(detail, /Connect wallet|Sign transaction|Execute strategy|Send transaction/i);
});
