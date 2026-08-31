import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LiveProof } from "@/components/LiveProof";
import { ReadinessPassport } from "@/components/ReadinessPassport";
import { getLiveAgent } from "@/lib/8004scan";
import { deriveEvidenceRecord } from "@/lib/evidence";

function show(value: string | number | undefined) { return value ?? "Not returned"; }

export async function generateMetadata({ params }: { params: Promise<{ chainId: string; tokenId: string }> }): Promise<Metadata> {
  const { tokenId } = await params;
  return { title: `Live agent #${tokenId}` };
}

export default async function LiveAgentPage({ params }: { params: Promise<{ chainId: string; tokenId: string }> }) {
  const values = await params;
  const chainId = Number(values.chainId);
  const tokenId = Number(values.tokenId);
  const agent = await getLiveAgent(chainId, tokenId);
  if (!agent) notFound();
  const evidence = deriveEvidenceRecord(agent);
  return <main><Header /><div className="detail-shell live-detail">
    <div className="breadcrumbs"><Link href="/live-agents">Live agents</Link><span>/</span><span>ERC-8004 #{agent.tokenId}</span></div>
    <section className="detail-hero"><div className="detail-main"><div className="source-badge verified">8004scan registry record</div><div className="agent-title"><span className="agent-avatar large live-avatar">{(agent.name?.slice(0, 2) || "#").toUpperCase()}</span><div><span className="eyebrow">Unclassified live agent</span><h1>{show(agent.name)}</h1></div></div><p>{show(agent.description)}</p></div><aside className="source-panel"><span>Data source</span><strong>8004scan Public API</strong><p>Fetched server-side. BLOCview does not enrich this profile with demo strategy, performance, risk, or activation data.</p></aside></section>
    <LiveProof evidence={evidence} />
    <ReadinessPassport agent={agent} evidence={evidence} />
    <div className="responsibility-notice live-warning"><div><strong>BLOCview has not independently audited this agent. Verify its details before interacting.</strong><p>No AI Agent Brief, activation, wallet, transaction, or payment feature is available for live agents in this milestone.</p></div></div>
  </div><Footer /></main>;
}
