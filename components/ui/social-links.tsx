"use client";

import { Mail } from "lucide-react";
import { socials } from "@/content/site";
import { GithubIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from "./brand-icons";
import { cn } from "@/lib/utils";

const iconMap = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  mail: Mail,
} as const;

const hoverAccent: Record<string, string> = {
  github: "hover:border-white/40 hover:text-white hover:shadow-[0_0_28px_-6px_rgba(255,255,255,0.5)]",
  linkedin: "hover:border-orange-400/50 hover:text-orange-300 hover:shadow-[0_0_28px_-6px_rgba(56,189,248,0.6)]",
  youtube: "hover:border-red-500/50 hover:text-red-400 hover:shadow-[0_0_28px_-6px_rgba(239,68,68,0.6)]",
  instagram: "hover:border-orange-400/50 hover:text-orange-300 hover:shadow-[0_0_28px_-6px_rgba(232,121,249,0.6)]",
  mail: "hover:border-orange-400/50 hover:text-orange-300 hover:shadow-[0_0_28px_-6px_rgba(34,211,238,0.6)]",
};

/** Glowing icon pills for every social profile. */
export function SocialLinks({
  className,
  showLabels = false,
  size = "md",
}: {
  className?: string;
  showLabels?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {socials.map((social) => {
        const Icon = iconMap[social.icon as keyof typeof iconMap] ?? Mail;
        const external = !social.href.startsWith("mailto:");

        return (
          <a
            key={social.label}
            href={social.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={social.label}
            data-cursor-label={social.label.slice(0, 2).toUpperCase()}
            className={cn(
              "glass group inline-flex items-center gap-2 rounded-full text-zinc-400",
              "transition-all duration-300 hover:-translate-y-0.5",
              size === "sm" ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-base",
              showLabels && "pr-4",
              hoverAccent[social.icon]
            )}
          >
            <Icon className="h-[1.05em] w-[1.05em] transition-transform duration-300 group-hover:scale-110" />
            {showLabels ? (
              <span className="text-xs font-medium">{social.label}</span>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}
