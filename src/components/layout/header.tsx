"use client";

import { Do4ULogo } from "@/components/icons/do4u-logo";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import { Moon, Sun, Globe, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

export function Header() {
  const { locale, setLocale } = useAppStore();
  const { theme, setTheme } = useTheme();
  const t = getTranslations(locale);

  // Prevent hydration mismatch — next-themes reads localStorage only on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : true;

  return (
    <header className="sticky top-0 z-50 w-full safe-top
      dark:bg-background/70 bg-background/80 backdrop-blur-2xl
      border-b dark:border-white/5 border-black/5">
      <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Do4ULogo size={28} />
          <span className="text-base font-extrabold tracking-tight">
            <span className="brand-gradient-text">Do4U</span>
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-0.5">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
            aria-label={t.theme.system}
            className="rounded-xl w-9 h-9 text-xs font-bold"
          >
            <Globe className="h-4 w-4" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className="rounded-xl w-9 h-9"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0,  opacity: 1, scale: 1   }}
                  exit={{   rotate: 90,  opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.18 }}
                >
                  <Sun className="h-4 w-4 text-yellow-400" />
                </motion.div>
              ) : (
                <motion.div key="moon"
                  initial={{ rotate: 90,  opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0,   opacity: 1, scale: 1   }}
                  exit={{   rotate: -90,  opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.18 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 relative" asChild>
            <Link href="/notifications">
              <Bell className="h-4 w-4" />
              {/* Unread dot — TODO: wire to real count */}
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full
                bg-orange-500 ring-2 dark:ring-background ring-background" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
