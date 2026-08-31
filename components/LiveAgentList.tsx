"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LiveAgent } from "@/lib/8004scan";
import { ArrowIcon, SearchIcon, ShieldIcon } from "./icons";

function text(value: string | undefined) {
  return value?.trim() || "Not returned";
}

function date(value: string | undefined) {
  if (!value) return "Not returned";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
}

export function LiveAgentList({ agents }: { agents: LiveAgent[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return agents;
    return agents.filter((agent) => `${agent.name ?? ""} ${agent.agentId} ${agent.tokenId} ${agent.description ?? ""} ${agent.capabilities.join(" ")}`.toLowerCase().includes(needle));
  }, [agents, query]);

  return <>
    <div className="live-search search-box"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search returned live agents" placeholder="Search this page by name, identity, or capability…" /></div>
    <p className="search-caveat"><ShieldIcon /> Search matches returned metadata only; it is not evidence of quality, safety, or suitability.</p>
    {filtered.length ? <div className="agent-grid live-grid">{filtered.map((agent) => { const key = `${agent.chainId}:${agent.tokenId}`; const checked = selected.includes(key); return <article className={`agent-card live-card ${checked ? "selected-for-compare" : ""}`} key={key}>
      <div className="card-topline"><div className="agent-identity"><span className="agent-avatar live-avatar">{(agent.name?.slice(0, 2) || "#").toUpperCase()}</span><div><h3>{text(agent.name)}</h3><span>ERC-8004 #{agent.tokenId}</span></div></div><span className="source-badge verified">8004scan registry record</span></div>
      <p className="card-description">{text(agent.description)}</p>
      <div className="tag-row"><span>Unclassified live agent</span>{agent.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div>
      <dl className="live-facts"><div><dt>Identity</dt><dd>{agent.agentId}</dd></div><div><dt>Network</dt><dd>{agent.network} ({agent.chainId})</dd></div><div><dt>Reputation</dt><dd>{agent.reputation?.score ?? "Not returned"}</dd></div><div><dt>Feedback</dt><dd>{agent.reputation?.feedbackCount ?? "Not returned"}</dd></div><div><dt>Registered</dt><dd>{date(agent.registeredAt)}</dd></div><div><dt>Retrieved</dt><dd>{date(agent.retrievedAt)} · {agent.retrievalTimestampBasis === "source-provided" ? "source timestamp" : "local fallback"}</dd></div></dl>
      <label className="live-compare-select"><input type="checkbox" checked={checked} disabled={!checked && selected.length >= 2} onChange={() => setSelected((current) => checked ? current.filter((item) => item !== key) : [...current, key])} /><span>{checked ? "Selected for live comparison" : "Select for live comparison"}</span></label>
      <Link href={`/live-agents/${agent.chainId}/${agent.tokenId}`} className="card-link">View sourced profile <ArrowIcon /></Link>
    </article>})}</div> : <div className="empty-state"><SearchIcon /><h3>No matching agents on this page</h3><p>Try a different name, identity, or capability.</p></div>}
    <div className="live-compare-dock" aria-live="polite"><div><strong>{selected.length} of 2 selected</strong><span>Live registry records only. Demo agents are excluded.</span></div>{selected.length === 2 ? <Link className="primary-button" href={{ pathname: "/live-agents/compare", query: { left: selected[0], right: selected[1] } }}>Compare selected records</Link> : <button className="primary-button" disabled>Select two records</button>}</div>
  </>;
}
