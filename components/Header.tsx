"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const links = [
    ["Discover", "/"],
    ["Compare", "/compare"],
    ["How it works", "/#how-it-works"],
  ];
  return (
    <header className="site-header">
      <Link href="/" className="logo" aria-label="BLOCview home">
        <span className="logo-mark"><i /><i /><i /></span>
        <span>BLOC<span>view</span></span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className={(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "active" : ""}>{label}</Link>
        ))}
      </nav>
      <Link href="/compare" className="header-cta">Compare agents <span>↗</span></Link>
    </header>
  );
}
