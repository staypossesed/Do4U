"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, MessageCircle, Package, Eye } from "lucide-react";

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
      setRows((data as Row[]) ?? []);
      setLoading(false);
    }
    void load();
  }, [supabase]);

  const filtered = rows.filter((r) => (tab === "active" ? r.status === "active" : r.status === "sold"));

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
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        {listing.views_count ?? 0}
                      </span>
                      <span className="uppercase tracking-wide">{listing.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs" asChild>
                    <Link href={`/marketplace/${listing.id}`}>
                      {locale === "ru" ? "Открыть" : "Open"}
                    </Link>
                  </Button>
                  {listing.status === "active" && (
                    <Button variant="brand" size="sm" className="flex-1 rounded-xl text-xs glow-orange" asChild>
                      <Link href={`/chats?listing=${listing.id}`}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        {locale === "ru" ? "Чат" : "Chat"}
                      </Link>
                    </Button>
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
