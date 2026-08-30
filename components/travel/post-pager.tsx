"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Turns the post body into pages instead of one long scroll.
 *
 * The body only. The route, the frames and the company stay on the page as
 * ordinary sections below this — they are things you glance at once, and
 * paging them turned reading a post into clicking through its furniture.
 *
 * Slides arrive as children and are rendered by the server — this component
 * only chooses which one is on screen, so nothing about the markup or the data
 * fetching moves to the client.
 *
 * The page lives in `?p=` and is pushed with the History API directly rather
 * than the router. `useSearchParams` would opt the route out of static
 * rendering for a piece of purely presentational state, and a router push
 * would round-trip to the server to show content already in the browser.
 */
export function PostPager({
  labels,
  children,
}: {
  /** One short label per slide, shown in the pager. */
  labels: string[];
  children: React.ReactNode;
}) {
  const slides = Children.toArray(children);
  const [index, setIndex] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  /** Distinguishes the first paint from a real page turn. */
  const mounted = useRef(false);

  const count = slides.length;
  const clamp = useCallback((n: number) => Math.max(0, Math.min(count - 1, n)), [count]);

  // Deep links and the back button are the same problem: the URL is the source
  // of truth, so both are handled by reading it.
  useEffect(() => {
    const fromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get("p");
      const parsed = Number(raw);
      setIndex(Number.isFinite(parsed) && parsed >= 1 ? clamp(parsed - 1) : 0);
    };

    fromUrl();
    window.addEventListener("popstate", fromUrl);
    return () => window.removeEventListener("popstate", fromUrl);
  }, [clamp]);

  const go = useCallback(
    (next: number) => {
      const target = clamp(next);
      if (target === index) return;

      setIndex(target);

      const url = new URL(window.location.href);
      // Page one is the bare URL — a canonical address for the post itself,
      // rather than two URLs for the same first screen.
      if (target === 0) url.searchParams.delete("p");
      else url.searchParams.set("p", String(target + 1));
      window.history.pushState({}, "", url);
    },
    [clamp, index]
  );

  // Bring the reader back to the start of the article on a turn — but never on
  // first paint, which would yank a deep link away from the hero.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

  // Arrow keys turn pages, unless the reader is typing or the lightbox has
  // taken the keyboard for its own navigation.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (document.querySelector('[role="dialog"]')) return;

      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  if (count === 0) return null;

  return (
    <>
      {/* Anchor for the scroll-to-top on a page turn. Sits above the slide so
          the reader lands on its heading, not partway into the text. */}
      <div ref={top} className="scroll-mt-28" />

      {slides[index]}

      {count > 1 ? (
        <nav
          aria-label="Post pages"
          className="mx-auto mt-14 w-full max-w-[60rem] sm:mt-16"
        >
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-6">
            <PagerButton
              direction="back"
              disabled={index === 0}
              label={index > 0 ? labels[index - 1] : ""}
              onClick={() => go(index - 1)}
            />

            <p className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.2em] text-zinc-600">
              <span className="text-brand-500">{String(index + 1).padStart(2, "0")}</span>
              {" / "}
              {String(count).padStart(2, "0")}
            </p>

            <PagerButton
              direction="forward"
              disabled={index === count - 1}
              label={index < count - 1 ? labels[index + 1] : ""}
              onClick={() => go(index + 1)}
            />
          </div>
        </nav>
      ) : null}
    </>
  );
}

function PagerButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: "back" | "forward";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === "back" ? ArrowLeft : ArrowRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 text-left transition-colors",
        direction === "forward" && "flex-row-reverse text-right",
        disabled ? "cursor-default opacity-25" : "hover:text-brand-400"
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-300",
          !disabled && direction === "back" && "group-hover:-translate-x-1",
          !disabled && direction === "forward" && "group-hover:translate-x-1"
        )}
      />
      <span className="min-w-0">
        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          {direction === "back" ? "Previous" : "Next"}
        </span>
        <span className="mt-1 block truncate text-[13px] font-semibold text-zinc-300">{label}</span>
      </span>
    </button>
  );
}
