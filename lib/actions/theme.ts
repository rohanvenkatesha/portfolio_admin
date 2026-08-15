"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { adminDb, getAdminUser } from "@/lib/firebase/admin";
import { SETTINGS_COLLECTION, THEME_DOC, THEME_TAG } from "@/lib/content/theme";
import { DEFAULT_THEME, isValidHex, type Theme } from "@/content/theme";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

/** Server Actions are public POST endpoints — re-check auth in every one. */
async function requireAdmin(): Promise<{ email: string } | null> {
  const user = await getAdminUser();
  if (!user?.email) return null;
  return { email: user.email };
}

async function write(theme: Theme, email: string) {
  await adminDb()
    .collection(SETTINGS_COLLECTION)
    .doc(THEME_DOC)
    .set({ ...theme, updatedAt: new Date().toISOString(), updatedBy: email });

  revalidateTag(THEME_TAG, "max");
  // Colours are injected in the root layout, so every route is affected.
  revalidatePath("/", "layout");
}

export async function saveTheme(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  const fields: (keyof Theme)[] = ["accent", "void", "panel", "panel2"];
  const theme = {} as Theme;

  for (const field of fields) {
    const value = String(formData.get(field) ?? "").trim();

    /**
     * These values are interpolated into a <style> tag, so anything other than
     * a plain hex is rejected outright rather than escaped. Narrow input beats
     * clever sanitising.
     */
    if (!isValidHex(value)) {
      return { ok: false, error: `"${field}" must be a 6-digit hex colour like #ff5a1f.` };
    }
    theme[field] = value.toLowerCase();
  }

  try {
    await write(theme, admin.email);
    return { ok: true, message: "Theme saved — the whole site has been recoloured." };
  } catch (error) {
    console.error("[saveTheme]", error);
    return { ok: false, error: "Could not save. Check the server logs." };
  }
}

export async function resetTheme(): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorised." };

  try {
    await write(DEFAULT_THEME, admin.email);
    return { ok: true, message: "Theme reset to the original palette." };
  } catch (error) {
    console.error("[resetTheme]", error);
    return { ok: false, error: "Could not reset." };
  }
}
