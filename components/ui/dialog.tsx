"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible modal built on the Radix Dialog primitive (the same primitive
 * Shadcn/UI wraps): focus trap, scroll lock, Escape to close and correct
 * aria wiring come from the primitive — the styling is ours.
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("dialog-overlay fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm", className)}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean;
  }
>(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "dialog-content fixed left-1/2 top-1/2 z-[101] w-[min(56rem,calc(100vw-2rem))]",
        "max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
        "rounded-2xl border border-white/10 bg-[#0d0d12]/95 backdrop-blur-xl",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_28px_80px_-12px_rgba(0,0,0,0.9)]",
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
      {!hideClose ? (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-zinc-400 transition-all hover:rotate-90 hover:border-orange-400/40 hover:text-orange-300"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-2xl font-bold tracking-tight text-white sm:text-3xl", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-zinc-400", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
};
