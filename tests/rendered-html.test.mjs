import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveEvidenceRecord, resolveRetrievalTimestamp } from "../lib/evidence.ts";
import { compareLiveAgents } from "../lib/live-comparison.ts";

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
