import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@/types";

// ─────────────────────────────────────────────────────────────────────────
// Dual-mode auth.
//   - No Supabase env vars: a signed-in-looking demo session backed by a
//     simple cookie (see /api/auth/demo-login). No real identity checks —
//     clearly a demo, and documented as such in the README and on the login
//     UI itself.
//   - Supabase env vars set: real Google/Apple/email auth via Supabase,
//     which is also what provides Row-Level Security's auth.uid().
// Admin sessions are a separate, simpler cookie (see /api/auth/admin-login) —
// one shared password per the MVP scope; the README calls out per-town admin
// roles as the next step.
// ─────────────────────────────────────────────────────────────────────────

const DEMO_COOKIE = "cp_demo_user";
const ADMIN_COOKIE = "cp_admin_session";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — safe to ignore because
            // middleware handles session refresh on the request path.
          }
        },
      },
    }
  );
}

export async function getCurrentUser(): Promise<User | null> {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      name:
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Resident",
      email: user.email ?? "",
      provider: (user.app_metadata?.provider as User["provider"]) ?? "email",
      createdAt: user.created_at,
    };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(DEMO_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ orgId: string; name: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { orgId: string; name: string };
  } catch {
    return null;
  }
}

export const AUTH_COOKIES = { DEMO_COOKIE, ADMIN_COOKIE };
