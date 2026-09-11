// Run with `npm run db:seed` after `npm run db:push`, once DATABASE_URL is set.
// Populates a real Postgres database with the same Elda + Petrer demo data
// used by the in-memory store, so "real mode" starts from the same place as
// the zero-config demo.
import { getDb, isDbMode } from "./index";
import { organizations, proposals } from "./schema";
import { ORGANIZATIONS, SEED_PROPOSALS } from "../seed-data";

async function main() {
  if (!isDbMode()) {
    console.error("DATABASE_URL is not set. Nothing to seed.");
    process.exit(1);
  }
  const db = getDb();

  console.log(`Seeding ${ORGANIZATIONS.length} organizations...`);
  for (const org of ORGANIZATIONS) {
    await db
      .insert(organizations)
      .values({ ...org, createdAt: new Date(org.createdAt) })
      .onConflictDoNothing({ target: organizations.id });
  }

  console.log(`Seeding ${SEED_PROPOSALS.length} proposals...`);
  for (const p of SEED_PROPOSALS) {
    await db
      .insert(proposals)
      .values({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })
      .onConflictDoNothing({ target: proposals.id });
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
