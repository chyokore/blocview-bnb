# BLOCview product specification

## Product purpose

BLOCview is a trusted, human-friendly marketplace for discovering, comparing, and activating live BNB Chain AI agents. Its primary job is to make complex onchain agent data understandable enough for a user to make a confident, informed choice.

## Experience requirements

- Maintain a premium dark DeFi interface with black and charcoal surfaces and restrained BNB yellow accents.
- Preserve the core paths: Discover, Agent Details, Compare, and Activation.
- Support LP Rebalancing, Grid Trading, Yield Optimisation, and Health-Factor Monitoring.
- Explain strategy purpose, risk, controls, supported protocol, fees, activity, and suitability in plain language.
- Keep layouts responsive and interaction targets accessible on mobile and desktop.

## Hard constraints

- Never describe profits as guaranteed or an agent as the “best performing.”
- Never present mock activity as live onchain activity. Label mock or stale data at the point of use.
- Do not add secrets, API keys, or private configuration to the repository.
- Do not introduce wallet, contract, payment, or live execution behavior without an explicit product milestone and a safe transaction-review design.
- Activation must continue to state that it is not investment advice and users remain responsible for their decisions.
- Prefer Lucide icons when the dependency is available; keep icon treatment consistent.

## Development priorities

1. Clarity, trust, and usability.
2. Accurate provenance and freshness of agent data.
3. Complete marketplace journeys before new integrations.
4. Typed, reusable components and a single source of truth for agent records.
5. Proportional automated checks and responsive verification for every change.

## Integration direction

The data boundary should remain easy to adapt to 8004scan, BNB Agent Studio, Altana, PancakeSwap, TermiX, and OpenAI API capabilities. External data must retain source, timestamp, network, and verification context. AI-generated explanations should be grounded in, and link back to, that source data.
