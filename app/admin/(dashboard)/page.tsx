import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Film,
  FolderGit2,
  LayoutList,
  MapPin,
  Milestone,
  NotebookPen,
  Type,
  UserRound,
} from "lucide-react";
import { getSectionsFresh } from "@/lib/content/sections";
import { getProjectsFresh } from "@/lib/content/projects";
import { getPhotosFresh } from "@/lib/content/photos";
import { getTripsFresh } from "@/lib/content/trips";
import { getFilmsFresh } from "@/lib/content/films";
import { getPostsFresh } from "@/lib/content/posts";
import { getThemeFresh } from "@/lib/content/theme";
import { SectionManager } from "@/components/admin/section-manager";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { Card, Eyebrow, Group } from "@/components/admin/admin-ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [theme, sections, projects, photos, trips, films, posts] = await Promise.all([
    getThemeFresh(),
    getSectionsFresh(),
    getProjectsFresh(),
    getPhotosFresh(),
    getTripsFresh(),
    getFilmsFresh(),
    getPostsFresh(),
  ]);

  const published = posts.filter((post) => post.published).length;
  const drafts = posts.length - published;

  return (
    <div className="space-y-14 pb-8">
      {/* ---------------- Masthead ---------------- */}
      <header>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-4 text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl">
          Everything on the site,
          <br />
          <span className="text-brand-500">editable from here</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Changes publish immediately — the live pages revalidate in the background. Nothing here
          needs a deploy.
        </p>
      </header>

      {/* ---------------- Collections ---------------- */}
      <Group
        eyebrow="Collections"
        lead="The things"
        accent="you've made"
        description="Ordering decides what reaches the home page; everything else lives on its index route."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            href="/admin/projects"
            icon={FolderGit2}
            title="Projects"
            description="Case studies, stacks and cover images."
            count={projects.length}
          />
          <Card
            href="/admin/photos"
            icon={Camera}
            title="Photos"
            description="Frames, captions and EXIF."
            count={photos.length}
          />
          <Card
            href="/admin/films"
            icon={Film}
            title="Films"
            description="Titles, roles and embeds."
            count={films.length}
          />
          <Card
            href="/admin/trips"
            icon={MapPin}
            title="Trips"
            description="Guides, itineraries and covers."
            count={trips.length}
          />
        </div>

        {/* Posts hang off trips rather than having a route of their own, so
            they get a line here instead of a card that would mislead. */}
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-panel px-5 py-4 text-[12px] text-zinc-500">
          <NotebookPen className="h-3.5 w-3.5 text-brand-500" />
          <span className="font-mono text-white">{published}</span> published blog{" "}
          {published === 1 ? "post" : "posts"}
          {drafts ? (
            <>
              {" · "}
              <span className="font-mono text-white">{drafts}</span>{" "}
              {drafts === 1 ? "draft" : "drafts"}
            </>
          ) : null}
          <span className="text-zinc-600">— written inside a trip.</span>
        </p>
      </Group>

      {/* ---------------- Words ---------------- */}
      <Group
        eyebrow="Words"
        lead="What the site"
        accent="says about you"
        description="Your identity, the headline above each section, and the card lists inside them."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Card
            href="/admin/profile"
            icon={UserRound}
            title="Profile & identity"
            description="Name, rotating roles, bio, contact details, portrait, tech strip and social links."
          />
          <Card
            href="/admin/headings"
            icon={Type}
            title="Headings & intros"
            description="The label, headline and paragraph that open each of the nine sections."
          />
          <Card
            href="/admin/timeline"
            icon={Milestone}
            title="Journey"
            description="Roles, education, honours and milestones across both tracks."
          />
          <Card
            href="/admin/lists"
            icon={LayoutList}
            title="Services & skills"
            description="The cards under the hero, the stat counters, principles and the skill matrix."
          />
        </div>
      </Group>

      {/* ---------------- Appearance ---------------- */}
      <Group
        eyebrow="Appearance"
        lead="How it"
        accent="looks and flows"
        description="Colour drives the whole accent ramp; the order below is the order visitors scroll through."
      >
        <div className="space-y-3">
          <ThemeEditor initial={theme} />
          <SectionManager sections={sections} />
        </div>
      </Group>

      <Link
        href="/"
        target="_blank"
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
      >
        Open the live site
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" />
      </Link>
    </div>
  );
}
