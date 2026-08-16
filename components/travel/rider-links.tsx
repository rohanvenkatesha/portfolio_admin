"use client";

import { Mail } from "lucide-react";
import { GithubIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from "@/components/ui/brand-icons";
import type { Rider } from "@/content/posts";
import { cn } from "@/lib/utils";

const iconMap = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  mail: Mail,
} as const;

/**
 * The people you rode with.
 *
 * A rider without a link still renders — someone can be credited without
 * having a profile to point at — so the card is only an anchor when there's
 * somewhere to go.
 */
export function RiderLinks({ riders, className }: { riders: Rider[]; className?: string }) {
  if (riders.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2.5", className)}>
      {riders.map((rider, index) => {
        const Icon = iconMap[rider.icon] ?? Mail;
        const external = Boolean(rider.href) && !rider.href.startsWith("mailto:");

        const inner = (
          <>
            <span className="ember-fill-hot flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Icon className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-white">{rider.name}</span>
              {rider.handle ? (
                <span className="block truncate font-mono text-[10px] text-zinc-500">
                  {rider.handle}
                </span>
              ) : null}
            </span>
          </>
        );

        const shell =
          "inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-panel-2 py-1.5 pl-1.5 pr-4 transition-all";

        return (
          <li key={`${rider.name}-${index}`}>
            {rider.href ? (
              <a
                href={rider.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className={cn(shell, "hover:-translate-y-0.5 hover:border-brand-500/50")}
              >
                {inner}
              </a>
            ) : (
              <span className={shell}>{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
