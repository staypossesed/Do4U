"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import { fadeUp, fadeInScale, staggerChildren as stagger } from "@/lib/motion";
import { formatPrice } from "@/lib/utils";
import {
  Package, TrendingUp, DollarSign, Sparkles,
  ArrowRight, Eye, Heart, MessageCircle,
  Share2, Loader2, Search, MessagesSquare, MapPinned,
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
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("users").select("name").eq("id", user.id).maybeSingle();
      const first = p?.name?.trim().split(/\s+/)[0];
      setWelcomeName(first || null);
    })();
  }, []);

  return (
    <motion.div
      className="px-4 py-6 space-y-6"
      variants={stagger} initial="initial" animate="animate"
    >
      {/* Greeting */}
      <motion.div variants={fadeInScale} className="space-y-1.5">
        <h1 className="text-2xl sm:text-[1.65rem] font-extrabold tracking-tight text-foreground leading-snug">
          {welcomeName
            ? (locale === "ru"
              ? `Добро пожаловать обратно, ${welcomeName}`
              : `Welcome back, ${welcomeName}`)
            : (locale === "ru" ? "Добро пожаловать" : "Welcome")}
        </h1>
        <p className="text-lg font-extrabold tracking-tight">
          <span className="brand-gradient-text">Do4U</span>
          <span className="text-foreground font-bold">
            {locale === "ru" ? " · Sell4U и Buy4U" : " · Sell4U & Buy4U"}
          </span>
        </p>
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
      <motion.div variants={fadeInScale}>
        <Link href="/sell/new" className="block active:scale-[0.99] transition-transform">
          <div className="relative overflow-hidden rounded-[1.75rem] min-h-[168px] px-6 py-8
            brand-gradient glow-orange shadow-2xl shadow-orange-500/30 dark:shadow-orange-500/20">
            <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-10 left-1/4 w-40 h-40 rounded-full bg-purple-500/25 blur-2xl" />
            <div className="absolute top-4 right-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="relative max-w-[85%]">
              <p className="text-white/85 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">
                Sell4U
              </p>
              <h2 className="text-white text-2xl sm:text-3xl font-black leading-[1.15] tracking-tight">
                {locale === "ru" ? "Продать за 60 секунд" : "Sell in 60 seconds"}
              </h2>
              <p className="text-white/90 text-sm sm:text-[15px] mt-4 leading-relaxed font-medium">
                {locale === "ru"
                  ? "Голос + фото → Do4U делает всё автоматически"
                  : "Voice + photo → Do4U does everything automatically"}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeInScale} className="grid grid-cols-3 gap-3">
        {[
          { icon: Package,    value: String(stats.active), label: locale === "ru" ? "Активных" : "Active",  color: "text-orange-400" },
          { icon: TrendingUp, value: String(stats.sold),   label: locale === "ru" ? "Продано"  : "Sold",    color: "text-emerald-400" },
          { icon: DollarSign, value: formatPrice(stats.earned), label: locale === "ru" ? "Заработок": "Earned", color: "text-amber-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-3xl p-4 flex flex-col gap-2.5
              dark:bg-white/[0.06] bg-white
              dark:border dark:border-white/[0.08] border border-black/[0.06]
              shadow-lg shadow-black/[0.06] dark:shadow-black/40
              ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl dark:bg-white/10 bg-black/[0.04]">
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-xl font-black tracking-tight">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-semibold leading-tight">{s.label}</p>
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
      <motion.div variants={fadeInScale} className="grid grid-cols-3 gap-2">
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
  const cards = [
    {
      icon: Search,
      title: locale === "ru" ? "AI-поиск" : "AI search",
      sub: locale === "ru" ? "Лучшие объявления под тебя" : "Best listings for you",
      grad: "from-orange-500/90 to-rose-500/80",
    },
    {
      icon: MessagesSquare,
      title: locale === "ru" ? "Авто-торг" : "Auto-negotiation",
      sub: locale === "ru" ? "Do4U торгуется за тебя" : "Do4U negotiates for you",
      grad: "from-purple-600/90 to-violet-500/80",
    },
    {
      icon: MapPinned,
      title: locale === "ru" ? "Встреча рядом" : "Meet nearby",
      sub: locale === "ru" ? "В радиусе 30 км" : "Within 30 km",
      grad: "from-blue-500/85 to-teal-500/75",
    },
  ];
  return (
    <motion.div
      variants={fadeInScale}
      className="relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8 text-center
        dark:bg-white/[0.04] bg-white border dark:border-white/10 border-black/8
        shadow-xl shadow-black/[0.07] dark:shadow-black/50"
    >
      <div className="absolute inset-0 brand-gradient-subtle opacity-80 pointer-events-none" />
      <div className="relative space-y-4">
        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest">
          Buy4U
        </Badge>
        <h3 className="text-2xl sm:text-[1.65rem] font-black tracking-tight">
          {locale === "ru" ? "Buy4U — скоро" : "Buy4U — coming soon"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {locale === "ru"
            ? "Do4U найдёт лучшие предложения рядом, сторгуется и договорится о встрече"
            : "Do4U will find the best deals near you, negotiate, and arrange the meetup"}
        </p>

        <div className="grid gap-3 pt-2 text-left">
          {cards.map((c) => (
            <div
              key={c.title}
              className="flex items-center gap-3 p-3.5 rounded-2xl dark:bg-white/5 bg-black/[0.03]
                border dark:border-white/8 border-black/6 shadow-md shadow-black/[0.04]"
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0
                  bg-gradient-to-br ${c.grad} text-white shadow-lg`}
              >
                <c.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-muted-foreground pt-2">
          {locale === "ru"
            ? "Этап 2 — запуск через несколько недель"
            : "Stage 2 — launching in a few weeks"}
        </p>
      </div>
    </motion.div>
  );
}
