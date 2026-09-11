import { NextResponse, type NextRequest } from "next/server";

// Route protection: /submit requires a citizen session, /admin (except
// /admin/login) requires an admin session. Cookie presence is checked here
// (fast, edge-safe); full validation happens server-side in the pages
// themselves via src/lib/auth.ts.

const DEMO_COOKIE = "cp_demo_user";
const ADMIN_COOKIE = "cp_admin_session";
const SUPABASE_AUTH_COOKIE_PREFIX = "sb-";

function hasAnyCookieStartingWith(req: NextRequest, prefix: string): boolean {
  return req.cookies.getAll().some((c) => c.name.startsWith(prefix) && c.name.endsWith("-auth-token"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/submit")) {
    const hasDemoUser = req.cookies.has(DEMO_COOKIE);
    const hasSupabaseSession = hasAnyCookieStartingWith(req, SUPABASE_AUTH_COOKIE_PREFIX);
    if (!hasDemoUser && !hasSupabaseSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasAdminSession = req.cookies.has(ADMIN_COOKIE);
    if (!hasAdminSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/submit/:path*", "/admin/:path*"],
};
