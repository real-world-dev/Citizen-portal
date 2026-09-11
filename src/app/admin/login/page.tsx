"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Organization } from "@/types";
import { DEFAULT_ORG_SLUG } from "@/lib/seed-data";

export default function AdminLoginPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgSlug, setOrgSlug] = useState(DEFAULT_ORG_SLUG);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => setOrgs(d.organizations ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgSlug, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="stamp-card p-8">
        <h1 className="font-display text-2xl font-bold text-navy-900">Town hall sign-in</h1>
        <p className="mt-1.5 text-sm text-navy-500">
          Access request analytics, categorization, and status tracking for your town.
        </p>

        <div className="mt-4 rounded-lg border border-ochre-200 bg-ochre-50 px-3 py-2 text-xs text-ochre-800">
          Demo password: <code className="font-mono font-semibold">townhall-demo</code> (set{" "}
          <code className="font-mono">ADMIN_DEMO_PASSWORD</code> to change it — see README).
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="org">
              Town
            </label>
            <select
              id="org"
              className="field"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
            >
              {(orgs.length ? orgs : [{ slug: "elda", name: "Elda" } as Organization]).map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
