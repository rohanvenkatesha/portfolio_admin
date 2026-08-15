"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult, signInWithPopup, signInWithRedirect, type Auth } from "firebase/auth";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import { profile } from "@/content/site";

/**
 * Turn a Firebase auth error into something actionable.
 *
 * Each of these has a specific fix, and guessing between them wastes time —
 * so the raw code is always shown when there's no mapping.
 */
function explainAuthError(code: string, message = ""): string | null {
  // Storage-layer failures surface as plain Errors with no Firebase code.
  if (/database is closing|indexeddb|storage/i.test(message)) {
    return "Browser storage was unavailable during sign-in. Retrying with a full-page redirect…";
  }

  switch (code) {
    // User closed the popup — not an error worth showing.
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;

    case "auth/operation-not-allowed":
      return "Google sign-in isn't enabled. Firebase console → Authentication → Sign-in method → enable Google.";

    case "auth/configuration-not-found":
      return "Authentication isn't set up on this Firebase project yet. Open Authentication in the console, click Get started, then enable Google.";

    case "auth/unauthorized-domain":
      return "This domain isn't authorised. Firebase console → Authentication → Settings → Authorized domains.";

    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "The web API key is missing or wrong. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local, then restart the dev server — Next.js only reads env files at startup.";

    case "auth/network-request-failed":
      return "Network request failed — check your connection, VPN or ad blocker.";

    default:
      return `Sign-in failed (${code}). The browser console has the full error.`;
  }
}

/** Popup failures that are worth retrying as a full-page redirect. */
function shouldFallBackToRedirect(code: string, message: string) {
  return (
    /database is closing|indexeddb|storage/i.test(message) ||
    code === "auth/popup-blocked" ||
    code === "auth/popup-closed-by-user" ||
    code === "auth/operation-not-supported-in-this-environment" ||
    code === "auth/web-storage-unsupported"
  );
}

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Catch the most common setup mistake before Firebase gets involved: env
   * vars are inlined at build time, so editing .env.local without restarting
   * the dev server leaves these undefined.
   */
  const missingConfig =
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  /**
   * True until we know whether we're returning from a redirect sign-in.
   * Seeded from missingConfig so the "nothing to resolve" case needs no
   * setState inside the effect body.
   */
  const [resolving, setResolving] = useState(!missingConfig);

  /** Trade the Firebase ID token for the server-side session cookie. */
  const exchangeToken = useCallback(
    async (auth: Auth, idToken: string) => {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        // Server said no — drop the local session too, so nothing looks
        // half-signed-in.
        await auth.signOut().catch(() => {});
        setError(body.error ?? "Sign-in failed.");
        return false;
      }

      router.replace("/admin");
      router.refresh();
      return true;
    },
    [router]
  );

  // Handle the return leg of a redirect sign-in.
  useEffect(() => {
    if (missingConfig) return;

    let cancelled = false;

    (async () => {
      try {
        const auth = getFirebaseAuth();
        const result = await getRedirectResult(auth);
        if (result?.user && !cancelled) {
          const idToken = await result.user.getIdToken();
          await exchangeToken(auth, idToken);
        }
      } catch (err) {
        if (!cancelled) {
          const code = (err as { code?: string })?.code ?? "unknown";
          const message = (err as { message?: string })?.message ?? "";
          setError(explainAuthError(code, message));
          console.error("[admin sign-in: redirect]", code, err);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missingConfig, exchangeToken]);

  async function signIn() {
    setBusy(true);
    setError(null);

    const auth = getFirebaseAuth();

    try {
      const credential = await signInWithPopup(auth, getGoogleProvider());
      const idToken = await credential.user.getIdToken();
      await exchangeToken(auth, idToken);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "unknown";
      const message = (err as { message?: string })?.message ?? "";
      console.error("[admin sign-in: popup]", code, err);

      if (shouldFallBackToRedirect(code, message)) {
        /**
         * Popups background the parent page, and browsers freeze IndexedDB on
         * hidden pages — which is where "Database is closing/hidden" comes
         * from. A redirect navigates away and back instead, so the storage
         * layer is never mid-flight.
         */
        try {
          await signInWithRedirect(auth, getGoogleProvider());
          return; // navigating away; leave the button busy
        } catch (redirectErr) {
          const rCode = (redirectErr as { code?: string })?.code ?? "unknown";
          setError(explainAuthError(rCode, String(redirectErr)));
          console.error("[admin sign-in: redirect fallback]", rCode, redirectErr);
        }
      } else {
        setError(explainAuthError(code, message));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-8">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 font-mono text-sm font-bold text-white">
        {profile.initials}
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Admin sign-in</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
        Restricted to the site owner. Sign in with the Google account on the allowlist.
      </p>

      <button
        onClick={signIn}
        disabled={busy || resolving || missingConfig}
        className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy || resolving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {resolving ? "Checking…" : "Signing in…"}
          </>
        ) : (
          <>
            <GoogleGlyph />
            Continue with Google
          </>
        )}
      </button>

      {missingConfig ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12px] leading-relaxed text-amber-200"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Firebase web config not loaded. Check the NEXT_PUBLIC_FIREBASE_* values in .env.local,
          then restart the dev server — env files are only read at startup.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] leading-relaxed text-red-300"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      <p className="mt-6 flex items-start gap-2 border-t border-white/8 pt-5 text-[11px] leading-relaxed text-zinc-600">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
        Authorisation is verified on the server. Signing in with a non-allowlisted account will be
        rejected.
      </p>
    </div>
  );
}

/** Google's mark, inline so the button needs no external asset. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#fff"
        d="M12 11v2.8h4a3.5 3.5 0 0 1-1.5 2.3l2.4 1.9c1.4-1.3 2.2-3.2 2.2-5.5 0-.5-.05-1-.15-1.5H12z"
      />
      <path
        fill="#fff"
        d="M12 20c2 0 3.7-.7 4.9-1.9l-2.4-1.9c-.7.5-1.5.7-2.5.7-2 0-3.6-1.3-4.2-3.1H5.3v2A8 8 0 0 0 12 20z"
      />
      <path fill="#fff" d="M7.8 13.8a4.8 4.8 0 0 1 0-3.1v-2H5.3a8 8 0 0 0 0 7.1l2.5-2z" />
      <path
        fill="#fff"
        d="M12 7.6c1.1 0 2.1.4 2.9 1.2l2.1-2.1A8 8 0 0 0 5.3 8.7l2.5 2c.6-1.8 2.2-3.1 4.2-3.1z"
      />
    </svg>
  );
}
