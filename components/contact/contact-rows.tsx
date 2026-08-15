"use client";

import { ArrowUpRight, FileText, Mail, MapPin } from "lucide-react";
import { profile } from "@/content/site";

/**
 * The direct routes to me — email, location, résumé.
 *
 * Same numbered-row rhythm and orange wipe as the travel and skill lists, so
 * the page ends on a pattern it has already taught the reader.
 */
export function ContactRows() {
  return (
    <div className="border-t border-white/8">
      <ContactRow
        index="01"
        label="Email"
        value={profile.email}
        href={`mailto:${profile.email}`}
        icon={Mail}
      />
      <ContactRow index="02" label="Based in" value={profile.location} icon={MapPin} />
      <ContactRow
        index="03"
        label="Résumé"
        value="Download PDF"
        href={profile.resumeUrl}
        icon={FileText}
      />
    </div>
  );
}

function ContactRow({
  index,
  label,
  value,
  href,
  icon: Icon,
}: {
  index: string;
  label: string;
  value: string;
  href?: string;
  icon: typeof Mail;
}) {
  const inner = (
    <div className="relative flex items-center gap-5 px-3 py-5">
      {/* Orange wash wipes in from the left */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-brand-500/12 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:scale-x-100"
      />

      <span className="relative font-mono text-[11px] text-zinc-600 transition-colors duration-300 group-hover/row:text-brand-500">
        {index}
      </span>

      <div className="relative min-w-0 flex-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-2">
        <span className="eyebrow block text-[9px] text-zinc-500">{label}</span>
        <span className="mt-1 block truncate text-[15px] font-medium text-white transition-colors duration-300 group-hover/row:text-brand-400">
          {value}
        </span>
      </div>

      <Icon className="relative h-4 w-4 shrink-0 text-zinc-600 transition-colors duration-300 group-hover/row:text-brand-500" />

      {href ? (
        <ArrowUpRight className="relative h-4 w-4 shrink-0 -translate-x-2 text-brand-500 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-0 group-hover/row:opacity-100" />
      ) : null}
    </div>
  );

  const className = "group/row block overflow-hidden border-b border-white/8 last:border-0";

  return href ? (
    <a href={href} className={className}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}
