"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

type CursorVariant = "default" | "hover" | "view" | "drag";

const FINE_POINTER_QUERY = "(pointer: fine)";

function subscribeToPointerType(onChange: () => void) {
  const media = window.matchMedia(FINE_POINTER_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** True for mouse/trackpad, false for touch — and false on the server. */
function useFinePointer() {
  return useSyncExternalStore(
    subscribeToPointerType,
    () => window.matchMedia(FINE_POINTER_QUERY).matches,
    () => false
  );
}

/**
 * Custom cursor: an instant inner dot plus a spring-lagged outer ring that
 * swells and picks up a label over interactive elements.
 *
 * Only activates for fine pointers (mouse/trackpad) and when the user has not
 * asked for reduced motion — touch devices keep their native behaviour, and the
 * native cursor is only hidden once this component is actually rendering.
 */
export function CustomCursor() {
  const reduceMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const enabled = finePointer && !reduceMotion;
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [label, setLabel] = useState("");
  const [pressed, setPressed] = useState(false);
  const [hidden, setHidden] = useState(true);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);

  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.55 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.55 });

  useEffect(() => {
    if (!enabled) return;

    document.body.classList.add("custom-cursor-active");

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);

      const target = e.target as HTMLElement | null;
      const interactive = target?.closest<HTMLElement>(
        "a, button, [role='button'], input, textarea, select, [data-cursor]"
      );

      if (!interactive) {
        setVariant("default");
        setLabel("");
        return;
      }

      const custom = interactive.dataset.cursor as CursorVariant | undefined;
      setVariant(custom ?? "hover");
      setLabel(interactive.dataset.cursorLabel ?? "");
    };

    const onLeave = () => setHidden(true);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ringSize = variant === "view" ? 76 : variant === "hover" ? 56 : 34;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Lagging ring */}
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="absolute left-0 top-0"
        animate={{ opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="flex items-center justify-center rounded-full border backdrop-blur-[2px]"
          animate={{
            width: ringSize,
            height: ringSize,
            marginLeft: -ringSize / 2,
            marginTop: -ringSize / 2,
            scale: pressed ? 0.82 : 1,
            borderColor:
              variant === "default" ? "rgba(255,255,255,0.28)" : "rgba(249,115,22,0.85)",
            backgroundColor:
              variant === "default" ? "rgba(255,255,255,0)" : "rgba(249,115,22,0.10)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          {label ? (
            <span className="eyebrow text-[9px] font-semibold text-orange-200">{label}</span>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Instant dot */}
      <motion.div
        style={{ x, y }}
        className="absolute left-0 top-0"
        animate={{ opacity: hidden || variant !== "default" ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="-ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_12px_2px_rgba(249,115,22,0.8)]" />
      </motion.div>
    </div>
  );
}
