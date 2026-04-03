"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function AppMainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.main
      key={pathname}
      className="flex-1 pb-20 max-w-lg mx-auto w-full"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      {children}
    </motion.main>
  );
}
