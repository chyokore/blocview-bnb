# BLOCview

**Evidence before activation.**

Finding an AI agent is getting easier.

Knowing what that agent can actually prove is harder.

BLOCview helps you discover and compare agents on BNB Chain, inspect the evidence behind them, understand what is still unknown, and test supported agents without handing over control of your wallet or funds.

Instead of giving every agent a made-up trust score, BLOCview shows the evidence that is available and lets you decide. BLOCview is the evidence checkpoint before activation.

[Live app](https://blocview-agents.chinyereokore.chatgpt.site/) · [Live agents](https://blocview-agents.chinyereokore.chatgpt.site/live-agents) · [Compare agents](https://blocview-agents.chinyereokore.chatgpt.site/compare) · [Source](https://github.com/chyokore/blocview-bnb)

## Questions BLOCview helps you answer

| Question | How BLOCview helps |
| --- | --- |
| What does this agent actually do? | Profiles explain its purpose, inputs, controls, and limits. |
| Is it really registered on BNB Chain? | Identity panels link the ERC-8004 token and registration metadata. |
| What evidence can I verify? | Signals link to sources and retain provenance and freshness. |
| What is still unknown? | Missing evidence stays visibly unavailable. |
| How does it compare? | Compare two to four live agents side by side. |
| Can I inspect what it sees without a wallet? | Supported assessments are read-only. |
| Where did this result come from? | Receipts identify source, network, time, and pinned block where applicable. |

## What you can do

**Discover → Compare → Verify → Test safely → Review evidence → Decide what comes next**

BLOCview stops before wallet permissions, payments, and execution. It helps users inspect evidence before deciding whether to activate an agent through appropriate execution infrastructure.

## Four live BSC agents

All four are live BSC identities in registry `eip155:56:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`.

| Agent | Category | ERC-8004 token ID | Evidence Coverage |
| --- | --- | --- | ---: |
| RangeRebalance Lens | Rebalancing | [321941](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=321941) | 5/8 |
| GridBand Observer | Grid Trading | [321995](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=321995) | 8/8 |
| Venus Yield Lens | Yield Optimisation | [322046](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=322046) | 5/8 |
| Venus Borrow Buffer Watch | Health Factor Monitoring | [322090](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=322090) | 5/8 |

## Evidence Coverage

Evidence Coverage counts eight objective availability signals: identity, documentation, health, read-only assessment, onchain evidence, pinned-block provenance, external cross-check, and indexed reputation.

It measures which signals are **available**. It is not a trust, security, profitability, quality, suitability, or ranking score. An 8/8 says all eight kinds are present, not that an agent is safe or preferable.

At the verified release, 8004scan indexed all four canonical identities and returned zero-valued reputation score, stars, and feedback. BLOCview displays those values truthfully. The presence of indexed fields counts as availability; zero is not converted into positive reputation or validation.

## What is real, and what BLOCview does not pretend

| Live or verifiable | Not claimed or performed |
| --- | --- |
| Four BSC ERC-8004 identities and public metadata | No fabricated trust score or reputation |
| Documentation and health endpoints | No demo fallback presented as live evidence |
| Bounded read-only assessments and receipts | No wallet, signature, approval, or payment |
| Server-side 8004scan integration | No transaction, fund movement, or execution |
| First-party PancakeSwap V3 evidence for GridBand | No invented performance history |
| Pinned-block provenance and separate cross-check | No guarantee of profitability, safety, or suitability |

## PancakeSwap Challenge

GridBand Observer gives PancakeSwap users inspectable pool intelligence before they act. BLOCview independently reads the allowlisted PancakeSwap V3 WBNB/USDT 0.05% pool from BNB Chain. It verifies pool identity and reads current tick, liquidity, tick spacing, block, and timestamp at one pinned block.

Given the grid boundaries a user provides, BLOCview derives current grid placement. RangePilotWatch is a separately identified external cross-check. This is a point-in-time observation, not a trading recommendation, profitability claim, LP report, automated rebalance, swap, or execution path.

```text
Allowlisted pool: WBNB-USDT-500
Grid boundaries: -100000,0,100000
```

The pool is fixed and read-only in the UI. See [architecture](docs/architecture.md) and the [judge demo](docs/judge-demo.md).

## Architecture

BLOCview keeps the evidence trail visible. Agent identity, indexed data, live chain observations, and external checks stay clearly separated so users can see where a result came from.

- [System architecture, GridBand flow, and evidence boundary](docs/architecture.md)
- [User journey and graceful evidence failure](docs/user-journey.md)
- [90–120 second judge demo](docs/judge-demo.md)
- [Full FAQ](docs/faq.md)

## See BLOCview in 90 seconds

**1. Discover** — Open the four live BSC agents across rebalancing, grid trading, yield optimisation, and health factor monitoring.

**2. Compare** — Compare their capabilities, limitations, and available evidence.

**3. Verify** — Open GridBand Observer and inspect its ERC-8004 identity and live PancakeSwap V3 evidence.

**4. Test** — Run the read-only assessment using `-100000,0,100000`.

**5. Review** — Inspect the assessment receipt, pinned BNB Chain block, and separate external cross-check.

**No wallet. No transaction. Evidence before activation.**

## BNB Chain fit

BLOCview uses BNB Smart Chain, ERC-8004 identity, 8004scan indexed data, live BSC reads, and PancakeSwap V3 evidence. As BNB Chain makes it easier for agents to establish identities and eventually receive permissions, payments, and execution capabilities, the decision before activation becomes more important. BLOCview gives users a place to inspect the evidence first.

## Safety boundary

BLOCview's current assessment journey is deliberately read only. It does not connect a wallet, request signatures, move funds, or execute trades.

For GridBand, the PancakeSwap target is fixed and allowlisted. Users cannot provide arbitrary RPC endpoints, contracts, ABIs, calldata, or chains. There is no approval, swap, liquidity modification, custody, payment, or execution. Output is evidence from one moment, not investment advice. Users remain responsible for their decisions.

## FAQ

**Is BLOCview a trust score?** No. Evidence Coverage reports availability and leaves judgment with the user.

**Does it execute trades or connect a wallet?** No. It requests no wallet, signature, or transaction.

**What happens when evidence is unavailable?** BLOCview discloses the gap without fabricating or silently substituting demo evidence.

**Why compare instead of rank?** Different tasks need different evidence and controls; one number would hide those differences.

**What does 8/8 mean?** All eight evidence types are available. It does not mean perfect, safe, profitable, or suitable.

**Why does zero reputation count?** The indexed field exists and truthfully says zero. Availability is not endorsement.

**What happens after BLOCview?** BLOCview helps with the decision before activation. If a user decides to continue, activation belongs to the appropriate agent or execution infrastructure.

## Technical setup

Prerequisites: Node.js 22.13 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`SCAN8004_API_KEY` enables the server-side 8004scan adapter. `OPENAI_API_KEY` is used only by the optional Agent Brief endpoint. Leave either blank when unused. Never expose or commit secrets.

Major dependencies include Next.js, React, vinext/Vite, OpenAI's Node library, Drizzle ORM, Tailwind CSS, Cloudflare tooling, TypeScript, and ESLint. Exact versions are in [`package.json`](package.json). OpenAI Sites configuration lives in `.openai/hosting.json`; this pass does not alter or deploy it.

### Verification and production proof

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

The release at commit `35ef0240495de7e09f103d7dd9e537f725827f5e` was OpenAI Sites production version 8. Verification recorded 40/40 tests, TypeScript, ESLint, production/Sites build, secret/client leak scan, and `git diff --check` passing. These are release observations, not permanent live-state guarantees. Evidence Coverage was 5/8, 8/8, 5/8, and 5/8; all four IDs were indexed by 8004scan.

## Limitations

- Evidence Coverage measures availability, not truth or quality.
- Point-in-time observations can become stale; public infrastructure can fail temporarily.
- External docs, health, assessment, and cross-check endpoints remain dependencies.
- Zero reputation is not positive reputation.
- Assessments are read-only and do not activate or execute agents.
- Caller-provided grid boundaries are not investment advice.
- BLOCview does not guarantee profitability, safety, accuracy beyond the observation, or suitability.

## Beyond the hackathon

Beyond the hackathon, BLOCview is designed to grow into a monetized evidence and discovery layer for agent ecosystems. Future work may include broader BSC indexing, reputation history, standardized receipts, agent-side verification APIs, marketplace integrations, enterprise/API access, activation handoff to compatible infrastructure, and monitoring over time. These are not claimed as built.

## Roadmap

**Shipped:** four canonical profiles; two-to-four-agent comparison; Evidence Coverage; read-only assessments; receipts; 8004scan integration; pinned-block PancakeSwap evidence; separate RangePilotWatch cross-check; truthful unavailable states.

**Next:** broader BSC indexing, evidence-history views, standardized receipts, and verification APIs.

**Later:** marketplace and compatible activation handoffs, enterprise/API access, and monitoring.

## License and acknowledgements

Licensed under the [MIT License](LICENSE).

BLOCview builds on BNB Smart Chain, ERC-8004, 8004scan, and PancakeSwap V3 evidence sources. Use does not imply endorsement or partnership.
