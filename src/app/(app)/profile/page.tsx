"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  LogOut, Settings, Shield, HelpCircle, User,
  Package, Star, Globe, ChevronRight, Loader2,
} from "lucide-react";
import { Do4ULogo } from "@/components/icons/do4u-logo";
import { toast } from "sonner";

export default function ProfilePage() {
  const { locale, setLocale } = useAppStore();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string | null; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, sold: 0 });

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setUser({
        email: authUser.email || "",
        name: profile?.name || authUser.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
      });

      const { count: active } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("status", "active");

      const { count: sold } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("status", "sold");

      setStats({ active: active || 0, sold: sold || 0 });
      setLoading(false);
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    toast.success(locale === "ru" ? "Вы вышли из аккаунта" : "Signed out");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Avatar & name */}
      <div className="flex flex-col items-center gap-3">
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
        ) : (
          <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
        )}
        <div className="text-center">
          <h1 className="text-xl font-extrabold">{user?.name || (locale === "ru" ? "Пользователь" : "User")}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-semibold">Verified</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl dark:bg-white/5 bg-black/5 p-3 text-center">
          <Package className="h-4 w-4 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold">{stats.active}</p>
          <p className="text-[10px] text-muted-foreground">{locale === "ru" ? "Активных" : "Active"}</p>
        </div>
        <div className="rounded-2xl dark:bg-white/5 bg-black/5 p-3 text-center">
          <Star className="h-4 w-4 mx-auto mb-1 text-yellow-400" />
          <p className="text-lg font-bold">{stats.sold}</p>
          <p className="text-[10px] text-muted-foreground">{locale === "ru" ? "Продано" : "Sold"}</p>
        </div>
        <div className="rounded-2xl dark:bg-white/5 bg-black/5 p-3 text-center">
          <Star className="h-4 w-4 mx-auto mb-1 text-orange-400 fill-orange-400" />
          <p className="text-lg font-bold">5.0</p>
          <p className="text-[10px] text-muted-foreground">{locale === "ru" ? "Рейтинг" : "Rating"}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="rounded-2xl border dark:border-white/5 border-black/5 overflow-hidden">
        {[
          { icon: Globe, label: locale === "ru" ? `Язык: ${locale.toUpperCase()}` : `Language: ${locale.toUpperCase()}`, action: () => setLocale(locale === "ru" ? "en" : "ru") },
          { icon: Settings, label: locale === "ru" ? "Настройки" : "Settings" },
          { icon: Shield, label: locale === "ru" ? "Безопасность" : "Security" },
          { icon: HelpCircle, label: locale === "ru" ? "Помощь" : "Help" },
        ].map((item, i) => (
          <button key={item.label} onClick={item.action}
            className={`w-full flex items-center gap-3 p-4 text-left hover:dark:bg-white/5 hover:bg-black/5 transition-colors
              ${i > 0 ? "border-t dark:border-white/5 border-black/5" : ""}`}>
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* App branding */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Do4ULogo size={20} animated={false} />
        <span className="text-xs text-muted-foreground">
          Do4U v0.1.0
        </span>
      </div>

      <Button variant="outline"
        className="w-full text-destructive hover:text-destructive rounded-xl"
        onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        {locale === "ru" ? "Выйти" : "Sign Out"}
      </Button>
    </div>
  );
}
