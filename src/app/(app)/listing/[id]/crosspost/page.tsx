"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, ExternalLink, Check, ArrowLeft, Share2,
  Sparkles, Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Listing {
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  price: number;
  category: string;
  tags: string[];
}

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: string;
  url: string;
}

const PLATFORMS: Platform[] = [
  { id: "avito",    name: "Avito",            color: "bg-green-500",  icon: "🟢", url: "https://www.avito.ru/additem" },
  { id: "vk",       name: "VK Маркет",        color: "bg-blue-500",   icon: "🔵", url: "https://vk.com/market" },
  { id: "youla",    name: "Юла",              color: "bg-purple-500", icon: "🟣", url: "https://youla.ru/add" },
  { id: "ebay",     name: "eBay",             color: "bg-yellow-500", icon: "🟡", url: "https://www.ebay.com/sell" },
  { id: "fb",       name: "FB Marketplace",   color: "bg-blue-600",   icon: "📘", url: "https://www.facebook.com/marketplace/create/item" },
  { id: "offerup",  name: "OfferUp",          color: "bg-teal-500",   icon: "🔹", url: "https://offerup.com/post" },
];

function generateTemplate(listing: Listing, platform: string): string {
  const { title, description, price, tags, category } = listing;

  switch (platform) {
    case "avito":
      return `📌 ${title}\n\n${description}\n\n💰 Цена: ${price.toLocaleString()} ₽\n📁 Категория: ${category}\n🏷️ ${tags.join(", ")}\n\n📩 Пишите в чат, отвечу быстро!`;
    case "vk":
      return `${title}\n\n${description}\n\nЦена: ${price.toLocaleString()} ₽\n\n#${tags.join(" #")}\n\n✍️ Пишите в ЛС`;
    case "youla":
      return `${title}\n\n${description}\n\n${price.toLocaleString()} ₽\n\nТеги: ${tags.join(", ")}`;
    case "ebay":
      return `${listing.title_en || title}\n\n${listing.description_en || description}\n\nPrice: $${Math.round(price / 90)}\nCategory: ${category}\nTags: ${tags.join(", ")}`;
    case "fb":
      return `${listing.title_en || title}\n\n${listing.description_en || description}\n\n$${Math.round(price / 90)}\n\n#${tags.join(" #")}`;
    case "offerup":
      return `${listing.title_en || title}\n\n${listing.description_en || description}\n\n$${Math.round(price / 90)}`;
    default:
      return `${title}\n${description}\n${price}₽`;
  }
}

export default function CrosspostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale } = useAppStore();
  const supabase = createClient();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("title, title_en, description, description_en, price, category, tags")
        .eq("id", id)
        .single();

      if (data) setListing(data as unknown as Listing);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function copyTemplate(platformId: string) {
    if (!listing) return;
    const text = generateTemplate(listing, platformId);
    await navigator.clipboard.writeText(text);
    setCopied(platformId);
    toast.success(locale === "ru" ? "Скопировано!" : "Copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="w-9 h-9 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {locale === "ru" ? "Кросс-постинг" : "Cross-posting"}
          </h1>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{listing.title}</p>
        </div>
      </div>

      {/* Do4U: listing already live on marketplace */}
      <div className="p-4 rounded-2xl brand-gradient">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5" />
          <div>
            <p className="font-bold text-sm">Do4U</p>
            <p className="text-xs text-white/70">{locale === "ru" ? "Уже опубликовано" : "Already published"}</p>
          </div>
          <Badge className="ml-auto bg-white/20 text-white border-0 text-[10px]">
            <Check className="h-3 w-3 mr-0.5" />Live
          </Badge>
        </div>
      </div>

      {/* Platform cards */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {locale === "ru" ? "Опубликовать вручную" : "Publish manually"}
        </p>
        {PLATFORMS.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border dark:border-white/5 border-black/5 dark:bg-white/3 bg-black/3">
            <span className="text-2xl">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {locale === "ru" ? "Готовый шаблон" : "Ready template"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs"
                onClick={() => copyTemplate(p.id)}>
                {copied === p.id
                  ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                  : <Copy className="h-3.5 w-3.5" />}
                {locale === "ru" ? "Копировать" : "Copy"}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                onClick={() => window.open(p.url, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {locale === "ru" ? "Пример шаблона (Avito)" : "Template preview (Avito)"}
        </p>
        <pre className="text-xs whitespace-pre-wrap p-3 rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 font-mono leading-relaxed">
          {generateTemplate(listing, "avito")}
        </pre>
      </div>
    </div>
  );
}
