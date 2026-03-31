"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ShoppingBag, MessageCircle, User, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",    icon: Home,          key: "home" as const },
  { href: "/marketplace",  icon: ShoppingBag,   key: "buy"  as const },
  { href: "/sell/new",     icon: Plus,          key: "sell" as const, isCta: true },
  { href: "/chats",        icon: MessageCircle, key: "chats" as const },
  { href: "/profile",      icon: User,          key: "profile" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useAppStore();
  const t = getTranslations(locale);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom
      dark:bg-background/80 bg-background/90 backdrop-blur-2xl
      border-t dark:border-white/5 border-black/5">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV.map(item => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.isCta) {
            return (
              <Link key={item.href} href={item.href} className="relative -mt-6">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center justify-center w-14 h-14 rounded-2xl
                    brand-gradient shadow-xl glow-orange"
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors relative min-w-[48px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute -inset-2 rounded-xl brand-gradient-subtle opacity-60"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 relative z-10 transition-transform", active && "scale-110")} />
              </div>
              <span className="text-[10px] font-semibold relative z-10">
                {t.nav[item.key]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
