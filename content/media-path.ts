/**
 * Whether a stored path is a legitimate repo image reference.
 *
 * Pure and client-safe on purpose. The same check has to run in three places —
 * the admin form, the write actions, and the read normalisers — and the read
 * normalisers live in client-importable modules, so it can't sit behind
 * `server-only` the way the rest of the media helpers do.
 *
 * Anchored to /media/ and rejecting "..", so a stored value can neither escape
 * public/media nor point at another origin. Anything else reaching next/image
 * throws at render time, because next.config deliberately configures no remote
 * patterns.
 */
export const MEDIA_ROOT = "media";

export function isValidMediaPath(value: string): boolean {
  if (!value.startsWith(`/${MEDIA_ROOT}/`)) return false;
  if (value.includes("..")) return false;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(value);
}

/** Trip imagery is filed per trip, in a folder named after the trip's slug. */
export const TRIP_MEDIA_ROOT = "trips";

/**
 * Where one trip's images live.
 *
 * Lives here rather than beside the other media helpers for the same reason
 * `isValidMediaPath` does: those are `server-only`, and the admin forms that
 * need to name this folder run on the client.
 *
 * Slugs are produced by `slugify` and so already hold only letters, digits and
 * hyphens — but the result is joined onto a filesystem root when listing, so it
 * is re-checked here rather than trusted. A slug arriving from anywhere else
 * cannot climb out of public/media.
 */
export function tripMediaFolder(slug: string): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return `${TRIP_MEDIA_ROOT}/${safe}`;
}
