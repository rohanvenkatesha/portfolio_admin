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
import { Contact } from "@/components/sections/contact";
import type { SectionId } from "@/content/sections";
import { getActiveSections, getNavSections } from "@/lib/content/sections";
import { getProjects } from "@/lib/content/projects";
import { getPhotos } from "@/lib/content/photos";
import { getTrips } from "@/lib/content/trips";
import { getFilms } from "@/lib/content/films";
import type { Film, Photo, Project, Trip } from "@/content/site";
import { HOME_LIMITS } from "@/content/limits";

/** Server-loaded data handed down to whichever sections need it. */
type PageData = {
  projects: Project[];
  photos: Photo[];
  trips: Trip[];
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
  travel: ({ trips, totals }) => <Travel trips={trips} totalCount={totals.trips} />,
  about: () => <About />,
  cta: () => <CallToAction />,
  contact: () => <Contact />,
};

export default async function Page() {
  const [sections, navSections, projects, photos, trips, films] = await Promise.all([
    getActiveSections(),
    getNavSections(),
    getProjects(),
    getPhotos(),
    getTrips(),
    getFilms(),
  ]);

  /**
   * The home page is a shop window: it shows a curated slice and links to the
   * full archive. Admin ordering decides which items make the cut.
   */
  const data: PageData = {
    projects,
    photos: photos.slice(0, HOME_LIMITS.photos),
    trips: trips.slice(0, HOME_LIMITS.trips),
    films: films.slice(0, HOME_LIMITS.films),
    totals: { photos: photos.length, trips: trips.length, films: films.length },
  };

  return (
    <>
      <Shell navSections={navSections} />

      <main className="relative flex-1">
        {sections.map((section) => (
          <div key={section.id} className="contents">
            {SECTION_RENDERERS[section.id](data)}
          </div>
        ))}
      </main>

      <Footer projects={projects} navSections={navSections} />
    </>
  );
}
