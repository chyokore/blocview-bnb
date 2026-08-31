"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AgentCard } from "./AgentCard";
import { agents, categories } from "@/data/agents";
import { SearchIcon } from "./icons";

export function Discover() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All agents");
  const filtered = useMemo(() => agents.filter((agent) => (category === "All agents" || agent.category === category) && `${agent.name} ${agent.description} ${agent.protocol}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <>
    <section className="hero">
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <span className="eyebrow"><i /> Built for the BNB Chain agent economy</span>
      <h1>Evidence before <span>activation.</span></h1>
      <p>Discover real BSC agents, see what the evidence supports, and compare what is known and unknown. BLOCview never asks for wallet access.</p>
      <div className="hero-actions"><Link href="/live-agents" className="primary-button">Explore 4 live BSC agents <span>→</span></Link><Link href="/find-your-fit" className="secondary-button">Find your fit</Link></div>
      <div className="proof-strip" aria-label="BLOCview proof points"><div><strong>4</strong><span>registered BSC agents</span></div><div><strong>4</strong><span>DeFi categories</span></div><div><strong>0</strong><span>wallet actions in BLOCview</span></div></div>
    </section>
    <section className="how-section" id="how-it-works"><div><span className="eyebrow">Evidence checkpoint</span><h2>Review before<br />you continue.</h2><p className="journey-intro">BLOCview adds a clear evidence checkpoint before you continue to an agent or source.</p></div><div className="how-steps">{[["01", "Find", "Browse live BSC agents by what you need."], ["02", "Compare", "See what each agent does, what evidence exists, and what is still unknown."], ["03", "Verify", "Check the sources behind the claims before making a decision."], ["04", "Test", "Run a bounded read only assessment without connecting a wallet."], ["05", "Continue", "Review the receipt, then decide what you want to do next."]].map(([n, title, copy]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="discover-section strategy-lab" id="discover">
      <div className="section-heading"><div><span className="eyebrow">Illustrative strategy lab</span><h2>Explore demo strategies</h2><p>Illustrative strategy profiles for learning how purpose, performance, and risk compare. These are not live ERC-8004 records.</p></div><span className="result-count">{filtered.length} illustrative agents</span></div>
      <div className="lab-search"><div className="search-box"><SearchIcon /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search illustrative strategies" placeholder="Search illustrative strategies or protocols..." /></div><span>Demo data · clearly labelled</span></div>
      <div className="filters" role="group" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {filtered.length ? <div className="agent-grid">{filtered.map((agent) => <AgentCard key={agent.slug} agent={agent} />)}</div> : <div className="empty-state"><SearchIcon /><h3>No matching agents</h3><p>Try another search or category.</p></div>}
    </section>
  </>;
}
