import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { FlagshipLiveProof } from "@/components/FlagshipLiveProof";
import { Header } from "@/components/Header";
import { LiveAgentList } from "@/components/LiveAgentList";
import { listLiveAgents } from "@/lib/8004scan";
import { listRangePilotLiveAgents } from "@/lib/range-pilot-watch-agents";

export const metadata: Metadata = { title: "Live BNB agents", description: "Browse evidence-backed BNB Chain ERC-8004 identities from 8004scan and clearly labelled first-party registrations." };

export default async function LiveAgentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const rawPage = Number((await searchParams).page ?? "1");
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const result = await listLiveAgents(requestedPage);
  const pendingAgents = [...listRangePilotLiveAgents()];
  let content: React.ReactNode;
  if (result.status === "not-configured") content = <LiveState title="Live data is not configured" copy="The server is missing SCAN8004_API_KEY. Demo strategies remain available and clearly labelled." />;
  else if (result.status === "unavailable") content = <LiveState title="8004scan is temporarily unavailable" copy="The request timed out or the API returned an error. No demo records are shown in its place." />;
  else if (result.status === "malformed") content = <LiveState title="8004scan returned an unexpected response" copy="BLOCview declined to display records that could not be safely validated." />;
  else if (result.agents.length === 0) content = <LiveState title="No live BNB agents returned" copy="8004scan returned an empty BNB Chain page. No demo records are substituted." />;
  else content = <>
    <div className="live-result-meta"><span>{result.total === undefined ? `${result.agents.length} returned` : `${result.total.toLocaleString()} total`} · Page {result.page}</span><span>Retrieved at: {new Date(result.retrievedAt).toLocaleString()} · {result.retrievalTimestampBasis === "source-provided" ? "source timestamp" : "local fallback"}</span></div>
    <LiveAgentList agents={result.agents} />
    <nav className="pagination" aria-label="Live agent pages">{result.page > 1 && <Link className="secondary-button" href={`/live-agents?page=${result.page - 1}`}>Previous</Link>}{result.hasMore && <Link className="primary-button" href={`/live-agents?page=${result.page + 1}`}>Next page</Link>}</nav>
  </>;
  return <main><Header /><div className="live-shell">
    <header className="live-heading"><div><span className="eyebrow">Evidence-based discovery · BSC mainnet</span><h1>Four agents.<br /><span>Evidence intact.</span></h1><p>Real ERC-8004 identities from clearly named sources, kept separate from BLOCview&apos;s illustrative strategies.</p></div><div className="live-proof-strip" aria-label="Live agent proof points"><div><strong>4</strong><span>BSC identities</span></div><div><strong>4</strong><span>DeFi categories</span></div><div><strong>0</strong><span>wallet actions</span></div></div></header>
    <FlagshipLiveProof />
    <section className="pending-agents" aria-labelledby="pending-agents-title"><div className="section-heading"><div><span className="eyebrow">First-party registration evidence</span><h2 id="pending-agents-title">RangePilotWatch agents</h2><p>Four BSC identities declared in public registration JSON. 8004scan status: <strong>indexing pending</strong>.</p></div><span className="source-badge pending">Not indexed or rated by 8004scan</span></div><div className="pending-disclosure">BLOCview has not claimed these agents are indexed, rated, validated, or operationally verified by 8004scan. Registration documents and the stated BSC registry identity are the evidence source.</div><LiveAgentList agents={pendingAgents} comparisonEnabled /></section>
    <section className="scan-agents" aria-labelledby="scan-agents-title"><div className="section-heading"><div><span className="eyebrow">8004scan discovery</span><h2 id="scan-agents-title">Indexed records</h2><p>Existing records returned by the 8004scan Public API.</p></div><span className="source-badge verified">8004scan registry records</span></div>
    {content}
    </section>
  </div><Footer /></main>;
}

function LiveState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state live-state"><h2>{title}</h2><p>{copy}</p><Link href="/" className="secondary-button">Explore demo strategies</Link></div>;
}
