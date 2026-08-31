import { NextResponse } from "next/server";
import { ASSESSMENT_ENDPOINTS, isAssessmentTokenId, validateAssessmentRequest } from "@/lib/range-pilot-assessments";

const REQUEST_TIMEOUT_MS = 15_000;

export async function POST(request: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const tokenId = Number((await params).tokenId);
  if (!isAssessmentTokenId(tokenId)) return NextResponse.json({ error: "Unknown RangePilotWatch agent." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const validated = validateAssessmentRequest(tokenId, body);
  if (!validated) return NextResponse.json({ error: "The request does not match this agent's documented read-only contract." }, { status: 400 });
  try {
    const response = await fetch(ASSESSMENT_ENDPOINTS[tokenId], {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(validated),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
    let result: unknown;
    try { result = await response.json(); }
    catch { return NextResponse.json({ error: "The assessment service returned unreadable data." }, { status: 502 }); }
    if (!response.ok) return NextResponse.json({ error: "The assessment service declined the request.", detail: result }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
    return NextResponse.json({ mode: "external-read-only-assessment", result });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
    return NextResponse.json({ error: timedOut ? "The assessment service timed out." : "The assessment service is temporarily unavailable." }, { status: 503 });
  }
}
