"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Code2,
  CornerDownLeft,
  Mail,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { profile, projects, trips } from "@/content/site";
import { navSections as fallbackNavSections } from "@/content/sections";
import type { NavSection } from "./shell";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  label: string;
  hint: string;
  group: string;
  icon: typeof Search;
  action: () => void;
};

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * ⌘K / Ctrl+K palette for jumping around the site.
 *
 * The body is a separate component rendered only while open, so query and
 * cursor state start fresh on every open without needing a reset effect.
 */
export function CommandPalette({
  open,
  onOpenChange,
  navSections = fallbackNavSections as unknown as NavSection[],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  navSections?: NavSection[];
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[18%] max-w-xl translate-y-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        {open ? <PaletteBody navSections={navSections} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({
  onClose,
  navSections,
}: {
  onClose: () => void;
  navSections: NavSection[];
}) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const commands = useMemo<Command[]>(() => {
    // Let the dialog finish closing before scrolling, so focus restoration
    // doesn't fight the smooth scroll.
    const close = (fn: () => void) => () => {
      onClose();
      window.setTimeout(fn, 120);
    };

    return [
      ...navSections.map((section) => ({
        id: `nav-${section.id}`,
        label: section.label,
        hint: "Jump to section",
        group: "Navigate",
        icon: Navigation,
        action: close(() => scrollToSection(section.id)),
      })),
      // Deep content navigates to its own route rather than scrolling
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        label: project.title,
        hint: [project.category, project.year].filter(Boolean).join(" · "),
        group: "Projects",
        icon: Code2,
        action: close(() => router.push(`/work/${project.slug}`)),
      })),
      ...trips.map((trip) => ({
        id: `trip-${trip.id}`,
        label: trip.destination,
        hint: `${trip.region} · ${trip.days}-day guide`,
        group: "Travel",
        icon: MapPin,
        action: close(() => router.push(`/travel/${trip.slug}`)),
      })),
      {
        id: "action-gallery",
        label: "Photography & films",
        hint: "Open the darkroom",
        group: "Actions",
        icon: Camera,
        action: close(() => scrollToSection("visuals")),
      },
      {
        id: "action-email",
        label: `Email ${profile.name.split(" ")[0]}`,
        hint: profile.email,
        group: "Actions",
        icon: Mail,
        action: close(() => window.location.assign(`mailto:${profile.email}`)),
      },
    ];
  }, [onClose, router, navSections]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(q) ||
        command.hint.toLowerCase().includes(q) ||
        command.group.toLowerCase().includes(q)
    );
  }, [commands, query]);

  /**
   * Precompute where group headers fall, so the render pass stays pure —
   * tracking "last group seen" by mutating a variable mid-map is exactly the
   * kind of render-time mutation the compiler rules reject.
   */
  const rows = useMemo(
    () =>
      results.map((command, index) => ({
        command,
        index,
        showHeader: index === 0 || results[index - 1].group !== command.group,
      })),
    [results]
  );

  // Keep the highlighted row scrolled into view
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[cursor]?.action();
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Search input */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <Search className="h-4 w-4 shrink-0 text-zinc-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          placeholder="Search sections, projects, destinations…"
          className="w-full bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
        />
        <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:block">
          ESC
        </kbd>
      </div>

      {/* Results */}
      <div ref={listRef} className="max-h-[22rem] overflow-y-auto p-2">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500">
            Nothing matches “{query}”.
          </p>
        ) : (
          rows.map(({ command, index, showHeader }) => {
            const Icon = command.icon;
            const activeRow = index === cursor;

            return (
              <div key={command.id}>
                {showHeader ? (
                  <p className="eyebrow px-3 pb-1.5 pt-3 text-[9px] text-zinc-600">
                    {command.group}
                  </p>
                ) : null}

                <button
                  data-index={index}
                  onClick={command.action}
                  onMouseEnter={() => setCursor(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    activeRow ? "bg-orange-400/10 text-white" : "text-zinc-400 hover:bg-white/5"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", activeRow ? "text-orange-300" : "text-zinc-600")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{command.label}</span>
                    <span className="block truncate text-[11px] text-zinc-600">{command.hint}</span>
                  </span>
                  {activeRow ? (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-orange-300" />
                  ) : null}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-4 border-t border-white/10 px-5 py-3 font-mono text-[10px] text-zinc-600">
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span className="ml-auto">{results.length} results</span>
      </div>
    </div>
  );
}
