import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LiveAgentComparison } from "@/components/LiveAgentComparison";
import { buildLiveComparison, LIVE_COMPARISON_MIN, normalizeComparisonIds } from "@/lib/live-comparison";
import { resolveRangePilotLiveAgents } from "@/lib/range-pilot-indexing";

export const metadata: Metadata = { title: "Compare live BSC agents", description: "Compare capability, evidence, freshness, safety boundaries, and unknowns across registered BSC agents." };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ agents?: string | string[] }> }) {
  const ids = normalizeComparisonIds((await searchParams).agents);
  const records = buildLiveComparison(ids, new Date(), await resolveRangePilotLiveAgents());
  if (records.length < LIVE_COMPARISON_MIN) return <ComparisonState />;
  return <main><Header /><div className="compare-wrap"><LiveAgentComparison records={records} /></div><Footer /></main>;
}

function ComparisonState() { return <main><Header /><div className="live-shell"><div className="empty-state live-state"><span className="eyebrow">Live comparison</span><h1>Select 2–4 live agents</h1><p>This comparison includes only the four registered first party BSC agents. Invalid, duplicate, and demo IDs are excluded.</p><Link href="/live-agents" className="primary-button">Choose live agents</Link></div></div><Footer /></main>; }
