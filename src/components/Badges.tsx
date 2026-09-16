import { cn } from "@/lib/utils";
import type { ProposalCategory, ProposalStatus, ProposalUrgency } from "@/types";
import { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from "@/types";

const CATEGORY_LABELS = Object.fromEntries(PROPOSAL_CATEGORIES.map((c) => [c.value, c.label]));
const STATUS_LABELS = Object.fromEntries(PROPOSAL_STATUSES.map((s) => [s.value, s.label]));

const CATEGORY_STYLES: Record<ProposalCategory, string> = {
  roads_transport: "bg-navy-100 text-navy-700",
  sanitation_waste: "bg-lime-100 text-lime-800",
  parks_environment: "bg-green-100 text-green-800",
  public_safety: "bg-red-100 text-red-700",
  housing_urban: "bg-purple-100 text-purple-700",
  utilities: "bg-sky-100 text-sky-700",
  community_culture: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
};

const STATUS_STYLES: Record<ProposalStatus, string> = {
  received: "bg-gray-100 text-gray-700",
  in_review: "bg-ochre-100 text-ochre-800",
  scheduled: "bg-sky-100 text-sky-700",
  in_progress: "bg-navy-100 text-navy-700",
  done: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

const URGENCY_STYLES: Record<ProposalUrgency, string> = {
  low: "bg-gray-50 text-gray-600 border-gray-200",
  medium: "bg-ochre-50 text-ochre-700 border-ochre-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

export function CategoryBadge({ category }: { category: ProposalCategory }) {
  return <Badge className={CATEGORY_STYLES[category]}>{CATEGORY_LABELS[category]}</Badge>;
}

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: ProposalUrgency }) {
  if (urgency === "low") return null;
  return (
    <Badge className={cn("border", URGENCY_STYLES[urgency])}>
      {urgency === "high" ? "⚠ High urgency" : "Medium urgency"}
    </Badge>
  );
}
