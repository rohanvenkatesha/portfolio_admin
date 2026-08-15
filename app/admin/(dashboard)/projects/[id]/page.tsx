import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getProjectsFresh } from "@/lib/content/projects";
import { ProjectForm } from "@/components/admin/project-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  const projects = await getProjectsFresh();
  const project = projects.find((p) => p.id === id);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-orange-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All projects
        </Link>

        <Link
          href={`/work/${project.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-orange-400"
        >
          View live page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {project.title}
        </h1>
        <p className="mt-2 font-mono text-[12px] text-zinc-600">{project.id}</p>
      </div>

      <ProjectForm project={project} />
    </div>
  );
}
