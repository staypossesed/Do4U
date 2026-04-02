"use client";

import { useEffect, useState, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, isDo4UAiSender } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft, Heart, Share2, MapPin, MessageCircle,
  Sparkles, Zap, ChevronLeft, ChevronRight, Send, Bot, Loader2,
} from "lucide-react";
import Link from "next/link";
import type { Json } from "@/lib/types/database";
import { toast } from "sonner";
import { SellerDraft } from "@/components/chat/SellerDraft";

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
  listing_images: { url_original: string; url_enhanced?: string | null; order: number }[];
  users: { name: string | null; avatar_url: string | null } | null;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "buyer" | "seller" | "do4u" | "claw";
  timestamp: string;
}

function parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is ChatMessage =>
      typeof m === "object" &&
      m !== null &&
      "id" in m &&
      "text" in m &&
      "sender" in m,
  ) as ChatMessage[];
}

function parsePending(raw: unknown): string | null {
  if (!raw || typeof raw !== "object" || !("text" in raw)) return null;
  const t = (raw as { text?: unknown }).text;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale } = useAppStore();
  const supabase = useMemo(() => createClient(), []);

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isClawManaged, setIsClawManaged] = useState(true);
  const [buyerSuggestLoading, setBuyerSuggestLoading] = useState(false);

  const [sellerChatId, setSellerChatId] = useState<string | null>(null);
  const [sellerMsgs, setSellerMsgs] = useState<ChatMessage[]>([]);
  const [sellerClawManaged, setSellerClawManaged] = useState(true);
  const [sellerPendingText, setSellerPendingText] = useState<string | null>(null);
  const [sellerFreeInput, setSellerFreeInput] = useState("");
  const [sellerReplyLoading, setSellerReplyLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from("listings")
        .select("*, listing_images(url_original, url_enhanced, \"order\"), users(name, avatar_url)")
        .eq("id", id)
        .single();

      if (data) {
        const row = data as unknown as Listing;
        setListing(row);
        await supabase
          .from("listings")
          .update({ views_count: (row.views_count ?? 0) + 1 })
          .eq("id", id);

        if (user && user.id !== row.user_id) {
          const { data: existing } = await supabase
            .from("chats")
            .select("id, messages, is_claw_managed")
            .eq("listing_id", id)
            .eq("buyer_id", user.id)
            .maybeSingle();

          if (existing) {
            setChatId(existing.id);
            setChatMsgs(parseMessages(existing.messages));
            setIsClawManaged(existing.is_claw_managed ?? true);
          }
        } else if (user && user.id === row.user_id) {
          const { data: sc } = await supabase
            .from("chats")
            .select("id, messages, is_claw_managed, pending_ai_suggestion")
            .eq("listing_id", id)
            .eq("seller_id", user.id)
            .order("last_message_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (sc) {
            setSellerChatId(sc.id);
            setSellerMsgs(parseMessages(sc.messages));
            setSellerClawManaged(sc.is_claw_managed ?? true);
            const pt = parsePending(sc.pending_ai_suggestion);
            setSellerPendingText(pt);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`listing-chat-${chatId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats", filter: `id=eq.${chatId}` },
        (payload) => {
          const row = payload.new as { messages?: unknown };
          if (row.messages) setChatMsgs(parseMessages(row.messages));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase]);

  useEffect(() => {
    if (!sellerChatId) return;
    const channel = supabase
      .channel(`listing-seller-chat-${sellerChatId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats", filter: `id=eq.${sellerChatId}` },
        (payload) => {
          const row = payload.new as { messages?: unknown; pending_ai_suggestion?: unknown };
          if (row.messages) setSellerMsgs(parseMessages(row.messages));
          if ("pending_ai_suggestion" in row) {
            const pt = parsePending(row.pending_ai_suggestion);
            setSellerPendingText(pt);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerChatId, supabase]);

  const isSeller = Boolean(listing && currentUserId && listing.user_id === currentUserId);

  async function toggleSellerClawManaged(next: boolean) {
    if (!sellerChatId) return;
    const { error } = await supabase.from("chats").update({ is_claw_managed: next }).eq("id", sellerChatId);
    if (!error) setSellerClawManaged(next);
    else toast.error(locale === "ru" ? "Не удалось сохранить" : "Could not save");
  }

  async function sendSellerMessage(text: string) {
    if (!sellerChatId || !text.trim()) return;
    setSellerReplyLoading(true);
    try {
      const newMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: text.trim(),
        sender: "seller",
        timestamp: new Date().toISOString(),
      };
      const merged = [...sellerMsgs, newMsg];
      const { error } = await supabase
        .from("chats")
        .update({
          messages: merged as unknown as Json,
          last_message_at: new Date().toISOString(),
          pending_ai_suggestion: null,
        })
        .eq("id", sellerChatId);
      if (error) throw error;
      setSellerMsgs(merged);
      setSellerPendingText(null);
      setSellerFreeInput("");
    } catch {
      toast.error(locale === "ru" ? "Не отправилось" : "Send failed");
    } finally {
      setSellerReplyLoading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || !listing || !currentUserId || isSeller) return;
    const text = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender: "buyer",
      timestamp: new Date().toISOString(),
    };

    try {
      if (!chatId) {
        const { data: created, error } = await supabase
          .from("chats")
          .insert({
            listing_id: listing.id,
            buyer_id: currentUserId,
            seller_id: listing.user_id,
            messages: [newMsg] as unknown as Json,
            last_message_at: new Date().toISOString(),
            is_claw_managed: true,
          })
          .select("id, is_claw_managed")
          .single();

        if (error) throw error;
        if (created) {
          setChatId(created.id);
          setIsClawManaged(created.is_claw_managed ?? true);
          setChatMsgs([newMsg]);
        }

        if (created?.id && (created.is_claw_managed ?? true)) {
          setBuyerSuggestLoading(true);
          setTimeout(() => {
            void fetch("/api/ai/chat-suggest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatId: created.id,
                messages: [newMsg],
              }),
            }).finally(() => setBuyerSuggestLoading(false));
          }, 500);
        }
      } else {
        const { data: row, error: fetchErr } = await supabase
          .from("chats")
          .select("messages, is_claw_managed")
          .eq("id", chatId)
          .single();

        if (fetchErr) throw fetchErr;
        const prev = parseMessages(row?.messages);
        const merged = [...prev, newMsg];

        await supabase
          .from("chats")
          .update({
            messages: merged as unknown as Json,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", chatId);

        setChatMsgs(merged);

        const managed = row?.is_claw_managed ?? isClawManaged;
        if (managed) {
          setBuyerSuggestLoading(true);
          setTimeout(() => {
            void fetch("/api/ai/chat-suggest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId, messages: merged }),
            }).finally(() => setBuyerSuggestLoading(false));
          }, 500);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-2xl" />
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

  const images = [...(listing.listing_images ?? [])].sort((a, b) => a.order - b.order);
  const title = locale === "en" && listing.title_en ? listing.title_en : listing.title;
  const desc = locale === "en" && listing.description_en ? listing.description_en : listing.description;
  const slideSrc = images[imgIdx]?.url_enhanced || images[imgIdx]?.url_original;

  return (
    <div className="pb-6">
      <div className="relative">
        {images.length > 0 && slideSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slideSrc}
              alt={title}
              className="w-full object-cover"
              style={{ aspectRatio: "4/3" }}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
                    />
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

        <Link
          href="/marketplace"
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={() => setLiked(!liked)}
            className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
          </button>
          <button type="button" className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-extrabold leading-tight">{title}</h1>
            <p className="text-xl font-extrabold brand-gradient-text shrink-0">{formatPrice(listing.price)}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px]">{listing.category}</Badge>
            <span className="text-xs text-muted-foreground">
              {listing.views_count} {locale === "ru" ? "просм." : "views"}
            </span>
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
            {listing.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] rounded-full">{t}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
          <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-sm font-bold text-white">
            {listing.users?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {listing.users?.name || (locale === "ru" ? "Продавец" : "Seller")}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-orange-400" />
              Do4U {locale === "ru" ? "ведёт чат" : "manages chat"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b dark:border-white/5 border-black/5">
            <Bot className="h-4 w-4 text-primary" />
            <p className="text-xs font-bold">Do4U · {locale === "ru" ? "Чат" : "Chat"}</p>
            <Badge className="ml-auto text-[9px] brand-gradient text-white border-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Realtime
            </Badge>
          </div>

          {isSeller ? (
            !sellerChatId ? (
              <div className="text-xs text-muted-foreground text-center py-4 px-3 space-y-2">
                <p>
                  {locale === "ru"
                    ? "Пока нет сообщений по этому объявлению. Когда покупатель напишет, переписка появится здесь и в «Чаты»."
                    : "No messages yet. When a buyer writes, the thread appears here and in Chats."}
                </p>
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link href="/chats">{locale === "ru" ? "Открыть чаты" : "Open chats"}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b dark:border-white/5 border-black/5">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {locale === "ru" ? "Включить Do4U-ответы" : "Do4U reply drafts"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sellerClawManaged}
                    onClick={() => void toggleSellerClawManaged(!sellerClawManaged)}
                    className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${
                      sellerClawManaged ? "brand-gradient" : "dark:bg-white/15 bg-black/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        sellerClawManaged ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="max-h-44 overflow-y-auto px-3 py-2 space-y-2 scrollbar-none">
                  {sellerMsgs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {locale === "ru" ? "Ждём первое сообщение" : "Waiting for first message"}
                    </p>
                  )}
                  {sellerMsgs.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender === "buyer" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${
                          m.sender === "buyer"
                            ? "dark:bg-white/10 bg-black/10 rounded-bl-sm"
                            : "dark:bg-white/8 bg-black/8 border dark:border-white/10 border-black/10 rounded-br-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                {sellerChatId && sellerClawManaged && sellerPendingText ? (
                  <div className="mx-3 mb-2">
                    <SellerDraft
                      chatId={sellerChatId}
                      pendingSuggestion={sellerPendingText}
                      isClawManaged={sellerClawManaged}
                      messages={sellerMsgs}
                      locale={locale}
                      onSuccess={({ messages: next, pendingCleared }) => {
                        if (next) setSellerMsgs(next);
                        if (pendingCleared) setSellerPendingText(null);
                      }}
                    />
                  </div>
                ) : null}
                <div className="flex gap-2 px-3 py-2 border-t dark:border-white/5 border-black/5">
                  <input
                    value={sellerFreeInput}
                    onChange={(e) => setSellerFreeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void sendSellerMessage(sellerFreeInput)}
                    placeholder={locale === "ru" ? "Свой ответ…" : "Your reply…"}
                    className="flex-1 h-9 px-3 rounded-lg text-xs border dark:border-white/10 border-black/10
                      dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button
                    type="button"
                    onClick={() => void sendSellerMessage(sellerFreeInput)}
                    variant="brand"
                    size="icon"
                    className="rounded-lg h-9 w-9 shrink-0"
                    disabled={sellerReplyLoading || !sellerFreeInput.trim()}
                  >
                    {sellerReplyLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            )
          ) : !currentUserId ? (
            <p className="text-xs text-muted-foreground text-center py-4 px-3">
              <Link href="/auth" className="text-primary font-semibold underline">
                {locale === "ru" ? "Войди" : "Sign in"}
              </Link>
              {locale === "ru" ? ", чтобы написать продавцу." : " to message the seller."}
            </p>
          ) : (
            <>
              <div className="max-h-52 overflow-y-auto px-3 py-2 space-y-2 scrollbar-none">
                {chatMsgs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    {locale === "ru"
                      ? "Напиши продавцу — Do4U может ответить за него"
                      : "Message the seller — Do4U can respond for them"}
                  </p>
                )}
                {chatMsgs.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      m.sender === "buyer" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                        m.sender === "buyer"
                          ? "dark:bg-white/10 bg-black/10 rounded-br-sm"
                          : m.sender === "seller"
                            ? "dark:bg-white/8 bg-black/8 border dark:border-white/10 border-black/10 rounded-bl-sm"
                            : "brand-gradient text-white rounded-bl-sm"
                      }`}
                    >
                      {isDo4UAiSender(m.sender) && (
                        <span className="text-[9px] text-white/70 block mb-0.5">🤖 Do4U</span>
                      )}
                      {m.sender === "seller" && (
                        <span className="text-[9px] text-muted-foreground block mb-0.5">
                          {locale === "ru" ? "Продавец" : "Seller"}
                        </span>
                      )}
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {buyerSuggestLoading && (
                  <p className="text-[10px] text-center text-muted-foreground py-1 flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {locale === "ru"
                      ? "Do4U готовит ответ для продавца…"
                      : "Do4U is drafting a reply for the seller…"}
                  </p>
                )}
              </div>

              <div className="flex gap-2 px-3 py-2 border-t dark:border-white/5 border-black/5">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void sendChat()}
                  placeholder={locale === "ru" ? "Написать продавцу..." : "Message seller..."}
                  disabled={chatLoading}
                  className="flex-1 h-9 px-3 rounded-lg text-xs border dark:border-white/10 border-black/10
                    dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  type="button"
                  onClick={() => { void sendChat(); }}
                  variant="brand"
                  size="icon"
                  className="rounded-lg h-9 w-9"
                  disabled={chatLoading || buyerSuggestLoading}
                >
                  {chatLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12" asChild>
            <Link href="/chats">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              {locale === "ru" ? "Все чаты" : "All chats"}
            </Link>
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
