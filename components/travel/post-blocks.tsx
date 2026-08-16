"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Quote } from "lucide-react";
import { youtubeEmbedUrl, youtubeThumbnail, type PostBlock } from "@/content/posts";
import { cn } from "@/lib/utils";

/**
 * Renders a post body.
 *
 * Every block maps to a component here, so stored content is data all the way
 * through and never becomes markup. That's what removes the need for a
 * sanitiser: there is no path from a stored string to innerHTML.
 */
/**
 * Text sits on a reading measure; media runs the full column.
 *
 * A long post set at the same width as its photographs is tiring to read. In
 * this column the prose was running 105 characters a line — well past the 60–75
 * the eye tracks comfortably. Constraining only the text gives the images room
 * and gives the page its rhythm, without either needing to know about the other.
 *
 * Not `ch`: that unit measures the "0" glyph, which in this typeface is 12.4px
 * against an average prose character of about 7.6px, so `68ch` resolved to 846px
 * and never applied. A fixed measure is both accurate and predictable — 34rem
 * lands at roughly 72 characters at this size.
 */
const MEASURE = "max-w-[34rem]";

export function PostBlocks({ blocks }: { blocks: PostBlock[] }) {
  if (blocks.length === 0) {
    return <p className="text-sm text-zinc-600">This post has no content yet.</p>;
  }

  return (
    <div className="space-y-10">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: PostBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2
          className={cn(
            "pt-4 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl",
            MEASURE
          )}
        >
          {block.text}
        </h2>
      );

    case "text":
      // `whitespace-pre-line` keeps the paragraph breaks the writer typed
      // without needing a markup pass over the text.
      return (
        <p
          className={cn(
            "whitespace-pre-line text-[16.5px] leading-[1.75] text-zinc-300 sm:text-[17px]",
            MEASURE
          )}
        >
          {block.body}
        </p>
      );

    case "image":
      return (
        <figure>
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/10 bg-panel-2">
            <Image
              src={block.src}
              alt={block.caption ?? ""}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
          {block.caption ? <Caption>{block.caption}</Caption> : null}
        </figure>
      );

    case "gallery":
      return <Gallery images={block.images} />;

    case "quote":
      // Set wider and larger than the prose so it reads as a break in the
      // writing rather than another paragraph in a box.
      return (
        <figure className="relative overflow-hidden rounded-2xl border-l-2 border-brand-500 bg-panel-2/70 py-7 pl-7 pr-8">
          <Quote className="h-6 w-6 text-brand-500" />
          <blockquote className="mt-4 max-w-[46ch] text-balance text-xl font-medium leading-[1.5] text-white sm:text-2xl">
            {block.text}
          </blockquote>
          {block.attribution ? (
            <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              {block.attribution}
            </figcaption>
          ) : null}
        </figure>
      );

    case "video":
      return <Video url={block.url} caption={block.caption} />;
  }
}

function Caption({ children }: { children: React.ReactNode }) {
  return <figcaption className="mt-2.5 text-[12px] text-zinc-500">{children}</figcaption>;
}

/**
 * A gallery of two or more images.
 *
 * One image spans the row, everything else pairs up — a lone half-width image
 * at the end of an odd gallery reads as a mistake, so the first one absorbs it.
 */
function Gallery({ images }: { images: { src: string; caption?: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const odd = images.length % 2 === 1;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <figure
            key={image.src + index}
            className={cn(odd && index === 0 && "sm:col-span-2")}
          >
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="group relative block aspect-[3/2] w-full overflow-hidden rounded-2xl border border-white/10 bg-panel-2"
            >
              <Image
                src={image.src}
                alt={image.caption ?? ""}
                fill
                sizes="(max-width: 640px) 100vw, 440px"
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            </button>
            {image.caption ? <Caption>{image.caption}</Caption> : null}
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {open !== null ? (
        <div
          role="dialog"
          aria-modal
          aria-label="Image viewer"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[80] grid place-items-center bg-void/95 p-4 backdrop-blur-md"
        >
          <div className="relative max-h-full w-full max-w-5xl">
            <Image
              src={images[open].src}
              alt={images[open].caption ?? ""}
              width={1600}
              height={1067}
              className="h-auto max-h-[85vh] w-full rounded-2xl object-contain"
            />
            {images[open].caption ? (
              <p className="mt-3 text-center text-[12px] text-zinc-400">{images[open].caption}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * A YouTube embed that only loads the iframe once you press play.
 *
 * The thumbnail is a plain image, so a post with several videos costs one
 * request each rather than several full YouTube players — and nothing is
 * loaded from YouTube's tracking domain until the visitor asks for it.
 */
function Video({ url, caption }: { url: string; caption?: string }) {
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbedUrl(url);
  const thumbnail = youtubeThumbnail(url);

  // Anything that isn't a recognisable YouTube link never reaches here, but a
  // record written directly to Firestore could still carry one.
  if (!embed) return null;

  return (
    <figure>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-panel-2">
        {playing ? (
          <iframe
            src={`${embed}?autoplay=1`}
            title={caption ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
            className="group absolute inset-0 h-full w-full"
          >
            {thumbnail ? (
              // Not next/image: i.ytimg.com would need a remote pattern in
              // next.config, and that config is deliberately empty so this app
              // can't be used as an image proxy.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}

            <span className="absolute inset-0 bg-void/40 transition-colors group-hover:bg-void/25" />
            <span className="ember-fill absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5 fill-white text-white" />
            </span>
          </button>
        )}
      </div>
      {caption ? <Caption>{caption}</Caption> : null}
    </figure>
  );
}
