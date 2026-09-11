import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { getProposal, updateProposalStatus } from "@/lib/repo";
import { PROPOSAL_STATUSES } from "@/types";

const schema = z.object({
  status: z.enum(PROPOSAL_STATUSES.map((s) => s.value) as [string, ...string[]]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Admin session required" }, { status: 401 });

  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (proposal.orgId !== admin.orgId) {
    return NextResponse.json({ error: "This proposal belongs to a different town." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await updateProposalStatus(id, parsed.data.status as any);
  return NextResponse.json({ proposal: updated });
}
