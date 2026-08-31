import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function Footer() { return <footer><div className="logo"><BrandMark /><span>BLOC<span>view</span></span></div><p>Evidence before activation.</p><div><Link href="/live-agents">Live agents</Link><Link href="/compare">Compare</Link></div><small>© 2026 BLOCview · Demo strategy information is illustrative. Live Agents registry identity and provenance come from 8004scan when configured; missing evidence is disclosed, not invented. No wallet connection, signing, or transactions.</small></footer>; }
