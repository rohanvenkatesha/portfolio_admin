/**
 * Theme shape, defaults, presets and validation.
 *
 * Deliberately free of any server imports: the admin editor is a Client
 * Component and needs these values, and anything it touches gets bundled for
 * the browser. The Firestore reader lives in lib/content/theme.ts, which pulls
 * in firebase-admin and must never cross that boundary.
 */

export type Theme = {
  /** Base accent. The whole brand-200…900 ramp is mixed from this one value. */
  accent: string;
  /** Page background — the darkest surface. */
  void: string;
  /** Section panels, one step up from the page. */
  panel: string;
  /** Cards nested inside a panel, one step up again. */
  panel2: string;
};

export const DEFAULT_THEME: Theme = {
  accent: "#ff5a1f",
  void: "#0c0c0d",
  panel: "#1a1a1c",
  panel2: "#222225",
};

/** Curated starting points, so you're not fighting a colour picker. */
export const THEME_PRESETS: { name: string; theme: Theme }[] = [
  { name: "Ember", theme: DEFAULT_THEME },
  { name: "Signal", theme: { accent: "#3b82f6", void: "#0a0c10", panel: "#15181f", panel2: "#1d212a" } },
  { name: "Acid", theme: { accent: "#a3e635", void: "#0b0d0a", panel: "#161a14", panel2: "#1e231b" } },
  { name: "Magenta", theme: { accent: "#e11d8f", void: "#0d0a0c", panel: "#1b1519", panel2: "#241d22" } },
  { name: "Ice", theme: { accent: "#22d3ee", void: "#0a0d0e", panel: "#141a1c", panel2: "#1c2427" } },
  { name: "Bone", theme: { accent: "#e7e5e4", void: "#0c0c0c", panel: "#1a1a1a", panel2: "#232323" } },
];

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Reject anything that isn't a plain 6-digit hex.
 *
 * These values are interpolated into a <style> tag, so the input is narrowed
 * rather than escaped — a shape this simple leaves nothing to sanitise.
 */
export function isValidHex(value: string): boolean {
  return HEX.test(value.trim());
}

export function normaliseTheme(raw: unknown): Theme {
  const t = (raw ?? {}) as Partial<Theme>;
  const pick = (value: unknown, fallback: string) =>
    typeof value === "string" && isValidHex(value) ? value.toLowerCase() : fallback;

  return {
    accent: pick(t.accent, DEFAULT_THEME.accent),
    void: pick(t.void, DEFAULT_THEME.void),
    panel: pick(t.panel, DEFAULT_THEME.panel),
    panel2: pick(t.panel2, DEFAULT_THEME.panel2),
  };
}

/**
 * Pick black or white text for anything sitting on the accent.
 *
 * Necessary because the accent is user-chosen: white reads well on a deep
 * orange and disappears on a pale one.
 *
 * Uses YIQ brightness rather than WCAG relative luminance. Strict luminance is
 * mathematically correct but puts the tipping point so low that saturated
 * mid-tones — blue, magenta — come out wanting black text, which nobody would
 * choose by eye. YIQ weights green closer to how the eye reads brightness and
 * lands where a designer would.
 */
export function readableInk(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140 ? "#0c0c0d" : "#ffffff";
}

/**
 * Render the theme as CSS custom properties for the document root.
 *
 * Every accent shade is mixed from `--brand` in globals.css, so one value
 * recolours the entire ramp — including translucent utilities like
 * `bg-brand-500/10`, which resolve through color-mix() rather than baked hex.
 *
 * `--brand-ink` is derived, not stored: whatever accent is chosen, text on top
 * of it stays legible without the admin thinking about contrast.
 */
export function themeToCss(theme: Theme): string {
  return (
    `:root{` +
    `--brand:${theme.accent};` +
    `--brand-ink:${readableInk(theme.accent)};` +
    `--color-void:${theme.void};` +
    `--color-panel:${theme.panel};` +
    `--color-panel-2:${theme.panel2};` +
    `}`
  );
}
