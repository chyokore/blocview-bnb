# BLOCview

BLOCview is a frontend-first marketplace for discovering, understanding, comparing, and previewing the activation of AI agents on BNB Chain. This MVP was created for the BNB Chain **Build the Era** hackathon.

The product focuses on clarity and trust: complex strategy data is translated into plain language, risk controls are visible before activation, and all illustrative metrics are labelled as demo data.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Create `.env.local` with the server-side 8004scan credential:

```bash
SCAN8004_API_KEY=your_8004scan_api_key
OPENAI_API_KEY=your_openai_api_key
```

The key is sent only from the server in the `X-API-Key` header. `.env.local` is Git-ignored and must never be exposed in browser code or committed.

`OPENAI_API_KEY` is also server-only. The AI Agent Brief endpoint uses the official OpenAI JavaScript SDK and Responses API with `gpt-4o-mini`, a strict JSON schema, a 700-token output cap, no tools or web search, no response persistence in BLOCview, and a 60-second per-agent in-memory cooldown.

Open the local URL printed in the terminal.

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## MVP features

- Responsive Discover marketplace with search and category filters
- Four-step Find Your Fit questionnaire with deterministic, fully explained demo-agent matching
- Typed mock agents across LP rebalancing, grid trading, yield optimisation, and health-factor monitoring
- Dynamic agent detail pages with plain-language descriptions, performance snapshots, controls, protocol context, and recent demo activity
- Clear suitability guidance plus a direct compare action that preselects the current agent
- Two-agent side-by-side comparison with independent selectors and URL-based preselection
- Three-step activation preview: Review → Set preference → Confirm, followed by an explicit simulated-ready state
- Compact profile provenance panels covering demo status, upcoming onchain verification, and illustrative freshness
- Server-only 8004scan identity, capability, and reputation lookup with strict BNB Chain matching and safe demo fallback
- Agent Readiness Passport on live profiles with explicit evidence coverage and provenance
- Internal `/api/8004scan/status` and `/api/8004scan/agents/[slug]` routes; browser code never calls 8004scan directly
- On-demand AI Agent Briefs grounded only in the selected BLOCview profile and available verified 8004scan fields
- Neutral-language and data-basis safeguards that keep demo metrics distinct from verified identity data
- Explicit demo-data, risk, no-wallet, no-funds-moved, and non-investment-advice notices
- Keyboard-friendly interactions and mobile layouts

## Architecture

- `app/` — App Router pages and global styles
- `components/` — reusable marketplace, navigation, comparison, and activation UI
- `data/agents.ts` — the typed local data model and current mock agent records

The UI reads from a single `Agent` type, keeping it straightforward to replace local records with indexed onchain data later. The activation experience is intentionally stateful only in the browser and sends no transaction.

## Find Your Fit

`/find-your-fit` helps a visitor turn four stated preferences—goal, risk comfort, priority, and experience—into an ordered view of the four BLOCview demo strategies. It is a decision aid, not a suitability assessment or financial recommendation.

Matching is deterministic and runs entirely in the browser without OpenAI, API keys, accounts, or hidden model inference. The selected goal/category is the primary signal; fixed, smaller adjustments use the selected risk comfort, priority, experience level, and existing typed demo-agent facts. Every result exposes the choices and product facts used in “Why this matched,” alongside a “What we do not know” evidence panel.

Only BLOCview demo strategies participate in Fit Finder ranking. Verified live 8004scan records remain separate and are not classified or recommended when their returned capabilities do not clearly support a category. Demo performance and activity remain illustrative. Fit results do not account for a visitor's finances, portfolio, liquidity needs, or capacity for loss and do not guarantee outcomes.

## 8004scan verified data

When an exact-name BNB Chain record exists, profiles show its registered identity, supported protocols, aggregate reputation, feedback count, registration time, and verification time. Demo strategy, performance, TVL, returns, fees, and activity remain separate and clearly illustrative. If the API, key, or compatible record is unavailable, the existing demo profile remains intact.

### Demo Strategies vs Live BNB Agents

- **Demo Strategies** are BLOCview-authored illustrative profiles. Their strategy categories, performance, TVL, fees, activity, AI Agent Brief, and activation preview are visibly labelled as demo data.
- **Live BNB Agents** at `/live-agents` are separate ERC-8004 identity records returned by the 8004scan Public API for BNB Chain mainnet (chain ID 56). BLOCview displays only returned identity, description, supported protocol/capability, reputation, feedback-count, registration, and API-verification fields.
- Live agents are never silently classified into BLOCview strategy categories and do not receive demo metrics, AI Agent Briefs, or activation controls. A returned protocol/capability is shown verbatim; the BLOCview classification remains **Unclassified live agent**.
- Requests use `SCAN8004_API_KEY` only in `lib/8004scan.ts`, which is guarded by `server-only`. Browser components receive normalized records and never receive the credential.

The live list uses the documented `GET /api/v1/public/agents` endpoint with `chainId=56`, `isTestnet=false`, `page`, `limit`, `sortBy=created_at`, and `sortOrder=desc`. Pagination is rendered only when the documented `meta.pagination` fields indicate it. Live detail uses `GET /api/v1/public/agents/{chainId}/{tokenId}`. The existing demo verification path also uses documented semantic search, detail, feedback, and chains endpoints.

### Agent Readiness Passport

Every live detail page includes an Agent Readiness Passport covering registry identity, declared capabilities, returned reputation, activity/validation evidence, and permission/operating-control evidence. Each area is labelled **Available**, **Declared only**, or **Not available**, with a compact evidence-coverage count. This count describes field coverage only; it is not a trust score, safety score, rating, ranking, or recommendation.

The passport uses only fields normalized by the existing server-side 8004scan adapter. Capabilities are shown exactly as returned and remain declarations rather than independently tested functionality. Missing reputation values remain missing rather than being converted to zero. Because the current public detail response used by BLOCview does not return independently verifiable activity, validation, wallet-permission, spend-cap, session-expiry, revocation, or payment-term evidence, those areas are explicitly marked unavailable. Live pages never borrow demo performance, strategy, TVL, trade, activation, or AI Agent Brief data.

Provenance includes the returned registration time when available, the API check timestamp, and a direct 8004scan source-record link constructed from the returned BNB Chain token identifier. BLOCview presents registry evidence for research but does not verify performance, guarantee outcomes, or provide financial advice.

## Later integrations

1. Add BNB Agent Studio deployment and lifecycle metadata.
2. Introduce wallet-aware, permission-scoped activation only after a full transaction review experience exists.
3. Add strategy-specific integrations for Altana, PancakeSwap, and TermiX.
4. Use OpenAI API features for plain-language explanations and contextual comparisons, with citations back to raw data.
5. Add data freshness, provenance, indexing health, and contract verification signals before presenting any metric as live.

## Current limitations

Demo agents, performance figures, capital values, status indicators, and activity events are local illustrative data. The separate Live BNB Agents area contains real identity records returned by 8004scan, but BLOCview does not independently audit them. There is no wallet, smart contract execution, payment, or movement of funds in this version. Nothing in the interface is investment advice.
