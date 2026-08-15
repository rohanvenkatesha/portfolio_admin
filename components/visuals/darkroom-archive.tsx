"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Aperture,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film as FilmIcon,
  Gauge,
  Play,
  Timer,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Film, Photo } from "@/content/site";
import { cn } from "@/lib/utils";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** How many frames to add each time "load more" is pressed. */
const PAGE_SIZE = 24;

/**
 * The full archive.
 *
 * Deliberately a masonry grid rather than the home page's accordion: the
 * accordion divides one row between all its strips, so it degrades badly past
 * about eight frames. A grid reads the same at eight or eight hundred.
 *
 * Frames are paged in rather than all mounted at once — a few hundred
 * <Image> elements is a lot of DOM and a lot of decode work, even lazily
 * loaded.
 */
export function DarkroomArchive({ photos, films }: { photos: Photo[]; films: Film[] }) {
  const [activeFilm, setActiveFilm] = useState<Film | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const visible = useMemo(() => photos.slice(0, shown), [photos, shown]);
  const remaining = photos.length - visible.length;

  const showPrev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, showPrev, showNext]);

  const activePhoto = lightboxIndex === null ? null : photos[lightboxIndex];

  return (
    <>
      {/* ---------------- Films ---------------- */}
      {films.length > 0 ? (
        <section className="mt-3 rounded-[1.75rem] border border-white/8 bg-panel px-6 py-12 sm:px-10 lg:px-14">
          <div className="mb-6 flex items-center gap-3">
            <Clapperboard className="h-4 w-4 text-orange-500" />
            <h2 className="eyebrow text-zinc-400">Films &amp; Reels</h2>
            <div className="h-px flex-1 bg-white/8" />
            <span className="font-mono text-[11px] text-zinc-600">{films.length}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {films.map((film) => (
              <button
                key={film.id}
                onClick={() => setActiveFilm(film)}
                data-cursor="view"
                data-cursor-label="PLAY"
                className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-white/8"
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br transition-transform duration-700 ease-out group-hover:scale-105",
                    film.gradient
                  )}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
                    style={{ backgroundImage: GRAIN }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-orange-400/70 group-hover:bg-orange-500/30">
                  <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                </span>

                <span className="absolute right-4 top-4 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-200 backdrop-blur-sm">
                  {film.runtime}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                  <span className="eyebrow text-[10px] text-orange-400">{film.year}</span>
                  <h3 className="mt-1 text-lg font-semibold text-white">{film.title}</h3>
                  <p className="text-[12px] text-zinc-400">{film.role}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- Photography ---------------- */}
      <section className="mt-3 rounded-[1.75rem] border border-white/8 bg-panel px-6 py-12 sm:px-10 lg:px-14">
        <div className="mb-6 flex items-center gap-3">
          <Camera className="h-4 w-4 text-orange-500" />
          <h2 className="eyebrow text-zinc-400">Photography</h2>
          <div className="h-px flex-1 bg-white/8" />
          <span className="font-mono text-[11px] text-zinc-600">
            {visible.length} / {photos.length}
          </span>
        </div>

        {photos.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">No frames published yet.</p>
        ) : (
          <>
            {/* CSS columns give a masonry feel without measuring anything */}
            <div className="columns-2 gap-3 sm:columns-3 xl:columns-4 [&>*]:mb-3">
              {visible.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  data-cursor="view"
                  data-cursor-label="VIEW"
                  className={cn(
                    "group relative block w-full break-inside-avoid overflow-hidden rounded-xl border border-white/8",
                    photo.span === "tall"
                      ? "aspect-[3/4]"
                      : photo.span === "wide"
                        ? "aspect-[4/3]"
                        : "aspect-square"
                  )}
                >
                  <PhotoSurface photo={photo} />
                  <div className="absolute inset-0 bg-black/30 transition-colors duration-500 group-hover:bg-black/10" />

                  <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/90 to-transparent p-3 text-left opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="truncate text-[13px] font-semibold text-white">{photo.title}</p>
                    <p className="truncate text-[10px] text-zinc-400">{photo.location}</p>
                  </div>
                </button>
              ))}
            </div>

            {remaining > 0 ? (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="rounded-full border border-white/12 bg-panel-2 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-orange-500/50 hover:text-orange-300"
                >
                  Load {Math.min(remaining, PAGE_SIZE)} more
                  <span className="ml-2 font-mono text-[11px] text-zinc-600">
                    {remaining} left
                  </span>
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* ---------------- Film player ---------------- */}
      <Dialog open={activeFilm !== null} onOpenChange={(open) => !open && setActiveFilm(null)}>
        <DialogContent className="p-0">
          {activeFilm ? (
            <div>
              <div className={cn("relative aspect-video w-full bg-gradient-to-br", activeFilm.gradient)}>
                {activeFilm.embedUrl ? (
                  <iframe
                    src={activeFilm.embedUrl}
                    title={activeFilm.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full rounded-t-2xl"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-t-2xl bg-black/60">
                    <FilmIcon className="h-8 w-8 text-zinc-500" />
                    <p className="text-xs text-zinc-500">No video link yet.</p>
                  </div>
                )}
              </div>
              <div className="p-8">
                <span className="eyebrow text-orange-400">
                  {activeFilm.year} · {activeFilm.runtime}
                </span>
                <DialogTitle className="mt-3">{activeFilm.title}</DialogTitle>
                <p className="mt-1.5 text-sm text-zinc-500">{activeFilm.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">{activeFilm.synopsis}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ---------------- Lightbox ---------------- */}
      <Dialog open={activePhoto !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl p-0">
          {activePhoto ? (
            <div>
              <div className="group relative aspect-[3/2] w-full overflow-hidden rounded-t-2xl">
                <PhotoSurface photo={activePhoto} priority />

                <button
                  onClick={showPrev}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:border-orange-400/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={showNext}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:border-orange-400/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] text-zinc-300 backdrop-blur-sm">
                  {(lightboxIndex ?? 0) + 1} / {photos.length}
                </span>
              </div>

              <div className="p-7">
                <DialogTitle className="text-xl">{activePhoto.title}</DialogTitle>
                <p className="mt-1 text-sm text-zinc-400">{activePhoto.location}</p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {[
                    { icon: Camera, value: activePhoto.exif.camera },
                    { icon: Aperture, value: activePhoto.exif.aperture },
                    { icon: Gauge, value: `ISO ${activePhoto.exif.iso}` },
                    { icon: Timer, value: activePhoto.exif.shutter },
                    { icon: FilmIcon, value: activePhoto.exif.focal },
                  ]
                    .filter((item) => item.value && item.value !== "ISO ")
                    .map(({ icon: Icon, value }) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/50 px-2 py-1 font-mono text-[10px] text-zinc-300"
                      >
                        <Icon className="h-3 w-3" />
                        {value}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Real photo when a src exists, otherwise a gradient plate. */
function PhotoSurface({ photo, priority = false }: { photo: Photo; priority?: boolean }) {
  if (photo.src) {
    return (
      <Image
        src={photo.src}
        alt={`${photo.title} — ${photo.location}`}
        fill
        priority={priority}
        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br transition-transform duration-700 ease-out group-hover:scale-105",
        photo.gradient
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
      <Aperture className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white/12" />
    </div>
  );
}
