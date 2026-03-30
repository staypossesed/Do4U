"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft, Heart, Share2, MapPin, Eye as EyeIcon, Shield,
  Send, Zap, Star, ChevronLeft, ChevronRight,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MOCK_LISTINGS: Record<string, {
  id: string; title: string; titleEn: string;
  price: number; desc: string; descEn: string;
  category: string; dist: number; views: number; likes: number;
  imgs: string[]; seller: string; sellerAvatar: string; sellerRating: number;
  sellerSales: number; createdAt: string; tags: string[]; hot: boolean;
}> = {
  "1": {
    id: "1", title: "Кожаная куртка чёрная, размер M",
    titleEn: "Black Leather Jacket, Size M",
    price: 4500,
    desc: "Кожаная куртка чёрного цвета, размер M. Небольшая царапина на рукаве. Куплена в 2023 году. Отличное состояние, носила 2 раза.",
    descEn: "Black leather jacket, size M. Small scratch on sleeve. Purchased in 2023. Excellent condition, worn twice.",
    category: "clothing", dist: 1.2, views: 34, likes: 8,
    imgs: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
      "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    ],
    seller: "Аня К.", sellerAvatar: "АК", sellerRating: 4.9, sellerSales: 23,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    tags: ["кожа", "куртка", "чёрная", "M", "2023"], hot: true,
  },
  "2": {
    id: "2", title: "iPhone 14 Pro 256GB Space Black",
    titleEn: "iPhone 14 Pro 256GB Space Black",
    price: 62000,
    desc: "iPhone 14 Pro 256GB Space Black. Полный комплект, чек есть. Состояние 9/10, небольшие царапины на корпусе. Работает отлично.",
    descEn: "iPhone 14 Pro 256GB Space Black. Full kit, receipt included. Condition 9/10, minor scratches on body. Works perfectly.",
    category: "electronics", dist: 0.8, views: 210, likes: 41,
    imgs: [
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&q=80",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80",
    ],
    seller: "Макс П.", sellerAvatar: "МП", sellerRating: 5.0, sellerSales: 47,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    tags: ["iPhone", "Apple", "14 Pro", "256GB", "черный"], hot: true,
  },
};

const MOCK_MESSAGES = [
  { id: 1, from: "buyer", text: "Привет! Ещё актуально?", time: "10:32" },
  { id: 2, from: "claw",  text: "✅ Да, товар доступен! Готовы к встрече сегодня. Когда вам удобно?", time: "10:32", isClaw: true },
  { id: 3, from: "buyer", text: "Уступите до 4000?", time: "10:35" },
  { id: 4, from: "claw",  text: "Минимальная цена — 4200 ₽. Это уже со скидкой 300 ₽ 🤝", time: "10:35", isClaw: true },
];

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale } = useAppStore();
  const router = useRouter();
  const listing = MOCK_LISTINGS[id];

  const [imgIdx, setImgIdx]   = useState(0);
  const [liked, setLiked]     = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [msg, setMsg]          = useState("");

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <p className="text-muted-foreground">
          {locale === "ru" ? "Объявление не найдено" : "Listing not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/marketplace">{locale === "ru" ? "Назад" : "Back"}</Link>
        </Button>
      </div>
    );
  }

  const title = locale === "ru" ? listing.title : listing.titleEn;
  const desc  = locale === "ru" ? listing.desc  : listing.descEn;
  const imgs  = listing.imgs;

  return (
    <div className="flex flex-col pb-32">
      {/* Image carousel */}
      <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={imgIdx}
            src={imgs[imgIdx]}
            alt={title}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>

        {/* Overlay top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4
          bg-gradient-to-b from-black/50 to-transparent">
          <button onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm">
              <Share2 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm"
            >
              <Heart className={`h-4 w-4 transition-colors ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
            </button>
          </div>
        </div>

        {/* Pagination dots */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imgs.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === imgIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Prev/next */}
        {imgs.length > 1 && (
          <>
            {imgIdx > 0 && (
              <button onClick={() => setImgIdx(i => i - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                  bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
            )}
            {imgIdx < imgs.length - 1 && (
              <button onClick={() => setImgIdx(i => i + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                  bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            )}
          </>
        )}

        {/* Hot badge */}
        {listing.hot && (
          <div className="absolute top-16 left-4 flex items-center gap-1
            px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
            <Zap className="h-3 w-3 fill-white" />
            {locale === "ru" ? "Горячий" : "Hot"}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-5 space-y-5">
        {/* Price + title */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-3xl font-extrabold price-tag claw-gradient-text">
              {formatPrice(listing.price)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <EyeIcon className="h-3.5 w-3.5" />
              {listing.views}
              <Heart className="h-3.5 w-3.5 ml-1" />
              {listing.likes}
            </div>
          </div>
          <h1 className="text-lg font-bold mt-1 leading-tight">{title}</h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {listing.dist} км
            </span>
            <span>{formatRelativeTime(listing.createdAt)}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {listing.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="rounded-full text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {locale === "ru" ? "Описание" : "Description"}
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{desc}</p>
        </div>

        {/* Seller card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl
          dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
          <div className="flex items-center justify-center w-11 h-11 rounded-full
            claw-gradient text-white text-sm font-bold shrink-0">
            {listing.sellerAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{listing.seller}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{listing.sellerRating}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                · {listing.sellerSales} {locale === "ru" ? "продаж" : "sales"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full
            bg-green-500/15 border border-green-500/20">
            <Shield className="h-3 w-3 text-green-400" />
            <span className="text-[10px] text-green-400 font-semibold">
              {locale === "ru" ? "Verified" : "Verified"}
            </span>
          </div>
        </div>

        {/* Claw AI chat preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
              bg-orange-500/15 border border-orange-500/20">
              <Zap className="h-3 w-3 text-orange-400" />
              <span className="text-xs text-orange-400 font-bold">Claw AI</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "ru" ? "ведёт переговоры за продавца" : "negotiates on seller's behalf"}
            </p>
          </div>
          <div className="space-y-2 p-3 rounded-2xl dark:bg-white/3 bg-black/3
            border dark:border-white/5 border-black/5 max-h-36 overflow-y-auto scrollbar-none">
            {MOCK_MESSAGES.map(m => (
              <div key={m.id} className={`flex ${m.from === "buyer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${
                  m.from === "buyer"
                    ? "dark:bg-white/10 bg-black/10"
                    : m.isClaw
                    ? "claw-gradient text-white"
                    : "dark:bg-white/10 bg-black/10"
                }`}>
                  {m.isClaw && (
                    <span className="text-[10px] text-white/70 block mb-0.5">🤖 Claw</span>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-background/90
        backdrop-blur-xl border-t dark:border-white/5 border-black/5 safe-bottom max-w-lg mx-auto">
        <div className="flex gap-3 pt-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-12"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {locale === "ru" ? "Написать" : "Message"}
          </Button>
          <Button variant="claw" className="flex-1 rounded-xl h-12 font-bold glow-orange">
            <Zap className="h-4 w-4 mr-1.5 fill-white" />
            {locale === "ru" ? "Купить сейчас" : "Buy Now"}
          </Button>
        </div>

        {/* Inline quick message */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-2">
                <input
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder={locale === "ru" ? "Написать продавцу…" : "Message seller…"}
                  className="flex-1 h-10 px-3 rounded-xl text-sm border dark:border-white/10
                    border-black/10 dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="flex items-center justify-center w-10 h-10 rounded-xl claw-gradient">
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-none">
                {[
                  locale === "ru" ? "Ещё актуально?" : "Still available?",
                  locale === "ru" ? "Уступите 10%?" : "10% off?",
                  locale === "ru" ? "Где встречаемся?" : "Where to meet?",
                ].map(q => (
                  <button key={q} onClick={() => setMsg(q)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full
                      dark:bg-white/10 bg-black/5 dark:hover:bg-white/15 hover:bg-black/10
                      border dark:border-white/10 border-black/5 whitespace-nowrap transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

