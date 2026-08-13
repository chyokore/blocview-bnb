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
```

The key is sent only from the server in the `X-API-Key` header. `.env.local` is Git-ignored and must never be exposed in browser code or committed.

Open the local URL printed in the terminal.

Useful checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## MVP features

- Responsive Discover marketplace with search and category filters
- Typed mock agents across LP rebalancing, grid trading, yield optimisation, and health-factor monitoring
- Dynamic agent detail pages with plain-language descriptions, performance snapshots, controls, protocol context, and recent demo activity
- Clear suitability guidance plus a direct compare action that preselects the current agent
- Two-agent side-by-side comparison with independent selectors and URL-based preselection
- Three-step activation preview: Review → Set preference → Confirm, followed by an explicit simulated-ready state
- Compact profile provenance panels covering demo status, upcoming onchain verification, and illustrative freshness
- Server-only 8004scan identity, capability, and reputation lookup with strict BNB Chain matching and safe demo fallback
- Internal `/api/8004scan/status` and `/api/8004scan/agents/[slug]` routes; browser code never calls 8004scan directly
- Explicit demo-data, risk, no-wallet, no-funds-moved, and non-investment-advice notices
- Keyboard-friendly interactions and mobile layouts

## Architecture

- `app/` — App Router pages and global styles
- `components/` — reusable marketplace, navigation, comparison, and activation UI
- `data/agents.ts` — the typed local data model and current mock agent records

The UI reads from a single `Agent` type, keeping it straightforward to replace local records with indexed onchain data later. The activation experience is intentionally stateful only in the browser and sends no transaction.

## 8004scan verified data

When an exact-name BNB Chain record exists, profiles show its registered identity, supported protocols, aggregate reputation, feedback count, registration time, and verification time. Demo strategy, performance, TVL, returns, fees, and activity remain separate and clearly illustrative. If the API, key, or compatible record is unavailable, the existing demo profile remains intact.

## Later integrations

1. Add BNB Agent Studio deployment and lifecycle metadata.
2. Introduce wallet-aware, permission-scoped activation only after a full transaction review experience exists.
3. Add strategy-specific integrations for Altana, PancakeSwap, and TermiX.
4. Use OpenAI API features for plain-language explanations and contextual comparisons, with citations back to raw data.
5. Add data freshness, provenance, indexing health, and contract verification signals before presenting any metric as live.

## Current limitations

All agents, performance figures, capital values, status indicators, and activity events are local illustrative data. There is no wallet, API, smart contract, payment, or movement of funds in this version. Nothing in the interface is investment advice.
