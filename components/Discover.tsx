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
      <p>Discover real BSC agent identities, inspect what the evidence supports, compare unknowns, and hand off safely—without wallet actions inside BLOCview.</p>
      <div className="hero-actions"><Link href="/live-agents" className="primary-button">Explore 4 live BSC agents <span>→</span></Link><Link href="/find-your-fit" className="secondary-button">Find your fit</Link></div>
      <div className="proof-strip" aria-label="BLOCview proof points"><div><strong>4</strong><span>registered BSC agents</span></div><div><strong>4</strong><span>DeFi categories</span></div><div><strong>0</strong><span>wallet actions in BLOCview</span></div></div>
    </section>
    <section className="how-section" id="how-it-works"><div><span className="eyebrow">A clearer decision path</span><h2>Find. Understand.<br />Activate safely.</h2><p className="journey-intro">Each step keeps source evidence, limitations, and responsibility visible.</p></div><div className="how-steps">{[["01", "Find", "Browse four registered BSC identities by the DeFi category you actually need."], ["02", "Understand", "Review provenance, declared capability, comparison rationale, and explicit unknowns."], ["03", "Activate safely", "Run a bounded read-only assessment with no wallet, signing, payment, or transaction."]].map(([n, title, copy]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="discover-section strategy-lab" id="discover">
      <div className="section-heading"><div><span className="eyebrow">Illustrative strategy lab</span><h2>Explore demo strategies</h2><p>Illustrative strategy profiles for learning how purpose, performance, and risk compare. These are not live ERC-8004 records.</p></div><span className="result-count">{filtered.length} illustrative agents</span></div>
      <div className="lab-search"><div className="search-box"><SearchIcon /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search illustrative strategies" placeholder="Search illustrative strategies or protocols..." /></div><span>Demo data · clearly labelled</span></div>
      <div className="filters" role="group" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {filtered.length ? <div className="agent-grid">{filtered.map((agent) => <AgentCard key={agent.slug} agent={agent} />)}</div> : <div className="empty-state"><SearchIcon /><h3>No matching agents</h3><p>Try another search or category.</p></div>}
    </section>
  </>;
}
