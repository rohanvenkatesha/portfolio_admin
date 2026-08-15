import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { ProjectDetail } from "@/components/work/project-detail";
import { Aurora } from "@/components/fx/effects";
import { profile } from "@/content/site";
import { getProjects } from "@/lib/content/projects";

/** Prerender every project at build time — the content is fully static. */
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const projects = await getProjects();
  const project = projects.find((p) => p.slug === slug);

  if (!project) return { title: "Project not found" };

  const description = `${project.blurb} Built with ${project.stack.slice(0, 4).join(", ")}.`;

  return {
    title: project.title,
    description,
    openGraph: {
      type: "article",
      title: `${project.title} — ${profile.name}`,
      description,
    },
    twitter: { card: "summary_large_image", title: project.title, description },
  };
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];

  if (!project) notFound();

  // Wrap around so there's always somewhere to go next
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <>
      <DetailChrome backHref="/#work" backLabel="All work" />

      <main className="relative flex-1 pt-28">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <Aurora className="opacity-60" />

        <article className="relative mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
          <div className="glass overflow-hidden rounded-2xl">
            <ProjectDetail project={project} headingLevel="h1" />
          </div>

          {/* Prev / next */}
          <nav className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/work/${previous.slug}`}
              className="glass group rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <span className="eyebrow flex items-center gap-1.5 text-zinc-500">
                <ArrowLeft className="h-3 w-3" />
                Previous
              </span>
              <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-orange-200">
                {previous.title}
              </span>
            </Link>

            <Link
              href={`/work/${next.slug}`}
              className="glass group rounded-2xl p-5 text-right transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <span className="eyebrow flex items-center justify-end gap-1.5 text-zinc-500">
                Next
                <ArrowRight className="h-3 w-3" />
              </span>
              <span className="mt-2 block font-semibold text-white transition-colors group-hover:text-orange-200">
                {next.title}
              </span>
            </Link>
          </nav>
        </article>
      </main>

      <Footer />
    </>
  );
}
