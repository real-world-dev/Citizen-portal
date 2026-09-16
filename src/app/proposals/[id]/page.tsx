import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge, StatusBadge, UrgencyBadge } from "@/components/Badges";
import { UpvoteButton } from "@/components/UpvoteButton";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationById, getProposal } from "@/lib/repo";
import { formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) notFound();

  const [org, user, duplicateOf] = await Promise.all([
    getOrganizationById(proposal.orgId),
    getCurrentUser(),
    proposal.duplicateOfId ? getProposal(proposal.duplicateOfId) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="text-sm text-navy-500 hover:text-navy-700">
        ← Back to all requests
      </Link>

      <article className="stamp-card p-6 sm:p-8 mt-4">
        <div className="flex flex-wrap gap-2">
          <CategoryBadge category={proposal.category} />
          <StatusBadge status={proposal.status} />
          <UrgencyBadge urgency={proposal.urgency} />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-4 leading-tight">
          {proposal.refinedTitle}
        </h1>

        <p className="mt-2 text-sm text-navy-400">
          {org?.name ?? "Unknown town"} · {proposal.locationLabel ?? "Location not specified"} ·
          submitted by {proposal.authorName} · {formatRelativeDate(proposal.createdAt)}
        </p>

        <p className="mt-6 text-navy-800 leading-relaxed">{proposal.refinedText}</p>

        {duplicateOf && (
          <div className="mt-6 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-800">
            This looks similar to an existing request:{" "}
            <Link href={`/proposals/${duplicateOf.id}`} className="underline font-semibold">
              {duplicateOf.refinedTitle}
            </Link>
            . Upvoting that one instead helps your town hall see the combined demand.
          </div>
        )}

        <details className="mt-6 text-sm text-navy-500">
          <summary className="cursor-pointer font-medium text-navy-600">
            View original submission
          </summary>
          <p className="mt-2 italic border-l-2 border-navy-200 pl-3">{proposal.originalText}</p>
        </details>

        <div className="mt-8 pt-6 border-t border-navy-100">
          <UpvoteButton
            proposalId={proposal.id}
            initialUpvotes={proposal.upvotes}
            isSignedIn={Boolean(user)}
          />
        </div>
      </article>
    </div>
  );
}
