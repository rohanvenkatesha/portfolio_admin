"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/fx/effects";

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

const badgeAccents = {
  neutral: "border-white/10 bg-white/5 text-zinc-300",
  cyan: "border-brand-400/25 bg-brand-400/10 text-brand-200",
  violet: "border-brand-400/25 bg-brand-400/10 text-brand-200",
  amber: "border-brand-400/25 bg-brand-400/10 text-brand-200",
  lime: "border-brand-400/25 bg-brand-400/10 text-brand-200",
  rose: "border-brand-400/25 bg-brand-400/10 text-brand-200",
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
} as const;

export function Badge({
  children,
  accent = "neutral",
  className,
}: {
  children: React.ReactNode;
  accent?: keyof typeof badgeAccents;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
        badgeAccents[accent],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Tech-stack chip that lights up on hover.
 *
 * `tone="ember"` for chips sitting on the warm backdrop, where the orange
 * hover state and the zinc text both disappear into the ground.
 */
export function TechBadge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "ember";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10.5px] tracking-wide transition-all duration-200",
        tone === "ember"
          ? "border-white/25 bg-black/20 text-white/80 hover:border-white/50 hover:text-white"
          : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-brand-400/40 hover:bg-brand-400/10 hover:text-brand-200"
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "ghost" | "outline";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-[var(--brand-ink)] hover:bg-brand-400",
  outline:
    "border border-white/15 bg-white/[0.03] text-white hover:border-brand-400/50 hover:bg-brand-400/10 hover:text-brand-100",
  ghost: "text-zinc-300 hover:bg-white/5 hover:text-white",
};

type ButtonBaseProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
  magnetic?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Pill button — the primary call-to-action shape                              */
/* -------------------------------------------------------------------------- */

const pillVariants = {
  solid: "bg-brand-500 text-[var(--brand-ink)] hover:bg-brand-400",
  outline: "border border-white/15 bg-white/[0.04] text-white hover:border-white/35 hover:bg-white/[0.08]",
  light: "bg-white text-black hover:bg-zinc-200",
} as const;

type PillVariant = keyof typeof pillVariants;

/**
 * Solid pill with a small inset circular badge on the leading edge. Shared by
 * the button and anchor variants so both render identically.
 */
function pillClasses(variant: PillVariant, className?: string) {
  return cn(
    "group/pill inline-flex items-center gap-2.5 rounded-full pl-1.5 pr-5 py-1.5",
    "text-sm font-semibold transition-all duration-300 active:scale-[0.97]",
    pillVariants[variant],
    className
  );
}

function PillBadge({ variant }: { variant: PillVariant }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover/pill:rotate-45",
        variant === "solid" ? "bg-white/95 text-brand-600" : "bg-brand-500 text-[var(--brand-ink)]"
      )}
    >
      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

export const PillButton = React.forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    variant?: PillVariant;
    className?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, variant = "solid", className, ...props }, ref) => (
  <button ref={ref} className={pillClasses(variant, className)} {...props}>
    <PillBadge variant={variant} />
    <span className="inline-flex items-center gap-1.5">{children}</span>
  </button>
));
PillButton.displayName = "PillButton";

export const PillLink = React.forwardRef<
  HTMLAnchorElement,
  {
    children: React.ReactNode;
    variant?: PillVariant;
    className?: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ children, variant = "solid", className, ...props }, ref) => (
  <a ref={ref} className={pillClasses(variant, className)} {...props}>
    <PillBadge variant={variant} />
    <span className="inline-flex items-center gap-1.5">{children}</span>
  </a>
));
PillLink.displayName = "PillLink";

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonBaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, variant = "primary", className, magnetic = false, ...props }, ref) => {
  const button = (
    <button
      ref={ref}
      className={cn(
        "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3",
        "text-sm font-semibold transition-all duration-300 active:scale-[0.97]",
        variants[variant],
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {/* Sheen sweep */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
    </button>
  );

  return magnetic ? <Magnetic strength={0.28}>{button}</Magnetic> : button;
});
Button.displayName = "Button";

export const LinkButton = React.forwardRef<
  HTMLAnchorElement,
  ButtonBaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ children, variant = "primary", className, magnetic = false, ...props }, ref) => {
  const anchor = (
    <a
      ref={ref}
      className={cn(
        "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3",
        "text-sm font-semibold transition-all duration-300 active:scale-[0.97]",
        variants[variant],
        className
      )}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
    </a>
  );

  return magnetic ? <Magnetic strength={0.28}>{anchor}</Magnetic> : anchor;
});
LinkButton.displayName = "LinkButton";
