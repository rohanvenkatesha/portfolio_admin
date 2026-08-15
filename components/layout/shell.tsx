"use client";

import { useState } from "react";
import { Nav } from "./nav";
import { CommandPalette } from "./command-palette";
import { CustomCursor } from "@/components/fx/cursor";
import { GrainOverlay, ScrollProgress } from "@/components/fx/effects";
import { navSections as fallbackNavSections } from "@/content/sections";

export type NavSection = { id: string; label: string };

/**
 * Client-side chrome that wraps the page: cursor, grain, scroll progress, nav
 * and the command palette. Kept separate so `app/page.tsx` stays a Server
 * Component and only this shared state lives on the client.
 *
 * navSections is resolved on the server (Firestore, or the repo as fallback)
 * and passed down, so hiding a section removes its nav entry too.
 */
export function Shell({
  navSections = fallbackNavSections as unknown as NavSection[],
}: {
  navSections?: NavSection[];
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      {/* Pure-CSS intro veil: fades itself out, so it can never trap the page
          behind a stuck overlay if hydration is slow or fails. */}
      <div aria-hidden className="intro-veil">
        <span className="intro-veil__pulse" />
      </div>

      <ScrollProgress />
      <GrainOverlay />
      <CustomCursor />
      <Nav navSections={navSections} onOpenPalette={() => setPaletteOpen(true)} />
      <CommandPalette
        navSections={navSections}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </>
  );
}
