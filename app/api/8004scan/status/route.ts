import { getScanAvailability } from "@/lib/8004scan";

export async function GET() {
  const status = await getScanAvailability();
  return Response.json({ source: "8004scan", status }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=240" } });
}
