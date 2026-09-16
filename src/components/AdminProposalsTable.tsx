"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Proposal, ProposalCategory, ProposalStatus } from "@/types";
import { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from "@/types";
import { CategoryBadge } from "./Badges";
import { formatRelativeDate } from "@/lib/utils";

export function AdminProposalsTable({ initialProposals }: { initialProposals: Proposal[] }) {
  const [proposals, setProposals] = useState(initialProposals);
  const [category, setCategory] = useState<ProposalCategory | "">("");
  const [status, setStatus] = useState<ProposalStatus | "">("");
  const [q, setQ] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      if (q) {
        const query = q.toLowerCase();
        if (
          !p.refinedTitle.toLowerCase().includes(query) &&
          !p.refinedText.toLowerCase().includes(query) &&
          !p.authorName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [proposals, category, status, q]);

  async function handleStatusChange(id: string, newStatus: ProposalStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/proposals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setProposals((prev) => prev.map((p) => (p.id === id ? data.proposal : p)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="stamp-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="field flex-1"
          placeholder="Search requests…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="field sm:w-56"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProposalCategory | "")}
        >
          <option value="">All categories</option>
          {PROPOSAL_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="field sm:w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProposalStatus | "")}
        >
          <option value="">Any status</option>
          {PROPOSAL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-400 border-b border-navy-100">
              <th className="py-2 pr-4">Request</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Votes</th>
              <th className="py-2 pr-4">Submitted</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                <td className="py-3 pr-4 max-w-xs">
                  <Link href={`/proposals/${p.id}`} className="font-medium text-navy-800 hover:underline">
                    {p.refinedTitle}
                  </Link>
                  <p className="text-xs text-navy-400 mt-0.5">by {p.authorName}</p>
                </td>
                <td className="py-3 pr-4">
                  <CategoryBadge category={p.category} />
                </td>
                <td className="py-3 pr-4 font-semibold text-navy-700">{p.upvotes}</td>
                <td className="py-3 pr-4 text-navy-500 whitespace-nowrap">
                  {formatRelativeDate(p.createdAt)}
                </td>
                <td className="py-3 pr-4">
                  <select
                    className="field !py-1.5 !text-xs !w-40"
                    value={p.status}
                    disabled={updatingId === p.id}
                    onChange={(e) => handleStatusChange(p.id, e.target.value as ProposalStatus)}
                  >
                    {PROPOSAL_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-navy-400">
                  No requests match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
