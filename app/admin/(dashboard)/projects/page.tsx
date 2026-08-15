import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProjectsFresh, isProjectsSeeded } from "@/lib/content/projects";
import { ProjectList } from "@/components/admin/project-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  // Fresh, not cached — the admin must see what they just saved.
  const [projects, seeded] = await Promise.all([getProjectsFresh(), isProjectsSeeded()]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-orange-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Overview
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Projects</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {seeded
            ? "Served from Firestore. Saving revalidates the live pages."
            : "Currently served from content/site.ts. Seed Firestore to start editing here."}
        </p>
      </div>

      <ProjectList projects={projects} seeded={seeded} />
    </div>
  );
}
