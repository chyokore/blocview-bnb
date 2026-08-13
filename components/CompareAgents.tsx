"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { agents } from "@/data/agents";
import { ArrowIcon, CheckIcon } from "./icons";

export function CompareAgents() {
  const searchParams = useSearchParams();
  const requestedAgent = searchParams.get("agent");
  const initialLeft = agents.some((agent) => agent.slug === requestedAgent) ? requestedAgent! : agents[0].slug;
  const initialRight = agents.find((agent) => agent.slug !== initialLeft)?.slug ?? agents[1].slug;
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);
  const selected = [agents.find((a) => a.slug === left)!, agents.find((a) => a.slug === right)!];
  const rows: Array<[string, (typeof agents)[number] extends infer T ? keyof T : never]> = [["Category", "category"], ["Risk level", "risk"], ["30-day return", "return30d"], ["Fee", "fee"], ["Strategy", "strategy"], ["Protocol", "protocol"], ["Recent activity", "activityCount"], ["Best suited for", "suitability"]];
  return <div className="compare-wrap">
    <div className="compare-header"><span className="eyebrow">Side-by-side</span><h1>Compare agents,<br /><span>without the guesswork.</span></h1><p>See the differences that matter before choosing a strategy.</p></div>
    <div className="compare-note"><span>DEMO</span>All metrics are illustrative and do not represent live onchain performance.</div>
    <section className="compare-table">
      <div className="compare-selectors"><div className="comparison-label">Comparing</div>{selected.map((agent, index) => <div className="selector-card" key={index}><label htmlFor={`agent-${index}`}>Agent {index + 1}</label><select id={`agent-${index}`} value={index === 0 ? left : right} onChange={(e) => index === 0 ? setLeft(e.target.value) : setRight(e.target.value)}>{agents.map((item) => <option key={item.slug} value={item.slug} disabled={selected[1-index].slug === item.slug}>{item.name}</option>)}</select><div className="selected-agent"><span className="agent-avatar" style={{ "--agent-accent": agent.accent } as React.CSSProperties}>{agent.monogram}</span><div><strong>{agent.name}</strong><span className="status"><i />{agent.status}</span></div></div></div>)}</div>
      <div className="compare-rows">{rows.map(([label, key]) => <div className="compare-row" key={label}><div>{label}</div>{selected.map((agent) => { const value = agent[key]; let output: React.ReactNode = String(value); if (key === "return30d") output = Number(value) > 0 ? `+${value}%` : "Alerts only"; if (key === "activityCount") output = `${value} demo events`; return <div key={agent.slug} className={key === "risk" ? `risk-text risk-${String(value).toLowerCase()}` : key === "return30d" ? "positive" : ""}>{key === "suitability" && <CheckIcon />}{output}</div>; })}</div>)}</div>
      <div className="compare-actions"><div /><Link href={`/agents/${selected[0].slug}`}>View {selected[0].name} <ArrowIcon /></Link><Link href={`/agents/${selected[1].slug}`}>View {selected[1].name} <ArrowIcon /></Link></div>
    </section>
  </div>;
}
