/**
 * The repeating card lists that fill the Services and About sections.
 *
 * Four lists, one document: the services cards, the stat counters beside them,
 * the numbered principles, and the skill matrix. They're grouped rather than
 * split because they're always edited on one screen and always read together —
 * a document each would mean four reads to render two sections.
 *
 * Free of server imports, like content/theme.ts and content/profile.ts, so the
 * admin editor can share these types. Defaults come from content/site.ts, so an
 * empty Firestore or a failed read still renders the site that's in the repo.
 */

import {
  capabilities as repoCapabilities,
  philosophy as repoPhilosophy,
  skillGroups as repoSkillGroups,
  stats as repoStats,
} from "@/content/site";

export type Capability = {
  /** Shown oversized in the accent — "01", "02", "03". */
  number: string;
  title: string;
  body: string;
  tags: string[];
};

export type Stat = {
  /** Counted up to on scroll, so it has to be a number. */
  value: number;
  /** Appended after the number — "+", "%", or nothing. */
  suffix: string;
  label: string;
};

export type Principle = { title: string; body: string };

export const SKILL_DOMAINS = ["engineering", "creative"] as const;
export type SkillDomain = (typeof SKILL_DOMAINS)[number];

/**
 * No per-group accent.
 *
 * The repo shape carries one, but nothing reads it: the About section never
 * referenced it, and the badge map routes all five of its colour names to the
 * same brand token. That's deliberate — the palette is single-accent by design,
 * with variety coming from typography and scale rather than a set of hues. A
 * colour picker here would be a control that changes nothing.
 */
export type SkillGroup = {
  id: string;
  label: string;
  domain: SkillDomain;
  /** `level` is a 0–100 self-assessment; it drives the bars. */
  skills: { name: string; level: number }[];
};

export type Lists = {
  capabilities: Capability[];
  stats: Stat[];
  philosophy: Principle[];
  skillGroups: SkillGroup[];
};

export const DEFAULT_LISTS: Lists = {
  capabilities: repoCapabilities.map((c) => ({
    number: c.number,
    title: c.title,
    body: c.body,
    tags: [...c.tags],
  })),
  stats: repoStats.map((s) => ({ value: s.value, suffix: s.suffix, label: s.label })),
  philosophy: repoPhilosophy.map((p) => ({ title: p.title, body: p.body })),
  skillGroups: repoSkillGroups.map((g) => ({
    id: g.id,
    label: g.label,
    domain: g.domain as SkillDomain,
    skills: g.skills.map((s) => ({ name: s.name, level: s.level })),
  })),
};

/* -------------------------------------------------------------------------- */
/* Normalising                                                                 */
/* -------------------------------------------------------------------------- */

const str = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const strList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim())
    : [];

function capabilities(value: unknown, fallback: Capability[]): Capability[] {
  if (!Array.isArray(value)) return fallback;

  return value.flatMap((raw, index): Capability[] => {
    const c = (raw ?? {}) as Partial<Capability>;
    const title = str(c.title);
    // A card with no title is an empty slot on the page, so it's dropped.
    if (!title) return [];

    return [
      {
        // Auto-numbered when blank, so the sequence stays right after a
        // reorder without anyone renumbering by hand.
        number: str(c.number, String(index + 1).padStart(2, "0")),
        title,
        body: str(c.body),
        tags: strList(c.tags),
      },
    ];
  });
}

function stats(value: unknown, fallback: Stat[]): Stat[] {
  if (!Array.isArray(value)) return fallback;

  return value.flatMap((raw): Stat[] => {
    const s = (raw ?? {}) as Partial<Stat>;
    const label = str(s.label);
    if (!label) return [];

    const numeric = Number(s.value);
    return [
      {
        // The counter animates toward this, so a non-number would leave the
        // figure stuck at NaN rather than merely wrong.
        value: Number.isFinite(numeric) ? numeric : 0,
        suffix: typeof s.suffix === "string" ? s.suffix.trim() : "",
        label,
      },
    ];
  });
}

function philosophy(value: unknown, fallback: Principle[]): Principle[] {
  if (!Array.isArray(value)) return fallback;

  return value.flatMap((raw): Principle[] => {
    const p = (raw ?? {}) as Partial<Principle>;
    const title = str(p.title);
    return title ? [{ title, body: str(p.body) }] : [];
  });
}

function skillGroups(value: unknown, fallback: SkillGroup[]): SkillGroup[] {
  if (!Array.isArray(value)) return fallback;

  return value.flatMap((raw, index): SkillGroup[] => {
    const g = (raw ?? {}) as Partial<SkillGroup>;
    const label = str(g.label);
    if (!label) return [];

    const skills = Array.isArray(g.skills)
      ? g.skills.flatMap((s) => {
          const skill = (s ?? {}) as { name?: string; level?: unknown };
          const name = str(skill.name);
          if (!name) return [];
          // Clamped: the bars are widths, and anything outside 0–100 would
          // either vanish or overflow its track.
          const level = Math.max(0, Math.min(100, Number(skill.level) || 0));
          return [{ name, level }];
        })
      : [];

    return [
      {
        id: str(g.id, `s-${index}`),
        label,
        domain: SKILL_DOMAINS.includes(g.domain as SkillDomain)
          ? (g.domain as SkillDomain)
          : "engineering",
        skills,
      },
    ];
  });
}

export function normaliseLists(raw: unknown): Lists {
  const l = (raw ?? {}) as Partial<Lists>;

  return {
    capabilities: capabilities(l.capabilities, DEFAULT_LISTS.capabilities),
    stats: stats(l.stats, DEFAULT_LISTS.stats),
    philosophy: philosophy(l.philosophy, DEFAULT_LISTS.philosophy),
    skillGroups: skillGroups(l.skillGroups, DEFAULT_LISTS.skillGroups),
  };
}

/* -------------------------------------------------------------------------- */
/* Textarea round-tripping                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Skills are edited as `name | level`, one per line.
 *
 * A nested repeater — rows of groups, each with rows of skills — is slower to
 * use than a textarea and much slower to reorder. This is the same trade the
 * trip itinerary editor already makes.
 */
export function skillsToText(skills: { name: string; level: number }[]): string {
  return skills.map((s) => `${s.name} | ${s.level}`).join("\n");
}

export function textToSkills(value: string): { name: string; level: number }[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [name = "", rawLevel = ""] = line.split("|").map((part) => part.trim());
      if (!name) return [];
      const level = Math.max(0, Math.min(100, Number(rawLevel) || 0));
      return [{ name, level }];
    });
}
