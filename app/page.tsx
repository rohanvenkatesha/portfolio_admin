import type { ReactNode } from "react";
import { Shell } from "@/components/layout/shell";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { Capabilities } from "@/components/sections/capabilities";
import { Journey } from "@/components/sections/journey";
import { Work } from "@/components/sections/work";
import { Visuals } from "@/components/sections/visuals";
import { Travel } from "@/components/sections/travel";
import { About } from "@/components/sections/about";
import { CallToAction } from "@/components/sections/cta";
import type { SectionId } from "@/content/sections";
import { getActiveSections, getNavSections } from "@/lib/content/sections";
import { getProjects } from "@/lib/content/projects";
import { getPhotos } from "@/lib/content/photos";
import { getTrips } from "@/lib/content/trips";
import { getFilms } from "@/lib/content/films";
import { getCopy } from "@/lib/content/copy";
import { CopyProvider } from "@/components/providers/copy-provider";
import type { Film, Photo, Project, Trip } from "@/content/site";
import { HOME_LIMITS } from "@/content/limits";

/** Server-loaded data handed down to whichever sections need it. */
type PageData = {
  projects: Project[];
  photos: Photo[];
  trips: Trip[];
  /** Unsliced, for the globe — it plots every trip, not just the listed ones. */
  allTrips: Trip[];
  films: Film[];
  /** Full collection sizes, so sections can offer "view all". */
  totals: { photos: number; trips: number; films: number };
};

/**
 * Maps a section id to how it renders. Which of these appear, and in what
 * order, comes from the section config (Firestore, or the repo as fallback) —
 * this map only says what each id means and which data it needs.
 *
 * A render function rather than a bare component so sections can take props:
 * the client sections can't reach the server data layer themselves.
 */
const SECTION_RENDERERS: Record<SectionId, (data: PageData) => ReactNode> = {
  hero: () => <Hero />,
  capabilities: () => <Capabilities />,
  journey: () => <Journey />,
  work: ({ projects }) => <Work projects={projects} />,
  visuals: ({ photos, films, totals }) => (
    <Visuals photos={photos} films={films} totalPhotos={totals.photos} totalFilms={totals.films} />
  ),
  travel: ({ trips, allTrips, totals }) => (
    <Travel trips={trips} allTrips={allTrips} totalCount={totals.trips} />
  ),
  about: () => <About />,
  cta: () => <CallToAction />,
  // Contact is rendered by the footer, which they now share a panel with.
  contact: () => null,
};

export default async function Page() {
  const [sections, navSections, projects, photos, trips, films, copy] = await Promise.all([
    getActiveSections(),
    getNavSections(),
    getProjects(),
    getPhotos(),
    getTrips(),
    getFilms(),
    getCopy(),
  ]);

  /**
   * The home page is a shop window: it shows a curated slice and links to the
   * full archive. Admin ordering decides which items make the cut.
   */
  const data: PageData = {
    projects,
    photos: photos.slice(0, HOME_LIMITS.photos),
    trips: trips.slice(0, HOME_LIMITS.trips),
    allTrips: trips,
    films: films.slice(0, HOME_LIMITS.films),
    totals: { photos: photos.length, trips: trips.length, films: films.length },
  };

  return (
    /* Sections are Client Components and can't reach the data layer, so the
       copy is read once here and read back through context. */
    <CopyProvider value={copy}>
      <Shell navSections={navSections} />

      <main className="relative flex-1">
        {sections.map((section) => (
          <div key={section.id} className="contents">
            {SECTION_RENDERERS[section.id](data)}
          </div>
        ))}
      </main>

      <Footer
        projects={projects}
        navSections={navSections}
        withContact={sections.some((s) => s.id === "contact")}
      />
    </CopyProvider>
  );
}
