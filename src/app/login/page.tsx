"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfiguredClient } from "@/lib/supabase-browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseReady = isSupabaseConfiguredClient();

  async function handleOAuth(provider: "google" | "apple") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) setError(err.message);
    setLoading(false);
  }

  async function handleDemoLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="stamp-card p-8">
        <h1 className="font-display text-2xl font-bold text-navy-900">Sign in to continue</h1>
        <p className="mt-1.5 text-sm text-navy-500">
          You need an account to submit or upvote requests. Browsing is always open to everyone.
        </p>

        {supabaseReady ? (
          <div className="mt-6 space-y-3">
            <button onClick={() => handleOAuth("google")} disabled={loading} className="btn-secondary w-full">
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("apple")} disabled={loading} className="btn-secondary w-full">
              Continue with Apple
            </button>
            <p className="text-center text-xs text-navy-400">or use email from the account menu</p>
          </div>
        ) : (
          <form onSubmit={handleDemoLogin} className="mt-6 space-y-4">
            <div className="rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-2 text-xs text-ochre-800">
              Demo mode: no real Google/Apple sign-in is configured for this deployment. Pick any
              display name and continue — see the README to enable real social login.
            </div>
            <div>
              <label className="label" htmlFor="name">
                Your name
              </label>
              <input
                id="name"
                className="field"
                placeholder="Jane Resident"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-ochre w-full">
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
