/**
 * The Journey timeline — the career and creative tracks.
 *
 * Free of server imports, like the other content modules, so the admin editor
 * can share these types. Defaults come from content/site.ts, so an empty
 * Firestore or a failed read still renders what's in the repo.
 */

import { timeline as repoTimeline } from "@/content/site";

export const TIMELINE_TRACKS = ["tech", "life"] as const;
export type TimelineTrack = (typeof TIMELINE_TRACKS)[number];

export const TIMELINE_KINDS = ["work", "education", "award", "milestone"] as const;
export type TimelineKind = (typeof TIMELINE_KINDS)[number];

/** What each track and kind is called in the interface. */
export const TRACK_LABELS: Record<TimelineTrack, string> = {
  tech: "Technical",
  life: "Creative",
};

export const KIND_LABELS: Record<TimelineKind, string> = {
  work: "Role",
  education: "Education",
  award: "Honour",
  milestone: "Milestone",
};

export type TimelineEntry = {
  id: string;
  track: TimelineTrack;
  /**
   * Free text — "May 2026 — Present", "2019", "Aug 2015 — Jul 2019".
   * The section pulls the first four-digit year out of it for the oversized
   * ghost numeral and for sorting the blended view, so a year has to appear
   * somewhere in it.
   */
  period: string;
  title: string;
  org: string;
  location?: string;
  kind: TimelineKind;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const DEFAULT_TIMELINE: TimelineEntry[] = repoTimeline.map((entry) => ({
  id: entry.id,
  track: entry.track as TimelineTrack,
  period: entry.period,
  title: entry.title,
  org: entry.org,
  location: entry.location,
  kind: entry.kind as TimelineKind,
  summary: entry.summary,
  highlights: [...entry.highlights],
  stack: entry.stack ? [...entry.stack] : [],
}));

const str = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const strList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim())
    : [];

export function normaliseTimeline(raw: unknown): TimelineEntry[] {
  if (!Array.isArray(raw)) return DEFAULT_TIMELINE;

  return raw.flatMap((item, index): TimelineEntry[] => {
    const e = (item ?? {}) as Partial<TimelineEntry>;
    const title = str(e.title);
    // An entry with no title is a blank card on the page, so it's dropped.
    if (!title) return [];

    const location = str(e.location);

    return [
      {
        id: str(e.id, `tl-${index}`),
        track: TIMELINE_TRACKS.includes(e.track as TimelineTrack)
          ? (e.track as TimelineTrack)
          : "tech",
        period: str(e.period),
        title,
        org: str(e.org),
        // Optional, so it stays absent rather than becoming an empty string —
        // the section tests for it to decide whether to render the separator.
        ...(location ? { location } : {}),
        kind: TIMELINE_KINDS.includes(e.kind as TimelineKind) ? (e.kind as TimelineKind) : "work",
        summary: str(e.summary),
        highlights: strList(e.highlights),
        stack: strList(e.stack),
      },
    ];
  });
}

/**
 * Pull the first four-digit year out of a period string.
 *
 * Shared with the section rather than duplicated: it drives the ghost numeral
 * and the blended sort, and the admin warns when a period has no year in it,
 * so both have to agree on what counts.
 */
export function startYear(period: string): string {
  const match = period.match(/\d{4}/);
  return match ? match[0] : "";
}
