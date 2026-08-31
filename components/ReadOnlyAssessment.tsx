"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { AssessmentTokenId } from "@/lib/range-pilot-assessments";
import type { RangePilotLiveAgent } from "@/lib/range-pilot-watch-agents";
import { ShieldIcon } from "./icons";

type Props = { agent: RangePilotLiveAgent };

export function ReadOnlyAssessment({ agent }: Props) {
  const tokenId = agent.tokenId as AssessmentTokenId;
  const [status, setStatus] = useState<"idle" | "sending" | "complete" | "error">("idle");
  const [output, setOutput] = useState<unknown>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const request = requestFor(tokenId, form);
    setStatus("sending");
    setOutput(null);
    try {
      const response = await fetch(`/api/range-pilot-watch/agents/${tokenId}/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await response.json();
      setOutput(body);
      setStatus(response.ok ? "complete" : "error");
    } catch {
      setOutput({ error: "The assessment request could not be completed." });
      setStatus("error");
    }
  }

  return <section className="assessment-handoff" aria-labelledby="assessment-title">
    <header><span className="eyebrow">Bounded activation</span><h2 id="assessment-title">Run one read-only assessment</h2><p>Review and submit only the documented public reference fields. BLOCview sends one JSON POST to the fixed {agent.name} endpoint and displays its off-chain evidence receipt.</p></header>
    <form onSubmit={submit}>
      <AssessmentFields tokenId={tokenId} />
      <div className="assessment-review"><ShieldIcon /><p><strong>No wallet, signing, transaction, payment, or execution.</strong> This request reads public BSC state only. It is not investment advice, a recommendation, continuous monitoring, or proof of safety or performance.</p></div>
      <button className="primary-button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Requesting evidence…" : "Run read-only assessment"}</button>
    </form>
    {status !== "idle" && status !== "sending" && <div className={`assessment-result ${status}`} role="status"><strong>{status === "complete" ? "Read-only evidence receipt returned" : "Assessment unavailable"}</strong>{status === "complete" && isGridBandReceipt(output) ? <GridBandReceipt output={output} /> : <pre>{JSON.stringify(output, null, 2)}</pre>}</div>}
  </section>;
}

function isGridBandReceipt(value: unknown): value is { result: { kind: "gridband-first-party-receipt"; pancakeSwap: { network: string; pair: string; pool: { address: string; fee: number; tickSpacing: number }; state: { tick: number; liquidity: string }; block: { number: number; timestamp: string }; verification: { status: string } }; assessment: { placement: { kind: string; bandIndex?: number } }; externalCrossCheck: { status: string; reason: string } } } {
  if (!value || typeof value !== "object") return false;
  const result = (value as { result?: { kind?: string } }).result;
  return result?.kind === "gridband-first-party-receipt";
}

function GridBandReceipt({ output }: { output: { result: { pancakeSwap: { network: string; pair: string; pool: { address: string; fee: number; tickSpacing: number }; state: { tick: number; liquidity: string }; block: { number: number; timestamp: string }; verification: { status: string } }; assessment: { placement: { kind: string; bandIndex?: number } }; externalCrossCheck: { status: string; reason: string } } } }) {
  const receipt = output.result;
  const pool = receipt.pancakeSwap;
  return <div className="pool-evidence"><div className="pool-evidence-heading"><span className="eyebrow">PancakeSwap V3 pool</span><strong>Live read-only on-chain observation</strong></div><dl><div><dt>Pair</dt><dd>{pool.pair}</dd></div><div><dt>Network</dt><dd>{pool.network}</dd></div><div><dt>Pool</dt><dd title={pool.pool.address}>{`${pool.pool.address.slice(0, 8)}…${pool.pool.address.slice(-4)}`}</dd></div><div><dt>Fee</dt><dd>{pool.pool.fee / 10_000}%</dd></div><div><dt>Tick spacing</dt><dd>{pool.pool.tickSpacing}</dd></div><div><dt>Current tick</dt><dd>{pool.state.tick}</dd></div><div><dt>Current in-range pool liquidity</dt><dd>{pool.state.liquidity}</dd></div><div><dt>Pinned block</dt><dd>{pool.block.number}</dd></div><div><dt>Block timestamp</dt><dd>{pool.block.timestamp}</dd></div><div><dt>Pool verification</dt><dd>{pool.verification.status === "verified" ? "Verified" : pool.verification.status}</dd></div><div><dt>Grid placement</dt><dd>{receipt.assessment.placement.kind.replaceAll("_", " ")}{receipt.assessment.placement.bandIndex === undefined ? "" : ` · band ${receipt.assessment.placement.bandIndex}`}</dd></div><div><dt>External cross-check</dt><dd>{receipt.externalCrossCheck.status} · {receipt.externalCrossCheck.reason}</dd></div></dl><p>Evidence source: First-party BLOCview read of PancakeSwap V3. Grid boundaries are caller-supplied. Point-in-time assessment · No execution.</p></div>;
}

function AssessmentFields({ tokenId }: { tokenId: AssessmentTokenId }) {
  if (tokenId === 321941) return <label>Public PancakeSwap V3 position token ID<input name="positionTokenId" inputMode="numeric" pattern="[1-9][0-9]*" required placeholder="e.g. 12345" /></label>;
  if (tokenId === 321995) return <><label>Allowlisted pool<input value="WBNB-USDT-500" readOnly aria-readonly="true" /></label><label>Grid boundaries (strictly increasing ticks, spacing 10)<input name="boundaries" required defaultValue="-100000,0,100000" /></label></>;
  if (tokenId === 322046) return <fieldset><legend>Allowlisted Venus Core Pool markets</legend><label><input type="checkbox" name="markets" value="core-vUSDC" defaultChecked /> core-vUSDC</label><label><input type="checkbox" name="markets" value="core-vUSDT" defaultChecked /> core-vUSDT</label></fieldset>;
  return <><label>Public BSC account address<input name="accountAddress" required pattern="0x[0-9a-fA-F]{40}" placeholder="0x…" /></label><label>Warning ratio (1.00–3.00)<input name="warningRatio" type="number" min="1" max="3" step="0.01" defaultValue="1.25" required /></label></>;
}

function requestFor(tokenId: AssessmentTokenId, form: FormData) {
  if (tokenId === 321941) return { tokenId: String(form.get("positionTokenId") ?? "") };
  if (tokenId === 321995) return { poolId: "WBNB-USDT-500", boundaries: String(form.get("boundaries") ?? "").split(",").map((tick) => Number(tick.trim())) };
  if (tokenId === 322046) return { assetId: "usd-stablecoins", markets: form.getAll("markets").map(String) };
  return { accountAddress: String(form.get("accountAddress") ?? ""), warningRatio: String(form.get("warningRatio") ?? "1.25") };
}
