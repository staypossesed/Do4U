"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  LogOut, Settings, Shield, HelpCircle,
  Package, Star, Globe, ChevronRight, Loader2, MapPin,
  Link2, Unlink, ExternalLink,
} from "lucide-react";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Do4ULogo } from "@/components/icons/do4u-logo";
import { toast } from "sonner";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { updateSellerLocation } from "@/lib/actions/profile";
import { getAdapter } from "@/lib/platforms/registry";
import { getOAuthAdapterSlug } from "@/lib/platforms/catalog-oauth";
import { Badge } from "@/components/ui/badge";

const COUNTRIES = [
  { code: "RU", ru: "Россия", en: "Russia" },
  { code: "US", ru: "США", en: "United States" },
  { code: "GB", ru: "Великобритания", en: "United Kingdom" },
  { code: "DE", ru: "Германия", en: "Germany" },
  { code: "FR", ru: "Франция", en: "France" },
  { code: "BE", ru: "Бельгия", en: "Belgium" },
  { code: "NL", ru: "Нидерланды", en: "Netherlands" },
  { code: "ES", ru: "Испания", en: "Spain" },
  { code: "IT", ru: "Италия", en: "Italy" },
  { code: "PL", ru: "Польша", en: "Poland" },
  { code: "PT", ru: "Португалия", en: "Portugal" },
  { code: "UA", ru: "Украина", en: "Ukraine" },
  { code: "KZ", ru: "Казахстан", en: "Kazakhstan" },
  { code: "CA", ru: "Канада", en: "Canada" },
  { code: "AU", ru: "Австралия", en: "Australia" },
  { code: "AT", ru: "Австрия", en: "Austria" },
  { code: "CH", ru: "Швейцария", en: "Switzerland" },
  { code: "SE", ru: "Швеция", en: "Sweden" },
  { code: "NO", ru: "Норвегия", en: "Norway" },
  { code: "DK", ru: "Дания", en: "Denmark" },
  { code: "CZ", ru: "Чехия", en: "Czechia" },
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
  const [cityDraft, setCityDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, sold: 0 });
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [savingLocation, setSavingLocation] = useState(false);
  const [connections, setConnections] = useState<Record<string, { status: string; platform_user_name: string | null }>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [catalogRows, setCatalogRows] = useState<
    { id: string; name: string; slug: string; is_api_available: boolean; posting_method: string; description: string | null }[]
  >([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const uid = authUser.id;

      const [
        profileRes,
        activeRes,
        soldRes,
        listingsRes,
        connsRes,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("name, avatar_url, country_code, city")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("status", "active"),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("status", "sold"),
        supabase
          .from("listings")
          .select("id, title, price, status")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("platform_connections")
          .select("platform_slug, status, platform_user_name")
          .eq("user_id", uid),
      ]);

      const profile = profileRes.data;

      setUser({
        email: authUser.email || "",
        name: profile?.name || authUser.user_metadata?.full_name || null,
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
      });
      setCountryCode(profile?.country_code ? String(profile.country_code).slice(0, 2).toUpperCase() : null);
      setCityDraft(profile?.city ? String(profile.city) : "");

      setStats({
        active: activeRes.count ?? 0,
        sold: soldRes.count ?? 0,
      });

      setMyListings((listingsRes.data as MyListing[]) ?? []);

      const connMap: Record<string, { status: string; platform_user_name: string | null }> = {};
      for (const c of connsRes.data ?? []) {
        connMap[c.platform_slug] = { status: c.status, platform_user_name: c.platform_user_name };
      }
      setConnections(connMap);

      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setCatalogRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("marketplace_platforms")
        .select("id, name, slug, is_api_available, posting_method, description")
        .eq("country_code", countryCode)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("marketplace_platforms:", error);
        setCatalogRows([]);
      } else {
        setCatalogRows(data ?? []);
      }
      setCatalogLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  async function saveSellingLocation() {
    if (!countryCode) {
      toast.error(
        locale === "ru" ? "Выбери страну продаж" : "Select a country",
      );
      return;
    }
    setSavingLocation(true);
    const res = await updateSellerLocation({
      countryCode,
      city: cityDraft,
    });
    setSavingLocation(false);
    if (!res.ok) {
      console.error("updateSellerLocation:", res.message);
      toast.error(
        locale === "ru"
          ? "Не удалось сохранить место. Убедись, что в Supabase применена миграция 004 (country_code, city)."
          : "Could not save location. Ensure Supabase migration 004 is applied.",
      );
      return;
    }
    useAppStore.getState().bumpCountryPlatformsRefresh();
    toast.success(
      locale === "ru" ? "Место продаж сохранено" : "Selling location saved",
    );
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
        {user ? (
          <UserAvatar
            avatarUrl={user.avatar_url}
            name={user.name}
            email={user.email}
          />
        ) : null}
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

      <Button
        asChild
        variant="brand"
        className="w-full rounded-2xl min-h-12 text-sm font-extrabold shadow-lg shadow-orange-500/20 gap-2"
      >
        <Link href="/profile/listings">
          <Package className="h-4 w-4" />
          {locale === "ru" ? "Мои объявления" : "My listings"}
        </Link>
      </Button>

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

        <div className="p-4 border-b dark:border-white/5 border-black/5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold">
              {locale === "ru" ? "Где продаёшь" : "Where you sell"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {locale === "ru"
              ? "Страна и город задают площадки в шаблонах и подсказку AI (цена и формулировки под рынок в радиусе ~50 км / 30 миль от города)."
              : "Country and city drive platform templates and AI hints (pricing and wording for a ~30 mi / 50 km local market)."}
          </p>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {locale === "ru" ? "Страна" : "Country"}
            </label>
            <select
              value={countryCode || ""}
              disabled={savingLocation}
              onChange={(e) => setCountryCode(e.target.value || null)}
              className="w-full h-11 mt-1 px-3 rounded-xl border dark:border-white/10 border-black/10
                dark:bg-white/5 bg-black/5 text-sm font-medium"
            >
              <option value="">{locale === "ru" ? "Выбери страну" : "Select country"}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {locale === "ru" ? c.ru : c.en} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {locale === "ru" ? "Город" : "City"}
            </label>
            <input
              type="text"
              value={cityDraft}
              disabled={savingLocation}
              onChange={(e) => setCityDraft(e.target.value)}
              placeholder={
                locale === "ru"
                  ? "Например: Москва, Брюссель, Остин"
                  : "e.g. Moscow, Brussels, Austin"
              }
              className="w-full h-11 mt-1 px-3 rounded-xl border dark:border-white/10 border-black/10
                dark:bg-white/5 bg-black/5 text-sm font-medium placeholder:text-muted-foreground/60"
            />
          </div>
          <Button
            type="button"
            variant="brand"
            className="w-full rounded-xl font-bold"
            disabled={savingLocation || !countryCode}
            onClick={() => void saveSellingLocation()}
          >
            {savingLocation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {locale === "ru" ? "Сохранение…" : "Saving…"}
              </>
            ) : locale === "ru" ? (
              "Сохранить место продаж"
            ) : (
              "Save selling location"
            )}
          </Button>
        </div>

          <div className="p-4 border-b dark:border-white/5 border-black/5 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold">
              {locale === "ru" ? "Подключённые площадки" : "Connected platforms"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {locale === "ru"
              ? "Список зависит от страны продаж выше. OAuth-площадки можно подключить для автопостинга и сообщений; остальные — через готовый текст на шаге «Старт»."
              : "The list depends on your selling country above. OAuth platforms can be linked for auto-posting and messages; others use copy-ready text on the Launch step."}
          </p>
          {!countryCode ? (
            <p className="text-xs text-amber-600/90 dark:text-amber-400/90 font-medium">
              {locale === "ru"
                ? "Сначала выбери страну — покажем только локальные площадки."
                : "Choose a country first — we only show marketplaces that operate there."}
            </p>
          ) : catalogLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : catalogRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {locale === "ru"
                ? "Нет строк в marketplace_platforms для этой страны. Примени миграцию 009 в Supabase."
                : "No marketplace_platforms rows for this country. Apply migration 009 in Supabase."}
            </p>
          ) : (
            catalogRows.map((row) => {
              const oauthSlug = getOAuthAdapterSlug(row.slug);
              const adapter = oauthSlug ? getAdapter(oauthSlug) : null;
              const conn = oauthSlug ? connections[oauthSlug] : undefined;
              const isConnected = conn?.status === "connected";
              const canOAuth = Boolean(adapter && oauthSlug);

              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-1.5 p-3 rounded-xl dark:bg-white/5 bg-black/5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold flex-1 min-w-[40%]">{row.name}</span>
                    {canOAuth ? (
                      isConnected ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-500 font-bold">
                            {conn!.platform_user_name || (locale === "ru" ? "Подключено" : "Connected")}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={async () => {
                              const supabase = createClient();
                              await supabase
                                .from("platform_connections")
                                .update({ status: "disconnected" })
                                .eq("platform_slug", oauthSlug!);
                              setConnections((prev) => {
                                const next = { ...prev };
                                delete next[oauthSlug!];
                                return next;
                              });
                              toast.success(locale === "ru" ? `${row.name} отключён` : `${row.name} disconnected`);
                            }}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs font-bold gap-1"
                          disabled={connectingPlatform === oauthSlug}
                          onClick={() => {
                            if (!adapter || !oauthSlug) return;
                            setConnectingPlatform(oauthSlug);
                            const redirectUri = `${window.location.origin}/api/platforms/callback?platform=${oauthSlug}`;
                            const url = adapter.getAuthUrl("", redirectUri);
                            window.location.href = url;
                          }}
                        >
                          {connectingPlatform === oauthSlug ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )}
                          {locale === "ru" ? "Подключить" : "Connect"}
                        </Button>
                      )
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-bold shrink-0">
                        {row.posting_method === "manual"
                          ? locale === "ru"
                            ? "Вручную"
                            : "Manual"
                          : locale === "ru"
                            ? "Шаблон"
                            : "Template"}
                      </Badge>
                    )}
                  </div>
                  {row.description ? (
                    <p className="text-[10px] text-muted-foreground leading-snug">{row.description}</p>
                  ) : null}
                  {!canOAuth ? (
                    <p className="text-[10px] text-muted-foreground/90">
                      {locale === "ru"
                        ? "Текст для этой площадки сформируется при продаже (шаг «Старт»)."
                        : "Copy-ready text for this board is generated when you sell (Launch step)."}
                    </p>
                  ) : null}
                </div>
              );
            })
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
