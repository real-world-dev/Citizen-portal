import type { Organization, Proposal } from "@/types";
import { ORGANIZATIONS, SEED_PROPOSALS } from "./seed-data";

// In-memory demo store. Used automatically when DATABASE_URL is not set, so
// the app runs instantly with zero setup (see src/lib/repo.ts for the mode
// switch). Data resets whenever the server process restarts — that's the
// intentional trade-off for a zero-config demo, and it's called out in the
// README as a limitation (also: in-memory state is per-instance, so it
// doesn't survive across multiple serverless function instances either).
//
// Kept as a module-level singleton via globalThis so Next.js dev-mode hot
// reloads don't wipe it on every file save.

interface DemoState {
  organizations: Organization[];
  proposals: Proposal[];
  upvotesByUser: Record<string, Set<string>>; // userId -> set of proposalIds
}

function freshState(): DemoState {
  return {
    organizations: ORGANIZATIONS.map((o) => ({ ...o })),
    proposals: SEED_PROPOSALS.map((p) => ({ ...p })),
    upvotesByUser: {},
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __citizensPortalDemoState: DemoState | undefined;
}

export function getState(): DemoState {
  if (!globalThis.__citizensPortalDemoState) {
    globalThis.__citizensPortalDemoState = freshState();
  }
  return globalThis.__citizensPortalDemoState;
}
