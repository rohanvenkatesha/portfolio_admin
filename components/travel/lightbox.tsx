"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { src: string; caption?: string };

/**
 * The image viewer, controlled by its parent.
 *
 * Shared rather than duplicated: the body's inline images open the same viewer
 * over the same list, so clicking a photo mid-paragraph and clicking it in the
 * gallery land on the same frame with the same navigation.
 */
export function Lightbox({
  images,
  index,
  onChange,
}: {
  images: GalleryImage[];
  index: number | null;
  onChange: (next: number | null) => void;
}) {
  const close = useCallback(() => onChange(null), [onChange]);
  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onChange((index + delta + images.length) % images.length);
    },
    [index, images.length, onChange]
  );

  // Keyboard drives the viewer: escape closes, arrows move. Bound only while
  // it's open so the page keeps its own arrow-key scrolling otherwise.
  useEffect(() => {
    if (index === null) return;

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
  }, [index, close, step]);

  if (index === null || !images[index]) return null;

  return (
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
          // Keyed on src so switching frames remounts and replays the entrance
          // rather than swapping the pixels in place.
          key={images[index].src}
          src={images[index].src}
          alt={images[index].caption ?? ""}
          width={1800}
          height={1200}
          className="h-auto max-h-[78vh] w-full rounded-sm object-contain"
        />

        <figcaption className="mt-4 flex items-center justify-between gap-4">
          <span className="text-[12.5px] text-zinc-400">{images[index].caption ?? ""}</span>
          <span className="shrink-0 font-mono text-[11px] text-zinc-600">
            {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
        </figcaption>
      </figure>
    </div>
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
