import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/firebase/admin";
import { AdminChrome } from "@/components/admin/admin-chrome";

/** Auth-gated: never prerender, never cache. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  // Belt and braces alongside the Disallow in robots.txt
  robots: { index: false, follow: false },
};

/**
 * Wraps every admin screen except the login page.
 *
 * Login sits at app/admin/login (outside this route group) so it isn't gated
 * by its own guard — otherwise signing out would redirect forever.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  /**
   * The gate. Runs on the server before any admin UI is rendered or sent, so
   * an unauthorised visitor never receives the markup — quite different from
   * hiding it behind a client-side conditional.
   */
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-svh bg-void">
      <AdminChrome email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
