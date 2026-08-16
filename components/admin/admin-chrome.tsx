"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ExternalLink, Loader2 } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useProfile } from "@/components/providers/profile-provider";
import { AdminNav } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

/**
 * One class for both chips in the bar, so their padding, type and shape can't
 * drift apart later — only the hover colour differs.
 */
const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-300 transition-colors";

/** Top bar for the admin area: who you are, and the way out. */
export function AdminChrome({ email }: { email: string }) {
  const profile = useProfile();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      // Clear the server session cookie first — that's the thing that
      // actually grants access — then the local Firebase session.
      await fetch("/api/auth/session", { method: "DELETE" });
      await getFirebaseAuth().signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-panel/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        {/* `min-w-0` so the email can actually truncate: a flex item defaults
            to min-width:auto and refuses to shrink below its content, which
            pushed the whole bar 14px past the viewport on a phone. */}
        <Link href="/admin" className="group flex min-w-0 items-center gap-3">
          {/* Same mark as the public nav, on the same rung of the ember ramp */}
          <span className="ember-fill-hot flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[11px] font-bold text-[var(--brand-ink)] group-hover:ember-fill-hotter">
            {profile.initials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Admin</p>
            <p className="truncate font-mono text-[11px] text-zinc-500">{email}</p>
          </div>
        </Link>

        {/* Icon-only on a phone. Both labels plus the email overran the bar,
            and losing an action is worse than losing its wording. */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Both lead with their icon. They were mirrored — one trailing, one
              leading — so the two marks zigzagged instead of sharing an edge,
              even though the boxes themselves lined up exactly. */}
          <Link
            href="/"
            target="_blank"
            aria-label="View site"
            className={cn(chipClass, "hover:border-white/30 hover:text-white")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View site</span>
          </Link>

          <button
            onClick={signOut}
            disabled={signingOut}
            aria-label="Sign out"
            className={cn(chipClass, "hover:border-brand-500 hover:text-brand-300 disabled:opacity-60")}
          >
            {signingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-2.5 sm:px-6">
        <AdminNav />
      </div>
    </header>
  );
}
