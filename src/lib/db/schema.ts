import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Real Postgres schema (Drizzle). Only loaded/used when DATABASE_URL is set —
// see src/lib/db/index.ts for the mode switch. Mirrors src/types/index.ts.

export const categoryEnum = pgEnum("proposal_category", [
  "roads_transport",
  "sanitation_waste",
  "parks_environment",
  "public_safety",
  "housing_urban",
  "utilities",
  "community_culture",
  "other",
]);

export const statusEnum = pgEnum("proposal_status", [
  "received",
  "in_review",
  "scheduled",
  "in_progress",
  "done",
  "declined",
]);

export const urgencyEnum = pgEnum("proposal_urgency", ["low", "medium", "high"]);
export const sentimentEnum = pgEnum("proposal_sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  population: integer("population").notNull().default(0),
  licenseActive: boolean("license_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  originalText: text("original_text").notNull(),
  refinedTitle: text("refined_title").notNull(),
  refinedText: text("refined_text").notNull(),
  category: categoryEnum("category").notNull().default("other"),
  urgency: urgencyEnum("urgency").notNull().default("low"),
  sentiment: sentimentEnum("sentiment").notNull().default("neutral"),
  status: statusEnum("status").notNull().default("received"),
  upvotes: integer("upvotes").notNull().default(0),
  duplicateOfId: text("duplicate_of_id"),
  locationLabel: text("location_label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const upvoteRecords = pgTable("upvote_records", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Row-Level Security note (enforced in real Supabase, not by Drizzle):
//   - proposals: SELECT allowed to anyone (public cross-town browse).
//   - proposals: INSERT requires auth.uid() = author_id.
//   - admin-only aggregate/status-update access is scoped by org_id and
//     requires organizations.license_active = true.
// See README.md "Row-Level Security" section for the exact SQL policies.
