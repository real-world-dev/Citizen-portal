import { NextResponse } from "next/server";
import { AUTH_COOKIES, isSupabaseConfigured, getSupabaseServerClient } from "@/lib/auth";

export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIES.DEMO_COOKIE);
  return res;
}
