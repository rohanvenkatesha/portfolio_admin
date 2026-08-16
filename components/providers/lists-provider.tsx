"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LISTS, type Lists } from "@/content/lists";

/**
 * The Services and About card lists, handed to Client Components.
 *
 * Same reasoning as the profile and copy providers: both sections are Client
 * Components and neither can reach the server data layer, so the lists are read
 * once in the page rather than threaded through as props.
 *
 * The default is the repo content rather than null, so a section rendered
 * outside the provider still shows something real.
 */
const ListsContext = createContext<Lists>(DEFAULT_LISTS);

export function ListsProvider({ value, children }: { value: Lists; children: ReactNode }) {
  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists(): Lists {
  return useContext(ListsContext);
}
