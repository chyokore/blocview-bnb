import Link from "next/link";
import type { Agent } from "@/data/agents";
import { ArrowIcon } from "./icons";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="agent-card">
      <div className="card-topline">
        <div className="agent-identity"><span className="agent-avatar" style={{ "--agent-accent": agent.accent } as React.CSSProperties}>{agent.monogram}</span><div><h3>{agent.name}</h3><span>{agent.protocol}</span></div></div>
        <span className="status"><i />{agent.status}</span>
      </div>
      <span className="source-badge demo">BLOCview Demo</span>
      <p className="card-description">{agent.description}</p>
      <div className="tag-row"><span>{agent.category}</span><span className={`risk-${agent.risk.toLowerCase()}`}>{agent.risk} risk</span></div>
      <div className="metrics-grid">
        <div><span>30-day return <em>DEMO</em></span><strong className={agent.return30d > 0 ? "positive" : "neutral"}>{agent.return30d > 0 ? `+${agent.return30d}%` : "Alerts only"}</strong></div>
        <div><span>{agent.capitalLabel}</span><strong>{agent.capital}</strong></div>
        <div><span>Fee</span><strong>{agent.fee}</strong></div>
      </div>
      <Link href={`/agents/${agent.slug}`} className="card-link">View agent <ArrowIcon /></Link>
    </article>
  );
}
