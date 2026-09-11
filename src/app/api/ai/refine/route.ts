import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { refineProposal } from "@/lib/ai/refine";
import { AI_PREVIEW_LIMIT, checkRateLimit, getClientIp, IP_LIMIT } from "@/lib/rate-limit";

const schema = z.object({ text: z.string().min(10).max(2000) });

// Step 1 of the two-step submit flow: the citizen types their raw text, we
// return an AI-refined preview they can review, edit, or accept — nothing
// is saved to the database yet (that happens on POST /api/proposals).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const ipCheck = checkRateLimit(`ip-ai:${ip}`, IP_LIMIT);
  if (!ipCheck.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }
  const userCheck = checkRateLimit(`ai:${user.id}`, AI_PREVIEW_LIMIT);
  if (!userCheck.allowed) {
    return NextResponse.json(
      { error: "You've used up this hour's AI preview limit. Please try again soon." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please write a bit more detail first." }, { status: 400 });
  }

  const result = await refineProposal(parsed.data.text);
  return NextResponse.json({ result });
}
