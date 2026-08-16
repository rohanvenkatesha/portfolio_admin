"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ExternalLink, Loader2 } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useProfile } from "@/components/providers/profile-provider";

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
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-mono text-[11px] font-bold text-[var(--brand-ink)]">
            {profile.initials}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Admin</p>
            <p className="truncate font-mono text-[11px] text-zinc-500">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            View site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-300 transition-colors hover:border-brand-500 hover:text-brand-300 disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
