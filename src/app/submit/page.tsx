"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Organization, ProposalCategory, ProposalUrgency, RefinementResult } from "@/types";
import { PROPOSAL_CATEGORIES } from "@/types";

type Step = "write" | "review";

export default function SubmitPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgSlug, setOrgSlug] = useState("elda");
  const [step, setStep] = useState<Step>("write");
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [refining, setRefining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RefinementResult | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((d) => setOrgs(d.organizations ?? []))
      .catch(() => {});
  }, []);

  async function handleRefine(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRefining(true);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't refine your request. Please try again.");
        return;
      }
      setResult(data.result);
      setStep("review");
    } finally {
      setRefining(false);
    }
  }

  async function handleSubmit() {
    if (!result) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          text,
          locationLabel: location || null,
          acceptedRefinedTitle: result.refinedTitle,
          acceptedRefinedText: result.refinedText,
          category: result.category,
          urgency: result.urgency,
          sentiment: result.sentiment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong submitting your request.");
        return;
      }
      setSubmitted(true);
      setTimeout(() => router.push(`/proposals/${data.proposal.id}`), 1200);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="text-4xl mb-3">✓</div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Request submitted</h1>
        <p className="mt-2 text-navy-500">Taking you to your request…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
        Submit a request
      </h1>
      <p className="mt-1.5 text-navy-500">
        Write it however feels natural. We&apos;ll suggest a clear version for you to review
        before anything is posted.
      </p>

      <ol className="mt-6 flex items-center gap-2 text-xs font-semibold text-navy-400">
        <li className={step === "write" ? "text-navy-800" : ""}>1. Write</li>
        <li>→</li>
        <li className={step === "review" ? "text-navy-800" : ""}>2. Review &amp; submit</li>
      </ol>

      {step === "write" && (
        <form onSubmit={handleRefine} className="stamp-card p-6 mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="org">
              Town
            </label>
            <select
              id="org"
              className="field"
              value={orgSlug}
              onChange={(e) => setOrgSlug(e.target.value)}
            >
              {(orgs.length ? orgs : [{ id: "org_elda", slug: "elda", name: "Elda" } as Organization]).map(
                (o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="text">
              What would you like to see changed?
            </label>
            <textarea
              id="text"
              className="field min-h-[140px]"
              placeholder="e.g. The streetlights on my street have been out for weeks and it feels unsafe walking home at night..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
            />
            <p className="mt-1 text-xs text-navy-400">{text.length}/2000</p>
          </div>

          <div>
            <label className="label" htmlFor="location">
              Location (optional)
            </label>
            <input
              id="location"
              className="field"
              placeholder="e.g. Calle Colón, near the school"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={refining || text.trim().length < 10} className="btn-ochre w-full">
            {refining ? "Refining with AI…" : "Refine with AI →"}
          </button>
        </form>
      )}

      {step === "review" && result && (
        <ReviewStep
          result={result}
          onChange={setResult}
          onBack={() => setStep("write")}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      )}
    </div>
  );
}

function ReviewStep({
  result,
  onChange,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  result: RefinementResult;
  onChange: (r: RefinementResult) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="stamp-card p-6 mt-4 space-y-4">
      <div className="rounded-lg border border-navy-100 bg-navy-50 px-3 py-2 text-xs text-navy-600">
        Here&apos;s our suggested version. Edit anything before submitting — nothing is posted
        until you confirm.
      </div>

      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="field"
          value={result.refinedTitle}
          maxLength={100}
          onChange={(e) => onChange({ ...result, refinedTitle: e.target.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor="body">
          Request
        </label>
        <textarea
          id="body"
          className="field min-h-[120px]"
          value={result.refinedText}
          maxLength={1000}
          onChange={(e) => onChange({ ...result, refinedText: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="field"
            value={result.category}
            onChange={(e) => onChange({ ...result, category: e.target.value as ProposalCategory })}
          >
            {PROPOSAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="urgency">
            Urgency
          </label>
          <select
            id="urgency"
            className="field"
            value={result.urgency}
            onChange={(e) => onChange({ ...result, urgency: e.target.value as ProposalUrgency })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">
          ← Back
        </button>
        <button onClick={onSubmit} disabled={submitting} className="btn-ochre flex-1">
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </div>
  );
}
