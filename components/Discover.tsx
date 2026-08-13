"use client";

import { useMemo, useState } from "react";
import { AgentCard } from "./AgentCard";
import { agents, categories } from "@/data/agents";
import { SearchIcon, ShieldIcon, SlidersIcon } from "./icons";

export function Discover() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All agents");
  const filtered = useMemo(() => agents.filter((agent) => (category === "All agents" || agent.category === category) && `${agent.name} ${agent.description} ${agent.protocol}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  return <>
    <section className="hero">
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <span className="eyebrow"><i /> Built for the BNB Chain agent economy</span>
      <h1>Find the right AI agent<br />for your <span>DeFi strategy.</span></h1>
      <p>Discover, understand, and compare onchain agents—without digging through contracts, dashboards, or jargon.</p>
      <div className="search-box"><SearchIcon /><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search agents" placeholder="Search agents, strategies, or protocols..." /><kbd>⌘ K</kbd></div>
      <div className="trust-strip"><span><ShieldIcon /> Clear risk controls</span><span><SlidersIcon /> Side-by-side comparison</span><span><i className="status-dot" /> Demo data, clearly labelled</span></div>
    </section>
    <section className="discover-section" id="discover">
      <div className="section-heading"><div><span className="eyebrow">Agent marketplace</span><h2>Explore live strategies</h2><p>Compare purpose, performance, and risk before you take the next step.</p></div><span className="result-count">{filtered.length} agents</span></div>
      <div className="filters" role="group" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {filtered.length ? <div className="agent-grid">{filtered.map((agent) => <AgentCard key={agent.slug} agent={agent} />)}</div> : <div className="empty-state"><SearchIcon /><h3>No matching agents</h3><p>Try another search or category.</p></div>}
    </section>
    <section className="how-section" id="how-it-works"><div><span className="eyebrow">How it works</span><h2>From discovery to decision,<br />with the important context intact.</h2></div><div className="how-steps">{[["01", "Discover", "Search by strategy or protocol and scan the essentials at a glance."], ["02", "Understand", "Read plain-language summaries, risk controls, and recent demo activity."], ["03", "Activate", "Set a preference and preview activation—without connecting a wallet."]].map(([n, title, copy]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  </>;
}
