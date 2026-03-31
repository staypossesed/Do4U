"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import { fadeUp, staggerChildren as stagger } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";
import {
  Package, TrendingUp, DollarSign, Sparkles,
  ArrowRight, Lock, Eye, Heart, MessageCircle, Plus,
  Share2, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "sell" | "buy";

interface UserListing {
  id: string;
  title: string;
  price: number;
  status: string;
  views_count: number;
  created_at: string;
  listing_images: { url_original: string; order: number }[];
}

export default function DashboardPage() {
  const { locale } = useAppStore();
  const t = getTranslations(locale);
  const [tab, setTab] = useState<Tab>("sell");

  return (
    <motion.div
      className="px-4 py-5 space-y-5"
      variants={stagger} initial="initial" animate="animate"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <p className="text-sm text-muted-foreground">
          {locale === "ru" ? "Добро пожаловать" : "Welcome back"}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
          <span className="brand-gradient-text">Do4U</span>
          {locale === "ru" ? " — Sell4U и Buy4U" : " — Sell4U & Buy4U"}
        </h1>
      </motion.div>

      {/* Tab switcher */}
      <motion.div variants={fadeUp}
        className="flex p-1 gap-1 rounded-2xl dark:bg-white/5 bg-black/5"
      >
        {(["sell", "buy"] as Tab[]).map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative ${
              tab === t2
                ? "dark:bg-white/10 bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t2 === "sell" ? t.sell.title : t.buy.title}
            {t2 === "buy" && (
              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider
                bg-gradient-to-r from-orange-400 to-purple-500 text-transparent bg-clip-text">
                soon
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {tab === "sell" ? <SellTab /> : <BuyStub />}
    </motion.div>
  );
}

function SellTab() {
  const { locale } = useAppStore();
  const t = getTranslations(locale);
  const supabase = useMemo(() => createClient(), []);

  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, sold: 0, earned: 0, views: 0, likes: 0, chats: 0 });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("listings")
        .select("id, title, price, status, views_count, created_at, listing_images(url_original, \"order\")")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const items = (data as unknown as UserListing[]) ?? [];
      setListings(items);

      const active = items.filter(l => l.status === "active").length;
      const sold = items.filter(l => l.status === "sold").length;
      const earned = items.filter(l => l.status === "sold").reduce((s, l) => s + l.price, 0);
      const views = items.reduce((s, l) => s + (l.views_count ?? 0), 0);

      setStats({ active, sold, earned, views, likes: 0, chats: 0 });
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <>
      {/* Hero CTA */}
      <motion.div variants={fadeUp}>
        <Link href="/sell/new">
          <div className="relative overflow-hidden rounded-3xl p-5 brand-gradient glow-orange">
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-2 w-24 h-24 rounded-full bg-white/5" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-1">
                  Sell4U
                </p>
                <h2 className="text-white text-xl font-extrabold leading-tight">
                  {locale === "ru" ? "Продать за\n60 секунд" : "Sell in\n60 seconds"}
                </h2>
                <p className="text-white/70 text-xs mt-1.5">
                  {locale === "ru" ? "Голос + фото → Do4U делает всё" : "Voice + photo → Do4U does it all"}
                </p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 shrink-0 ml-4">
                <Plus className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { icon: Package,    value: String(stats.active), label: locale === "ru" ? "Активных" : "Active",  color: "text-orange-400" },
          { icon: TrendingUp, value: String(stats.sold),   label: locale === "ru" ? "Продано"  : "Sold",    color: "text-emerald-400" },
          { icon: DollarSign, value: formatPrice(stats.earned), label: locale === "ru" ? "Заработок": "Earned", color: "text-yellow-400" },
        ].map((s) => (
          <div key={s.label}
            className="rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 p-3.5 flex flex-col gap-2"
          >
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <p className="text-xl font-extrabold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* User's listings */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length > 0 ? (
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {locale === "ru" ? "Мои объявления" : "My Listings"}
          </p>
          {listings.map(l => {
            const img = l.listing_images?.sort((a, b) => a.order - b.order)?.[0]?.url_original;
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-2xl border dark:border-white/5 border-black/5 dark:bg-white/3 bg-black/3">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{l.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold brand-gradient-text">{formatPrice(l.price)}</span>
                    <Badge variant="secondary" className="text-[9px]">
                      {l.status === "active" ? (locale === "ru" ? "Активно" : "Active")
                        : l.status === "sold" ? (locale === "ru" ? "Продано" : "Sold")
                        : l.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />{l.views_count ?? 0}
                    </span>
                  </div>
                </div>
                <Link href={`/listing/${l.id}/crosspost`}
                  className="w-8 h-8 rounded-lg dark:bg-white/5 bg-black/5 flex items-center justify-center">
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <>
          {/* How it works */}
          <motion.div variants={fadeUp} className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {locale === "ru" ? "Как работает" : "How it works"}
            </p>
            {[
              { n: "01", title: locale === "ru" ? "Скажи 10-15 секунд" : "Speak 10-15 seconds", desc: locale === "ru" ? "Опиши товар — AI сразу даёт подсказки" : "Describe item — AI gives live hints", color: "from-orange-500 to-rose-500" },
              { n: "02", title: locale === "ru" ? "Сфотографируй (4-8 фото)" : "Take 4-8 photos", desc: locale === "ru" ? "AI улучшает каждое: свет, фон, 360°" : "AI enhances each: light, bg, 360°", color: "from-rose-500 to-purple-600" },
              { n: "03", title: locale === "ru" ? "Do4U публикует везде" : "Do4U publishes everywhere", desc: locale === "ru" ? "Marketplace + Avito + VK + шаблоны" : "Marketplace + Avito + VK + templates", color: "from-purple-600 to-blue-500" },
              { n: "04", title: locale === "ru" ? "Do4U ведёт за тебя" : "Do4U manages for you", desc: locale === "ru" ? "Чаты 24/7, GPS встреча, эскроу" : "Chats 24/7, GPS meet, escrow", color: "from-blue-500 to-teal-500" },
            ].map((step) => (
              <div key={step.n}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl dark:bg-white/3 bg-black/3 border dark:border-white/5 border-black/5">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} text-white text-xs font-extrabold shrink-0`}>
                  {step.n}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </div>
            ))}
          </motion.div>

          {/* Empty listings placeholder */}
          <motion.div variants={fadeUp}
            className="rounded-3xl border-2 border-dashed dark:border-white/10 border-black/10 p-8 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl
              brand-gradient-subtle border dark:border-white/10 border-black/5 mx-auto mb-4">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold mb-1">
              {locale === "ru" ? "Пока пусто" : "Nothing here yet"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {locale === "ru" ? "Создай первое объявление — Do4U сделает всё" : "Create your first listing — Do4U does the rest"}
            </p>
            <Button variant="brand" size="sm" className="rounded-xl" asChild>
              <Link href="/sell/new">
                <Sparkles className="h-4 w-4 mr-1.5" />
                {t.sell.newListing}
              </Link>
            </Button>
          </motion.div>
        </>
      )}

      {/* Quick stats cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        {[
          { icon: Eye, label: locale === "ru" ? "Просмотры" : "Views", val: String(stats.views) },
          { icon: Heart, label: locale === "ru" ? "Лайки" : "Likes", val: String(stats.likes) },
          { icon: MessageCircle, label: locale === "ru" ? "Чаты" : "Chats", val: String(stats.chats) },
        ].map((c) => (
          <div key={c.label}
            className="rounded-2xl dark:bg-white/5 bg-black/5 p-3 text-center">
            <c.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-base font-bold">{c.val}</p>
            <p className="text-[10px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </motion.div>
    </>
  );
}

function BuyStub() {
  const { locale } = useAppStore();
  return (
    <motion.div variants={fadeUp}
      className="relative overflow-hidden rounded-3xl p-7 text-center
        dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/5"
    >
      <div className="absolute inset-0 brand-gradient-subtle" />
      <div className="relative">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl
          dark:bg-white/10 bg-black/5 mx-auto mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-extrabold mb-2">Buy4U</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
          {locale === "ru"
            ? "Buy4U найдёт лучшие предложения в радиусе 30 км, сторгуется и договорится о встрече"
            : "Buy4U finds best deals within 30 km, negotiates price and arranges the meetup"}
        </p>
        <Badge className="brand-gradient text-white border-0 px-4 py-1.5 text-xs font-bold">
          {locale === "ru" ? "Скоро · Этап 2" : "Coming Soon · Stage 2"}
        </Badge>
        <div className="mt-6 grid grid-cols-3 gap-2 text-left">
          {[
            { emoji: "🔍", label: locale === "ru" ? "AI-поиск" : "AI Search" },
            { emoji: "💬", label: locale === "ru" ? "Авто-торг" : "Auto-haggle" },
            { emoji: "📍", label: locale === "ru" ? "30 км" : "30 km" },
          ].map(f => (
            <div key={f.label} className="rounded-xl dark:bg-white/5 bg-black/5 p-3 text-center">
              <span className="text-xl">{f.emoji}</span>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
