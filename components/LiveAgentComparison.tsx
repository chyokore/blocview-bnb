import Link from "next/link";
import type { ComparisonEvidenceState, LiveAgentComparisonRecord } from "@/lib/live-comparison";
import { ArrowIcon, ShieldIcon } from "./icons";

const yesNo = (value: boolean) => value ? "Yes" : "No";

export function LiveAgentComparison({ records }: { records: LiveAgentComparisonRecord[] }) {
  return <div className="evidence-compare">
    <header className="evidence-compare-heading"><span className="eyebrow">Compare live BSC agents</span><h1>Evidence before<br /><span>activation.</span></h1><p>See capability, evidence, safety boundaries, and unknowns side by side before choosing a read-only test.</p></header>
    <div className="comparison-principle"><ShieldIcon /><p><strong>Evidence coverage is not a trust score.</strong> It counts available evidence signals—not security, profitability, quality, or suitability.</p></div>

    <section className="choice-summary" aria-labelledby="choice-summary-title"><span className="eyebrow">How these agents differ</span><h2 id="choice-summary-title">Choose by intended task—not a ranking.</h2><div>{records.map(({ agent, bestFor }) => <p key={agent.tokenId}><strong>{agent.name}</strong> {bestFor.charAt(0).toLowerCase() + bestFor.slice(1)}</p>)}</div></section>

    <section className="comparison-cards" aria-label="Selected live agent comparison">{records.map((record) => <article className="comparison-agent" key={record.agent.tokenId}>
      <header><div><span>{record.agent.category}</span><h2>{record.agent.name}</h2><p>{record.protocol} · BNB Chain</p></div><span className="evidence-state pending">INDEXING PENDING</span></header>
      <ComparisonBlock title="Best for"><p>{record.bestFor}</p></ComparisonBlock>
      <ComparisonBlock title="What it observes"><p>{record.observes}</p><small>Supported input: {record.supportedInput}</small></ComparisonBlock>
      <ComparisonBlock title="Live evidence"><Status state={record.onchainEvidence.state} /><p>{record.onchainEvidence.detail}</p><small>{record.categoryEvidence}</small><small>Source: {record.evidenceSource}</small></ComparisonBlock>
      <ComparisonBlock title="Evidence freshness"><Status state="AVAILABLE" /><p>{record.evidenceFreshness}</p></ComparisonBlock>
      <ComparisonBlock title="Evidence coverage"><strong className="coverage-count">{record.coverage.available} of {record.coverage.total} signals available</strong><ul className="signal-list"><Signal label="ERC-8004 identity" available={record.signals.erc8004Identity} /><Signal label="Documentation" available={record.signals.documentation} /><Signal label="Health endpoint" available={record.signals.healthEndpoint} suffix="not checked here" /><Signal label="Read-only assessment" available={record.signals.liveAssessment} /><Signal label="On-chain evidence" available={record.signals.onchainEvidence} /><Signal label="Pinned-block provenance" available={record.signals.pinnedBlock} /><Signal label="External cross-check" available={record.signals.externalCrossCheck} /><Signal label="Indexed reputation" available={record.signals.indexedReputation} /></ul></ComparisonBlock>
      <ComparisonBlock title="Activation / test mode"><Status state="AVAILABLE" /><p>{record.activationMode}</p></ComparisonBlock>
      <ComparisonBlock title="Safety boundary"><dl className="safety-facts"><div><dt>Read-only</dt><dd>Yes</dd></div><div><dt>Wallet required</dt><dd>{yesNo(record.safety.walletRequired)}</dd></div><div><dt>Signature required</dt><dd>{yesNo(record.safety.signatureRequired)}</dd></div><div><dt>Transaction capability</dt><dd>{yesNo(record.safety.transactionCapability)}</dd></div><div><dt>Fund movement</dt><dd>{yesNo(record.safety.fundMovement)}</dd></div><div><dt>Custody</dt><dd>{record.safety.custody}</dd></div></dl></ComparisonBlock>
      <ComparisonBlock title="Known limitations"><p>{record.limitation}</p><p><strong>Unsupported:</strong> {record.unsupportedAction}</p></ComparisonBlock>
      <ComparisonBlock title="Unknown / unavailable evidence"><Status state="UNAVAILABLE" /><ul>{record.missingEvidence.map((item) => <li key={item}>{item}</li>)}</ul></ComparisonBlock>
      <ComparisonBlock title="ERC-8004 provenance"><dl className="identity-facts"><div><dt>Token ID</dt><dd>{record.agent.tokenId}</dd></div><div><dt>Identity</dt><dd>{record.agent.agentId}</dd></div><div><dt>Source</dt><dd>Public registration JSON</dd></div><div><dt>Registration</dt><dd>Declared · 8004scan indexing pending</dd></div></dl></ComparisonBlock>
      <footer><Link href={`/live-agents/56/${record.agent.tokenId}`} className="primary-button">Run read-only assessment <ArrowIcon /></Link><Link href={record.agent.registrationUrl} target="_blank" rel="noreferrer" className="secondary-button">View source evidence</Link></footer>
    </article>)}</section>
    <div className="comparison-close"><strong>No recommendation is made.</strong><p>Open a profile to review the exact inputs, current evidence response, and limitations before running its bounded assessment.</p><Link href="/live-agents" className="secondary-button">Change selected agents</Link></div>
  </div>;
}

function ComparisonBlock({ title, children }: { title: string; children: React.ReactNode }) { return <section className="comparison-block"><h3>{title}</h3>{children}</section>; }
function Status({ state }: { state: ComparisonEvidenceState }) { return <span className={`evidence-state ${state.toLowerCase().replaceAll(" ", "-")}`}>{state}</span>; }
function Signal({ label, available, suffix }: { label: string; available: boolean; suffix?: string }) { return <li>{label} · {available ? "Available" : "Unavailable"}{available && suffix ? `, ${suffix}` : ""}</li>; }
