import { NextResponse } from "next/server";
import { ASSESSMENT_ENDPOINTS, isAssessmentTokenId, validateAssessmentRequest } from "@/lib/range-pilot-assessments";
import { composeGridBandReceipt } from "@/lib/gridband-evidence";
import { readPancakeSwapV3PoolEvidence } from "@/lib/pancakeswap-v3";

const REQUEST_TIMEOUT_MS = 15_000;

export async function POST(request: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const tokenId = Number((await params).tokenId);
  if (!isAssessmentTokenId(tokenId)) return NextResponse.json({ error: "Unknown RangePilotWatch agent." }, { status: 404 });
  const assessmentTokenId = tokenId;
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const validated = validateAssessmentRequest(tokenId, body);
  if (!validated) return NextResponse.json({ error: "The request does not match the documented input for this read only assessment." }, { status: 400 });
  async function requestExternal() {
    return fetch(ASSESSMENT_ENDPOINTS[assessmentTokenId], {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(validated),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  }
  if (tokenId === 321995) {
    const [firstParty, external] = await Promise.all([
      readPancakeSwapV3PoolEvidence(),
      requestExternal().then(async (response) => {
        try { return response.ok ? await response.json() : null; }
        catch { return null; }
      }).catch(() => null),
    ]);
    const receipt = composeGridBandReceipt(validated as { poolId: "WBNB-USDT-500"; boundaries: number[] }, firstParty, external);
    if (!receipt) {
      const failure = firstParty.status === "mismatch" ? "verification-failed" : "evidence-unavailable";
      return NextResponse.json({ mode: "first-party-read-only-assessment", status: failure, firstParty }, { status: firstParty.status === "unavailable" ? 503 : 502 });
    }
    return NextResponse.json({ mode: "first-party-read-only-assessment", result: receipt });
  }
  try {
    const response = await requestExternal();
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
