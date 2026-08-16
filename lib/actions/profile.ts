"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { PROFILE_DOC, PROFILE_TAG, SETTINGS_COLLECTION } from "@/lib/content/profile";
import {
  DEFAULT_PROFILE,
  SOCIAL_ICONS,
  isValidTimezone,
  normaliseProfile,
  type Profile,
  type Social,
  type SocialIcon,
} from "@/content/profile";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

async function write(profile: Profile, email: string) {
  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(PROFILE_DOC)
    .set({ ...profile, updatedAt: new Date().toISOString(), updatedBy: email });

  revalidateTag(PROFILE_TAG, "max");
  // The name and description feed the root layout's metadata, and the nav and
  // footer appear on every route — so this invalidates the whole tree.
  revalidatePath("/", "layout");
}

/** One item per line, blanks dropped. Used for roles and the marquee. */
function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Socials arrive as three parallel arrays from repeated field names, which is
 * how a plain HTML form expresses a list. Rows missing a label or href are
 * dropped rather than saved half-complete.
 */
function readSocials(formData: FormData): Social[] {
  const labels = formData.getAll("socialLabel").map(String);
  const hrefs = formData.getAll("socialHref").map(String);
  const icons = formData.getAll("socialIcon").map(String);

  return labels.flatMap((rawLabel, i): Social[] => {
    const label = rawLabel.trim();
    const href = (hrefs[i] ?? "").trim();
    if (!label || !href) return [];

    const icon = SOCIAL_ICONS.includes(icons[i] as SocialIcon) ? (icons[i] as SocialIcon) : "mail";
    return [{ label, href, icon }];
  });
}

export async function saveProfile(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const timezone = text("timezone");
  if (timezone && !isValidTimezone(timezone)) {
    // Intl.DateTimeFormat throws on an unknown zone, which would crash the
    // footer clock on every page — so it's rejected at the door.
    return {
      ok: false,
      error: `"${timezone}" isn't an IANA time zone. Use a value like America/Detroit.`,
    };
  }

  const email = text("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "That email address doesn't look valid." };
  }

  /**
   * Everything goes through the same normaliser the read path uses, so a field
   * left blank falls back to the repo value instead of being saved empty and
   * blanking that spot on the site.
   */
  const profile = normaliseProfile({
    name: text("name"),
    initials: text("initials"),
    roles: lines(formData.get("roles")),
    tagline: text("tagline"),
    location: text("location"),
    timezone,
    email,
    availability: text("availability"),
    resumeUrl: text("resumeUrl"),
    portraitUrl: text("portraitUrl"),
    bio: String(formData.get("bio") ?? "").trim(),
    bioShort: text("bioShort"),
    marquee: lines(formData.get("marquee")),
    socials: readSocials(formData),
  });

  try {
    await write(profile, admin.email);
    return { ok: true, message: "Profile saved — the site has been updated." };
  } catch (error) {
    console.error("[saveProfile]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

export async function resetProfile(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    await write(DEFAULT_PROFILE, admin.email);
    return { ok: true, message: "Profile reset to the values in the repo." };
  } catch (error) {
    console.error("[resetProfile]", error);
    return { ok: false, error: "Could not reset." };
  }
}
