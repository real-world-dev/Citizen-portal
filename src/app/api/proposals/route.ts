import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  createProposal,
  findLikelyDuplicate,
  getOrganizationBySlug,
  listProposals,
} from "@/lib/repo";
import { refineProposal } from "@/lib/ai/refine";
import {
  checkRateLimit,
  getClientIp,
  IP_LIMIT,
  SUBMISSION_LIMIT,
} from "@/lib/rate-limit";
import { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgSlug = searchParams.get("org") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") === "top" ? "top" : "recent";

  let orgId: string | undefined;
  if (orgSlug && orgSlug !== "all") {
    const org = await getOrganizationBySlug(orgSlug);
    if (!org) return NextResponse.json({ error: "Unknown town" }, { status: 404 });
    orgId = org.id;
  }

  const categoryValues = PROPOSAL_CATEGORIES.map((c) => c.value) as string[];
  const statusValues = PROPOSAL_STATUSES.map((s) => s.value) as string[];

  const results = await listProposals({
    orgId,
    category: category && categoryValues.includes(category) ? (category as any) : undefined,
    status: status && statusValues.includes(status) ? (status as any) : undefined,
    search,
    sort,
  });

  return NextResponse.json({ proposals: results });
}

const submitSchema = z.object({
  orgSlug: z.string().min(1),
  text: z.string().min(10, "Please describe your request in a bit more detail.").max(2000),
  locationLabel: z.string().max(200).optional().nullable(),
  // The citizen previewed the AI refinement and accepted (or edited) it —
  // both fields are re-sent so we never silently swap in something the
  // citizen never saw, per the "don't silently change their words" rule.
  acceptedRefinedTitle: z.string().min(1).max(100),
  acceptedRefinedText: z.string().min(1).max(1000),
  category: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to submit a request." }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const ipCheck = checkRateLimit(`ip:${ip}`, IP_LIMIT);
  if (!ipCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests from this network. Please try again later." },
      { status: 429 }
    );
  }
  const userCheck = checkRateLimit(`submit:${user.id}`, SUBMISSION_LIMIT);
  if (!userCheck.allowed) {
    return NextResponse.json(
      { error: "You've reached today's limit of 5 requests. Please try again tomorrow." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const org = await getOrganizationBySlug(data.orgSlug);
  if (!org) return NextResponse.json({ error: "Unknown town" }, { status: 404 });

  // Re-run moderation server-side on the ORIGINAL text — never trust a
  // client-supplied "this passed moderation" flag.
  const check = await refineProposal(data.text);
  if (check.flaggedForModeration) {
    return NextResponse.json(
      {
        error:
          check.moderationReason ??
          "This request couldn't be published as written. Please rephrase and try again.",
      },
      { status: 422 }
    );
  }

  const categoryValues = PROPOSAL_CATEGORIES.map((c) => c.value) as string[];
  const category = categoryValues.includes(data.category) ? (data.category as any) : check.category;

  const duplicate = await findLikelyDuplicate(org.id, category, data.acceptedRefinedText);

  const proposal = await createProposal({
    orgId: org.id,
    authorId: user.id,
    authorName: user.name,
    originalText: data.text,
    refinedTitle: data.acceptedRefinedTitle,
    refinedText: data.acceptedRefinedText,
    category,
    urgency: data.urgency,
    sentiment: data.sentiment,
    locationLabel: data.locationLabel || null,
    duplicateOfId: duplicate?.id ?? null,
  });

  return NextResponse.json({ proposal, duplicateOf: duplicate }, { status: 201 });
}
