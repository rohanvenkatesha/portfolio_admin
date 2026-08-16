"use client";

import { useState } from "react";
import CircularGallery from "@/components/vendor/reactbits/CircularGallery";
import { Lightbox } from "@/components/travel/lightbox";
import type { GalleryImage } from "@/components/travel/lightbox";

/**
 * The gallery, as a curved reel you drag through.
 *
 * Replaces a flat grid of thumbnails. React Bits' CircularGallery renders the
 * frames on a bent plane in WebGL, so the set reads as one object you move
 * along rather than a table of pictures.
 *
 * The lightbox is kept and wired underneath it. The reel is for browsing at a
 * glance; actually looking at a photograph still wants it full size, and
 * losing that would trade a real capability for an effect.
 */
export function PostGalleryReel({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div
        // Fixed height: the canvas sizes itself to its container, and a height
        // that came from the images would collapse to zero before they load.
        className="relative h-[24rem] w-full cursor-grab active:cursor-grabbing sm:h-[30rem]"
      >
        <CircularGallery
          items={images.map((image, i) => ({
            image: image.src,
            text: image.caption || `Frame ${String(i + 1).padStart(2, "0")}`,
          }))}
          bend={2}
          borderRadius={0.02}
          scrollEase={0.05}
          font="600 22px Inter, system-ui, sans-serif"
        />
      </div>

      {/* The reel has no click handler of its own — dragging is its gesture —
          so the full-size view is reached from an explicit list beneath it. */}
      <div className="mt-6 flex flex-wrap gap-2">
        {images.map((image, i) => (
          <button
            key={image.src + i}
            type="button"
            onClick={() => setOpen(i)}
            className="rounded-sm border border-white/10 px-2.5 py-1.5 font-mono text-[10px] tabular-nums text-zinc-500 transition-colors hover:border-brand-500/60 hover:text-brand-400"
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>

      <Lightbox images={images} index={open} onChange={setOpen} />
    </>
  );
}
