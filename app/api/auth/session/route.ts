import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  adminAuth,
  isAdmin,
  isAdminConfigured,
} from "@/lib/firebase/admin";

/** firebase-admin needs Node APIs; it cannot run on the edge runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchange a Firebase ID token for an httpOnly session cookie.
 *
 * The allowlist is enforced here, on the server, before any cookie is minted.
 * A client-side email check would be trivially bypassed by calling this
 * endpoint directly — this is the real gate.
 */
export async function POST(request: Request) {
  // Distinguish incomplete setup from a rejected sign-in, so a missing
  // service account key doesn't look like an auth failure.
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Server not configured: add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local, then restart the dev server.",
      },
      { status: 503 }
    );
  }

  let idToken: string | undefined;

  try {
    const body = (await request.json()) as { idToken?: string };
    idToken = body.idToken;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: "Missing ID token." }, { status: 400 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    if (!isAdmin(decoded)) {
      // Deliberately vague: don't reveal who is or isn't on the allowlist.
      return NextResponse.json({ error: "This account is not authorised." }, { status: 403 });
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });

    return NextResponse.json({ ok: true, email: decoded.email });
  } catch {
    return NextResponse.json({ error: "Could not verify that sign-in." }, { status: 401 });
  }
}

/** Sign out: clear the cookie and revoke refresh tokens for the session. */
export async function DELETE() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;

  if (session) {
    try {
      const claims = await adminAuth().verifySessionCookie(session);
      await adminAuth().revokeRefreshTokens(claims.sub);
    } catch {
      // Already invalid — clearing the cookie below is enough.
    }
  }

  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
