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
