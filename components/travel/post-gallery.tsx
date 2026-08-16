"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";
import { cn } from "@/lib/utils";

export type GalleryImage = { src: string; caption?: string };

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * Bento tiling.
 *
 * A six-tile repeating pattern: one hero, two squares, one wide, one tall, one
 * square. Cycling it means any number of images tiles without gaps and without
 * the grid degenerating into uniform thumbnails — the variation is what makes a
 * wall of photos read as a composition rather than a contact sheet.
 *
 * Row spans only apply from `sm`. On a phone the grid is two even columns:
 * a bento at 375px is just small rectangles in slightly different sizes.
 */
const BENTO = [
  "sm:col-span-2 sm:row-span-2",
  "sm:col-span-1 sm:row-span-1",
  "sm:col-span-1 sm:row-span-1",
  "sm:col-span-2 sm:row-span-1",
  "sm:col-span-1 sm:row-span-2",
  "sm:col-span-1 sm:row-span-1",
];

export function PostGallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? null : (i + delta + images.length) % images.length)),
    [images.length]
  );

  // Keyboard drives the lightbox: escape closes, arrows move. Bound only while
  // it's open so the page keeps its own arrow-key scrolling otherwise.
  useEffect(() => {
    if (open === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };

    window.addEventListener("keydown", onKey);
    // The page behind must not scroll under the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close, step]);

  if (images.length === 0) return null;

  return (
    <>
      <RevealGroup
        className="grid auto-rows-[8rem] grid-cols-2 gap-3 sm:auto-rows-[10rem] sm:grid-cols-4 lg:auto-rows-[11rem]"
        stagger={0.05}
      >
        {images.map((image, index) => (
          <RevealItem key={image.src + index} className={cn(BENTO[index % BENTO.length], "min-h-0")}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={image.caption || `Open image ${index + 1}`}
              className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/8 bg-panel-2 transition-colors duration-300 hover:border-brand-500/50"
            >
              <Image
                src={image.src}
                alt={image.caption ?? ""}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  "object-cover transition-transform duration-[900ms]",
                  EASE,
                  "group-hover:scale-[1.08]"
                )}
              />

              {/* Warm wash rises on hover, the same gesture as the philosophy
                  cards and the skill rows. */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-brand-500/35 via-brand-500/10 to-transparent transition-transform duration-500",
                  EASE,
                  "group-hover:scale-y-100"
                )}
              />

              <span
                aria-hidden
                className={cn(
                  "absolute right-3 top-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full border border-white/25 bg-void/50 opacity-0 backdrop-blur-md transition-all duration-500",
                  EASE,
                  "group-hover:translate-y-0 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:opacity-100"
                )}
              >
                <Expand className="h-3.5 w-3.5 text-white" />
              </span>

              {image.caption ? (
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-void/90 to-transparent px-4 pb-3.5 pt-8 text-left text-[11.5px] leading-snug text-white opacity-0 transition-all duration-500",
                    EASE,
                    "group-hover:translate-y-0 group-hover:opacity-100"
                  )}
                >
                  {image.caption}
                </span>
              ) : null}

              <span className="absolute left-3 top-3 font-mono text-[10px] text-white/50 transition-colors duration-300 group-hover:text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* ---------------- Lightbox ---------------- */}
      {open !== null ? (
        <div
          role="dialog"
          aria-modal
          aria-label="Image viewer"
          onClick={close}
          className="fixed inset-0 z-[90] grid place-items-center bg-void/96 p-4 backdrop-blur-xl [animation:dialog-overlay-in_200ms_ease-out] sm:p-8"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-zinc-300 transition-colors hover:border-brand-500 hover:bg-brand-500 hover:text-white sm:right-6 sm:top-6"
          >
            <X className="h-4 w-4" />
          </button>

          {images.length > 1 ? (
            <>
              <LightboxArrow side="left" onClick={() => step(-1)} />
              <LightboxArrow side="right" onClick={() => step(1)} />
            </>
          ) : null}

          <figure
            // Stop the backdrop's click-to-close firing from the image itself.
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-full w-full max-w-6xl [animation:dialog-content-in_280ms_var(--ease-out-expo)]"
          >
            <Image
              // Keyed on src so switching frames remounts and replays the
              // entrance rather than swapping the pixels in place.
              key={images[open].src}
              src={images[open].src}
              alt={images[open].caption ?? ""}
              width={1800}
              height={1200}
              className="h-auto max-h-[78vh] w-full rounded-2xl object-contain"
            />

            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <span className="text-[12.5px] text-zinc-400">{images[open].caption ?? ""}</span>
              <span className="shrink-0 font-mono text-[11px] text-zinc-600">
                {String(open + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}

function LightboxArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous image" : "Next image"}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 text-zinc-300 backdrop-blur-md transition-all duration-300 hover:border-brand-500 hover:bg-brand-500 hover:text-white sm:flex",
        side === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
