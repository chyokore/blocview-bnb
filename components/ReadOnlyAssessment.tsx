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
    {status !== "idle" && status !== "sending" && <div className={`assessment-result ${status}`} role="status"><strong>{status === "complete" ? "Off-chain evidence receipt returned" : "Assessment unavailable"}</strong><pre>{JSON.stringify(output, null, 2)}</pre></div>}
  </section>;
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
