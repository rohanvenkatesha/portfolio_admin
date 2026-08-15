/**
 * How much of each collection the home page shows.
 *
 * The home page is a shop window, not a catalogue — everything lives on the
 * index routes. These numbers are chosen from what each layout can actually
 * carry, not from taste:
 *
 *   photos  The accordion gives each collapsed strip an equal share of the
 *           row. Past ~8 the strips are too narrow to read or aim at.
 *   trips   Rows stay readable indefinitely, but the section shouldn't
 *           dominate the page.
 *   films   One tidy row of three on desktop.
 *
 * Reordering in the admin decides *which* items appear, so curation needs no
 * extra "featured" flag on these collections.
 */
export const HOME_LIMITS = {
  photos: 8,
  trips: 5,
  films: 3,
} as const;
