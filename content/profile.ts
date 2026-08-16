/**
 * Profile shape, defaults and validation.
 *
 * Free of server imports, the same way content/theme.ts is: the admin form is a
 * Client Component and needs these, and anything it touches gets bundled for the
 * browser. The Firestore reader lives in lib/content/profile.ts.
 *
 * Defaults come from content/site.ts, so an empty Firestore, an unconfigured
 * Firebase, or a failed read all still render the site that's in the repo.
 */

import { profile as repoProfile, socials as repoSocials } from "@/content/site";

/** The only icons the social pills can render. */
export const SOCIAL_ICONS = ["github", "linkedin", "youtube", "instagram", "mail"] as const;
export type SocialIcon = (typeof SOCIAL_ICONS)[number];

export type Social = {
  label: string;
  href: string;
  icon: SocialIcon;
};

export type Profile = {
  name: string;
  /** Two or three characters — the nav mark and the portrait placeholder. */
  initials: string;
  /** Rotating words under the hero headline. */
  roles: string[];
  tagline: string;
  location: string;
  /** IANA zone, e.g. "America/Detroit". Drives the footer clock. */
  timezone: string;
  email: string;
  availability: string;
  resumeUrl: string;
  portraitUrl: string;
  /** Long-form, shown in the About panel. Blank lines separate paragraphs. */
  bio: string;
  /** One or two sentences, shown under the hero. */
  bioShort: string;
  /** Scrolling strip under the hero panel. */
  marquee: string[];
  socials: Social[];
};

/** The tech strip, which until now was a private const inside hero.tsx. */
const DEFAULT_MARQUEE = [
  "Vertex AI",
  "Gemini",
  "LangGraph",
  "pgvector",
  "FastAPI",
  "Next.js",
  "YOLOv8",
  "Document AI",
  "Cloud Run",
  "AWS Lambda",
  "PostgreSQL",
  "Docker",
];

export const DEFAULT_PROFILE: Profile = {
  name: repoProfile.name,
  initials: repoProfile.initials,
  roles: [...repoProfile.roles],
  tagline: repoProfile.tagline,
  location: repoProfile.location,
  timezone: repoProfile.timezone,
  email: repoProfile.email,
  availability: repoProfile.availability,
  resumeUrl: repoProfile.resumeUrl,
  portraitUrl: repoProfile.portraitUrl,
  bio: repoProfile.bio,
  bioShort: repoProfile.bioShort,
  marquee: DEFAULT_MARQUEE,
  socials: repoSocials.map((s) => ({ label: s.label, href: s.href, icon: s.icon as SocialIcon })),
};

/** Trim, and fall back when the value is missing or blank rather than empty. */
function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * A list the admin may legitimately empty — an empty marquee or no socials are
 * both valid states, so unlike `str` this doesn't fall back on empty.
 */
function list(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim());
}

function socials(value: unknown, fallback: Social[]): Social[] {
  if (!Array.isArray(value)) return fallback;

  return value.flatMap((raw): Social[] => {
    const s = (raw ?? {}) as Partial<Social>;
    const label = typeof s.label === "string" ? s.label.trim() : "";
    const href = typeof s.href === "string" ? s.href.trim() : "";
    // A link with no destination is worse than no link at all.
    if (!label || !href) return [];

    const icon = SOCIAL_ICONS.includes(s.icon as SocialIcon) ? (s.icon as SocialIcon) : "mail";
    return [{ label, href, icon }];
  });
}

export function normaliseProfile(raw: unknown): Profile {
  const p = (raw ?? {}) as Partial<Profile>;

  return {
    name: str(p.name, DEFAULT_PROFILE.name),
    initials: str(p.initials, DEFAULT_PROFILE.initials).slice(0, 3),
    roles: list(p.roles, DEFAULT_PROFILE.roles),
    tagline: str(p.tagline, DEFAULT_PROFILE.tagline),
    location: str(p.location, DEFAULT_PROFILE.location),
    timezone: str(p.timezone, DEFAULT_PROFILE.timezone),
    email: str(p.email, DEFAULT_PROFILE.email),
    availability: str(p.availability, DEFAULT_PROFILE.availability),
    // These two are allowed to be empty: no résumé link and no portrait are
    // both real choices, and the components already handle them.
    resumeUrl: typeof p.resumeUrl === "string" ? p.resumeUrl.trim() : DEFAULT_PROFILE.resumeUrl,
    portraitUrl: typeof p.portraitUrl === "string" ? p.portraitUrl.trim() : DEFAULT_PROFILE.portraitUrl,
    bio: str(p.bio, DEFAULT_PROFILE.bio),
    bioShort: str(p.bioShort, DEFAULT_PROFILE.bioShort),
    marquee: list(p.marquee, DEFAULT_PROFILE.marquee),
    socials: socials(p.socials, DEFAULT_PROFILE.socials),
  };
}

/**
 * An IANA zone the runtime actually knows. A typo here would otherwise throw
 * inside Intl.DateTimeFormat and take the footer clock down with it.
 */
export function isValidTimezone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}
