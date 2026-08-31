"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";

export function Header() {
  const pathname = usePathname();
  const links = [
    ["Discover", "/"],
    ["Find your fit", "/find-your-fit"],
    ["Live agents", "/live-agents"],
    ["Compare", "/compare"],
    ["How it works", "/#how-it-works"],
  ];
  return (
    <header className="site-header">
      <Link href="/" className="logo" aria-label="BLOCview home">
        <BrandMark />
        <span>BLOC<span>view</span></span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className={(href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0])) ? "active" : ""}>{label}</Link>
        ))}
      </nav>
      <Link href="/live-agents" className="header-cta">Explore live agents <span>→</span></Link>
    </header>
  );
}
