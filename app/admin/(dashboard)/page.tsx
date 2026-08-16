import Link from "next/link";
import { ArrowUpRight, Camera, Film, FolderGit2, LayoutList, MapPin, Type, UserRound } from "lucide-react";
import { getSectionsFresh } from "@/lib/content/sections";
import { getProjectsFresh } from "@/lib/content/projects";
import { getPhotosFresh } from "@/lib/content/photos";
import { getTripsFresh } from "@/lib/content/trips";
import { getFilmsFresh } from "@/lib/content/films";
import { SectionManager } from "@/components/admin/section-manager";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { getThemeFresh } from "@/lib/content/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [theme, sections, projects, photos, trips, films] = await Promise.all([
    getThemeFresh(),
    getSectionsFresh(),
    getProjectsFresh(),
    getPhotosFresh(),
    getTripsFresh(),
    getFilmsFresh(),
  ]);

  const counts = [
    { label: "Projects", value: projects.length, icon: FolderGit2, href: "/admin/projects" },
    { label: "Photos", value: photos.length, icon: Camera, href: "/admin/photos" },
    { label: "Trips", value: trips.length, icon: MapPin, href: "/admin/trips" },
    { label: "Films", value: films.length, icon: Film, href: "/admin/films" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Overview</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Changes publish immediately — the live pages revalidate in the background.
        </p>
      </div>

      {/* Counts */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ label, value, icon: Icon, href }) => {
          const body = (
            <>
              <Icon className="h-4 w-4 text-zinc-600" />
              <p className="mt-4 font-mono text-3xl font-bold text-white">{value}</p>
              <p className="mt-1 text-[12px] text-zinc-500">{label}</p>
            </>
          );

          return href ? (
            <Link
              key={label}
              href={href}
              className="group rounded-2xl border border-white/8 bg-panel p-5 transition-colors hover:border-brand-500/40"
            >
              {body}
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
                Manage <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <div key={label} className="rounded-2xl border border-white/8 bg-panel p-5">
              {body}
              <span className="mt-3 block text-[11px] text-zinc-700">Editing in a later phase</span>
            </div>
          );
        })}
      </div>

      {/* Everything identifying you — name, bio, contact, portrait, links */}
      <Link
        href="/admin/profile"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-panel p-6 transition-colors hover:border-brand-500/40"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserRound className="h-4 w-4 text-brand-500" />
            Profile
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-zinc-600">
            Name, rotating roles, bio, contact details, portrait, tech strip and social links.
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400" />
      </Link>

      {/* Every section's eyebrow, headline and description */}
      <Link
        href="/admin/copy"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-panel p-6 transition-colors hover:border-brand-500/40"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Type className="h-4 w-4 text-brand-500" />
            Section copy
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-zinc-600">
            The eyebrow, headline and description above all nine sections.
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400" />
      </Link>

      {/* The repeating card lists behind Services and About */}
      <Link
        href="/admin/lists"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-panel p-6 transition-colors hover:border-brand-500/40"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <LayoutList className="h-4 w-4 text-brand-500" />
            Services, numbers, principles &amp; skills
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-zinc-600">
            The cards under the hero, the stat counters, and everything inside About.
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400" />
      </Link>

      <ThemeEditor initial={theme} />

      <SectionManager sections={sections} />

      <Link
        href="/"
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
      >
        Open the live site
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
