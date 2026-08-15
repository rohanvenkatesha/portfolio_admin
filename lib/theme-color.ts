"use client";

/**
 * Read a resolved CSS custom property as a colour, for canvases.
 *
 * The WebGL scenes take numeric hex, so they can't reference CSS variables the
 * way the DOM does. Reading the computed value at scene-build time keeps them
 * in step with whatever accent the admin has set.
 *
 * `getComputedStyle` resolves var() chains and color-mix() to an actual colour,
 * so this works even though the brand scale is defined as a mix.
 */
export function readThemeColor(variable: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;

  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  if (!raw) return fallback;

  // Paint it onto a 1x1 canvas and read the pixel back. Cheaper than parsing
  // every colour syntax the browser might hand back (hex, rgb, oklab, lab…).
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;

    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return (r << 16) | (g << 8) | b;
  } catch {
    return fallback;
  }
}
