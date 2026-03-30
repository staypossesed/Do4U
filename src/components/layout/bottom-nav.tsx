"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Plus, ShoppingBag, MessageCircle, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, labelKey: "home" as const },
  { href: "/marketplace", icon: ShoppingBag, labelKey: "buy" as const },
  { href: "/sell/new", icon: Plus, labelKey: "sell" as const, isClaw: true },
  { href: "/chats", icon: MessageCircle, labelKey: "chats" as const },
  { href: "/profile", icon: User, labelKey: "profile" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useAppStore();
  const t = getTranslations(locale);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isClaw) {
            return (
              <Link key={item.href} href={item.href} className="relative -mt-5">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-14 h-14 rounded-full claw-gradient shadow-lg"
                >
                  <Icon className="h-6 w-6 text-white" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className="text-[10px] font-medium">
                {t.nav[item.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
