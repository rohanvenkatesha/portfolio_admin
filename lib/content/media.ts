import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Images committed to the repo under public/media.
 *
 * Firestore holds every other kind of content, but images live in git: it's
 * free, needs no third-party service, and `next/image` optimises local files
 * at build time rather than on demand.
 *
 * The trade is that adding an image is a commit. The admin makes up for that
 * by letting you *assign* any committed image without another one.
 */
export const MEDIA_ROOT = "media";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

export type MediaFile = {
  /** Web path, e.g. /media/projects/atlas.jpg — what gets stored and rendered. */
  src: string;
  /** File name without extension, for display. */
  name: string;
  folder: string;
};

/**
 * List images in public/media/<folder>.
 *
 * Returns an empty array when the folder doesn't exist yet — a missing folder
 * is the normal state before the first commit, not an error worth crashing on.
 */
export async function listMedia(folder: string): Promise<MediaFile[]> {
  const dir = path.join(process.cwd(), "public", MEDIA_ROOT, folder);

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => ({
        src: `/${MEDIA_ROOT}/${folder}/${entry.name}`,
        name: entry.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
        folder,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/**
 * Whether a stored path is a legitimate repo image reference.
 *
 * Guards the write path: without it, a crafted request could point site
 * imagery at an arbitrary URL. Anchored, and no "..", so it can't escape
 * public/media.
 */
export function isValidMediaPath(value: string): boolean {
  if (!value.startsWith(`/${MEDIA_ROOT}/`)) return false;
  if (value.includes("..")) return false;
  return /\.(jpe?g|png|webp|avif|gif)$/i.test(value);
}
