import type { Config } from "drizzle-kit";

// Only used when DATABASE_URL is set (real Postgres/Supabase mode).
// In demo mode the app never touches this file.
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://placeholder",
  },
} satisfies Config;
