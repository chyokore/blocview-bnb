"use client";

import { useEffect, useState } from "react";
import type { Agent } from "@/data/agents";
import { CheckIcon, CloseIcon, ShieldIcon } from "./icons";

export function ActivationModal({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [preference, setPreference] = useState("Balanced");
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  function close() { setOpen(false); setTimeout(() => setStep(1), 250); }
  return <>
    <button className="primary-button wide" onClick={() => setOpen(true)}>Activate agent <span>→</span></button>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section className="activation-modal" role="dialog" aria-modal="true" aria-labelledby="activation-title">
        <div className="modal-header"><div><span className="eyebrow">Demo activation preview</span><h2 id="activation-title">Activate {agent.name}</h2></div><button onClick={close} aria-label="Close activation"><CloseIcon /></button></div>
        <div className="stepper">
          {["Review agent", "Set preference", "Confirm"].map((label, i) => <div key={label} className={step >= i + 1 ? "step active" : "step"}><span>{step > i + 1 ? <CheckIcon /> : i + 1}</span><small>{label}</small></div>)}
        </div>
        {step === 1 && <div className="modal-content">
          <div className="review-agent"><span className="agent-avatar" style={{ "--agent-accent": agent.accent } as React.CSSProperties}>{agent.monogram}</span><div><strong>{agent.name}</strong><p>{agent.category} · {agent.risk} risk</p></div></div>
          <div className="review-list"><div><span>Strategy</span><strong>{agent.strategy}</strong></div><div><span>Protocol</span><strong>{agent.protocol}</strong></div><div><span>Fee</span><strong>{agent.fee}</strong></div></div>
          <div className="notice"><ShieldIcon /><p><strong>Preview only.</strong> No wallet will connect and no transaction or movement of funds will occur.</p></div>
        </div>}
        {step === 2 && <div className="modal-content"><h3>Choose a preference</h3><p className="muted">This demonstrates how you could tune the agent before activating it.</p><div className="preference-list">{["Conservative", "Balanced", "Responsive"].map((p) => <button key={p} onClick={() => setPreference(p)} className={preference === p ? "selected" : ""}><span>{p}</span><small>{p === "Conservative" ? "Fewer actions, wider safety margins" : p === "Balanced" ? "A practical balance of activity and control" : "Faster response within your limits"}</small><i>{preference === p && <CheckIcon />}</i></button>)}</div></div>}
        {step === 3 && <div className="modal-content confirm-state"><span className="confirm-icon"><CheckIcon /></span><h3>Ready to preview activation</h3><p>You selected <strong>{preference}</strong> for {agent.name}. Confirming creates a demo state only.</p><div className="notice"><ShieldIcon /><p>Activation is not investment advice. You remain responsible for reviewing risks and making your own decisions.</p></div></div>}
        <div className="modal-actions">{step > 1 && <button className="secondary-button" onClick={() => setStep(step - 1)}>Back</button>}<button className="primary-button" onClick={() => step < 3 ? setStep(step + 1) : close()}>{step < 3 ? "Continue" : "Confirm demo"} <span>→</span></button></div>
      </section>
    </div>}
  </>;
}
