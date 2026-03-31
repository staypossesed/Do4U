"use client";

import { useEffect, useState, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, isDo4UAiSender } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Heart, Share2, MapPin, MessageCircle,
  Sparkles, Zap, ChevronLeft, ChevronRight, Send, Bot,
} from "lucide-react";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  price: number;
  category: string;
  tags: string[];
  views_count: number;
  created_at: string;
  user_id: string;
  listing_images: { url_original: string; order: number }[];
  users: { name: string | null; avatar_url: string | null } | null;
}

interface ChatMessage {
  id: string;
  from: "buyer" | "do4u" | "claw";
  text: string;
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale } = useAppStore();
  const supabase = useMemo(() => createClient(), []);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  // Chat simulation
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("*, listing_images(url_original, \"order\"), users(name, avatar_url)")
        .eq("id", id)
        .single();

      if (data) {
        setListing(data as unknown as Listing);
        // Increment view count
        await supabase
          .from("listings")
          .update({ views_count: (data.views_count ?? 0) + 1 })
          .eq("id", id);
      }
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  async function sendChat() {
    if (!chatInput.trim() || !listing) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(prev => [...prev, { id: Date.now().toString(), from: "buyer", text: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          listingTitle: listing.title,
          listingPrice: listing.price,
        }),
      });
      const data = await res.json();
      setChatMsgs(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: "do4u", text: data.reply },
      ]);
    } catch {
      setChatMsgs(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: "do4u", text: "Извините, попробуйте позже." },
      ]);
    }

    setChatLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60dvh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60dvh] gap-3">
        <p className="text-sm text-muted-foreground">
          {locale === "ru" ? "Объявление не найдено" : "Listing not found"}
        </p>
        <Link href="/marketplace">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> {locale === "ru" ? "Назад" : "Back"}
          </Button>
        </Link>
      </div>
    );
  }

  const images = listing.listing_images?.sort((a, b) => a.order - b.order) ?? [];
  const title = (locale === "en" && listing.title_en) ? listing.title_en : listing.title;
  const desc = (locale === "en" && listing.description_en) ? listing.description_en : listing.description;

  return (
    <div className="pb-6">
      {/* Image carousel */}
      <div className="relative">
        {images.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imgIdx]?.url_original}
              alt={title}
              className="w-full object-cover"
              style={{ aspectRatio: "4/3" }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full bg-muted flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
            <Sparkles className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        <Link href="/marketplace"
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div className="absolute top-3 right-3 flex gap-2">
          <button onClick={() => setLiked(!liked)}
            className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
          </button>
          <button className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-4 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-extrabold leading-tight">{title}</h1>
            <p className="text-xl font-extrabold brand-gradient-text shrink-0">{formatPrice(listing.price)}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px]">{listing.category}</Badge>
            <span className="text-xs text-muted-foreground">{listing.views_count} {locale === "ru" ? "просм." : "views"}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {new Date(listing.created_at).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
            </span>
          </div>
        </div>

        {desc && (
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {locale === "ru" ? "Описание" : "Description"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        )}

        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.map(t => (
              <Badge key={t} variant="outline" className="text-[10px] rounded-full">{t}</Badge>
            ))}
          </div>
        )}

        {/* Seller */}
        <div className="flex items-center gap-3 p-3 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
          <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-sm font-bold text-white">
            {listing.users?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{listing.users?.name || (locale === "ru" ? "Продавец" : "Seller")}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-orange-400" />
              Do4U {locale === "ru" ? "ведёт чат" : "manages chat"}
            </p>
          </div>
        </div>

        {/* Do4U AI chat preview */}
        <div className="rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b dark:border-white/5 border-black/5">
            <Bot className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold">Do4U AI</p>
            <Badge className="ml-auto text-[9px] brand-gradient text-white border-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Live
            </Badge>
          </div>

          <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-2 scrollbar-none">
            {chatMsgs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                {locale === "ru" ? "Напиши продавцу — Do4U ответит за него" : "Message the seller — Do4U responds for them"}
              </p>
            )}
            {chatMsgs.map(m => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.from === "buyer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                  m.from === "buyer"
                    ? "dark:bg-white/10 bg-black/10 rounded-br-sm"
                    : "brand-gradient text-white rounded-bl-sm"
                }`}>
                  {isDo4UAiSender(m.from) && <span className="text-[9px] text-white/70 block mb-0.5">🤖 Do4U</span>}
                  {m.text}
                </div>
              </motion.div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl rounded-bl-sm brand-gradient">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 px-3 py-2 border-t dark:border-white/5 border-black/5">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder={locale === "ru" ? "Написать продавцу..." : "Message seller..."}
              className="flex-1 h-8 px-3 rounded-lg text-xs border dark:border-white/10 border-black/10
                dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button onClick={sendChat} variant="brand" size="icon" className="rounded-lg h-8 w-8">
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12">
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {locale === "ru" ? "Написать" : "Message"}
          </Button>
          <Button variant="brand" className="flex-1 rounded-xl h-12 font-bold">
            <MapPin className="h-4 w-4 mr-1.5" />
            {locale === "ru" ? "Встретиться" : "Meet Up"}
          </Button>
        </div>
      </div>
    </div>
  );
}
