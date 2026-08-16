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
  { href: "/admin/copy", label: "Copy" },
  { href: "/admin/timeline", label: "Journey" },
  { href: "/admin/lists", label: "Services & skills" },
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
      // Scrolls sideways rather than wrapping: nine links wrap to two rows on a
      // laptop and push the page content down on every screen.
      className="no-scrollbar mask-fade-x -mx-4 flex gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
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
