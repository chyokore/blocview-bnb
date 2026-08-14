import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function Loading() {
  return <main><Header /><div className="live-shell"><header className="live-heading"><span className="eyebrow">8004scan discovery</span><h1>Loading live BNB agents…</h1><p>Requesting verified ERC-8004 identity data from the server.</p></header><div className="loading-grid" role="status" aria-label="Loading live agents">{[1, 2, 3, 4].map((item) => <div className="agent-card loading-card" key={item} />)}</div></div><Footer /></main>;
}
