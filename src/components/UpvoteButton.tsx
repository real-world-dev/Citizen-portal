"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpvoteButton({
  proposalId,
  initialUpvotes,
  isSignedIn,
}: {
  proposalId: string;
  initialUpvotes: number;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpvote() {
    if (!isSignedIn) {
      router.push(`/login?next=/proposals/${proposalId}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/upvote`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setUpvotes(data.proposal.upvotes);
      setVoted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        onClick={handleUpvote}
        disabled={loading || voted}
        className="btn-ochre !px-4 !py-2"
      >
        ▲ {voted ? "Upvoted" : "Upvote"} · {upvotes}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
