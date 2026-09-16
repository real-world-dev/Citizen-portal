import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/auth";

// Supabase OAuth callback (Google/Apple) — only reached when Supabase is
// configured; the login page falls back to demo login otherwise.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
