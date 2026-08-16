import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/firebase/admin";
import { backupFilename, readBackup } from "@/lib/content/backup";

/** firebase-admin needs Node APIs; it cannot run on the edge runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Download every Firestore document the site reads, as one JSON file.
 *
 * A GET so it can be a plain link the browser saves — no client code, no blob
 * juggling. Gated by the same session check as every admin screen: this is a
 * complete copy of the site's content, and while none of it is secret, an
 * unauthenticated dump endpoint is not something to leave lying around.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const backup = await readBackup();

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${backupFilename(backup.exportedAt)}"`,
        // A snapshot is a point in time — never serve a stale one.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[backup] export failed:", error);
    return NextResponse.json({ error: "Could not build the backup." }, { status: 500 });
  }
}
