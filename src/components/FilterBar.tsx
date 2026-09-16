"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { Organization } from "@/types";
import { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from "@/types";

export function FilterBar({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/?${params.toString()}`));
  }

  return (
    <div className="stamp-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
      <form
        className="flex-1 flex"
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q);
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search requests…"
          className="field"
          aria-label="Search requests"
        />
      </form>

      <select
        className="field md:w-48"
        value={searchParams.get("org") ?? "all"}
        onChange={(e) => setParam("org", e.target.value === "all" ? "" : e.target.value)}
        aria-label="Filter by town"
      >
        <option value="all">All towns</option>
        {organizations.map((o) => (
          <option key={o.id} value={o.slug}>
            {o.name}
          </option>
        ))}
      </select>

      <select
        className="field md:w-52"
        value={searchParams.get("category") ?? ""}
        onChange={(e) => setParam("category", e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {PROPOSAL_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        className="field md:w-44"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">Any status</option>
        {PROPOSAL_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        className="field md:w-40"
        value={searchParams.get("sort") ?? "recent"}
        onChange={(e) => setParam("sort", e.target.value)}
        aria-label="Sort order"
      >
        <option value="recent">Most recent</option>
        <option value="top">Most upvoted</option>
      </select>

      {isPending && <span className="text-xs text-navy-400 shrink-0">Updating…</span>}
    </div>
  );
}
