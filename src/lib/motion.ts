import type { Variants } from "framer-motion";

const smooth = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: smooth } },
};

/** Premium entrance: fade + subtle scale-up */
export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.38, ease: smooth },
  },
};

export const staggerChildren: Variants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export const staggerFast: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
};
