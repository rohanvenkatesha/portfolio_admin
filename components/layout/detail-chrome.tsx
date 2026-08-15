"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomCursor } from "@/components/fx/cursor";
import { GrainOverlay, ScrollProgress } from "@/components/fx/effects";
import { profile } from "@/content/site";

/**
 * Chrome for standalone detail routes.
 *
 * Deliberately lighter than the home page's <Shell>: the main nav is built
 * around same-page anchors, which would dead-link from here, so this offers a
 * single route back instead.
 */
export function DetailChrome({ backHref = "/", backLabel = "Back to portfolio" }: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <>
      <ScrollProgress />
      <GrainOverlay />
      <CustomCursor />

      <header className="fixed inset-x-0 top-0 z-[60] px-4 pt-4">
        <nav className="glass mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full px-5 py-3">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-brand-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            {backLabel}
          </Link>

          <Link href="/" className="flex items-center gap-2.5" aria-label={`${profile.name} — home`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 font-mono text-[11px] font-bold text-black">
              {profile.initials}
            </span>
          </Link>
        </nav>
      </header>
    </>
  );
}
