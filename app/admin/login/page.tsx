import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/firebase/admin";
import { LoginForm } from "@/components/admin/login-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * Public by design — it has to be reachable while signed out. Anyone can load
 * it; nobody gets anything without passing the server-side allowlist check in
 * /api/auth/session.
 */
export default async function LoginPage() {
  // Already signed in? Skip straight through.
  const user = await getAdminUser();
  if (user) redirect("/admin");

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-void px-4">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-600/10 blur-[120px]" />
      <LoginForm />
    </div>
  );
}
