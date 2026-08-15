/* ============================================================================
 * SECTION REGISTRY
 * ----------------------------------------------------------------------------
 * The single place that decides which sections exist, whether they render, in
 * what order, and how they're labelled in navigation.
 *
 * Flip `enabled` to false to remove a section from the page, the nav, the
 * footer sitemap and the ⌘K palette — all at once. Change `order` to move it.
 *
 * Phase 2 of the admin panel will read these same fields from Firestore, so
 * the shape here is deliberately serialisable: no functions, no components.
 * ========================================================================== */

export type SectionId =
  | "hero"
  | "capabilities"
  | "journey"
  | "work"
  | "visuals"
  | "travel"
  | "about"
  | "cta"
  | "contact";

export type SectionConfig = {
  id: SectionId;
  /** Nav label. Also used in the footer sitemap and command palette. */
  label: string;
  /** Render this section at all. */
  enabled: boolean;
  /** Show a link to it in the nav, footer and section dots. */
  inNav: boolean;
  /** Ascending. Ties keep declaration order. */
  order: number;
  /** Short note for the admin UI — why you might turn this off. */
  note?: string;
};

export const sections: SectionConfig[] = [
  { id: "hero", label: "Home", enabled: true, inNav: true, order: 10 },
  {
    id: "capabilities",
    label: "Services",
    enabled: true,
    inNav: false,
    order: 20,
    note: "What you're hired to do, plus the headline numbers.",
  },
  { id: "journey", label: "Journey", enabled: true, inNav: true, order: 30 },
  { id: "work", label: "Work", enabled: true, inNav: true, order: 40 },
  {
    id: "visuals",
    label: "Visuals",
    enabled: true,
    inNav: true,
    order: 50,
    note: "Currently placeholder — turn off until you have real films and frames.",
  },
  {
    id: "travel",
    label: "Travel",
    enabled: true,
    inNav: true,
    order: 60,
    note: "Currently placeholder — turn off until you have real trips.",
  },
  { id: "about", label: "About", enabled: true, inNav: true, order: 70 },
  { id: "cta", label: "Get in touch", enabled: true, inNav: false, order: 80 },
  { id: "contact", label: "Contact", enabled: true, inNav: true, order: 90 },
];

/** Enabled sections, in render order. */
export const activeSections = sections
  .filter((section) => section.enabled)
  .sort((a, b) => a.order - b.order);

/** Enabled sections that should appear in navigation. */
export const navSections = activeSections
  .filter((section) => section.inNav)
  .map(({ id, label }) => ({ id, label }));

/** True when a section is switched on — for guarding section-specific UI. */
export function isSectionEnabled(id: SectionId) {
  return sections.some((section) => section.id === id && section.enabled);
}
