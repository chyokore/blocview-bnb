import { composeFlagshipProof } from "@/lib/flagship-proof";
import { fetchRangePilotWatchProof } from "@/lib/range-pilot-watch";

export async function POST() {
  const result = await fetchRangePilotWatchProof();
  const proof = composeFlagshipProof(result);
  const status = result.status === "timeout" ? 504 : result.status === "http-error" ? 502 : 200;
  return Response.json(proof, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
