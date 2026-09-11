import type { ProposalCategory, RefinementResult } from "@/types";

// Deterministic, dependency-free fallback used whenever ANTHROPIC_API_KEY is
// not set. It's intentionally simple (keyword scoring + light cleanup) but
// keeps the whole product loop functional with zero external services —
// this is what makes "npm install && npm run dev" work with no setup.

const CATEGORY_KEYWORDS: Record<ProposalCategory, string[]> = {
  roads_transport: [
    "pothole", "road", "street", "traffic", "sidewalk", "crosswalk", "bike lane",
    "bus", "parking", "roundabout", "highway", "carretera", "calle",
  ],
  sanitation_waste: [
    "trash", "garbage", "waste", "recycling", "bin", "litter", "dump", "smell", "odor",
  ],
  parks_environment: [
    "park", "tree", "green", "garden", "bench", "shade", "pollution", "air quality", "playground",
  ],
  public_safety: [
    "danger", "unsafe", "crime", "light", "lighting", "dark", "police", "noise", "accident",
    "scary", "safety",
  ],
  housing_urban: [
    "housing", "building", "lot", "vacant", "construction", "zoning", "apartment", "rent",
  ],
  utilities: ["water", "electric", "power", "gas", "sewer", "pressure", "outage", "internet", "wifi"],
  community_culture: [
    "event", "culture", "festival", "library", "community", "dog park", "art", "music",
  ],
  other: [],
};

const NEGATIVE_WORDS = [
  "danger", "unsafe", "terrible", "awful", "disgusting", "hate", "worst", "broken",
  "scary", "damaged", "bad", "joke", "waste of time",
];
const POSITIVE_WORDS = ["thank", "grateful", "great", "amazing", "love", "appreciate", "good job"];
const HIGH_URGENCY_WORDS = [
  "danger", "unsafe", "emergency", "asap", "urgent", "hurt", "injur", "accident", "crater",
];
const ABUSE_WORDS = ["idiot", "stupid f", "kill", "fuck you"]; // deliberately narrow; moderation, not censorship

function scoreCategory(lowerText: string): ProposalCategory {
  let best: ProposalCategory = "other";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ProposalCategory,
    string[],
  ][]) {
    const score = keywords.reduce((acc, kw) => (lowerText.includes(kw) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return best;
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanSentence(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/!{2,}/g, ".")
    .replace(/\?{2,}/g, "?")
    .replace(/\.{2,}/g, ".");
}

export function heuristicRefine(rawText: string): RefinementResult {
  const lower = rawText.toLowerCase();
  const category = scoreCategory(lower);

  const negativeHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  const positiveHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const sentiment: RefinementResult["sentiment"] =
    positiveHits > negativeHits ? "positive" : negativeHits > 0 ? "negative" : "neutral";

  const urgency: RefinementResult["urgency"] = HIGH_URGENCY_WORDS.some((w) => lower.includes(w))
    ? "high"
    : negativeHits >= 2
      ? "medium"
      : "low";

  const flaggedForModeration = ABUSE_WORDS.some((w) => lower.includes(w));

  const cleaned = cleanSentence(rawText);
  const firstClause = cleaned.split(/[.!?]/)[0]?.trim() || cleaned;
  const titleSource = firstClause.length > 70 ? firstClause.slice(0, 70) : firstClause;
  const refinedTitle = toTitleCase(titleSource.replace(/^(the|a|an)\s+/i, "")).slice(0, 80);

  const refinedText = `We received a report from a resident: "${cleaned.slice(0, 280)}". This has been categorized as a ${category.replace("_", " ")} matter${urgency === "high" ? " and flagged as high priority" : ""} for town-hall review.`;

  return {
    refinedTitle: refinedTitle || "Resident request",
    refinedText,
    category,
    urgency,
    sentiment,
    flaggedForModeration,
    moderationReason: flaggedForModeration
      ? "Contains language that may require moderation review before publishing."
      : null,
  };
}
