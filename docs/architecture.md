# BLOCview architecture

BLOCview separates first-party observation from external evidence and carries provenance into the result. Using a source does not mean treating it as trusted or complete.

Hiring uses fixed BLOCview server routes that validate one of four canonical inputs, call the allowlisted RangePilotWatch origin with a server-only `BLOCVIEW_SERVICE_TOKEN`, sanitize responses, and expose only durable task creation and retrieval. The browser never receives the credential or chooses an upstream URL.

## System architecture

```mermaid
flowchart LR
 U[User] --> UI[BLOCview UI]
 UI --> P[Discovery, profiles, comparison]
 P --> O[Evidence orchestration]
 subgraph FP[First-party BLOCview evidence]
  R[PancakeSwap V3 reader]
 end
 subgraph EXT[External evidence]
  REG[BSC ERC-8004 registry]
  S[8004scan API]
  D[Agent documentation]
  H[Health endpoints]
  A[Bounded read-only assessments]
  X[RangePilotWatch cross-check]
 end
 O --> R & REG & S & D & H & A & X
 R & REG & S & D & H & A & X --> N[Normalized evidence with source and freshness]
 N --> C[Evidence Coverage]
 N --> RC[Assessment receipt]
 C & RC --> DEC[User decision]
```

Evidence orchestration obtains only supported evidence, normalizes without inventing fields, and keeps first-party and external observations distinct. Coverage reports availability; receipts report what was observed and where it came from.

## GridBand evidence flow

```mermaid
flowchart TD
 B[User boundaries] --> V[Validate increasing ticks and spacing]
 V --> P[Fixed allowlisted WBNB-USDT-500 pool]
 P --> RPC[BSC RPC]
 RPC --> BL[Pin one block]
 BL --> ID[Verify bytecode, factory, tokens, and fee]
 ID --> STATE[Read tick, liquidity, spacing, timestamp]
 STATE --> GP[Derive grid placement]
 GP --> RC[Evidence receipt]
 X[Separate RangePilotWatch cross-check] -. independent observation .-> RC
 RC --> STOP[Review only: no wallet, signature, or transaction]
```

The server rejects identity mismatches, missing code, malformed critical state, or unavailable required getters. Large integers remain exact strings where needed. RangePilotWatch may add a separately identified cross-check; it never substitutes for the first-party observation.

No wallet, signature, approval, arbitrary RPC/address/ABI/calldata, swap, liquidity modification, payment, or transaction path exists.

## Trust and evidence boundary

| Boundary | BLOCview controls | External to BLOCview |
| --- | --- | --- |
| Product | UI, allowlists, validation, normalization, coverage, receipts | User decisions after review |
| First-party observation | Pool identity checks, pinned reads, placement derivation | BSC node availability and contracts |
| Indexed evidence | Server adapter and truthful display | 8004scan indexing, availability, correctness |
| Agent evidence | Supported shapes and source labels | Registration metadata, docs, health, assessment services |
| Cross-check | Separation from first-party evidence | RangePilotWatch availability and timing |

External evidence is evidence to inspect, not endorsement. Coverage measures presence, not truth, quality, safety, profitability, or suitability.
