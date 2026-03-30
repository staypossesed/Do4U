import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const staggerChildren: Variants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export const staggerFast: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
};
