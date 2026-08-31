import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LiveAgentComparison } from "@/components/LiveAgentComparison";
import { getLiveAgent } from "@/lib/8004scan";
import { compareLiveAgents } from "@/lib/live-comparison";
import { getRangePilotLiveAgent } from "@/lib/range-pilot-watch-agents";

export const metadata: Metadata = { title: "Compare live registry agents", description: "Compare two BNB Chain ERC-8004 registry records using declared capabilities and available evidence." };

function parseKey(value: string | undefined) {
  const match = value?.match(/^(56):(\d+)$/);
  if (!match) return null;
  const tokenId = Number(match[2]);
  return Number.isSafeInteger(tokenId) ? { chainId: 56, tokenId } as const : null;
}

export default async function LiveComparePage({ searchParams }: { searchParams: Promise<{ left?: string; right?: string; requirements?: string }> }) {
  const query = await searchParams;
  const leftKey = parseKey(query.left);
  const rightKey = parseKey(query.right);
  if (!leftKey || !rightKey || leftKey.tokenId === rightKey.tokenId) return <ComparisonState title="Select two different live registry records" copy="Return to Live Agents and select exactly two 8004scan records. Demo strategies cannot be added to this comparison." />;
  const [left, right] = await Promise.all([
    getRangePilotLiveAgent(leftKey.chainId, leftKey.tokenId) ?? getLiveAgent(leftKey.chainId, leftKey.tokenId),
    getRangePilotLiveAgent(rightKey.chainId, rightKey.tokenId) ?? getLiveAgent(rightKey.chainId, rightKey.tokenId),
  ]);
  if (!left || !right) return <ComparisonState title="Live comparison data is unavailable" copy="One or both registry records could not be returned. No demo data was substituted." />;
  const requirementText = (query.requirements ?? "").slice(0, 240);
  const result = compareLiveAgents(left, right, requirementText);
  return <main><Header /><div className="compare-wrap"><LiveAgentComparison result={result} requirementText={requirementText} leftKey={query.left!} rightKey={query.right!} /></div><Footer /></main>;
}

function ComparisonState({ title, copy }: { title: string; copy: string }) {
  return <main><Header /><div className="live-shell"><div className="empty-state live-state"><h1>{title}</h1><p>{copy}</p><Link href="/live-agents" className="primary-button">Browse live agents</Link></div></div><Footer /></main>;
}
