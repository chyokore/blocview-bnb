import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LiveAgentList } from "@/components/LiveAgentList";
import { listLiveAgents } from "@/lib/8004scan";

export const metadata: Metadata = { title: "Live BNB agents", description: "Browse BNB Chain ERC-8004 identities returned by 8004scan." };

export default async function LiveAgentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const rawPage = Number((await searchParams).page ?? "1");
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const result = await listLiveAgents(requestedPage);
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
    <header className="live-heading"><span className="eyebrow">8004scan discovery</span><h1>Live BNB agents</h1><p>Real ERC-8004 registry records returned by 8004scan, kept separate from BLOCview&apos;s illustrative strategies.</p><div className="source-badge verified">8004scan registry records</div></header>
    {content}
  </div><Footer /></main>;
}

function LiveState({ title, copy }: { title: string; copy: string }) {
  return <div className="empty-state live-state"><h2>{title}</h2><p>{copy}</p><Link href="/" className="secondary-button">Explore demo strategies</Link></div>;
}
