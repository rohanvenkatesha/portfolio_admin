/**
 * Editable section copy — eyebrow, headline and description for every section.
 *
 * Free of server imports, like content/theme.ts and content/profile.ts, so the
 * admin editor can import it without dragging firebase-admin into the browser
 * bundle.
 *
 * ## Why the headline is two fields
 *
 * These headlines aren't strings in the components, they're JSX:
 *
 *     <>Two tracks,<br /><span className="text-brand-500">one person</span></>
 *
 * Firestore can't hold JSX, and letting the admin type raw HTML would be both an
 * injection risk and trivial to break. Splitting it into `titleLead` and
 * `titleAccent` gives full control of the words while the component keeps
 * ownership of the line break and the accent colour — nothing renderable
 * crosses the boundary.
 *
 * A few panels (the capabilities pair, the closing call to action) set their
 * second line in plain white rather than the accent. `titleAccent` is still the
 * second line there; only the colour differs, and that's the component's call.
 */

export type SectionCopy = {
  /** Small label above the headline. Empty hides it. */
  eyebrow: string;
  /** First line of the headline. */
  titleLead: string;
  /** Second line. Accented in most sections. */
  titleAccent: string;
  /**
   * Supporting paragraph. In `work` and `travel` the token `{count}` is
   * replaced with the live number of items, so the copy stays honest as the
   * collection grows.
   */
  description: string;
};

export const COPY_IDS = [
  "capabilities",
  "stats",
  "journey",
  "work",
  "visuals",
  "travel",
  "about",
  "cta",
  "contact",
] as const;

export type CopyId = (typeof COPY_IDS)[number];
export type Copy = Record<CopyId, SectionCopy>;

/** Shown next to each field in the admin so it's clear what you're editing. */
export const COPY_LABELS: Record<CopyId, { title: string; note: string }> = {
  capabilities: { title: "Services", note: "Left panel under the hero" },
  stats: { title: "Numbers", note: "The warm stats panel beside it" },
  journey: { title: "Journey", note: "Career and creative timeline" },
  work: { title: "Work", note: "Projects — {count} becomes the project total" },
  visuals: { title: "Visuals", note: "Films and photography" },
  travel: { title: "Travel", note: "Trips — {count} becomes the trip total" },
  about: { title: "About", note: "Bio, principles and skills" },
  cta: { title: "Call to action", note: "The full-bleed closing panel" },
  contact: { title: "Contact", note: "Above the contact form" },
};

export const DEFAULT_COPY: Copy = {
  capabilities: {
    eyebrow: "",
    titleLead: "Engineering that ships,",
    titleAccent: "not just prototypes",
    description:
      "Three things I get hired for, and have shipped into production across retail, fuel networks, marketing automation and enterprise document workflows.",
  },
  stats: {
    eyebrow: "",
    titleLead: "Work that delivers",
    titleAccent: "real results",
    description: "Every figure below traces back to a shipped system — not a rounded-up estimate.",
  },
  journey: {
    eyebrow: "The Journey",
    titleLead: "Two tracks,",
    titleAccent: "one person",
    description:
      "The engineering career and the creative life didn't happen in sequence — they happened at the same time, and kept feeding each other.",
  },
  work: {
    eyebrow: "Selected Work",
    titleLead: "Things I've",
    titleAccent: "actually built",
    description:
      "{count} public projects — retrieval systems, computer vision, full-stack apps and compiler front-ends. Every one links to its source.",
  },
  visuals: {
    eyebrow: "Visual Storytelling",
    titleLead: "The other half,",
    titleAccent: "shot on location",
    description:
      "Films and frames from the practice that runs alongside the engineering. Shot, cut and graded end to end — usually alone, usually somewhere with bad wifi.",
  },
  travel: {
    eyebrow: "Solo Travel",
    titleLead: "Places I went",
    titleAccent: "on my own",
    description:
      "{count} journeys on the map. Hover a destination to find it on the globe — open it for the full day-by-day guide.",
  },
  about: {
    eyebrow: "About",
    titleLead: "How I think",
    titleAccent: "about the work",
    description:
      "Two disciplines that look unrelated from outside and feel identical from inside: notice what matters, cut everything else, get it in front of people.",
  },
  cta: {
    eyebrow: "",
    titleLead: "Let's build something",
    titleAccent: "worth shipping",
    description:
      "Whether it's a retrieval system that needs to get faster, a product that needs building end to end, or a story that needs telling on camera — I'd love to hear about it.",
  },
  contact: {
    eyebrow: "Contact",
    titleLead: "Tell me what",
    titleAccent: "you're building",
    description: "Engineering work, a film, or just a good argument about lenses. The inbox is open.",
  },
};

/** Blank falls back, so clearing a field can't leave a section headless. */
function pick(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normaliseCopy(raw: unknown): Copy {
  const source = (raw ?? {}) as Partial<Record<CopyId, Partial<SectionCopy>>>;
  const out = {} as Copy;

  for (const id of COPY_IDS) {
    const entry = source[id] ?? {};
    const fallback = DEFAULT_COPY[id];

    out[id] = {
      // The eyebrow is the one field where empty is meaningful — several
      // panels deliberately have none — so it isn't forced back to a default.
      eyebrow: typeof entry.eyebrow === "string" ? entry.eyebrow.trim() : fallback.eyebrow,
      titleLead: pick(entry.titleLead, fallback.titleLead),
      titleAccent: pick(entry.titleAccent, fallback.titleAccent),
      description: pick(entry.description, fallback.description),
    };
  }

  return out;
}

/** Swap `{count}` for the live total. Copy without the token is untouched. */
export function withCount(description: string, count: number): string {
  return description.replace(/\{count\}/g, String(count));
}
