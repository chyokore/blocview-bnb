"use client";

import { useEffect, useState } from "react";
import type { FlagshipProof } from "@/lib/flagship-proof";
import { ShieldIcon } from "./icons";

type ViewState =
  | { status: "checking" }
  | { status: "ready"; proof: FlagshipProof }
  | { status: "client-error"; message: string };

function formatDate(value: string | undefined) {
  if (!value) return "Not available from this observation";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "Timestamp unavailable" : parsed.toLocaleString();
}

async function requestProof() {
  const response = await fetch("/api/range-pilot-watch/proof", { method: "POST", headers: { Accept: "application/json" } });
  return await response.json() as FlagshipProof;
}

export function FlagshipLiveProof() {
  const [view, setView] = useState<ViewState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    requestProof()
      .then((proof) => { if (active) setView({ status: "ready", proof }); })
      .catch(() => { if (active) setView({ status: "client-error", message: "BLOCview could not reach its server proof route." }); });
    return () => { active = false; };
  }, []);

  function checkAgain() {
    setView({ status: "checking" });
    requestProof()
      .then((proof) => setView({ status: "ready", proof }))
      .catch(() => setView({ status: "client-error", message: "BLOCview could not reach its server proof route." }));
  }

  if (view.status === "checking") return <section className="flagship-proof proof-checking" aria-live="polite">
    <div><span className="eyebrow">Live service proof</span><h2>Checking Range Pilot Watch…</h2><p>BLOCview is making one bounded request from its server. The service may need time to wake. BLOCview will not retry automatically or substitute demo data.</p></div>
  </section>;

  if (view.status === "client-error") return <section className="flagship-proof proof-unavailable" aria-live="polite">
    <div><span className="eyebrow">Live service proof</span><h2>Proof temporarily unavailable</h2><p>{view.message} Registry records and demo strategies remain separate and unchanged.</p><button className="secondary-button" onClick={checkAgain}>Try one bounded check</button></div>
  </section>;

  const { proof } = view;
  return <section className="flagship-proof" aria-labelledby="flagship-proof-title" aria-live="polite">
    <header className="flagship-proof-header">
      <div><span className="eyebrow">Live service proof</span><h2 id="flagship-proof-title">Range Pilot Watch</h2><p>This is a separate read only observation. It is not an 8004scan registration or a link to the illustrative Range Pilot demo.</p></div>
      <span className={`proof-status proof-status-${proof.status.toLowerCase().replaceAll(" ", "-")}`}>{proof.status}</span>
    </header>

    <div className="flagship-facts">
      <ProofFact label="Observation scope" value={proof.service.scope} />
      <ProofFact label="Range status" value={proof.rangeStatus ?? "Not available from this observation"} />
      <ProofFact label="Observed price" value={proof.chainObserved.observedPrice === undefined ? "Not available from this observation" : `${proof.chainObserved.observedPrice} · spot-state estimate`} />
      <ProofFact label="Chain" value={proof.chainObserved.chainId === undefined ? "Not available from this observation" : `${proof.chainObserved.chainId} · BNB Smart Chain`} />
      <ProofFact label="Block" value={proof.chainObserved.blockNumber ?? "Not available from this observation"} />
      <ProofFact label="Pool" value={proof.chainObserved.poolAddress ?? "Not available from this observation"} />
      <ProofFact label="Fetched" value={formatDate(proof.sourceTimestamp)} />
      <ProofFact label="BLOCview retrieved" value={formatDate(proof.blocviewRetrievedAt)} />
      <ProofFact label="Freshness" value={`${proof.freshness} · ${proof.freshnessReason}`} />
    </div>

    <div className="flagship-evidence-columns">
      <article><span>What BLOCview observed</span>{proof.observations.length ? <ul>{proof.observations.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No valid chain observation was accepted for this attempt.</p>}{proof.sourceEvidence && <small>{proof.sourceEvidence}</small>}</article>
      <article><span>What this does not prove</span><ul>{proof.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul></article>
    </div>

    <div className="proof-story">
      <div><strong>1 · Declared</strong><span>Range Pilot Watch identifies its service and fixed observation scope.</span></div>
      <div><strong>2 · Registry-observed</strong><span>No authoritative 8004scan linkage is claimed.</span></div>
      <div><strong>3 · Service and chain observation</strong><span>Only the pool state evidence returned by the read only check is shown.</span></div>
      <div><strong>4 · Unknown</strong><span>Safety, performance, permissions, custody, and execution quality remain unknown.</span></div>
    </div>

    <div className="flagship-proof-notice"><ShieldIcon /><p><strong>Supplemental readiness evidence only.</strong> Availability and freshness do not change registry coverage or comparison scoring. No wallet, signing, transaction, payment, or execution control is present.</p><button className="secondary-button" onClick={checkAgain}>Refresh once</button></div>
  </section>;
}

function ProofFact({ label, value }: { label: string; value: string | number }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
