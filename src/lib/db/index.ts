import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazily create a real Postgres connection only when DATABASE_URL is set and
// this module is actually imported. The demo in-memory store (see
// src/lib/store.ts) never imports this file, so `npm run dev` with zero env
// vars never tries to open a DB connection.
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — createDb() should only be called when isDbMode() is true."
    );
  }
  const client = postgres(url, { max: 5 });
  return drizzle(client, { schema });
}

let cached: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!cached) cached = createDb();
  return cached;
}

export function isDbMode(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
