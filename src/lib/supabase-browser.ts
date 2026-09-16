"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client, used by the login page to kick off Google /
// Apple / email OAuth redirects. Only instantiated when Supabase env vars
// are present — callers check isSupabaseConfigured() (see src/lib/auth.ts
// logic, mirrored client-side below) before rendering the real login
// buttons; otherwise the UI shows the one-click demo login instead.

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}

export function isSupabaseConfiguredClient(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
