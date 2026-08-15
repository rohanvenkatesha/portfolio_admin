"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
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
  ArrowUpRight,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem, SectionHeading } from "@/components/fx/reveal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  films as fallbackFilms,
  photos as fallbackPhotos,
  type Film,
  type Photo,
} from "@/content/site";
import { cn } from "@/lib/utils";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** Photos come from the server (Firestore, or the repo as fallback). */
export function Visuals({
  photos = fallbackPhotos,
  films = fallbackFilms,
  totalPhotos,
  totalFilms,
}: {
  photos?: Photo[];
  films?: Film[];
  /** Full collection sizes, when the lists above are truncated selections. */
  totalPhotos?: number;
  totalFilms?: number;
}) {
  const [activeFilm, setActiveFilm] = useState<Film | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  /** Which strip of the accordion gallery is expanded. */
  const [expanded, setExpanded] = useState(0);

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
    <section id="visuals" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        <SectionHeading
          eyebrow="Visual Storytelling"
          title={
            <>
              The other half,
              <br />
              <span className="text-orange-500">shot on location</span>
            </>
          }
          description="Films and frames from the practice that runs alongside the engineering. Shot, cut and graded end to end — usually alone, usually somewhere with bad wifi."
        />

        {/* ---------------- Films ---------------- */}
        <div className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <Clapperboard className="h-4 w-4 text-orange-500" />
            <h3 className="eyebrow text-zinc-400">Films &amp; Reels</h3>
            <div className="h-px flex-1 bg-white/8" />
            {totalFilms && totalFilms > films.length ? (
              <Link
                href="/darkroom"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-500 transition-colors hover:text-orange-400"
              >
                all {totalFilms}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : null}
          </div>

          <RevealGroup className="grid gap-4 md:grid-cols-3" stagger={0.09}>
            {films.map((film) => (
              <RevealItem key={film.id}>
                <button
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-colors duration-500 group-hover:from-black/80" />

                  {/* Play control grows and warms on hover */}
                  <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-orange-400/70 group-hover:bg-orange-500/30">
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  </span>

                  <span className="absolute right-4 top-4 rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-200 backdrop-blur-sm">
                    {film.runtime}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                    <span className="eyebrow text-[10px] text-orange-400">{film.year}</span>
                    <h4 className="mt-1 text-lg font-semibold text-white">{film.title}</h4>
                    {/* Role slides open on hover */}
                    <p className="max-h-0 overflow-hidden text-[12px] text-zinc-300 opacity-0 transition-all duration-500 group-hover:max-h-12 group-hover:opacity-100">
                      {film.role}
                    </p>
                  </div>
                </button>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* ---------------- Photography: expanding accordion ---------------- */}
        <div className="mt-14">
          <div className="mb-5 flex items-center gap-3">
            <Camera className="h-4 w-4 text-orange-500" />
            <h3 className="eyebrow text-zinc-400">Photography</h3>
            <div className="h-px flex-1 bg-white/8" />
            <span className="hidden font-mono text-[11px] text-zinc-600 sm:block">
              hover to expand
            </span>
            {totalPhotos && totalPhotos > photos.length ? (
              <Link
                href="/darkroom"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-500 transition-colors hover:text-orange-400"
              >
                all {totalPhotos}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : null}
          </div>

          <Reveal direction="up">
            {/* Desktop: strips that flex-grow into the hovered frame.
                Mobile: a plain grid, since there's no hover to drive it. */}
            <div className="hidden h-[30rem] gap-2.5 lg:flex">
              {photos.map((photo, index) => {
                const isOpen = expanded === index;
                return (
                  <button
                    key={photo.id}
                    onMouseEnter={() => setExpanded(index)}
                    onFocus={() => setExpanded(index)}
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`${photo.title} — view larger`}
                    className="group relative overflow-hidden rounded-2xl border border-white/8 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ flexGrow: isOpen ? 5 : 1, flexBasis: 0 }}
                  >
                    <PhotoSurface photo={photo} sizes="(max-width: 1024px) 100vw, 50vw" />
                    <div
                      className={cn(
                        "absolute inset-0 transition-all duration-700",
                        isOpen
                          ? "bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                          : "bg-black/55"
                      )}
                    />

                    {/* Collapsed: vertical title. Expanded: full caption + EXIF. */}
                    <span
                      className={cn(
                        "absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 transition-opacity duration-500 [writing-mode:vertical-rl]",
                        isOpen ? "opacity-0" : "opacity-100"
                      )}
                    >
                      {photo.title}
                    </span>

                    <div
                      className={cn(
                        "absolute inset-x-0 bottom-0 p-6 text-left transition-all duration-700",
                        isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                      )}
                    >
                      <span className="eyebrow text-[10px] text-orange-400">{photo.location}</span>
                      <h4 className="mt-1.5 text-2xl font-semibold text-white">{photo.title}</h4>
                      <ExifRow photo={photo} compact className="mt-3" />
                    </div>

                    {/* Accent rail wipes in on the expanded frame */}
                    <span
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-0.5 origin-left bg-orange-500 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        isOpen ? "scale-x-100" : "scale-x-0"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Mobile grid */}
            <div className="grid grid-cols-2 gap-2.5 lg:hidden">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/8"
                >
                  <PhotoSurface photo={photo} sizes="50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                    <p className="text-sm font-semibold text-white">{photo.title}</p>
                    <p className="text-[10px] text-zinc-400">{photo.location}</p>
                  </div>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {/* ---------------- Film player modal ---------------- */}
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
                  /* No embed configured yet — show the reel plate instead of a broken frame */
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-t-2xl bg-black/60">
                    <FilmIcon className="h-8 w-8 text-zinc-500" />
                    <p className="max-w-xs text-center text-xs leading-relaxed text-zinc-500">
                      Add a YouTube or Vimeo embed URL for this film in
                      <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                        content/site.ts
                      </code>
                      to activate the player.
                    </p>
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

      {/* ---------------- Photo lightbox ---------------- */}
      <Dialog open={activePhoto !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl p-0">
          {activePhoto ? (
            <div>
              <div className="group relative aspect-[3/2] w-full overflow-hidden rounded-t-2xl">
                <PhotoSurface photo={activePhoto} sizes="(max-width: 1024px) 100vw, 900px" />

                <button
                  onClick={showPrev}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:border-orange-400/60 hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={showNext}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:border-orange-400/60 hover:bg-black/70"
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
                <ExifRow photo={activePhoto} className="mt-5" />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/** Renders the real photo when a src exists, otherwise a cinematic plate. */
function PhotoSurface({ photo, sizes }: { photo: Photo; sizes: string }) {
  if (photo.src) {
    return (
      <Image
        src={photo.src}
        alt={`${photo.title} — ${photo.location}`}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br transition-transform duration-[900ms] ease-out group-hover:scale-105",
        photo.gradient
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
      <Aperture className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/12" />
    </div>
  );
}

function ExifRow({
  photo,
  compact = false,
  className,
}: {
  photo: Photo;
  compact?: boolean;
  className?: string;
}) {
  const items = [
    { icon: Camera, value: photo.exif.camera },
    { icon: Aperture, value: photo.exif.aperture },
    { icon: Gauge, value: `ISO ${photo.exif.iso}` },
    { icon: Timer, value: photo.exif.shutter },
    { icon: FilmIcon, value: photo.exif.focal },
  ];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map(({ icon: Icon, value }, i) => (
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/50 font-mono text-zinc-300 backdrop-blur-sm",
            compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
          )}
        >
          <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
          {value}
        </motion.span>
      ))}
    </div>
  );
}
