"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="live-shell"><div className="empty-state live-state"><h1>Live discovery could not load</h1><p>An unexpected application error occurred. No demo records were substituted.</p><button className="primary-button" onClick={reset}>Try again</button></div></main>;
}
