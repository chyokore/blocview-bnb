import { notFound } from "next/navigation";
import Link from "next/link";
import { ActivationModal } from "@/components/ActivationModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ActivityIcon, ChevronIcon, ShieldIcon } from "@/components/icons";
import { agents, getAgent } from "@/data/agents";

export function generateStaticParams() { return agents.map((agent) => ({ slug: agent.slug })); }

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();
  return <main><Header /><div className="detail-shell">
    <div className="breadcrumbs"><Link href="/">Discover</Link><ChevronIcon /><span>{agent.name}</span></div>
    <section className="detail-hero">
      <div className="detail-main"><div className="agent-title"><span className="agent-avatar large" style={{ "--agent-accent": agent.accent } as React.CSSProperties}>{agent.monogram}</span><div><div className="tag-row"><span>{agent.category}</span><span className={`risk-${agent.risk.toLowerCase()}`}>{agent.risk} risk</span><span className="status"><i />{agent.status}</span></div><h1>{agent.name}</h1></div></div><p>{agent.longDescription}</p><div className="detail-meta"><span>Strategy <strong>{agent.strategy}</strong></span><span>Protocol <strong>{agent.protocol}</strong></span></div></div>
      <aside className="activation-card"><span className="eyebrow">Demo activation</span><h2>Put this agent to work</h2><p>Review its setup and preview how activation would feel.</p><ActivationModal agent={agent} /><small>No wallet · No transaction · No real funds</small></aside>
    </section>
    <div className="demo-banner"><span>DEMO DATA</span><p>All performance and activity shown below is illustrative. It does not represent live onchain execution.</p></div>
    <section className="performance-section"><div className="section-heading"><div><span className="eyebrow">Performance snapshot</span><h2>What the numbers say</h2></div><span className="snapshot-date">Last 30 days · Demo</span></div><div className="performance-grid"><article><span>30-day return</span><strong className={agent.return30d > 0 ? "positive" : "neutral"}>{agent.return30d > 0 ? `+${agent.return30d}%` : "N/A"}</strong><small>{agent.return30d > 0 ? "Illustrative, after strategy fees" : "Monitoring agent; does not target return"}</small></article><article><span>{agent.capitalLabel}</span><strong>{agent.capital}</strong><small>Illustrative capital under observation</small></article><article><span>Recent activity</span><strong>{agent.activityCount}</strong><small>Demo events in the past 30 days</small></article><article><span>Agent fee</span><strong className="fee-value">{agent.fee}</strong><small>Example fee structure</small></article></div></section>
    <section className="details-columns"><article className="panel"><div className="panel-title"><ShieldIcon /><div><span className="eyebrow">Guardrails</span><h2>Risk controls</h2></div></div><p>Boundaries designed to keep the agent working within a user&apos;s chosen comfort zone.</p><ul className="control-list">{agent.controls.map((control) => <li key={control}><span>✓</span>{control}</li>)}</ul><div className="risk-note"><strong>{agent.risk} risk</strong><p>{agent.risk === "Low" ? "Focused on monitoring rather than executing a capital strategy." : agent.risk === "Medium" ? "Market conditions can reduce returns or create losses despite controls." : "Frequent trading and price trends can materially affect outcomes."}</p></div></article>
      <article className="panel"><div className="panel-title"><ActivityIcon /><div><span className="eyebrow">Recent activity</span><h2>What it has been watching</h2></div></div><p>A simple-language preview of recent demo events.</p><div className="timeline">{agent.activity.map((item) => <div key={item.title}><i /><span>{item.time}</span><h3>{item.title}</h3><p>{item.detail}</p></div>)}</div></article></section>
    <section className="responsibility-notice"><ShieldIcon /><div><strong>Understand before you activate</strong><p>Agent activation is not investment advice. DeFi strategies involve risk, including loss of capital. You remain responsible for reviewing the strategy and making your own decisions.</p></div></section>
  </div><Footer /></main>;
}
