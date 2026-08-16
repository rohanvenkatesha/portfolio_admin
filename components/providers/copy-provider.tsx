"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_COPY, type Copy, type CopyId, type SectionCopy } from "@/content/copy";

/**
 * Section copy, handed to Client Components.
 *
 * Same reasoning as the profile provider: every section is a Client Component
 * and none of them can reach the server data layer, so the copy is read once in
 * the page and read back here rather than threaded through nine prop lists.
 *
 * The default is the repo copy rather than null, so a section rendered outside
 * the provider still has a headline.
 */
const CopyContext = createContext<Copy>(DEFAULT_COPY);

export function CopyProvider({ value, children }: { value: Copy; children: ReactNode }) {
  return <CopyContext.Provider value={value}>{children}</CopyContext.Provider>;
}

/** The copy for one section. */
export function useCopy(id: CopyId): SectionCopy {
  return useContext(CopyContext)[id];
}
