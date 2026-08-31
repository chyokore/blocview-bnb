import Link from "next/link";
import type { EvidenceRecord } from "@/lib/evidence";
import { ArrowIcon, ShieldIcon } from "./icons";

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "Timestamp unavailable" : parsed.toLocaleString();
}

export function LiveProof({ evidence }: { evidence: EvidenceRecord }) {
  return <section className="live-proof" aria-labelledby="live-proof-title">
    <header className="live-proof-header"><div><span className="eyebrow">Evidence first</span><h2 id="live-proof-title">Live Proof</h2><p>What this registry record supports, where it came from, and what remains unknown.</p></div><span className={`freshness-badge freshness-${evidence.retrieval.freshness.toLowerCase()}`}>{evidence.retrieval.freshness}</span></header>
    <div className="live-proof-grid">
      <article><span>Registry record</span><strong>{evidence.identity.network} · Chain {evidence.identity.chainId}</strong><dl><div><dt>Token ID</dt><dd>{evidence.identity.tokenId}</dd></div><div><dt>Agent ID</dt><dd>{evidence.identity.agentId}</dd></div><div><dt>Contract</dt><dd>{evidence.identity.contractAddress ?? "Not available from this record"}</dd></div></dl></article>
      <article><span>Provenance</span><strong>{evidence.source.name}</strong><p>{evidence.source.identifier}</p><Link href={evidence.source.url} target="_blank" rel="noreferrer">Open exact source record <ArrowIcon /></Link></article>
      <article><span>Retrieved at</span><strong>{formatDate(evidence.retrieval.retrievedAt)}</strong><p>{evidence.retrieval.timestampBasis === "source-provided" ? "Timestamp provided by source" : "Local retrieval time; source timestamp was missing or invalid"}</p><small>{evidence.retrieval.freshnessReason}</small></article>
      <article><span>Declared by agent</span><strong>{evidence.declaredCapabilities.length ? `${evidence.declaredCapabilities.length} capabilities` : "Not available from this record"}</strong>{evidence.declaredCapabilities.length ? <div className="capability-list">{evidence.declaredCapabilities.map((capability) => <span key={capability}>{capability}</span>)}</div> : <p>No capability labels were returned.</p>}</article>
      <article><span>Returned by source</span><strong>{evidence.reputation ? "Reputation fields present" : "Reputation not available"}</strong>{evidence.reputation ? <dl><div><dt>Score</dt><dd>{evidence.reputation.score ?? "Not available"}</dd></div><div><dt>Stars</dt><dd>{evidence.reputation.stars ?? "Not available"}</dd></div><div><dt>Feedback</dt><dd>{evidence.reputation.feedbackCount ?? "Not available"}</dd></div></dl> : <p>No score, stars, or feedback count was returned.</p>}</article>
      <article className="live-proof-missing"><span>Evidence gaps</span><strong>{evidence.coverage.available} of {evidence.coverage.total} areas covered</strong><ul>{evidence.missingEvidence.map((reason) => <li key={reason}>{reason}</li>)}</ul></article>
    </div>
    <div className="live-proof-notice"><ShieldIcon /><p>Freshness describes retrieval time only. It is not independent verification of activity, permissions, performance, validation, or safety.</p></div>
  </section>;
}
