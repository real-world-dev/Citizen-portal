// Shared domain types — used by the demo in-memory store, the Drizzle schema
// mapping layer, the API routes, and every UI component. Keeping one set of
// types end-to-end (DB → API → UI) is the whole point of a TS-only stack.

export type ProposalCategory =
  | "roads_transport"
  | "sanitation_waste"
  | "parks_environment"
  | "public_safety"
  | "housing_urban"
  | "utilities"
  | "community_culture"
  | "other";

export const PROPOSAL_CATEGORIES: { value: ProposalCategory; label: string }[] = [
  { value: "roads_transport", label: "Roads & Transport" },
  { value: "sanitation_waste", label: "Sanitation & Waste" },
  { value: "parks_environment", label: "Parks & Environment" },
  { value: "public_safety", label: "Public Safety" },
  { value: "housing_urban", label: "Housing & Urban Planning" },
  { value: "utilities", label: "Utilities" },
  { value: "community_culture", label: "Community & Culture" },
  { value: "other", label: "Other" },
];

export type ProposalStatus =
  | "received"
  | "in_review"
  | "scheduled"
  | "in_progress"
  | "done"
  | "declined";

export const PROPOSAL_STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "in_review", label: "In Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
];

export type ProposalUrgency = "low" | "medium" | "high";

export type ProposalSentiment = "positive" | "neutral" | "negative";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  region: string;
  country: string;
  population: number;
  licenseActive: boolean;
  createdAt: string;
}

export interface Proposal {
  id: string;
  orgId: string;
  authorId: string;
  authorName: string;
  // What the citizen originally typed, preserved verbatim for transparency.
  originalText: string;
  // The AI-refined, constructive rewrite the citizen reviewed and accepted.
  refinedTitle: string;
  refinedText: string;
  category: ProposalCategory;
  urgency: ProposalUrgency;
  sentiment: ProposalSentiment;
  status: ProposalStatus;
  upvotes: number;
  duplicateOfId: string | null;
  locationLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  provider: "google" | "apple" | "email" | "demo";
  createdAt: string;
}

export interface AdminUser {
  id: string;
  orgId: string;
  name: string;
  email: string;
}

// Shape returned by the AI refine pipeline (and its heuristic fallback).
export interface RefinementResult {
  refinedTitle: string;
  refinedText: string;
  category: ProposalCategory;
  urgency: ProposalUrgency;
  sentiment: ProposalSentiment;
  flaggedForModeration: boolean;
  moderationReason: string | null;
}

export interface AdminStats {
  total: number;
  byCategory: Record<ProposalCategory, number>;
  byStatus: Record<ProposalStatus, number>;
  byUrgency: Record<ProposalUrgency, number>;
  trend: { date: string; count: number }[];
  topProposals: Proposal[];
}
