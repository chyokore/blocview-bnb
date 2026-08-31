import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LiveProof } from "@/components/LiveProof";
import { ReadinessPassport } from "@/components/ReadinessPassport";
import { ReadOnlyAssessment } from "@/components/ReadOnlyAssessment";
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
    <section className="detail-hero"><div className="detail-main"><div className="source-badge verified">{pending ? "Public registration · indexing pending" : "8004scan registry record"}</div><div className="agent-title"><span className="agent-avatar large live-avatar">{(agent.name?.slice(0, 2) || "#").toUpperCase()}</span><div><span className="eyebrow">{pending ? agent.category : "Unclassified live agent"}</span><h1>{show(agent.name)}</h1></div></div><p>{show(agent.description)}</p></div><aside className="source-panel"><span>Data source</span><strong>{pending ? "Public ERC-8004 registration JSON" : "8004scan Public API"}</strong><p>{pending ? "This identity is linked to the stated BSC registry. 8004scan has not indexed, rated, validated, or checked the agent's operation yet." : "BLOCview fetched this record from its server. Demo strategy, performance, risk, and activation data are not added to this profile."}</p></aside></section>
    {pending && <><section className="readiness-passport"><div className="section-heading"><span className="eyebrow">Evidence checkpoint</span><h2>Check the sources before the test</h2><p>Review this agent&apos;s registration, documentation, and health response before running an assessment. The POST destination is fixed. You cannot supply another URL, chain, contract, or RPC endpoint.</p></div><div className="passport-grid"><a className="secondary-button" href={agent.registrationUrl} target="_blank" rel="noreferrer">View registration</a><a className="secondary-button" href={agent.documentationUrl} target="_blank" rel="noreferrer">View documentation</a><a className="secondary-button" href={agent.healthUrl} target="_blank" rel="noreferrer">Check health</a></div></section><ReadOnlyAssessment agent={agent} /></>}
    <LiveProof evidence={evidence} />
    <ReadinessPassport agent={agent} evidence={evidence} />
    <div className="responsibility-notice live-warning"><div><strong>BLOCview has not independently audited this agent. Check the details before you continue.</strong><p>BLOCview only provides a reviewed, read only handoff to the external service. It does not connect a wallet, request a signature or payment, submit a transaction, or execute a strategy. This is not investment advice. You remain responsible for your decisions.</p></div></div>
  </div><Footer /></main>;
}
