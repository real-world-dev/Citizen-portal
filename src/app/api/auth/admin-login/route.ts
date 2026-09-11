import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIES } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/repo";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// MVP admin auth: one shared password per deployment, gated to a chosen
// town. This is intentionally the simplest thing that could work for a
// single-tenant demo; the README documents per-town admin accounts
// (Supabase auth + an `admins` table scoped by org_id via RLS) as the
// immediate next step before onboarding a second paying town.
const schema = z.object({ orgSlug: z.string().min(1), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const expected = process.env.ADMIN_DEMO_PASSWORD || "townhall-demo";
  if (parsed.data.password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const org = await getOrganizationBySlug(parsed.data.orgSlug);
  if (!org) return NextResponse.json({ error: "Unknown town" }, { status: 404 });
  if (!org.licenseActive) {
    return NextResponse.json(
      { error: "This town's license is inactive. Contact sales to reactivate access." },
      { status: 403 }
    );
  }

  const session = { orgId: org.id, name: `${org.name} Town Hall` };
  const res = NextResponse.json({ session });
  res.cookies.set(AUTH_COOKIES.ADMIN_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
