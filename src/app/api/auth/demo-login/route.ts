import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIES } from "@/lib/auth";
import { newId } from "@/lib/utils";
import type { User } from "@/types";

// One-click demo login, used only when Supabase isn't configured. Clearly
// labeled as a demo on the UI — this issues a cookie-backed session with no
// real identity verification, which is fine for a local/demo deployment but
// must not be relied on as real auth. See README "Auth modes".
const schema = z.object({ name: z.string().min(1).max(60).optional() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const name = parsed.success && parsed.data.name ? parsed.data.name : "Demo Resident";

  const user: User = {
    id: newId("user"),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@demo.local`,
    provider: "demo",
    createdAt: new Date().toISOString(),
  };

  const res = NextResponse.json({ user });
  res.cookies.set(AUTH_COOKIES.DEMO_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
