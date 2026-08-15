"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  initializeAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

/**
 * Browser-side Firebase. These values are public by design — they identify the
 * project and are visible in any client bundle. Access control comes from
 * Firebase Auth plus Firestore security rules, never from hiding this config.
 *
 * Analytics is deliberately not initialised: it needs consent handling and
 * isn't required for auth.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Reuse the existing app across hot reloads instead of re-initialising. */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let cachedAuth: Auth | undefined;

/**
 * Auth with an explicit persistence fallback chain.
 *
 * Firebase defaults to IndexedDB, which throws "Database is closing/hidden" in
 * embedded, sandboxed or backgrounded browser contexts. That failure is
 * avoidable here: the durable session is the httpOnly cookie minted by
 * /api/auth/session, and the client only needs to hold an ID token long enough
 * to exchange it. So if IndexedDB is unavailable we degrade to localStorage,
 * then sessionStorage, then memory — all of which are fine for that one hop.
 */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const app = getFirebaseApp();

  try {
    cachedAuth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // initializeAuth throws if auth was already initialised for this app
    // (e.g. across a hot reload) — fall back to the existing instance.
    cachedAuth = getAuth(app);
  }

  return cachedAuth;
}

/**
 * Storage handle for browser uploads.
 *
 * Files go browser → Storage directly rather than through a Server Action:
 * Next caps Server Action request bodies well below a typical photo, and
 * routing megabytes through the server adds nothing. storage.rules is what
 * enforces admin-only writes.
 */
export async function getFirebaseStorage() {
  const { getStorage } = await import("firebase/storage");
  return getStorage(getFirebaseApp());
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  // Always show the account chooser, so signing in as the wrong Google
  // account isn't a silent trap.
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
