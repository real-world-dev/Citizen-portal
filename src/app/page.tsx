import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { ProposalCard } from "@/components/ProposalCard";
import { listOrganizations, listProposals } from "@/lib/repo";
import type { ProposalCategory, ProposalStatus } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const organizations = await listOrganizations();
  const orgBySlug = Object.fromEntries(organizations.map((o) => [o.slug, o.name]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o.name]));

  const proposals = await listProposals({
    orgId:
      sp.org && sp.org !== "all"
        ? organizations.find((o) => o.slug === sp.org)?.id
        : undefined,
    category: (sp.category as ProposalCategory) || undefined,
    status: (sp.status as ProposalStatus) || undefined,
    search: sp.q || undefined,
    sort: sp.sort === "top" ? "top" : "recent",
  });

  return (
    <div>
      <section className="bg-navy-800 text-parchment">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <span className="inline-block rounded-full bg-ochre-500/20 border border-ochre-400/40 text-ochre-300 text-xs font-semibold uppercase tracking-wide px-3 py-1 mb-5">
            Open to every resident, every town
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight max-w-2xl">
            Propose the change your town needs.
          </h1>
          <p className="mt-4 text-navy-200 max-w-xl text-base sm:text-lg">
            Write it in your own words — our AI helps turn it into a clear, constructive
            request your town hall can act on. Browse what neighbors everywhere are asking for.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/submit" className="btn-ochre">
              Submit a request
            </Link>
            <Link href="/admin" className="btn-secondary !bg-transparent !text-parchment !border-navy-500 hover:!bg-navy-700">
              I&apos;m from a town hall
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <FilterBar organizations={organizations} />

        {proposals.length === 0 ? (
          <div className="stamp-card p-10 text-center text-navy-500">
            No requests match your filters yet.{" "}
            <Link href="/submit" className="text-navy-700 underline">
              Be the first to submit one
            </Link>
            .
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} townName={orgById[p.orgId]} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border-t border-navy-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-3 gap-8">
          <HowItWorksStep
            n={1}
            title="Write it your way"
            body="Describe the problem or idea in plain language — no forms to wrestle with."
          />
          <HowItWorksStep
            n={2}
            title="AI refines it with you"
            body="We suggest a clear, constructive rewrite and a category. You review and accept it before anything is posted."
          />
          <HowItWorksStep
            n={3}
            title="Your town hall takes it from here"
            body="Requests are grouped, prioritized, and tracked from received through done — visible to everyone."
          />
        </div>
      </section>
    </div>
  );
}

function HowItWorksStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-ochre-300 font-display font-bold text-sm mb-3">
        {n}
      </div>
      <h3 className="font-display font-semibold text-navy-800">{title}</h3>
      <p className="mt-1.5 text-sm text-navy-500">{body}</p>
    </div>
  );
}
