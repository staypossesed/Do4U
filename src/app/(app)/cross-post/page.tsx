"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Copy, Check, ExternalLink, Share2,
  Sparkles, Package, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ListingBasic {
  id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  price: number;
  category: string;
  tags: string[];
}

const PLATFORMS = [
  {
    id: "avito",
    name: "Avito",
    color: "bg-emerald-500",
    format: (l: ListingBasic) => `📦 ${l.title}\n\n${l.description}\n\n💰 Цена: ${l.price.toLocaleString()} ₽\n\n📱 Связь через Do4U\n#${l.tags.join(" #")}`,
  },
  {
    id: "vk",
    name: "VK Market",
    color: "bg-blue-500",
    format: (l: ListingBasic) => `🔥 ${l.title}\n\n${l.description}\n\nЦена: ${l.price.toLocaleString()} ₽\n\nНаписать: Do4U\n${l.tags.map(t => `#${t}`).join(" ")}`,
  },
  {
    id: "ebay",
    name: "eBay",
    color: "bg-yellow-500",
    format: (l: ListingBasic) => `${l.title_en || l.title}\n\n${l.description_en || l.description}\n\nPrice: $${Math.round(l.price / 90)} USD\n\nTags: ${l.tags.join(", ")}`,
  },
  {
    id: "telegram",
    name: "Telegram",
    color: "bg-sky-500",
    format: (l: ListingBasic) => `🏷 *${l.title}*\n\n${l.description}\n\n💰 ${l.price.toLocaleString()} ₽\n\n📲 Подробнее в Do4U`,
  },
];

export default function CrossPostPage() {
  const { locale } = useAppStore();
  const supabase = createClient();

  const [listings, setListings] = useState<ListingBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ListingBasic | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("listings")
        .select("id, title, title_en, description, description_en, price, category, tags")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      setListings((data as ListingBasic[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function copyTemplate(platformId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [platformId]: true });
      toast.success(locale === "ru" ? "Скопировано!" : "Copied!");
      setTimeout(() => setCopied(c => ({ ...c, [platformId]: false })), 2000);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function shareNative(text: string) {
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(locale === "ru" ? "Скопировано!" : "Copied!");
    }
  }

  if (!selected) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Share2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-extrabold">{locale === "ru" ? "Кросс-постинг" : "Cross-posting"}</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "Выбери объявление — получишь готовые шаблоны для Avito, VK, eBay и Telegram"
            : "Select a listing — get ready templates for Avito, VK, eBay and Telegram"}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl dark:bg-white/5 bg-black/5 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">
              {locale === "ru" ? "Нет активных объявлений" : "No active listings"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map(l => (
              <motion.button
                key={l.id}
                onClick={() => setSelected(l)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 text-left"
              >
                <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.price.toLocaleString()} ₽ · {l.category}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="text-primary text-sm font-medium">
          ← {locale === "ru" ? "Назад" : "Back"}
        </button>
      </div>

      <div className="p-3 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
        <p className="text-sm font-bold">{selected.title}</p>
        <p className="text-xs text-muted-foreground">{selected.price.toLocaleString()} ₽</p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map(p => {
          const text = p.format(selected);
          return (
            <div key={p.id} className="rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b dark:border-white/5 border-black/5">
                <div className={`w-6 h-6 rounded-md ${p.color} flex items-center justify-center`}>
                  <ExternalLink className="h-3 w-3 text-white" />
                </div>
                <p className="text-sm font-bold">{p.name}</p>
                <Badge variant="outline" className="ml-auto text-[9px]">
                  {locale === "ru" ? "шаблон" : "template"}
                </Badge>
              </div>
              <pre className="px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-none leading-relaxed">
                {text}
              </pre>
              <div className="flex gap-2 p-2 border-t dark:border-white/5 border-black/5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl text-xs"
                  onClick={() => copyTemplate(p.id, text)}
                >
                  {copied[p.id] ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied[p.id] ? (locale === "ru" ? "Скопировано" : "Copied") : (locale === "ru" ? "Копировать" : "Copy")}
                </Button>
                <Button
                  variant="brand"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => shareNative(text)}
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  {locale === "ru" ? "Поделиться" : "Share"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
