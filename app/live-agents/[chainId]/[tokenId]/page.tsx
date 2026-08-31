import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LiveProof } from "@/components/LiveProof";
import { ReadinessPassport } from "@/components/ReadinessPassport";
import { getLiveAgent } from "@/lib/8004scan";
import { deriveEvidenceRecord } from "@/lib/evidence";
import { getRangePilotLiveAgent, isRangePilotLiveAgent } from "@/lib/range-pilot-watch-agents";

function show(value: string | number | undefined) { return value ?? "Not returned"; }

export async function generateMetadata({ params }: { params: Promise<{ chainId: string; tokenId: string }> }): Promise<Metadata> {
  const { tokenId } = await params;
  return { title: `Live agent #${tokenId}` };
}

export default async function LiveAgentPage({ params }: { params: Promise<{ chainId: string; tokenId: string }> }) {
  const values = await params;
  const chainId = Number(values.chainId);
  const tokenId = Number(values.tokenId);
  const agent = getRangePilotLiveAgent(chainId, tokenId) ?? await getLiveAgent(chainId, tokenId);
  if (!agent) notFound();
  const evidence = deriveEvidenceRecord(agent);
  const pending = isRangePilotLiveAgent(agent);
  return <main><Header /><div className="detail-shell live-detail">
    <div className="breadcrumbs"><Link href="/live-agents">Live agents</Link><span>/</span><span>ERC-8004 #{agent.tokenId}</span></div>
    <section className="detail-hero"><div className="detail-main"><div className="source-badge verified">{pending ? "Public registration · indexing pending" : "8004scan registry record"}</div><div className="agent-title"><span className="agent-avatar large live-avatar">{(agent.name?.slice(0, 2) || "#").toUpperCase()}</span><div><span className="eyebrow">{pending ? agent.category : "Unclassified live agent"}</span><h1>{show(agent.name)}</h1></div></div><p>{show(agent.description)}</p></div><aside className="source-panel"><span>Data source</span><strong>{pending ? "Public ERC-8004 registration JSON" : "8004scan Public API"}</strong><p>{pending ? "Identity is mapped to the declared BSC registry. 8004scan indexing, rating, validation, and operational verification are pending." : "Fetched server-side. BLOCview does not enrich this profile with demo strategy, performance, risk, or activation data."}</p></aside></section>
    {pending && <section className="readiness-passport"><div className="section-heading"><span className="eyebrow">Reviewed external handoff</span><h2>Read-only endpoints</h2><p>Review documentation and service health before opening the assessment. BLOCview does not connect a wallet, sign, submit a transaction, execute a strategy, or recommend an investment.</p></div><div className="passport-grid"><a className="secondary-button" href={agent.documentationUrl} target="_blank" rel="noreferrer">Documentation</a><a className="secondary-button" href={agent.healthUrl} target="_blank" rel="noreferrer">Service health</a><a className="primary-button" href={agent.assessmentUrl} target="_blank" rel="noreferrer">Open read-only assessment</a></div></section>}
    <LiveProof evidence={evidence} />
    <ReadinessPassport agent={agent} evidence={evidence} />
    <div className="responsibility-notice live-warning"><div><strong>BLOCview has not independently audited this agent. Verify its details before interacting.</strong><p>Activation is a reviewed external/read-only handoff only. No wallet connection, signing, transaction, execution, or payment occurs in BLOCview. This is not investment advice; you remain responsible for your decisions.</p></div></div>
  </div><Footer /></main>;
}
