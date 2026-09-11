import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { upvoteProposal } from "@/lib/repo";
import { checkRateLimit, UPVOTE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to upvote." }, { status: 401 });
  }

  const rl = checkRateLimit(`upvote:${user.id}`, UPVOTE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Slow down a little and try again shortly." }, { status: 429 });
  }

  const { id } = await params;
  try {
    const { proposal, alreadyUpvoted } = await upvoteProposal(id, user.id);
    return NextResponse.json({ proposal, alreadyUpvoted });
  } catch {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }
}
