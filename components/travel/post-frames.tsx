"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import AccordionGallery from "@/components/vendor/reactbits/AccordionGallery";
import { Lightbox } from "@/components/travel/lightbox";
import type { GalleryImage } from "@/components/travel/lightbox";

/**
 * The frames.
 *
 * Two layouts, chosen by what the device can actually do rather than by width
 * alone. The accordion is a hover instrument: panels sit as slivers and the one
 * under the pointer opens. On a phone there is no pointer to open anything
 * with, and its panels collapse into a stack of letterboxed strips with the
 * labels overlapping — so touch gets a plain grid of tappable frames instead.
 *
 * Neither layout is the "mobile" one and the other the real one. They are the
 * same set of photographs arranged for the input available.
 */

const ACCORDION_QUERY = "(min-width: 640px) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(ACCORDION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * False on the server, so the grid is what renders first.
 *
 * That is the deliberate way round: the grid is the layout that works with no
 * JavaScript and on any input, and a device that can drive the accordion
 * swaps to it on hydration.
 */
function useAccordion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(ACCORDION_QUERY).matches,
    () => false
  );
}

export function PostFrames({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const accordion = useAccordion();

  if (images.length === 0) return null;

  /** Which panel was clicked, by its position among the panels. */
  const openClicked = (event: React.MouseEvent<HTMLDivElement>) => {
    const panel = (event.target as HTMLElement).closest(".group");
    if (!panel || !root.current) return;

    const index = [...root.current.querySelectorAll(".group")].indexOf(panel);
    if (index >= 0) setOpen(index);
  };

  return (
    <>
      {accordion ? (
        <>
          <div ref={root} onClick={openClicked}>
            <AccordionGallery
              items={images.map((image, i) => ({
                image: image.src,
                label: image.caption || `Frame ${String(i + 1).padStart(2, "0")}`,
                alt: image.caption ?? "",
              }))}
              // No `link`, so the component renders plain panels rather than
              // anchors and its own click is a no-op — which leaves the event
              // free for the lightbox, with no edit to the vendored file.
              trigger="hover"
              height={440}
              gap={10}
              radius={2}
              accentColor="var(--brand)"
            />
          </div>

          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-600">
            Hover to open · click for full size
          </p>
        </>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-2.5">
            {images.map((image, i) => (
              <li key={image.src + i}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={image.caption || `Open frame ${i + 1}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm border border-white/10 bg-panel-2"
                >
                  <Image
                    src={image.src}
                    alt={image.caption ?? ""}
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/85 to-transparent px-2.5 pb-2 pt-6 text-left font-mono text-[10px] tabular-nums text-white/80"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-600">
            Tap a frame for full size
          </p>
        </>
      )}

      <Lightbox images={images} index={open} onChange={setOpen} />
    </>
  );
}
