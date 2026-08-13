# BLOCview

BLOCview is a frontend-first marketplace for discovering, understanding, comparing, and previewing the activation of AI agents on BNB Chain. This MVP was created for the BNB Chain **Build the Era** hackathon.

The product focuses on clarity and trust: complex strategy data is translated into plain language, risk controls are visible before activation, and all illustrative metrics are labelled as demo data.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

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
- Two-agent side-by-side comparison with independent selectors
- Three-step activation preview: review, preference, and confirmation
- Explicit demo-data and non-investment-advice notices
- Keyboard-friendly interactions and mobile layouts

## Architecture

- `app/` — App Router pages and global styles
- `components/` — reusable marketplace, navigation, comparison, and activation UI
- `data/agents.ts` — the typed local data model and current mock agent records

The UI reads from a single `Agent` type, keeping it straightforward to replace local records with indexed onchain data later. The activation experience is intentionally stateful only in the browser and sends no transaction.

## Next integrations

1. Replace demo identity and activity with verified records from 8004scan.
2. Add BNB Agent Studio deployment and lifecycle metadata.
3. Introduce wallet-aware, permission-scoped activation only after a full transaction review experience exists.
4. Add strategy-specific integrations for Altana, PancakeSwap, and TermiX.
5. Use OpenAI API features for plain-language explanations and contextual comparisons, with citations back to raw data.
6. Add data freshness, provenance, indexing health, and contract verification signals before presenting any metric as live.

## Current limitations

All agents, performance figures, capital values, status indicators, and activity events are local illustrative data. There is no wallet, API, smart contract, payment, or movement of funds in this version. Nothing in the interface is investment advice.
