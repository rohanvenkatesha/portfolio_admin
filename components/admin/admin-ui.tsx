import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared admin furniture, built from the same vocabulary as the public site:
 * accent-dot eyebrows, rounded panels, and the orange wash that wipes in from
 * the left on anything you can click.
 *
 * Padding is tighter than the public sections. The site's panels breathe
 * because they're read once; these are worked in, and the same 3.5rem of
 * vertical padding would mean scrolling past air to reach a form.
 */

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/** The dot-and-label pairing that opens every section on the site. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
      <span className="eyebrow text-brand-500">{children}</span>
    </div>
  );
}

/** A titled group of cards, with the site's two-line accent headline. */
export function Group({
  eyebrow,
  lead,
  accent,
  description,
  children,
}: {
  eyebrow: string;
  lead: string;
  accent: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-2xl font-bold leading-[1.1] tracking-tight text-white sm:text-[1.75rem]">
        {lead} <span className="text-brand-500">{accent}</span>
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500">{description}</p>
      ) : null}

      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * A card linking to an admin screen.
 *
 * `count` is shown oversized when given — for the collections it's the most
 * useful thing on the card, and it doubles as a hint that the screen has
 * something in it.
 */
export function Card({
  href,
  icon: Icon,
  title,
  description,
  count,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-panel p-5 transition-colors duration-300 hover:border-brand-500/40"
    >
      {/* Orange wash wipes in from the left, as on every list row on the site */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500",
          EASE,
          "group-hover:scale-x-100"
        )}
      />

      <span className="relative flex items-start justify-between gap-3">
        <Icon className="h-4 w-4 text-zinc-600 transition-colors duration-300 group-hover:text-brand-500" />

        <span
          aria-hidden
          className={cn(
            "flex h-8 w-8 shrink-0 translate-x-2 items-center justify-center rounded-full border border-white/12 opacity-0 transition-all duration-500",
            EASE,
            "group-hover:translate-x-0 group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:opacity-100"
          )}
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-white transition-transform duration-300 group-hover:rotate-45" />
        </span>
      </span>

      {count !== undefined ? (
        <p className="relative mt-4 font-mono text-3xl font-bold leading-none text-white">{count}</p>
      ) : null}

      <p
        className={cn(
          "relative text-[13px] font-semibold text-white transition-colors duration-300 group-hover:text-brand-400",
          count !== undefined ? "mt-2" : "mt-5"
        )}
      >
        {title}
      </p>
      <p className="relative mt-1 text-[11px] leading-relaxed text-zinc-600">{description}</p>
    </Link>
  );
}

/** Wrapper for the editors that live inline on the dashboard. */
export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/8 bg-panel p-6">{children}</div>;
}
