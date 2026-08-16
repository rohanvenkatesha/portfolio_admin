"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_PROFILE, type Profile } from "@/content/profile";

/**
 * The live profile, handed to Client Components.
 *
 * Profile touches almost every component on the site — hero, nav, footer,
 * contact, about, palette, detail pages. Threading it through as props would
 * mean twenty signatures carrying a value none of those components choose, so
 * it's read once in the root layout and read back through context instead.
 *
 * Server Components should call `getProfile()` from lib/content/profile
 * directly — it's cached, so extra calls are free, and it avoids making a
 * component a client one just to read a name.
 *
 * The default is the repo profile rather than null, so a component rendered
 * outside the provider (a test, a stray route) still renders real content
 * instead of throwing.
 */
const ProfileContext = createContext<Profile>(DEFAULT_PROFILE);

export function ProfileProvider({ value, children }: { value: Profile; children: ReactNode }) {
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Profile {
  return useContext(ProfileContext);
}
