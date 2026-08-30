"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Persistent navigation across the admin.
 *
 * Every screen was previously reachable only by going back to the overview,
 * which made moving between, say, Copy and Journey a three-click round trip.
 *
 * The active pill is the same treatment as the public nav — a shared
 * `layoutId` so it slides between links rather than cutting.
 */
const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/films", label: "Films" },
  { href: "/admin/trips", label: "Trips" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/headings", label: "Headings" },
  { href: "/admin/timeline", label: "Journey" },
  { href: "/admin/lists", label: "Services & skills" },
  { href: "/admin/trash", label: "Trash" },
];

export function AdminNav() {
  const pathname = usePathname();

  /**
   * Longest matching prefix wins, so /admin/trips/t-x/posts/p-y highlights
   * Trips rather than Overview — which every path would otherwise match.
   */
  const active = LINKS.reduce((best, link) => {
    const matches = pathname === link.href || pathname.startsWith(link.href + "/");
    if (!matches) return best;
    return !best || link.href.length > best.length ? link.href : best;
  }, "");

  return (
    <nav
      aria-label="Admin sections"
      /**
       * Scrolls sideways rather than wrapping: this many links wrap to two rows
       * on a laptop and push the page content down on every screen.
       *
       * The vertical padding is load-bearing. `overflow-x: auto` computes
       * `overflow-y` to auto as well, so this clips top and bottom too — and
       * the active pill's ring is drawn *outside* its border box, landing
       * exactly on that edge and coming out shaved. The negative margin puts
       * the layout back where it was.
       *
       * No edge fade here either. It faded the outer 6% of the nav, which on a
       * wide screen is wider than the padding, so the first and last pills were
       * half transparent at rest — and Overview, the one selected by default,
       * is the first.
       */
      className="no-scrollbar -mx-4 -my-1 flex gap-1 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6"
    >
      {LINKS.map((link) => {
        const isActive = active === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors",
              isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="admin-nav-active"
                className="absolute inset-0 rounded-full bg-brand-500/18 ring-1 ring-brand-500/40"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
