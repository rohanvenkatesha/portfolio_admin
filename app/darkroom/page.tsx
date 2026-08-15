import type { Metadata } from "next";
import { DetailChrome } from "@/components/layout/detail-chrome";
import { Footer } from "@/components/layout/footer";
import { getPhotos } from "@/lib/content/photos";
import { getFilms } from "@/lib/content/films";
import { DarkroomArchive } from "@/components/visuals/darkroom-archive";
import { profile } from "@/content/site";

export const metadata: Metadata = {
  title: "Darkroom — films & photography",
  description: `The full archive of ${profile.name}'s films and photography, with camera and lens details on every frame.`,
};

export default async function DarkroomPage() {
  const [photos, films] = await Promise.all([getPhotos(), getFilms()]);

  return (
    <>
      <DetailChrome backHref="/#visuals" backLabel="Back to portfolio" />

      <main className="relative flex-1 px-3 pt-28 sm:px-5 lg:px-6">
        <div className="mx-auto w-full max-w-[100rem]">
          <header className="rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 lg:px-14">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="eyebrow text-orange-500">Archive</span>
            </div>

            <h1 className="mt-4 max-w-3xl text-balance text-3xl font-bold leading-[1.06] tracking-tight text-white sm:text-4xl lg:text-5xl">
              The whole
              <br />
              <span className="text-orange-500">darkroom</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {films.length} {films.length === 1 ? "film" : "films"} and {photos.length}{" "}
              {photos.length === 1 ? "frame" : "frames"}. Click any frame for full EXIF.
            </p>
          </header>

          <DarkroomArchive photos={photos} films={films} />
        </div>
      </main>

      <Footer />
    </>
  );
}
