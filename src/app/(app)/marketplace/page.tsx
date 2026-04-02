"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/hooks/use-geolocation";
import {
  Search, SlidersHorizontal, MapPin, Heart,
  Sparkles, TrendingUp, Clock, Zap, Eye,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

/** Top filters: Все | Одежда | Электроника | Обувь | Мебель */
const FILTER_CATEGORIES = [
  { id: "all",         emoji: "✨", labelRu: "Все",          labelEn: "All" },
  { id: "clothing",    emoji: "👕", labelRu: "Одежда",       labelEn: "Clothing" },
  { id: "electronics", emoji: "📱", labelRu: "Электроника",  labelEn: "Electronics" },
  { id: "shoes",       emoji: "👟", labelRu: "Обувь",        labelEn: "Shoes" },
  { id: "furniture",   emoji: "🪑", labelRu: "Мебель",       labelEn: "Furniture" },
];

const SORTS = [
  { id: "new",     icon: Clock,       labelRu: "Новые",     labelEn: "Newest" },
  { id: "near",    icon: MapPin,      labelRu: "Рядом",     labelEn: "Nearby" },
  { id: "hot",     icon: Zap,         labelRu: "Горячие",   labelEn: "Hot" },
  { id: "popular", icon: TrendingUp,  labelRu: "Популярные",labelEn: "Popular" },
];

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  views_count: number;
  created_at: string;
  listing_images: { url_original: string; url_enhanced?: string | null; order: number }[];
  users: { name: string | null; avatar_url: string | null } | null;
}

export default function MarketplacePage() {
  const { locale } = useAppStore();
  const geo = useGeolocation();
  const supabase = useMemo(() => createClient(), []);

  const [query, setQuery]       = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort]         = useState("new");
  const [liked, setLiked]       = useState<Set<string>>(new Set());
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [geoMode, setGeoMode] = useState<"radius" | "fallback">("radius");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setListings([]);
          setLoading(false);
        }
        return;
      }

      const hasGeo = geo.lat != null && geo.lng != null;

      if (hasGeo) {
        if (!cancelled) setGeoMode("radius");
        const { data: raw, error: rpcErr } = await supabase.rpc("nearby_listings_for_marketplace", {
          p_viewer_id: user.id,
          p_lat: geo.lat!,
          p_lng: geo.lng!,
          p_radius_km: 30,
          p_category: category === "all" ? null : category,
          p_search: query.trim() || null,
          p_order: sort,
          p_limit: 50,
        });

        if (rpcErr) {
          console.error(rpcErr);
          if (!cancelled) {
            setListings([]);
            setLoading(false);
          }
          return;
        }

        const rows = (raw ?? []) as { id: string }[];
        const ids = rows.map((r) => r.id);
        if (ids.length === 0) {
          if (!cancelled) {
            setListings([]);
            setLoading(false);
          }
          return;
        }

        const { data: full } = await supabase
          .from("listings")
          .select("id, title, price, category, status, views_count, created_at, listing_images(url_original, url_enhanced, \"order\"), users(name, avatar_url)")
          .in("id", ids);

        const orderMap = new Map(ids.map((id, i) => [id, i]));
        const sorted = ((full ?? []) as unknown as ListingRow[]).sort(
          (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );
        if (!cancelled) setListings(sorted);
      } else {
        if (!cancelled) setGeoMode("fallback");
        let q = supabase
          .from("listings")
          .select("id, title, price, category, status, views_count, created_at, listing_images(url_original, url_enhanced, \"order\"), users(name, avatar_url)")
          .eq("status", "active")
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (category !== "all") {
          q = q.eq("category", category);
        }
        if (query.trim()) {
          q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
        }

        const { data } = await q;
        let rows = (data as unknown as ListingRow[]) ?? [];
        if (sort === "popular" || sort === "hot") {
          rows = [...rows].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0));
        }
        if (!cancelled) setListings(rows);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [category, query, sort, supabase, geo.lat, geo.lng]);

  // Request geolocation on sort-by-near
  useEffect(() => {
    if (sort === "near" && !geo.lat) {
      geo.request();
    }
  }, [sort, geo]);

  function toggleLike(id: string) {
    setLiked(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }

  const displayed = listings;

  return (
    <div className="flex flex-col gap-0">
      {/* Sticky top bar */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b dark:border-white/5 border-black/5 px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={locale === "ru" ? "Найти товар…" : "Search items…"}
            className="w-full h-10 pl-9 pr-4 rounded-xl border dark:border-white/10 border-black/10
              dark:bg-white/5 bg-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-ring
              placeholder:text-muted-foreground"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg dark:bg-white/10 bg-black/10">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-0.5">
          {FILTER_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold
                whitespace-nowrap border transition-all duration-200 shrink-0 ${
                category === c.id
                  ? "brand-gradient text-white border-transparent shadow-lg shadow-orange-500/20"
                  : "dark:border-white/10 border-black/10 dark:text-gray-300 text-gray-600"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{locale === "ru" ? c.labelRu : c.labelEn}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {SORTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                whitespace-nowrap transition-all shrink-0 ${
                sort === s.id ? "dark:bg-white/15 bg-black/10 text-foreground" : "text-muted-foreground"
              }`}
            >
              <s.icon className="h-3 w-3" />
              {locale === "ru" ? s.labelRu : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold">
            {locale === "ru" ? "Рядом с тобой" : "Near You"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {displayed.length} {locale === "ru" ? "объявлений" : "listings"}
            {geoMode === "radius" && geo.lat
              ? ` · 30 ${locale === "ru" ? "км" : "km"}`
              : geoMode === "fallback"
                ? ` · ${locale === "ru" ? "все активные (включи гео для 30 км)" : "all active (enable location for 30 km)"}`
                : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0
          dark:bg-orange-500/15 bg-orange-500/10 border border-orange-500/20">
          <MapPin className="h-3 w-3 text-orange-400" />
          <span className="text-xs text-orange-400 font-semibold">30 km</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border dark:border-white/5 border-black/5">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {displayed.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
            >
              <div className="relative mb-8">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/25 to-purple-500/20 blur-xl scale-150"
                  animate={{ scale: [1.35, 1.5, 1.35], opacity: [0.5, 0.75, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="relative flex items-center justify-center w-28 h-28 rounded-full
                    dark:bg-white/10 bg-white border dark:border-white/15 border-orange-200/60
                    shadow-xl shadow-orange-500/15"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-5xl" role="img" aria-hidden>🛍️</span>
                </motion.div>
              </div>
              <h2 className="text-lg font-extrabold">
                {locale === "ru"
                  ? "Пока здесь тихо. Стань первым, кто продаст вещь рядом!"
                  : "It’s quiet here. Be the first to sell something nearby!"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
                {locale === "ru"
                  ? "Через пару шагов Do4U поможет с фото, текстом и ценой — соседи увидят объявление в ленте."
                  : "In a few steps Do4U helps with photos, copy, and price — neighbors will see you in the feed."}
              </p>
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link
                  href="/sell/new"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold text-white
                    brand-gradient glow-orange shadow-lg shadow-orange-500/25 min-h-[48px]"
                >
                  {locale === "ru" ? "Создать первое объявление" : "Create your first listing"}
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              className="grid grid-cols-2 gap-3 px-4 pb-6"
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
            >
              {displayed.map(listing => {
                const sortedImgs = [...(listing.listing_images ?? [])].sort((a, b) => a.order - b.order);
                const img = sortedImgs[0]?.url_enhanced || sortedImgs[0]?.url_original;
                return (
                  <motion.div
                    key={listing.id}
                    variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link href={`/marketplace/${listing.id}`}>
                      <div className="rounded-2xl overflow-hidden border dark:border-white/5 border-black/5
                        dark:bg-card bg-card hover:shadow-lg transition-shadow">
                        <div className="relative">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={listing.title} className="listing-img" />
                          ) : (
                            <div className="listing-img dark:bg-white/5 bg-black/5 flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                          <button
                            onClick={e => { e.preventDefault(); toggleLike(listing.id); }}
                            className="absolute top-2 right-2 flex items-center justify-center
                              w-7 h-7 rounded-full dark:bg-black/50 bg-white/80 backdrop-blur-sm"
                          >
                            <Heart className={`h-3.5 w-3.5 transition-colors ${
                              liked.has(listing.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"
                            }`} />
                          </button>
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-bold price-tag">{formatPrice(listing.price)}</p>
                          <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{listing.title}</p>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {locale === "ru" ? "рядом" : "near"}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {listing.views_count ?? 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
