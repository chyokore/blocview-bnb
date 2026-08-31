export type AgentCategory =
  | "LP Rebalancing"
  | "Grid Trading"
  | "Yield Optimisation"
  | "Health-Factor Monitoring";

export type RiskLevel = "Low" | "Medium" | "High";

export type AgentActivity = {
  time: string;
  title: string;
  detail: string;
};

export type Agent = {
  slug: string;
  name: string;
  monogram: string;
  description: string;
  longDescription: string;
  category: AgentCategory;
  risk: RiskLevel;
  status: "Demo preview" | "Demo monitoring";
  return30d: number;
  capital: string;
  capitalLabel: string;
  fee: string;
  protocol: string;
  strategy: string;
  suitability: string;
  activityCount: number;
  controls: string[];
  activity: AgentActivity[];
  accent: string;
};

export const categories: Array<"All agents" | AgentCategory> = [
  "All agents",
  "LP Rebalancing",
  "Grid Trading",
  "Yield Optimisation",
  "Health-Factor Monitoring",
];

export const agents: Agent[] = [
  {
    slug: "range-pilot",
    name: "Range Pilot",
    monogram: "RP",
    description: "Keeps concentrated liquidity within a useful trading range as markets move.",
    longDescription: "Range Pilot watches a PancakeSwap liquidity position and proposes a new price range when the current one becomes inefficient. Think of it as a calm co-pilot for LP management: it monitors continuously, but only acts within the limits you choose.",
    category: "LP Rebalancing",
    risk: "Medium",
    status: "Demo preview",
    return30d: 4.8,
    capital: "$2.41M",
    capitalLabel: "demo TVL",
    fee: "0.40% performance",
    protocol: "PancakeSwap V3",
    strategy: "Adaptive BNB / USDT range",
    suitability: "Active LPs who want fewer manual range checks",
    activityCount: 18,
    controls: ["User-defined price boundary", "Maximum 2 rebalances per day", "Pause when volatility exceeds 8%", "No custody in this demo"],
    activity: [
      { time: "2h ago", title: "Range health checked", detail: "Position remains 84% inside the selected range." },
      { time: "Yesterday", title: "Rebalance simulated", detail: "A tighter upper range improved projected fee efficiency." },
      { time: "3 days ago", title: "Volatility guard triggered", detail: "Action was paused while BNB moved beyond the set limit." },
    ],
    accent: "#f3ba2f",
  },
  {
    slug: "grid-sentinel",
    name: "Grid Sentinel",
    monogram: "GS",
    description: "Places simulated buy and sell levels across a user-defined BNB price range.",
    longDescription: "Grid Sentinel turns a price band into a series of small, rules-based trades. It is designed for sideways markets and makes the trade-off clear: a strong trend can leave part of the position behind.",
    category: "Grid Trading",
    risk: "High",
    status: "Demo preview",
    return30d: 6.2,
    capital: "$860K",
    capitalLabel: "demo capital monitored",
    fee: "0.60% performance",
    protocol: "PancakeSwap",
    strategy: "12-level BNB / USDC grid",
    suitability: "Experienced users expecting range-bound markets",
    activityCount: 42,
    controls: ["Hard upper and lower price limits", "Maximum position size", "Automatic stop outside the grid", "No leverage enabled"],
    activity: [
      { time: "38m ago", title: "Grid level observed", detail: "Price crossed level 7; demo order recorded." },
      { time: "6h ago", title: "Exposure check passed", detail: "Position remains below the selected maximum." },
      { time: "2 days ago", title: "Grid spacing adjusted", detail: "Preview widened spacing after higher volatility." },
    ],
    accent: "#ff8a5b",
  },
  {
    slug: "yield-navigator",
    name: "Yield Navigator",
    monogram: "YN",
    description: "Compares stablecoin lending opportunities and surfaces cleaner risk-adjusted routes.",
    longDescription: "Yield Navigator checks supported lending markets and explains where a stablecoin position could earn yield. It weighs headline rate against utilisation, liquidity, and protocol exposure instead of chasing the highest number.",
    category: "Yield Optimisation",
    risk: "Medium",
    status: "Demo monitoring",
    return30d: 3.6,
    capital: "$4.82M",
    capitalLabel: "demo capital monitored",
    fee: "0.25% annual",
    protocol: "Venus Protocol",
    strategy: "USDT lending allocation",
    suitability: "Stablecoin holders prioritising understandable yield",
    activityCount: 11,
    controls: ["Approved markets only", "Minimum liquidity threshold", "Single-protocol exposure cap", "Rate-change confirmation window"],
    activity: [
      { time: "1h ago", title: "Markets compared", detail: "Three demo lending routes passed liquidity checks." },
      { time: "Yesterday", title: "Rate change detected", detail: "USDT supply APY moved by 0.3 percentage points." },
      { time: "4 days ago", title: "Allocation held", detail: "Alternative yield did not justify switching costs." },
    ],
    accent: "#7dd3fc",
  },
  {
    slug: "health-guard",
    name: "Health Guard",
    monogram: "HG",
    description: "Monitors borrowing positions and warns before the health factor becomes dangerous.",
    longDescription: "Health Guard translates a lending position's health factor into clear, timely alerts. It shows what changed, how close the position is to its chosen safety threshold, and what action a user might review.",
    category: "Health-Factor Monitoring",
    risk: "Low",
    status: "Demo preview",
    return30d: 0,
    capital: "$7.12M",
    capitalLabel: "demo positions watched",
    fee: "$3 / month",
    protocol: "Venus Protocol",
    strategy: "Multi-position safety alerts",
    suitability: "Borrowers who want early, plain-language warnings",
    activityCount: 27,
    controls: ["Custom alert threshold", "Read-only monitoring", "Multi-channel alert preview", "No automatic repayment"],
    activity: [
      { time: "12m ago", title: "Health factor checked", detail: "All demo positions remain above 1.65." },
      { time: "8h ago", title: "Threshold alert previewed", detail: "One position moved within 0.1 of its user-set warning." },
      { time: "Yesterday", title: "Collateral change noted", detail: "BNB collateral value increased 2.1% in the demo feed." },
    ],
    accent: "#86efac",
  },
];

export function getAgent(slug: string) {
  return agents.find((agent) => agent.slug === slug);
}
