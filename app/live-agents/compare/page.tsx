"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyLiveComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = [searchParams.get("left"), searchParams.get("right")].map((key) => key?.match(/^56:(\d+)$/)?.[1]).filter(Boolean).join(",");
  const target = ids ? `/compare?agents=${ids}` : "/compare";
  useEffect(() => { router.replace(target); }, [router, target]);
  return <main className="live-shell"><div className="empty-state live-state"><h1>Forwarding live comparison…</h1><p>Preserving valid selected live-agent identities in the canonical comparison flow.</p><Link href={target} className="primary-button">Continue to comparison</Link></div></main>;
}
