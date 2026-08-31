import Link from "next/link";
import type { LiveComparisonResult } from "@/lib/live-comparison";
import { ArrowIcon, ShieldIcon } from "./icons";

function label(result: LiveComparisonResult, index: number) {
  const agent = result.records[index].agent;
  return agent.name ?? `ERC-8004 #${agent.tokenId}`;
}

function reputation(result: LiveComparisonResult, index: number) {
  const value = result.records[index].evidence.reputation;
  if (!value) return "Not available from this record";
  return `Score ${value.score ?? "not returned"} · Stars ${value.stars ?? "not returned"} · Feedback ${value.feedbackCount ?? "not returned"}`;
}

export function LiveAgentComparison({ result, requirementText, leftKey, rightKey }: { result: LiveComparisonResult; requirementText: string; leftKey: string; rightKey: string }) {
  const recommended = result.recommendedAgentId ? result.records.find((record) => record.agent.agentId === result.recommendedAgentId) : undefined;
  return <div className="live-compare">
    <header className="live-compare-heading"><span className="eyebrow">Live registration comparison</span><h1>Compare evidence,<br /><span>not promises.</span></h1><p>Two ERC-8004 records, evaluated only against their cited source evidence and the requirements you state.</p></header>
    <div className="live-compare-separation"><span>LIVE RECORDS ONLY</span>Demo strategies and illustrative metrics are excluded from this comparison.</div>
    <form className="requirement-form" action="/live-agents/compare" method="get">
      <input type="hidden" name="left" value={leftKey} /><input type="hidden" name="right" value={rightKey} />
      <label htmlFor="requirements">What capabilities do you require?</label>
      <div><input id="requirements" name="requirements" defaultValue={requirementText} placeholder="e.g. trading, data analysis" maxLength={240} /><button className="primary-button" type="submit">Update rationale</button></div>
      <small>Use comma-separated capability requirements. Matching is deterministic against declared labels only.</small>
    </form>

    <section className={`best-fit-panel ${result.outcome === "no-clear-best-fit" ? "inconclusive" : ""}`} aria-labelledby="best-fit-title">
      <div className="best-fit-summary"><span className="eyebrow">Best fit for your stated requirements</span><h2 id="best-fit-title">{result.headline}</h2><p>{result.runnerUpExplanation}</p>{result.requirements.length ? <div className="requirement-tags">{result.requirements.map((requirement) => <span key={requirement}>{requirement}</span>)}</div> : <strong className="requirement-warning">No capability requirements were supplied; the result remains inconclusive.</strong>}</div>
      <div className="best-fit-reasons"><h3>{recommended ? `Why ${recommended.agent.name ?? `#${recommended.agent.tokenId}`}` : "Why this is inconclusive"}</h3>{(recommended ? recommended.weightedReasons : result.records[0].weightedReasons).map((reason) => <div key={reason.criterion}><strong>+{reason.points}</strong><p>{reason.explanation}</p></div>)}</div>
      <div className="decision-support-notice"><ShieldIcon /><p>{result.decisionSupportNotice}</p></div>
    </section>

    <section className="live-compare-table" aria-label="Live registry record comparison">
      <div className="live-compare-row live-compare-records"><div>Registry record</div>{result.records.map((record) => <article key={record.agent.agentId}><span className={`source-badge ${record.agent.source === "8004scan" ? "verified" : "pending"}`}>{record.agent.source === "8004scan" ? "8004scan registry record" : "8004scan: indexing pending"}</span><h2>{record.agent.name ?? `ERC-8004 #${record.agent.tokenId}`}</h2><p>{record.agent.network} · Token #{record.agent.tokenId}</p><Link href={record.evidence.source.url} target="_blank" rel="noreferrer">Open source evidence <ArrowIcon /></Link></article>)}</div>
      <CompareRow label="Declared capabilities" values={result.records.map((record) => record.evidence.declaredCapabilities.length ? record.evidence.declaredCapabilities.join(" · ") : "Not available from this record")} />
      <CompareRow label="Capability match" values={result.records.map((record) => `${record.matchedRequirements.length} of ${result.requirements.length} stated requirements`)} />
      <CompareRow label="Evidence coverage" values={result.records.map((record) => `${record.evidence.coverage.available} of ${record.evidence.coverage.total} areas`)} />
      <CompareRow label="Retrieval freshness" values={result.records.map((record) => `${record.evidence.retrieval.freshness} · ${record.evidence.retrieval.timestampBasis === "source-provided" ? "source timestamp" : "local fallback"}`)} />
      <CompareRow label="Source-returned reputation" values={[reputation(result, 0), reputation(result, 1)]} />
      <CompareRow label="Weighted evidence total" values={result.records.map((record) => `${record.score} points`)} />
      <div className="live-compare-row live-compare-gaps"><div>Disqualifiers and unknowns</div>{result.records.map((record) => <div key={record.agent.agentId}><strong>{record.disqualifiers.length ? "Disqualifiers" : "No evidence disqualifier triggered"}</strong>{record.disqualifiers.length > 0 && <ul>{record.disqualifiers.map((item) => <li key={item}>{item}</li>)}</ul>}<strong>Unknowns</strong><ul>{record.unknowns.map((item) => <li key={item}>{item}</li>)}</ul></div>)}</div>
      <div className="live-compare-actions"><div /><Link href={`/live-agents/${result.records[0].agent.chainId}/${result.records[0].agent.tokenId}`}>View {label(result, 0)} <ArrowIcon /></Link><Link href={`/live-agents/${result.records[1].agent.chainId}/${result.records[1].agent.tokenId}`}>View {label(result, 1)} <ArrowIcon /></Link></div>
    </section>
  </div>;
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return <div className="live-compare-row"><div>{label}</div>{values.map((value, index) => <div key={`${label}-${index}`}>{value}</div>)}</div>;
}
