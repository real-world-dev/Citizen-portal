import Link from "next/link";
import type { Proposal } from "@/types";
import { CategoryBadge, StatusBadge, UrgencyBadge } from "./Badges";
import { formatRelativeDate } from "@/lib/utils";

export function ProposalCard({
  proposal,
  townName,
}: {
  proposal: Proposal;
  townName?: string;
}) {
  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="stamp-card block p-5 hover:shadow-md hover:border-ochre-300 transition group"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-semibold text-lg text-navy-800 group-hover:text-navy-900 leading-snug">
          {proposal.refinedTitle}
        </h3>
        <div className="flex flex-col items-center shrink-0 text-navy-600">
          <span className="text-lg font-bold leading-none">{proposal.upvotes}</span>
          <span className="text-[10px] uppercase tracking-wide text-navy-400">votes</span>
        </div>
      </div>

      <p className="mt-2 text-sm text-navy-600 line-clamp-2">{proposal.refinedText}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CategoryBadge category={proposal.category} />
        <StatusBadge status={proposal.status} />
        <UrgencyBadge urgency={proposal.urgency} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-navy-400">
        <span>
          {townName ? `${townName} · ` : ""}
          {proposal.locationLabel ?? "Location not specified"}
        </span>
        <span>{formatRelativeDate(proposal.createdAt)}</span>
      </div>
    </Link>
  );
}
