import type { Metadata } from "next";
import "./globals.css";
import "./brief.css";

export const metadata: Metadata = {
  title: { default: "BLOCview — Understand onchain AI agents", template: "%s · BLOCview" },
  description: "Discover, compare, and preview BNB Chain AI agents with clear performance context and risk controls.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "BLOCview — Understand agents. Choose with confidence.",
    description: "Discover and compare BNB Chain AI agents with clear strategy context and risk controls.",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "BLOCview agent marketplace" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
