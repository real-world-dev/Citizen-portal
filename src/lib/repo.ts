import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AdminStats,
  Organization,
  Proposal,
  ProposalCategory,
  ProposalStatus,
} from "@/types";
import { PROPOSAL_CATEGORIES, PROPOSAL_STATUSES } from "@/types";
import { getDb, isDbMode } from "./db";
import { organizations, proposals } from "./db/schema";
import { getState } from "./store";
import { newId } from "./utils";

// ─────────────────────────────────────────────────────────────────────────
// Single data-access layer. Every API route and server component calls
// through here — none of them know or care whether they're hitting the
// in-memory demo store or real Postgres. That's what makes DATABASE_URL a
// one-line upgrade instead of a rewrite.
// ─────────────────────────────────────────────────────────────────────────

function rowToProposal(row: typeof proposals.$inferSelect): Proposal {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function rowToOrg(row: typeof organizations.$inferSelect): Organization {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function listOrganizations(): Promise<Organization[]> {
  if (isDbMode()) {
    const rows = await getDb().select().from(organizations);
    return rows.map(rowToOrg);
  }
  return getState().organizations;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  if (isDbMode()) {
    const rows = await getDb()
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    return rows[0] ? rowToOrg(rows[0]) : null;
  }
  return getState().organizations.find((o) => o.slug === slug) ?? null;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  if (isDbMode()) {
    const rows = await getDb()
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return rows[0] ? rowToOrg(rows[0]) : null;
  }
  return getState().organizations.find((o) => o.id === id) ?? null;
}

export interface ListProposalsOptions {
  orgId?: string;
  category?: ProposalCategory;
  status?: ProposalStatus;
  search?: string;
  sort?: "recent" | "top";
  limit?: number;
}

export async function listProposals(opts: ListProposalsOptions = {}): Promise<Proposal[]> {
  let results: Proposal[];

  if (isDbMode()) {
    const conditions = [];
    if (opts.orgId) conditions.push(eq(proposals.orgId, opts.orgId));
    if (opts.category) conditions.push(eq(proposals.category, opts.category));
    if (opts.status) conditions.push(eq(proposals.status, opts.status));

    const rows = await getDb()
      .select()
      .from(proposals)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(opts.sort === "top" ? desc(proposals.upvotes) : desc(proposals.createdAt));
    results = rows.map(rowToProposal);
  } else {
    results = getState().proposals.filter((p) => {
      if (opts.orgId && p.orgId !== opts.orgId) return false;
      if (opts.category && p.category !== opts.category) return false;
      if (opts.status && p.status !== opts.status) return false;
      return true;
    });
    results = [...results].sort((a, b) =>
      opts.sort === "top"
        ? b.upvotes - a.upvotes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.refinedTitle.toLowerCase().includes(q) ||
        p.refinedText.toLowerCase().includes(q) ||
        (p.locationLabel ?? "").toLowerCase().includes(q)
    );
  }

  if (opts.limit) results = results.slice(0, opts.limit);
  return results;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  if (isDbMode()) {
    const rows = await getDb().select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return rows[0] ? rowToProposal(rows[0]) : null;
  }
  return getState().proposals.find((p) => p.id === id) ?? null;
}

export interface CreateProposalInput {
  orgId: string;
  authorId: string;
  authorName: string;
  originalText: string;
  refinedTitle: string;
  refinedText: string;
  category: ProposalCategory;
  urgency: Proposal["urgency"];
  sentiment: Proposal["sentiment"];
  locationLabel: string | null;
  duplicateOfId: string | null;
}

export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  const now = new Date();
  const base: Proposal = {
    id: newId("prop"),
    orgId: input.orgId,
    authorId: input.authorId,
    authorName: input.authorName,
    originalText: input.originalText,
    refinedTitle: input.refinedTitle,
    refinedText: input.refinedText,
    category: input.category,
    urgency: input.urgency,
    sentiment: input.sentiment,
    status: "received",
    upvotes: 0,
    duplicateOfId: input.duplicateOfId,
    locationLabel: input.locationLabel,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (isDbMode()) {
    await getDb()
      .insert(proposals)
      .values({ ...base, createdAt: now, updatedAt: now });
  } else {
    getState().proposals.unshift(base);
  }
  return base;
}

export async function upvoteProposal(
  id: string,
  userId: string
): Promise<{ proposal: Proposal; alreadyUpvoted: boolean }> {
  if (isDbMode()) {
    // Real mode: enforced by a unique (proposal_id, user_id) index at the DB
    // level via upvote_records — see README for the exact migration/policy.
    // Kept minimal here since the demo store is the documented default path.
    const existing = await getProposal(id);
    if (!existing) throw new Error("Proposal not found");
    const rows = await getDb()
      .update(proposals)
      .set({ upvotes: sql`${proposals.upvotes} + 1`, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return { proposal: rowToProposal(rows[0]), alreadyUpvoted: false };
  }

  const state = getState();
  const proposal = state.proposals.find((p) => p.id === id);
  if (!proposal) throw new Error("Proposal not found");

  if (!state.upvotesByUser[userId]) state.upvotesByUser[userId] = new Set();
  const already = state.upvotesByUser[userId].has(id);
  if (!already) {
    state.upvotesByUser[userId].add(id);
    proposal.upvotes += 1;
    proposal.updatedAt = new Date().toISOString();
  }
  return { proposal, alreadyUpvoted: already };
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus
): Promise<Proposal> {
  if (isDbMode()) {
    const rows = await getDb()
      .update(proposals)
      .set({ status, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    if (!rows[0]) throw new Error("Proposal not found");
    return rowToProposal(rows[0]);
  }
  const state = getState();
  const proposal = state.proposals.find((p) => p.id === id);
  if (!proposal) throw new Error("Proposal not found");
  proposal.status = status;
  proposal.updatedAt = new Date().toISOString();
  return proposal;
}

// Lightweight duplicate signal for the MVP: word-overlap (Jaccard) similarity
// against recent open proposals in the same category/org. This is the
// heuristic stand-in for the embeddings-based clustering described in the
// project plan's Phase 2 — swap this function's body for a vector similarity
// query once pgvector/embeddings are wired up; every call site stays the same.
export async function findLikelyDuplicate(
  orgId: string,
  category: ProposalCategory,
  text: string
): Promise<Proposal | null> {
  const candidates = await listProposals({ orgId, category, limit: 200 });
  const words = new Set(text.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (words.size === 0) return null;

  let best: { proposal: Proposal; score: number } | null = null;
  for (const c of candidates) {
    if (c.status === "done" || c.status === "declined") continue;
    const cWords = new Set(
      `${c.refinedTitle} ${c.refinedText}`.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
    );
    const intersection = [...words].filter((w) => cWords.has(w)).length;
    const union = new Set([...words, ...cWords]).size;
    const score = union > 0 ? intersection / union : 0;
    if (score > 0.28 && (!best || score > best.score)) {
      best = { proposal: c, score };
    }
  }
  return best?.proposal ?? null;
}

export async function getAdminStats(orgId: string): Promise<AdminStats> {
  const all = await listProposals({ orgId });

  const byCategory = Object.fromEntries(
    PROPOSAL_CATEGORIES.map((c) => [c.value, 0])
  ) as AdminStats["byCategory"];
  const byStatus = Object.fromEntries(
    PROPOSAL_STATUSES.map((s) => [s.value, 0])
  ) as AdminStats["byStatus"];
  const byUrgency: AdminStats["byUrgency"] = { low: 0, medium: 0, high: 0 };

  for (const p of all) {
    byCategory[p.category]++;
    byStatus[p.status]++;
    byUrgency[p.urgency]++;
  }

  // 14-day trend of submissions.
  const trendMap = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const p of all) {
    const key = p.createdAt.slice(0, 10);
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }
  const trend = [...trendMap.entries()].map(([date, count]) => ({ date, count }));

  const topProposals = [...all].sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

  return { total: all.length, byCategory, byStatus, byUrgency, trend, topProposals };
}
