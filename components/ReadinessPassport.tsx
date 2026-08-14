import Link from "next/link";
import type { LiveAgent } from "@/lib/8004scan";
import { ArrowIcon, CheckIcon, ShieldIcon } from "./icons";

type EvidenceState = "Available" | "Not available" | "Declared only";
type EvidenceArea = { label: string; state: EvidenceState; helper: string };

function formatDate(value: string | undefined) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
}

function returned(value: number | undefined) {
  return value === undefined ? "Not available" : String(value);
}

export function ReadinessPassport({ agent }: { agent: LiveAgent }) {
  const hasReputation = agent.reputation?.score !== undefined || agent.reputation?.stars !== undefined || agent.reputation?.feedbackCount !== undefined;
  const evidence: EvidenceArea[] = [
    { label: "Identity", state: "Available", helper: "Verified means the chain and token identity were returned by 8004scan; it is not a performance audit." },
    { label: "Declared capabilities", state: agent.capabilities.length ? "Declared only" : "Not available", helper: agent.capabilities.length ? "Declared means the capability label was published in the record but has not been tested by BLOCview." : "Not available means this field was absent or empty in the returned record." },
    { label: "Reputation", state: hasReputation ? "Available" : "Not available", helper: hasReputation ? "Available means 8004scan returned at least one reputation field; BLOCview has not audited it." : "No score, stars, or feedback count was returned." },
    { label: "Activity / validation", state: "Not available", helper: "The current 8004scan detail response used by BLOCview does not provide independently verifiable activity or validation evidence." },
    { label: "Permissions / controls", state: "Not available", helper: "The returned record does not describe wallet permissions or spending controls." },
  ];
  const covered = evidence.filter((area) => area.state !== "Not available").length;
  const sourceUrl = `https://8004scan.io/agents/bsc/${agent.tokenId}`;

  return <section className="passport" aria-labelledby="passport-title">
    <header className="passport-header"><div><span className="eyebrow">Research record</span><h2 id="passport-title">Agent Readiness Passport</h2><p>A structured view of what this record does—and does not—support.</p></div><div className="coverage-count"><strong>{covered} of 5</strong><span>evidence areas available</span><small>Coverage, not a score or rating</small></div></header>
    <div className="evidence-strip">{evidence.map((area) => <div className={`evidence-item state-${area.state.toLowerCase().replaceAll(" ", "-")}`} key={area.label}><span>{area.label}</span><strong>{area.state}</strong><small>{area.helper}</small></div>)}</div>

    <div className="passport-grid">
      <PassportSection number="01" title="Identity" state="Available"><dl className="passport-facts"><div><dt>Agent name</dt><dd>{agent.name ?? "Not available"}</dd></div><div><dt>ERC-8004 token ID</dt><dd>{agent.tokenId}</dd></div><div><dt>Network</dt><dd>{agent.network} · Chain ID {agent.chainId}</dd></div><div><dt>Registration timestamp</dt><dd>{formatDate(agent.registeredAt)}</dd></div><div><dt>API verification check</dt><dd>{formatDate(agent.lastVerifiedAt)}</dd></div><div><dt>Registry state</dt><dd className="verified-text"><CheckIcon /> Verified registry identity</dd></div></dl></PassportSection>

      <PassportSection number="02" title="Declared capabilities" state={agent.capabilities.length ? "Declared only" : "Not available"}><p className="passport-helper">Declared capability — not independently verified by BLOCview.</p>{agent.capabilities.length ? <div className="capability-list">{agent.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div> : <p className="not-available-copy">No declared capabilities were returned.</p>}</PassportSection>

      <PassportSection number="03" title="Reputation" state={hasReputation ? "Available" : "Not available"}><p className="passport-helper">Reputation is shown as returned by 8004scan and is not independently audited by BLOCview.</p><dl className="reputation-facts"><div><dt>Reputation score</dt><dd>{returned(agent.reputation?.score)}</dd></div><div><dt>Stars</dt><dd>{returned(agent.reputation?.stars)}</dd></div><div><dt>Feedback count</dt><dd>{returned(agent.reputation?.feedbackCount)}</dd></div></dl></PassportSection>

      <PassportSection number="04" title="Activity and validation" state="Not available"><p className="not-available-copy">No independently verifiable activity or validation record is currently available through this data source.</p><p className="passport-helper">No demo performance, TVL, returns, trades, or strategy activity is used on this live profile.</p></PassportSection>

      <PassportSection number="05" title="Permissions and operating controls" state="Not available"><p className="not-available-copy">Permission and spending-control evidence is not available in this record.</p><ul className="control-evidence-list"><li>Wallet permissions: Not available</li><li>Spend caps: Not available</li><li>Session expiry: Not available</li><li>Revocation controls: Not available</li><li>Payment terms: Not available</li></ul><p className="passport-helper">Absence of evidence must not be interpreted as safe operating permissions.</p></PassportSection>
    </div>

    <section className="passport-provenance"><div className="provenance-heading"><span className="eyebrow">Provenance and freshness</span><Link href={sourceUrl} target="_blank" rel="noreferrer">Open source record <ArrowIcon /></Link></div><div className="provenance-timeline"><div><i /><span>Registered on</span><strong>{formatDate(agent.registeredAt)}</strong></div><div><i /><span>Data last checked</span><strong>{formatDate(agent.lastVerifiedAt)}</strong></div><div><i /><span>Source</span><strong>8004scan API</strong></div></div></section>
    <div className="passport-notice"><ShieldIcon /><p><strong>BLOCview presents available registry evidence to support research.</strong> It does not verify agent performance, guarantee outcomes, or provide financial advice.</p></div>
  </section>;
}

function PassportSection({ number, title, state, children }: { number: string; title: string; state: EvidenceState; children: React.ReactNode }) {
  return <article className="passport-section"><header><span>{number}</span><div><h3>{title}</h3><small>What the returned record supports</small></div><strong className={`passport-state state-${state.toLowerCase().replaceAll(" ", "-")}`}>{state}</strong></header>{children}</article>;
}
