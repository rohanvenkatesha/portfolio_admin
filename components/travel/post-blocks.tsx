"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand, Play, Quote } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { EmberBackdrop } from "@/components/fx/ember-backdrop";
import { collectImages, youtubeEmbedUrl, youtubeThumbnail, type PostBlock } from "@/content/posts";
import { Lightbox } from "@/components/travel/post-gallery";
import { cn } from "@/lib/utils";

/**
 * Renders a post body.
 *
 * Every block maps to a component here, so stored content is data all the way
 * through and never becomes markup. That's what removes the need for a
 * sanitiser: there is no path from a stored string to innerHTML.
 *
 * Visually this borrows the home page's vocabulary rather than inventing a
 * second one — the same reveal-on-scroll, the same ember treatment for the
 * moment that should carry weight, the same hover language on anything
 * clickable.
 */

/**
 * Text carries a reading measure; everything else spans the panel.
 *
 * The section runs edge to edge like the rest of the site, but prose can't:
 * unconstrained it ran 105 characters a line here, well past the 60–75 the eye
 * tracks comfortably. Only the text is capped, so the layout is full width
 * while the reading stays a sane length. Flush left, never centred — every
 * other section on this site starts at the same left edge.
 *
 * Not `ch`: that unit measures the "0" glyph, which in this typeface is 12.4px
 * against an average prose character of about 7.6px, so the `68ch` first tried
 * here resolved to 846px and never applied at all.
 */
const MEASURE = "max-w-[36rem]";

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

export function PostBlocks({ blocks }: { blocks: PostBlock[] }) {
  /**
   * The same deduped list the gallery section shows, so an image opened from
   * the body lands on the right frame and can be paged through to the rest.
   */
  const images = collectImages(blocks);
  const [open, setOpen] = useState<number | null>(null);
  const indexOf = (src: string) => images.findIndex((image) => image.src === src);

  if (blocks.length === 0) {
    return <p className="text-sm text-zinc-600">This post has no content yet.</p>;
  }

  return (
    <>
      {/* Full width and flush left, like every other section. Text carries its
          own reading measure; media spans the panel end to end. */}
      <div className="flex w-full flex-col gap-12">
        {blocks.map((block, index) => (
          // Staggered like RevealGroup elsewhere, but capped — past a few blocks
          // a growing delay just means waiting for your own article.
          <Reveal key={index} direction="up" delay={Math.min(index * 0.05, 0.2)}>
            <Block block={block} onOpenImage={(src) => setOpen(indexOf(src))} />
          </Reveal>
        ))}
      </div>

      <Lightbox images={images} index={open} onChange={setOpen} />
    </>
  );
}

function Block({ block, onOpenImage }: { block: PostBlock; onOpenImage: (src: string) => void }) {
  switch (block.type) {
    case "heading":
      // Accent rule above the heading, echoing the dot-and-eyebrow pairing
      // that opens every section on the home page.
      return (
        <div className={cn("pt-6", MEASURE)}>
          <span aria-hidden className="block h-px w-10 bg-brand-500" />
          <h2 className="mt-5 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl">
            {block.text}
          </h2>
        </div>
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
      /**
       * Full-bleed across the panel, in a cinematic crop.
       *
       * 21:9 rather than something squarer: at this width a 3:2 frame is over
       * 900px tall and takes the whole screen, which is what made images feel
       * like they were interrupting the writing rather than punctuating it.
       * The wide crop spans the panel end to end without swallowing it.
       */
      return (
        <figure className="group w-full">
          <button
            type="button"
            onClick={() => onOpenImage(block.src)}
            aria-label={block.caption || "Open image"}
            className="relative block aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-panel-2 transition-colors duration-300 hover:border-brand-500/50 sm:aspect-[21/9]"
          >
            <Image
              src={block.src}
              alt={block.caption ?? ""}
              fill
              sizes="(max-width: 1024px) 100vw, 1488px"
              className={cn("object-cover transition-transform duration-700", EASE, "group-hover:scale-[1.03]")}
            />

            <span
              aria-hidden
              className={cn(
                "absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-t from-brand-500/25 to-transparent transition-transform duration-500",
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
          </button>
          {block.caption ? <Caption>{block.caption}</Caption> : null}
        </figure>
      );

    /**
     * Deliberately renders nothing inline.
     *
     * A gallery mid-paragraph was either a grid that stopped the reading dead
     * or a sideways strip that was awkward to scroll. Its images still reach
     * the reader — collectImages feeds them into the bento gallery below, which
     * is a better place to look at a set of photographs than the middle of a
     * sentence. The block is kept as the quick way to push several frames into
     * that gallery at once.
     */
    case "gallery":
      return null;

    case "quote":
      /**
       * The one block that gets the ember treatment.
       *
       * Used the way the home page uses it — the personal statement in About,
       * the closing call to action — for the moment that should carry weight.
       * The palette inverts to white on the warm ground, since the orange
       * accent would vanish into it.
       */
      return (
        <figure className="relative overflow-hidden rounded-2xl border border-white/8">
          <EmberBackdrop drift={false} />

          <div className="relative p-8 sm:p-10">
            <Quote className="h-7 w-7 text-white/50" />
            <blockquote className="mt-5 max-w-[46ch] text-balance text-xl font-medium leading-[1.5] text-white sm:text-2xl">
              {block.text}
            </blockquote>
            {block.attribution ? (
              <figcaption className="mt-5 flex items-center gap-2.5">
                <span aria-hidden className="h-px w-6 bg-white/50" />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
                  {block.attribution}
                </span>
              </figcaption>
            ) : null}
          </div>
        </figure>
      );

    case "video":
      return <Video url={block.url} caption={block.caption} />;
  }
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className="mt-3 flex items-center gap-2.5 text-[12px] text-zinc-500">
      <span aria-hidden className="h-px w-5 shrink-0 bg-brand-500/60" />
      {children}
    </figcaption>
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
    <figure className="w-full">
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
                className={cn("h-full w-full object-cover transition-transform duration-700", EASE, "group-hover:scale-105")}
              />
            ) : null}

            <span className="absolute inset-0 bg-void/45 transition-colors group-hover:bg-void/25" />

            {/* Pulsing ring behind the button, the same cue the status pill and
                the active globe pin use. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/40 [animation:var(--animate-pulse-ring)]"
            />
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
