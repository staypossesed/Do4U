"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  LogOut, Settings, Shield, HelpCircle, User,
  Package, Star, Globe, ChevronRight, Loader2, MapPin,
} from "lucide-react";
import { Do4ULogo } from "@/components/icons/do4u-logo";
import { toast } from "sonner";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

const COUNTRIES = [
  { code: "RU", ru: "Россия", en: "Russia" },
  { code: "US", ru: "США", en: "United States" },
  { code: "GB", ru: "Великобритания", en: "United Kingdom" },
  { code: "DE", ru: "Германия", en: "Germany" },
  { code: "FR", ru: "Франция", en: "France" },
  { code: "ES", ru: "Испания", en: "Spain" },
  { code: "IT", ru: "Италия", en: "Italy" },
  { code: "PL", ru: "Польша", en: "Poland" },
  { code: "UA", ru: "Украина", en: "Ukraine" },
  { code: "KZ", ru: "Казахстан", en: "Kazakhstan" },
];

interface MyListing {
  id: string;
  title: string;
  price: number;
  status: string;
}

export default function ProfilePage() {
  const { locale, setLocale } = useAppStore();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string | null; avatar_url: string | null } | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, sold: 0 });
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [savingCountry, setSavingCountry] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

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
      setCountryCode(profile?.country_code ? String(profile.country_code).slice(0, 2).toUpperCase() : null);

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

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, status")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(8);

      setMyListings((listings as MyListing[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function saveCountry(code: string) {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setSavingCountry(true);
    const { error } = await supabase
      .from("users")
      .update({ country_code: code, updated_at: new Date().toISOString() })
      .eq("id", authUser.id);
    setSavingCountry(false);
    if (error) {
      toast.error(locale === "ru" ? "Не удалось сохранить страну" : "Could not save country");
      return;
    }
    setCountryCode(code);
    toast.success(locale === "ru" ? "Страна обновлена" : "Country updated");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    toast.success(locale === "ru" ? "Вы вышли из аккаунта" : "Signed out");
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
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

      <div className="rounded-2xl border dark:border-white/5 border-black/5 overflow-hidden">
        <div className="p-4 border-b dark:border-white/5 border-black/5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold">{locale === "ru" ? "Язык" : "Language"}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={locale === "ru" ? "brand" : "outline"}
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => setLocale("ru")}
            >
              RU
            </Button>
            <Button
              variant={locale === "en" ? "brand" : "outline"}
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => setLocale("en")}
            >
              EN
            </Button>
          </div>
        </div>

        <div className="p-4 border-b dark:border-white/5 border-black/5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold">{locale === "ru" ? "Страна (для площадок)" : "Country (for platforms)"}</span>
          </div>
          <select
            value={countryCode || ""}
            disabled={savingCountry}
            onChange={(e) => {
              const v = e.target.value;
              if (v) void saveCountry(v);
            }}
            className="w-full h-11 px-3 rounded-xl border dark:border-white/10 border-black/10
              dark:bg-white/5 bg-black/5 text-sm font-medium"
          >
            <option value="">{locale === "ru" ? "Выбери страну" : "Select country"}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {locale === "ru" ? c.ru : c.en} ({c.code})
              </option>
            ))}
          </select>
          {savingCountry && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {locale === "ru" ? "Сохранение…" : "Saving…"}
            </p>
          )}
        </div>

        {[
          { icon: Settings, label: locale === "ru" ? "Настройки" : "Settings" },
          { icon: Shield, label: locale === "ru" ? "Безопасность" : "Security" },
          { icon: HelpCircle, label: locale === "ru" ? "Помощь" : "Help" },
        ].map((item, i) => (
          <button
            key={item.label}
            type="button"
            className={`w-full flex items-center gap-3 p-4 text-left hover:dark:bg-white/5 hover:bg-black/5 transition-colors
              ${i > 0 ? "border-t dark:border-white/5 border-black/5" : ""}`}
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="rounded-2xl border dark:border-white/5 border-black/5 overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-white/5 border-black/5 flex items-center justify-between">
          <span className="text-sm font-bold">{locale === "ru" ? "Мои объявления" : "My listings"}</span>
          <Link href="/profile/listings" className="text-xs font-semibold text-primary">
            {locale === "ru" ? "Все →" : "All →"}
          </Link>
        </div>
        {myListings.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            {locale === "ru" ? "Пока нет объявлений" : "No listings yet"}
          </p>
        ) : (
          <ul className="divide-y dark:divide-white/5 divide-black/5">
            {myListings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/marketplace/${l.id}`}
                  className="flex items-center gap-3 p-3 hover:dark:bg-white/5 hover:bg-black/5 transition-colors"
                >
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(l.price)} · {l.status}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-2">
        <Do4ULogo size={20} animated={false} />
        <span className="text-xs text-muted-foreground">Do4U v0.1.0</span>
      </div>

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive rounded-xl"
        onClick={() => void handleSignOut()}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {locale === "ru" ? "Выйти" : "Sign Out"}
      </Button>
    </div>
  );
}
