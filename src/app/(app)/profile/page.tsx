"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Shield, HelpCircle } from "lucide-react";
import { ClawLogo } from "@/components/icons/claw-logo";
import { toast } from "sonner";

// TODO: Этап 6 — Полный профиль + style_examples для Claw авто-ответов

export default function ProfilePage() {
  const { locale } = useAppStore();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    toast.success(locale === "ru" ? "Вы вышли из аккаунта" : "Signed out");
  }

  const menuItems = [
    {
      icon: Settings,
      label: locale === "ru" ? "Настройки" : "Settings",
      href: "#",
    },
    {
      icon: Shield,
      label: locale === "ru" ? "Безопасность" : "Security",
      href: "#",
    },
    {
      icon: HelpCircle,
      label: locale === "ru" ? "Помощь" : "Help",
      href: "#",
    },
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <ClawLogo size={56} />
        <h1 className="text-xl font-bold">
          {locale === "ru" ? "Профиль" : "Profile"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {locale === "ru" ? "Выйти" : "Sign Out"}
      </Button>
    </div>
  );
}
