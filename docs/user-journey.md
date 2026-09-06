# BLOCview user journey

## Main journey

```mermaid
flowchart LR
 L[Land] --> D[Discover by category]
 D --> P[Open profile]
 P --> Q{Compare?}
 Q -- Yes --> C[Compare 2–4 agents]
 Q -- No --> E[Inspect evidence and unknowns]
 C --> E
 E --> A[Run supported read-only assessment]
 A --> R[Review receipt]
 R --> N[Continue to registration, docs, or health]
 R --> X[Decide what comes next]
```

Purpose comes first, followed by identity, evidence, controls, freshness, and gaps. Comparison preserves differences instead of producing a ranking. BLOCview ends at the evidence checkpoint, before wallet permission, payment, or execution.

## Graceful evidence failure

```mermaid
flowchart TD
 R[Request live evidence] --> A{Available and valid?}
 A -- Yes --> P[Present sourced result and provenance]
 A -- No --> D[Disclose evidence unavailable]
 D --> N[Do not fabricate a result]
 N --> S[Do not silently substitute demo evidence]
 S --> C[Keep sources and next checks visible]
```

An unavailable RPC or endpoint, malformed response, or failed identity check produces an explicit unavailable state. Demo records remain separate and labelled; they are never live fallback evidence.
