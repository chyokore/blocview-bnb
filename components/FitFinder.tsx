"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { agents, type Agent, type AgentCategory } from "@/data/agents";
import { ArrowIcon, CheckIcon, ShieldIcon } from "./icons";

const goals = [
  { label: "Managing a PancakeSwap LP position", category: "LP Rebalancing" as AgentCategory },
  { label: "Running a grid trading strategy", category: "Grid Trading" as AgentCategory },
  { label: "Finding stablecoin yield opportunities", category: "Yield Optimisation" as AgentCategory },
  { label: "Monitoring a lending position for liquidation risk", category: "Health-Factor Monitoring" as AgentCategory },
] as const;
const risks = ["Low", "Medium", "High", "Not sure"] as const;
const priorities = ["Clear risk controls", "Yield opportunity", "Automation", "Proven activity / evidence"] as const;
const experienceLevels = ["New to DeFi", "Some experience", "Experienced"] as const;
type Answers = { goal?: (typeof goals)[number]; risk?: (typeof risks)[number]; priority?: (typeof priorities)[number]; experience?: (typeof experienceLevels)[number] };
type Match = { agent: Agent; score: number; reasons: string[]; unknowns: string[] };
const steps = ["Goal", "Risk comfort", "Priority", "Experience"];

function priorityFact(agent: Agent, priority: NonNullable<Answers["priority"]>) {
  if (priority === "Clear risk controls") return `${agent.name} lists ${agent.controls.length} demo controls, including “${agent.controls[0]}”.`;
  if (priority === "Yield opportunity") return agent.return30d > 0 ? `${agent.name} includes an illustrative 30-day return field; it is demo data, not evidence of future returns.` : `${agent.name} is monitoring-focused and does not present a positive demo return.`;
  if (priority === "Automation") return `${agent.name}'s demo purpose describes ${agent.status === "Monitoring" ? "monitoring" : "rules-based strategy support"}.`;
  return `${agent.name} contains ${agent.activityCount} illustrative activity events in its demo profile.`;
}

function experienceFit(agent: Agent, experience: NonNullable<Answers["experience"]>) {
  if (experience === "Experienced") return agent.risk === "High" ? 8 : 3;
  if (experience === "New to DeFi") return agent.risk === "Low" ? 8 : agent.risk === "Medium" ? 3 : -5;
  return agent.risk === "Medium" ? 7 : 3;
}

function calculateMatches(answers: Required<Answers>): Match[] {
  return agents.map((agent) => {
    let score = 0;
    const reasons = [
      `You selected “${answers.goal.label}”; this demo agent is categorised as ${agent.category}.`,
      `You selected ${answers.risk} risk comfort; this demo profile lists ${agent.risk} risk.`,
      `You prioritised ${answers.priority}. ${priorityFact(agent, answers.priority)}`,
      `You selected ${answers.experience}; the profile says it may suit “${agent.suitability}”.`,
      `Product facts used: ${agent.protocol}; ${agent.strategy}.`,
    ];
    if (agent.category === answers.goal.category) score += 100;
    if (answers.risk === "Not sure") score += agent.risk === "Low" ? 12 : agent.risk === "Medium" ? 8 : 2;
    else if (agent.risk === answers.risk) score += 20;
    else if ((answers.risk === "Low" && agent.risk === "High") || (answers.risk === "High" && agent.risk === "Low")) score -= 8;
    if (answers.priority === "Clear risk controls") score += Math.min(agent.controls.length, 5) * 2;
    if (answers.priority === "Yield opportunity") score += agent.category === "Yield Optimisation" ? 15 : agent.return30d > 0 ? 5 : 0;
    if (answers.priority === "Automation") score += agent.category === "Grid Trading" || agent.category === "LP Rebalancing" ? 10 : 5;
    if (answers.priority === "Proven activity / evidence") score += Math.min(agent.activityCount, 50) / 5;
    score += experienceFit(agent, answers.experience);
    return { agent, score, reasons, unknowns: ["BLOCview has not verified live strategy execution, reliability, or outcomes for this demo agent.", "Performance, capital, status, and activity figures are illustrative rather than live onchain evidence.", "This questionnaire does not assess your finances, portfolio, liquidity needs, or capacity for loss."] };
  }).sort((a, b) => b.score - a.score || a.agent.name.localeCompare(b.agent.name));
}

export function FitFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const completed = step === 4;
  const matches = useMemo(() => completed ? calculateMatches(answers as Required<Answers>) : [], [answers, completed]);
  const options = step === 0 ? goals.map((goal) => goal.label) : step === 1 ? [...risks] : step === 2 ? [...priorities] : [...experienceLevels];
  const selected = step === 0 ? answers.goal?.label : step === 1 ? answers.risk : step === 2 ? answers.priority : answers.experience;
  function choose(value: string) { if (step === 0) setAnswers((current) => ({ ...current, goal: goals.find((goal) => goal.label === value) })); if (step === 1) setAnswers((current) => ({ ...current, risk: value as Answers["risk"] })); if (step === 2) setAnswers((current) => ({ ...current, priority: value as Answers["priority"] })); if (step === 3) setAnswers((current) => ({ ...current, experience: value as Answers["experience"] })); }
  function restart() { setAnswers({}); setStep(0); }

  return <div className="fit-shell">
    <header className="fit-heading"><span className="eyebrow">Transparent preference matching</span><h1>Find your fit,<br /><span>with the reasoning visible.</span></h1><p>Four quick questions. No login, no AI-generated ranking, and no live agent is classified on your behalf.</p></header>
    <div className="fit-trust"><ShieldIcon /><p><strong>How this works</strong>BLOCview explains marketplace fit using the preferences you selected and available agent information. It does not provide financial advice or guarantee outcomes.</p></div>
    {!completed ? <section className="fit-questionnaire" aria-labelledby="fit-question">
      <div className="fit-progress" aria-label={`Step ${step + 1} of 4`}>{steps.map((label, index) => <div className={index <= step ? "active" : ""} key={label}><span>{index + 1}</span><small>{label}</small></div>)}</div>
      <div className="fit-question"><span className="eyebrow">Step {step + 1} of 4</span><h2 id="fit-question">{step === 0 ? "What do you want help with?" : step === 1 ? "What is your risk comfort?" : step === 2 ? "What matters most?" : "What is your experience level?"}</h2><div className="fit-options" role="radiogroup" aria-label={steps[step]}>{options.map((option) => <button role="radio" aria-checked={selected === option} className={selected === option ? "selected" : ""} key={option} onClick={() => choose(option)}><span>{option}</span>{selected === option && <CheckIcon />}</button>)}</div></div>
      <div className="fit-actions">{step > 0 ? <button className="secondary-button" onClick={() => setStep(step - 1)}>Back</button> : <Link href="/" className="secondary-button">Back to Discover</Link>}<button className="primary-button" disabled={!selected} onClick={() => setStep(step + 1)}>{step === 3 ? "Show transparent matches" : "Continue"} <ArrowIcon /></button></div>
    </section> : <section className="fit-results" aria-live="polite">
      <div className="fit-results-heading"><div><span className="eyebrow">Deterministic demo matches</span><h2>May fit your stated preferences</h2><p>Ranked from your four answers using fixed rules. A higher position is not proof of quality, safety, or returns.</p></div><button className="secondary-button" onClick={restart}>Start again</button></div>
      <div className="fit-answer-summary">{[answers.goal?.label, `${answers.risk} risk comfort`, answers.priority, answers.experience].map((answer) => <span key={answer}>{answer}</span>)}</div>
      <div className="fit-match-list">{matches.map((match, index) => <article className="fit-match" key={match.agent.slug}>
        <div className="fit-rank"><span>{index === 0 ? "Closest match" : `Alternative ${index}`}</span><strong>#{index + 1}</strong></div><div className="fit-agent-intro"><span className="agent-avatar" style={{ "--agent-accent": match.agent.accent } as React.CSSProperties}>{match.agent.monogram}</span><div><span className="source-badge demo">BLOCview Demo</span><h3>{match.agent.name}</h3><p>{match.agent.category} · {match.agent.protocol}</p></div></div><p className="fit-description">{match.agent.description}</p>
        <div className="fit-explanation"><div><h4>Why this matched</h4><ul>{match.reasons.map((reason) => <li key={reason}><CheckIcon />{reason}</li>)}</ul></div><div className="fit-unknowns"><h4>What we do not know</h4><ul>{match.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul></div></div>
        <div className="fit-demo-metric"><span>Illustrative demo snapshot</span><strong>{match.agent.return30d > 0 ? `+${match.agent.return30d}% demo 30-day return` : "Alerts-only demo; no return shown"}</strong><small>Not live performance and not a forecast.</small></div><div className="fit-match-actions"><Link className="primary-button" href={`/agents/${match.agent.slug}`}>View agent profile</Link><Link className="secondary-button" href={`/compare?agent=${match.agent.slug}`}>Compare agents</Link><Link className="text-button" href="/live-agents">Explore verified live BNB Chain agents <ArrowIcon /></Link></div>
      </article>)}</div>
      <aside className="live-records-note"><strong>Verified BNB Chain records — review capabilities before hiring.</strong><p>Live 8004scan agents are kept outside this demo ranking. BLOCview does not infer a strategy category when returned capabilities are unclear.</p><Link href="/live-agents">Browse live records <ArrowIcon /></Link></aside>
    </section>}
  </div>;
}
