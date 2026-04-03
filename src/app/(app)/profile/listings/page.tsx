"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, MessageCircle, Package, Eye, Share2, TrendingUp } from "lucide-react";
import { shareListingUrl } from "@/lib/share-listing";
import { toast } from "sonner";

interface Row {
  id: string;
  title: string;
  price: number;
  status: string;
  views_count: number | null;
  listing_images: { url_original: string; url_enhanced: string | null; order: number }[];
}

export default function MyListingsPage() {
  const { locale } = useAppStore();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"active" | "sold">("active");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalByListing, setExternalByListing] = useState<
    Record<string, { platform_slug: string; external_url: string | null }[]>
  >({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, status, views_count, listing_images(url_original, url_enhanced, \"order\")")
        .eq("user_id", user.id)
        .in("status", ["active", "sold"])
        .order("created_at", { ascending: false });
      const list = (data as Row[]) ?? [];
      setRows(list);

      if (list.length > 0) {
        const ids = list.map((r) => r.id);
        const { data: ext } = await supabase
          .from("external_posts")
          .select("listing_id, platform_slug, external_url, status")
          .in("listing_id", ids)
          .eq("status", "posted");
        const map: Record<string, { platform_slug: string; external_url: string | null }[]> = {};
        for (const e of ext ?? []) {
          if (!map[e.listing_id]) map[e.listing_id] = [];
          map[e.listing_id].push({
            platform_slug: e.platform_slug,
            external_url: e.external_url,
          });
        }
        setExternalByListing(map);
      } else {
        setExternalByListing({});
      }
      setLoading(false);
    }
    void load();
  }, [supabase]);

  const filtered = rows.filter((r) => (tab === "active" ? r.status === "active" : r.status === "sold"));

  function platformShortLabel(slug: string): string {
    const ru: Record<string, string> = {
      avito: "Авито",
      vk_marketplace: "VK",
      ebay: "eBay",
      olx: "OLX",
      facebook_marketplace: "Facebook",
    };
    return ru[slug] ?? slug.replace(/_/g, " ");
  }

  return (
    <div className="px-4 py-5 pb-8 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 shrink-0" asChild>
          <Link href="/profile" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-extrabold flex-1">
          {locale === "ru" ? "Мои объявления" : "My listings"}
        </h1>
      </div>

      <div className="flex gap-2 p-1 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
        {(
          [
            { id: "active" as const, ru: "Активные", en: "Active" },
            { id: "sold" as const, ru: "Проданные", en: "Sold" },
          ]
        ).map((t) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            onClick={() => setTab(t.id)}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tab === t.id
                ? "brand-gradient text-white shadow-md shadow-orange-500/20"
                : "text-muted-foreground"
            }`}
          >
            {locale === "ru" ? t.ru : t.en}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-dashed dark:border-white/10 border-black/10 p-10 text-center"
          >
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {locale === "ru"
                ? tab === "active"
                  ? "Нет активных объявлений"
                  : "Нет проданных"
                : tab === "active"
                  ? "No active listings"
                  : "No sold listings"}
            </p>
            {tab === "active" && (
              <Button variant="brand" className="mt-4 rounded-xl" asChild>
                <Link href="/sell/new">{locale === "ru" ? "Создать объявление" : "Create listing"}</Link>
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="space-y-3"
          >
          {filtered.map((listing) => {
            const imgs = [...(listing.listing_images ?? [])].sort((a, b) => a.order - b.order);
            const img = imgs[0]?.url_enhanced || imgs[0]?.url_original;
            const postedExt = externalByListing[listing.id] ?? [];
            const lowReach =
              listing.status === "active" &&
              (listing.views_count ?? 0) < 12 &&
              postedExt.length === 0;
            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border dark:border-white/10 border-black/10 overflow-hidden dark:bg-white/[0.03] bg-black/[0.02]"
              >
                <div className="flex gap-3 p-3">
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/25" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="font-bold text-sm line-clamp-2">{listing.title}</p>
                    <p className="text-sm font-extrabold brand-gradient-text">{formatPrice(listing.price)}</p>
                    <div className="flex flex-col gap-1 text-[11px] text-muted-foreground mt-auto">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="flex items-center gap-0.5"
                          title={
                            locale === "ru"
                              ? "Открытия страницы на Do4U. На Авито/VK счётчик другой."
                              : "Opens of this page on Do4U only — not Avito/VK traffic."
                          }
                        >
                          <Eye className="h-3 w-3" />
                          {listing.views_count ?? 0}{" "}
                          {locale === "ru" ? "в Do4U" : "on Do4U"}
                        </span>
                        <span className="uppercase tracking-wide">{listing.status}</span>
                      </div>
                      {postedExt.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {postedExt.map((e) => (
                            <span
                              key={`${e.platform_slug}-${e.external_url ?? ""}`}
                              className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                            >
                              {platformShortLabel(e.platform_slug)}
                              {e.external_url ? " · URL" : ""}
                            </span>
                          ))}
                        </div>
                      ) : listing.status === "active" ? (
                        <span className="text-amber-600/90 dark:text-amber-400/85 font-medium">
                          {locale === "ru"
                            ? "Нет автопоста на Авито/VK — только Do4U"
                            : "No auto-post yet — Do4U only"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {lowReach ? (
                       <div className="mx-3 mb-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 flex items-start gap-2">
                         <TrendingUp className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                         <p className="text-[11px] leading-snug text-muted-foreground">
                           {locale === "ru" ? (
                             <>
                               Мало охвата: поделись ссылкой и в{" "}
                               <Link href="/profile" className="text-primary font-bold underline">
                                 Профиле
                               </Link>{" "}
                               подключи площадки страны — тогда публикация пойдёт туда же автоматически.
                             </>
                           ) : (
                             <>
                               Low reach: share the link and{" "}
                               <Link href="/profile" className="text-primary font-bold underline">
                                 connect platforms
                               </Link>{" "}
                               in Profile for auto-posting.
                             </>
                           )}
                         </p>
                       </div>
                ) : null}
                <div className="flex gap-2 px-3 pb-3">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs" asChild>
                    <Link href={`/marketplace/${listing.id}`}>
                      {locale === "ru" ? "Открыть" : "Open"}
                    </Link>
                  </Button>
                  {listing.status === "active" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 rounded-xl text-xs gap-1"
                        type="button"
                        onClick={async () => {
                          const url = `${window.location.origin}/marketplace/${listing.id}`;
                          const r = await shareListingUrl({
                            url,
                            title: listing.title,
                            text:
                              locale === "ru"
                                ? `Объявление: ${listing.title}`
                                : `Listing: ${listing.title}`,
                          });
                          if (r === "copied") toast.success(locale === "ru" ? "Ссылка скопирована" : "Link copied");
                          if (r === "shared") toast.success(locale === "ru" ? "Готово" : "Shared");
                          if (r === "unsupported") toast.error(locale === "ru" ? "Не вышло" : "Failed");
                        }}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        {locale === "ru" ? "В сеть" : "Share"}
                      </Button>
                      <Button variant="brand" size="sm" className="flex-1 rounded-xl text-xs glow-orange" asChild>
                        <Link href={`/chats?listing=${listing.id}`}>
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />
                          {locale === "ru" ? "Чат" : "Chat"}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
