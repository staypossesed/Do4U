"use client";

import { ClawLogo } from "@/components/icons/claw-logo";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import { Moon, Sun, Globe, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function Header() {
  const { locale, setLocale } = useAppStore();
  const { theme, setTheme } = useTheme();
  const t = getTranslations(locale);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl safe-top">
      <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ClawLogo size={28} />
          <span className="text-lg font-bold claw-gradient-text">
            {t.app.name}
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
