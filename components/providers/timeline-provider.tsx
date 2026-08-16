"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_TIMELINE, type TimelineEntry } from "@/content/timeline";

/**
 * The Journey timeline, handed to Client Components.
 *
 * Same reasoning as the profile, copy and lists providers: the section is a
 * Client Component and can't reach the server data layer, so the timeline is
 * read once in the page rather than threaded through as a prop.
 */
const TimelineContext = createContext<TimelineEntry[]>(DEFAULT_TIMELINE);

export function TimelineProvider({
  value,
  children,
}: {
  value: TimelineEntry[];
  children: ReactNode;
}) {
  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimeline(): TimelineEntry[] {
  return useContext(TimelineContext);
}
