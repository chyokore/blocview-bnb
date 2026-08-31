# BLOCview

BLOCview helps people discover, understand, compare, and assess AI agents on BNB Chain using evidence they can inspect. It was built for the BNB Chain Smart Money Era main track.

- Public app: https://blocview-agents.chinyereokore.chatgpt.site
- Live agent marketplace: https://blocview-agents.chinyereokore.chatgpt.site/live-agents
- Network: BNB Smart Chain mainnet, chain ID 56
- Source: https://github.com/chinyereokore/blocview-agents

## What judges can do

1. Land on BLOCview and open **Live BNB Agents**.
2. Find one real RangePilotWatch agent in each required category.
3. Open a profile to inspect registry identity, public registration evidence, documentation, agent health, evidence gaps, and operating boundaries.
4. Select two to four live agents and compare capability, evidence, freshness, provenance, safety boundaries, and limitations without mixing in demo records.
5. Run a bounded assessment through BLOCview and review the evidence it returns.

The assessment does not connect a wallet, request a signature, construct or send a transaction, move funds, execute a strategy, or make an investment recommendation.

BLOCview provides an evidence checkpoint before activation. Its assessment flows are bounded and read only. They do not move funds or submit transactions. A completed receipt gives the user evidence from one moment in time to review before opening the agent's registration, documentation, or health source. BLOCview provides no execution action.

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

Each profile links to real documentation and the health endpoint for that agent. Its assessment form accepts only the documented request shape and forwards it to a fixed RangePilotWatch HTTPS endpoint:

- RangeRebalance Lens: one nonzero ERC-8004 token ID.
- GridBand Observer: a documented pool ID and strictly increasing boundaries aligned to tick spacing.
- Venus Yield Lens: the documented stablecoin asset group and an optional subset of supported Venus markets.
- Venus Borrow Buffer Watch: one public BSC address and an optional warning ratio.

The server rejects unknown fields and does not accept a URL, RPC endpoint, chain, or contract supplied by the caller. BLOCview displays the response as an offchain evidence receipt. It is not continuous monitoring, a safety proof, or investment advice.

### PancakeSwap V3 evidence from BLOCview

For GridBand Observer, BLOCview verifies the approved BSC mainnet PancakeSwap V3 WBNB/USDT 0.05% pool directly from its server without submitting transactions. At one pinned BNB Chain block, it reads the pool bytecode and block timestamp plus `factory()`, `token0()`, `token1()`, `fee()`, `tickSpacing()`, `slot0()`, and `liquidity()`.

BLOCview compares the returned identity fields with its internal allowlist before labelling the observation verified. A mismatch, malformed response, missing contract, or unavailable critical getter produces a clear failure instead of normal evidence or demo substitution. Integer pool state remains in exact decimal strings where JavaScript numbers would be unsafe.

GridBand compares the verified current pool tick with grid boundaries supplied by the caller. It does not inspect an LP NFT, infer historical crossings, recommend trades or ranges, or modify liquidity. RangePilotWatch remains a separate cross check captured at a different time. RangeRebalance Lens is the separate LP position pathway and remains externally implemented in this milestone.

## Evidence and comparison model

BLOCview preserves the source, network, registry, registration document, and retrieval context. Its shareable comparison explains why live records differ using only the evidence available. It starts with the task and observed state instead of technical identity fields. Missing reputation, activity, validation, permission, or operation evidence is shown as unavailable. BLOCview does not infer it, score it as zero, or borrow it from demo profiles.

Evidence Coverage counts objective signals such as registry identity, documentation, a health endpoint, a bounded assessment, evidence from BNB Chain, provenance from a pinned block, an external cross check, and indexed reputation. **It is not a rating of trust, security, profitability, quality, or suitability.** A signal counts only when the corresponding evidence exists. Unavailable evidence remains visible separately.

Demo strategies and real live agents remain separate. Demo metrics, performance, capital values, fees, status, and activity are illustrative and labelled at the point of use. Live RangePilotWatch profiles do not inherit those fields.

## Architecture

- `app/live-agents/`: live discovery and profiles built around evidence.
- `app/api/range-pilot-watch/agents/[tokenId]/assess/`: allowlisted proxy that accepts POST requests only.
- `components/ReadOnlyAssessment.tsx`: bounded assessment forms and receipts for each agent.
- `lib/range-pilot-watch-agents.ts`: typed source of truth for the four registered identities.
- `lib/range-pilot-assessments.ts`: fixed endpoints and strict request validation.
- `lib/pancakeswap-v3.ts`: `server-only` reader that pins one block and verifies the fixed PancakeSwap V3 pool against an allowlist.
- `lib/gridband-evidence.ts`: GridBand placement receipt and deterministic RangePilotWatch cross check.
- `lib/8004scan.ts`: `server-only` adapter that preserves existing indexed records.
- `data/agents.ts`: separate illustrative demo records.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Optional `server-only` integrations use `SCAN8004_API_KEY` and `OPENAI_API_KEY`. Do not expose their values to browser code or commit local environment files. The four RangePilotWatch identities awaiting indexing and their public evidence do not depend on those credentials.

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
2. Point out the four category cards with equal detail and the shared BSC ERC-8004 registry.
3. Open RangeRebalance Lens. Show its token ID, registration JSON, documentation, health link, and **8004scan: indexing pending** disclosure.
4. Open Compare and contrast it with another category, highlighting explicit unknown reputation, activity, and validation evidence.
5. Return to a profile, run the bounded read only assessment, and show the offchain receipt. Point out that it requires no wallet, signature, or transaction.
6. Close on the remaining three categories to demonstrate identical evidence and assessment depth.

## Current limitations

8004scan indexing for these four identities is pending. BLOCview does not independently audit their registration claims, code, activity, validation, performance, permissions, or safety. External health and assessment availability depends on the public RangePilotWatch service. There is no wallet connection, signing, transaction construction, payment, execution, or movement of funds in this milestone.
