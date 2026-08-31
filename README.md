# BLOCview

BLOCview is a public, evidence-first marketplace for discovering, understanding, comparing, and safely assessing AI agents on BNB Chain. It was built for the BNB Chain Smart Money Era main track.

- Public app: https://blocview-agents.chinyereokore.chatgpt.site
- Live-agent marketplace: https://blocview-agents.chinyereokore.chatgpt.site/live-agents
- Network: BNB Smart Chain mainnet, chain ID 56
- Source: https://github.com/chinyereokore/blocview-agents

## What judges can do

1. Land on BLOCview and open **Live BNB Agents**.
2. Find one real RangePilotWatch agent in each required category.
3. Open a profile to inspect registry identity, public registration evidence, documentation, agent-specific health, evidence gaps, and operating boundaries.
4. Compare two agents using only disclosed evidence, with unavailable reputation, activity, and validation data left unknown.
5. Submit a bounded, one-time assessment request through BLOCview and review the returned offchain evidence receipt.

The assessment handoff does not connect a wallet, request a signature, construct or send a transaction, move funds, execute a strategy, or make an investment recommendation.

## Four registered BSC agents

All four identities are registered in ERC-8004 registry `eip155:56:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`.

| Category | Agent | Token ID | Registry evidence | Public registration JSON |
| --- | --- | ---: | --- | --- |
| Rebalancing | RangeRebalance Lens | 321941 | [BscScan](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=321941) | [JSON](https://range-pilot-watch.onrender.com/erc8004/range-rebalance.json) |
| Grid Trading | GridBand Observer | 321995 | [BscScan](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=321995) | [JSON](https://range-pilot-watch.onrender.com/erc8004/grid-band.json) |
| Yield Optimisation | Venus Yield Lens | 322046 | [BscScan](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=322046) | [JSON](https://range-pilot-watch.onrender.com/erc8004/venus-yield.json) |
| Health Factor Monitoring | Venus Borrow Buffer Watch | 322090 | [BscScan](https://bscscan.com/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=322090) | [JSON](https://range-pilot-watch.onrender.com/erc8004/venus-borrow-buffer.json) |

### 8004scan status

These identities are **8004scan: indexing pending**. BLOCview does not claim that 8004scan has indexed, rated, validated, or operationally verified them. Until indexing completes, the BSC registry identity and public registration JSON are the evidence sources. Existing records returned by 8004scan remain available separately and are not overwritten.

## Safe assessment boundary

Each profile links to real documentation and its agent-specific health endpoint. Its assessment form accepts only the documented request shape for that registered agent and forwards it to a fixed, first-party RangePilotWatch HTTPS endpoint:

- RangeRebalance Lens: one non-zero ERC-8004 token ID.
- GridBand Observer: a documented pool ID and strictly increasing, tick-aligned boundaries.
- Venus Yield Lens: the documented stablecoin asset group and an optional subset of supported Venus markets.
- Venus Borrow Buffer Watch: one public BSC address and an optional warning-ratio threshold.

The server rejects unknown fields and does not accept caller-controlled URLs, RPC endpoints, chains, or contracts. The response is displayed as a read-only offchain receipt. It is not continuous monitoring, a safety proof, or investment advice.

### First-party PancakeSwap V3 evidence

For GridBand Observer, BLOCview now performs its own server-side, read-only verification of the single allowlisted BSC mainnet PancakeSwap V3 WBNB/USDT 0.05% pool. At one pinned BNB Chain block it reads the pool bytecode and block timestamp plus `factory()`, `token0()`, `token1()`, `fee()`, `tickSpacing()`, `slot0()`, and `liquidity()`.

The returned identity fields are compared with BLOCview's internal allowlist before the observation can be labelled verified. A mismatch, malformed response, missing contract, or unavailable critical getter produces an explicit failure rather than normal evidence or demo substitution. Integer pool state is retained as exact decimal strings where JavaScript numbers would be unsafe.

GridBand compares the verified current pool tick with caller-supplied grid boundaries. It does not inspect an LP NFT, infer historical crossings, recommend trades or ranges, or modify liquidity. RangePilotWatch remains a separately timed secondary cross-check. RangeRebalance Lens is the distinct LP-position pathway and remains externally implemented in this milestone.

## Evidence and comparison model

BLOCview preserves source, network, registry, registration-document, and retrieval context. Comparison explains why records differ using only available evidence. Missing reputation, activity, validation, permissions, or operational-verification evidence is shown as unavailable rather than inferred, scored as zero, or borrowed from demo profiles.

Demo strategies and real live agents remain separate. Demo metrics, performance, capital values, fees, status, and activity are illustrative and labelled at the point of use. Live RangePilotWatch profiles do not inherit those fields.

## Architecture

- `app/live-agents/` — live discovery and evidence-first profiles.
- `app/api/range-pilot-watch/agents/[tokenId]/assess/` — allowlisted POST-only assessment proxy.
- `components/ReadOnlyAssessment.tsx` — bounded per-agent assessment forms and receipts.
- `lib/range-pilot-watch-agents.ts` — typed source of truth for the four registered identities.
- `lib/range-pilot-assessments.ts` — fixed endpoints and strict request validation.
- `lib/pancakeswap-v3.ts` — server-only pinned-block reader and allowlist verification for the fixed PancakeSwap V3 pool.
- `lib/gridband-evidence.ts` — first-party GridBand placement receipt and deterministic external cross-check.
- `lib/8004scan.ts` — server-only adapter that preserves existing indexed records.
- `data/agents.ts` — separate illustrative demo records.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Optional server-only integrations use `SCAN8004_API_KEY` and `OPENAI_API_KEY`. Do not expose their values to browser code or commit local environment files. The four pending-index RangePilotWatch identities and their public evidence do not depend on those credentials.

Verification:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
git diff --check
```

## 90-second judge flow

1. Open the public app and select **Live BNB Agents**.
2. Point out the four equal-depth category cards and the shared BSC ERC-8004 registry.
3. Open RangeRebalance Lens; show its token ID, registration JSON, documentation, agent-specific health link, and **8004scan: indexing pending** disclosure.
4. Open Compare and contrast it with another category, highlighting explicit unknown reputation, activity, and validation evidence.
5. Return to a profile, run the bounded read-only assessment, and show the offchain receipt plus the no-wallet/no-signature/no-transaction boundary.
6. Close on the remaining three categories to demonstrate identical evidence and assessment depth.

## Current limitations

8004scan indexing for these four identities is pending. BLOCview does not independently audit their registration claims, code, activity, validation, performance, permissions, or safety. External health and assessment availability depends on the public RangePilotWatch service. There is no wallet connection, signing, transaction construction, payment, execution, or movement of funds in this milestone.
