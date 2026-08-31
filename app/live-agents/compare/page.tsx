import { redirect } from "next/navigation";

export default async function LegacyLiveComparePage({ searchParams }: { searchParams: Promise<{ left?: string; right?: string }> }) {
  const query = await searchParams;
  const ids = [query.left, query.right].map((key) => key?.split(":")[1]).filter(Boolean).join(",");
  redirect(ids ? `/compare?agents=${ids}` : "/compare");
}
