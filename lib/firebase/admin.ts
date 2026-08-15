import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { cookies } from "next/headers";

/**
 * Server-side Firebase Admin.
 *
 * `server-only` at the top makes this a build error if it is ever imported
 * from a Client Component — the service account key must never reach the
 * browser.
 */

export const SESSION_COOKIE = "__session";
/** Firebase caps session cookies at 14 days. */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 14 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local — see .env.example for where each value comes from.`
    );
  }
  return value;
}

/**
 * Whether the service account credentials are present.
 *
 * Lets callers tell "you haven't finished setup" apart from "that sign-in was
 * rejected" — otherwise a missing key surfaces as a misleading auth failure.
 */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

let cachedApp: App | undefined;

function adminApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length) {
    cachedApp = existing[0];
    return cachedApp;
  }

  cachedApp = initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      // Stored with literal \n escapes in the env file; restore real newlines.
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });

  return cachedApp;
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminDb() {
  return getFirestore(adminApp());
}

/* -------------------------------------------------------------------------- */
/* Authorisation                                                              */
/* -------------------------------------------------------------------------- */

/** Emails allowed into /admin. Server-side only — never sent to the client. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * An account is an admin only if it is on the allowlist AND Google has
 * verified the address. Without the verified check, an unverified account
 * claiming an allowlisted address would pass.
 */
export function isAdmin(claims: { email?: string; email_verified?: boolean }): boolean {
  const email = claims.email?.toLowerCase();
  if (!email || !claims.email_verified) return false;
  return adminEmails().includes(email);
}

/**
 * Resolve the current admin from the session cookie, or null.
 *
 * `checkRevoked: true` costs a round trip but means signing out of Firebase,
 * or disabling the account, takes effect immediately rather than whenever the
 * cookie happens to expire.
 */
export async function getAdminUser(): Promise<DecodedIdToken | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const claims = await adminAuth().verifySessionCookie(session, true);
    return isAdmin(claims) ? claims : null;
  } catch {
    // Expired, revoked or tampered-with cookie — treat as signed out.
    return null;
  }
}
