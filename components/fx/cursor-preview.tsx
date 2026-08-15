"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A card that trails the cursor, for hover-preview on list rows.
 *
 * Position is driven by motion values fed from a window-level pointer
 * listener, so React never re-renders on mouse movement — only on show/hide.
 * Renders nothing for touch pointers or under reduced-motion, where a
 * cursor-anchored element has no meaning.
 */
export function CursorPreview({
  visible,
  children,
  className,
  offsetX = 28,
  offsetY = -20,
}: {
  visible: boolean;
  children: ReactNode;
  className?: string;
  offsetX?: number;
  offsetY?: number;
}) {
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 320, damping: 32, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 320, damping: 32, mass: 0.5 });

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX + offsetX);
      y.set(e.clientY + offsetY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y, offsetX, offsetY, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          style={{ x: sx, y: sy }}
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "pointer-events-none fixed left-0 top-0 z-[95] hidden origin-top-left overflow-hidden rounded-2xl border border-white/12 shadow-[0_24px_70px_-18px_rgba(0,0,0,0.9)] lg:block",
            className
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
