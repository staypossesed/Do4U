"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import {
  Search, SlidersHorizontal, MapPin, Heart,
  Sparkles, TrendingUp, Clock, Zap, Eye,
} from "lucide-react";
import Link from "next/link";

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LISTINGS = [
  { id: "1", title: "Кожаная куртка чёрная", price: 4500, category: "clothing", dist: 1.2, views: 34,  likes: 8,  img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80", hot: true  },
  { id: "2", title: "iPhone 14 Pro 256GB",  price: 62000, category: "electronics", dist: 0.8, views: 210, likes: 41, img: "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400&q=80", hot: true  },
  { id: "3", title: "Air Max 90 Nike, 42",  price: 7200, category: "shoes", dist: 3.1, views: 55,  likes: 12, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80", hot: false },
  { id: "4", title: "MacBook Air M2 13″",   price: 89000, category: "electronics", dist: 2.4, views: 189, likes: 37, img: "https://images.unsplash.com/photo-1611186871525-5da09e53d98a?w=400&q=80", hot: false },
  { id: "5", title: "Платье Zara, размер S", price: 1800, category: "clothing", dist: 0.5, views: 22,  likes: 5,  img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80", hot: false },
  { id: "6", title: "Гарри Поттер (7 книг)",price: 1200, category: "books", dist: 4.0, views: 18,  likes: 3,  img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80", hot: false },
  { id: "7", title: "Sony WH-1000XM5",      price: 18000, category: "electronics", dist: 1.7, views: 98,  likes: 22, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80", hot: false },
  { id: "8", title: "Кресло Herman Miller",  price: 35000, category: "furniture", dist: 5.2, views: 44,  likes: 9,  img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80", hot: false },
];

const CATEGORIES = [
  { id: "all",         emoji: "✨", labelRu: "Все",          labelEn: "All" },
  { id: "clothing",    emoji: "👕", labelRu: "Одежда",       labelEn: "Clothing" },
  { id: "electronics", emoji: "📱", labelRu: "Электроника",  labelEn: "Electronics" },
  { id: "shoes",       emoji: "👟", labelRu: "Обувь",        labelEn: "Shoes" },
  { id: "furniture",   emoji: "🪑", labelRu: "Мебель",       labelEn: "Furniture" },
  { id: "books",       emoji: "📚", labelRu: "Книги",        labelEn: "Books" },
  { id: "accessories", emoji: "👜", labelRu: "Аксессуары",   labelEn: "Accessories" },
  { id: "toys",        emoji: "🧸", labelRu: "Игрушки",      labelEn: "Toys" },
];

const SORTS = [
  { id: "new",     icon: Clock,       labelRu: "Новые",     labelEn: "Newest" },
  { id: "near",    icon: MapPin,      labelRu: "Рядом",     labelEn: "Nearby" },
  { id: "hot",     icon: Zap,         labelRu: "Горячие",   labelEn: "Hot" },
  { id: "popular", icon: TrendingUp,  labelRu: "Популярные",labelEn: "Popular" },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { locale } = useAppStore();
  const [query, setQuery]    = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort]      = useState("new");
  const [liked, setLiked]    = useState<Set<string>>(new Set());

  const filtered = MOCK_LISTINGS
    .filter(l => category === "all" || l.category === category)
    .filter(l => l.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "near")    return a.dist - b.dist;
      if (sort === "popular") return b.views - a.views;
      if (sort === "hot")     return (b.hot ? 1 : 0) - (a.hot ? 1 : 0);
      return 0;
    });

  function toggleLike(id: string) {
    setLiked(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Sticky top bar */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b dark:border-white/5 border-black/5 px-4 py-3 space-y-3">

        {/* Search */}
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
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg
            dark:bg-white/10 bg-black/10">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-0.5">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                whitespace-nowrap border transition-all duration-200 shrink-0 ${
                category === c.id
                  ? "claw-gradient text-white border-transparent shadow-md"
                  : "dark:border-white/10 border-black/10 dark:text-gray-300 text-gray-600 dark:hover:bg-white/5 hover:bg-black/5"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{locale === "ru" ? c.labelRu : c.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Sort pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {SORTS.map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                whitespace-nowrap transition-all shrink-0 ${
                sort === s.id
                  ? "dark:bg-white/15 bg-black/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <s.icon className="h-3 w-3" />
              {locale === "ru" ? s.labelRu : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold">
            {locale === "ru" ? "Рядом с тобой" : "Near You"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length}{locale === "ru" ? " объявлений · Москва" : " listings · Moscow"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
          dark:bg-orange-500/15 bg-orange-500/10 border border-orange-500/20">
          <MapPin className="h-3 w-3 text-orange-400" />
          <span className="text-xs text-orange-400 font-semibold">30 км</span>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
          >
            <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold">{locale === "ru" ? "Ничего не найдено" : "Nothing found"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === "ru" ? "Попробуй другой запрос или категорию" : "Try a different query or category"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-2 gap-3 px-4 pb-6"
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          >
            {filtered.map(listing => (
              <motion.div
                key={listing.id}
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.3 }}
              >
                <Link href={`/marketplace/${listing.id}`}>
                  <div className="rounded-2xl overflow-hidden border dark:border-white/5 border-black/5
                    dark:bg-card bg-card hover:shadow-lg transition-shadow">

                    {/* Image */}
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={listing.img}
                        alt={listing.title}
                        className="listing-img"
                      />
                      {/* Hot badge */}
                      {listing.hot && (
                        <div className="absolute top-2 left-2 flex items-center gap-1
                          px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                          <Zap className="h-2.5 w-2.5 fill-white" />
                          {locale === "ru" ? "Горячий" : "Hot"}
                        </div>
                      )}
                      {/* Like button */}
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

                    {/* Info */}
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-bold price-tag">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                        {listing.title}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {listing.dist} км
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {listing.views}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

