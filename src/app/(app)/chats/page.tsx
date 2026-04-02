"use client";

// TODO: AI Negotiation Engine — deeper auto-negotiation, price suggestions, tone by locale, escrow handoff.

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  MessageCircle, Send, ArrowLeft, Zap, Bot,
  User, Loader2, Bell, Sparkles,
} from "lucide-react";
import type { Json } from "@/lib/types/database";
import { isDo4UAiSender } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  text: string;
  sender: "buyer" | "seller" | "do4u" | "claw";
  timestamp: string;
}

interface Chat {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  messages: ChatMessage[];
  last_message_at: string | null;
  is_claw_managed: boolean;
  pending_ai_suggestion?: Json | null;
  status: string;
  listing_title?: string;
}

function parsePending(raw: unknown): string | null {
  if (!raw || typeof raw !== "object" || !("text" in raw)) return null;
  const t = (raw as { text?: unknown }).text;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

export default function ChatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <ChatsPageInner />
    </Suspense>
  );
}

function ChatsPageInner() {
  const searchParams = useSearchParams();
  const focusListing = searchParams.get("listing");

  const { locale } = useAppStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const focusedRef = useRef(false);

  const patchChat = useCallback((id: string, partial: Partial<Chat>) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("chats")
        .select("*, listings(title)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (data) {
        const mapped = data.map((c: Record<string, unknown>) => ({
          ...c,
          messages: Array.isArray(c.messages) ? (c.messages as ChatMessage[]) : [],
          listing_title: (c.listings as Record<string, string> | null)?.title || "Listing",
        })) as Chat[];
        setChats(mapped);
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("chats-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (!updated?.id) return;
          setChats((prev) => {
            const idx = prev.findIndex((c) => c.id === updated.id);
            const messages = updated.messages != null
              ? (Array.isArray(updated.messages) ? (updated.messages as ChatMessage[]) : prev[idx]?.messages ?? [])
              : prev[idx]?.messages ?? [];
            const next: Partial<Chat> = {
              ...updated,
              messages,
              listing_title: prev[idx]?.listing_title,
            } as Partial<Chat>;
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...next };
              return copy;
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!focusListing || focusedRef.current || chats.length === 0) return;
    const hit = chats.find((c) => c.listing_id === focusListing);
    if (hit) {
      setActiveChat(hit.id);
      focusedRef.current = true;
    }
  }, [focusListing, chats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const chat = activeChat ? chats.find((c) => c.id === activeChat) : null;

  if (chat && userId) {
    return (
      <ChatView
        chat={chat}
        userId={userId}
        onBack={() => setActiveChat(null)}
        onPatch={(partial) => patchChat(chat.id, partial)}
      />
    );
  }

  return (
    <div className="px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold">
          {locale === "ru" ? "Чаты" : "Chats"}
        </h1>
        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 shrink-0" asChild>
          <Link href="/notifications" aria-label={locale === "ru" ? "Уведомления" : "Notifications"}>
            <Bell className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {chats.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed dark:border-white/10 border-black/10 p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-semibold">{locale === "ru" ? "Пока нет чатов" : "No chats yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "ru"
              ? "Когда покупатель напишет, Do4U подготовит черновик ответа"
              : "When a buyer writes, Do4U can draft a reply for you"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveChat(c.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl
                  dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5
                  hover:dark:bg-white/8 hover:bg-black/8 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.listing_title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastMsg?.text || "—"}
                  </p>
                </div>
                {c.is_claw_managed && (
                  <Badge className="brand-gradient text-white border-0 text-[10px] shrink-0">
                    <Bot className="h-3 w-3 mr-0.5" />
                    Do4U
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatView({
  chat,
  userId,
  onBack,
  onPatch,
}: {
  chat: Chat;
  userId: string;
  onBack: () => void;
  onPatch: (partial: Partial<Chat>) => void;
}) {
  const { locale } = useAppStore();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState(() => parsePending(chat.pending_ai_suggestion) ?? "");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [sellerSending, setSellerSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isSeller = chat.seller_id === userId;
  const pendingText = parsePending(chat.pending_ai_suggestion);

  useEffect(() => {
    const t = parsePending(chat.pending_ai_suggestion);
    setDraft(t ?? "");
  }, [chat.pending_ai_suggestion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  async function toggleClaw(next: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("chats").update({ is_claw_managed: next }).eq("id", chat.id);
    if (error) {
      toast.error(locale === "ru" ? "Не сохранилось" : "Could not save");
      return;
    }
    onPatch({ is_claw_managed: next });
  }

  async function sendSellerText(text: string) {
    if (!text.trim()) return;
    setSellerSending(true);
    const supabase = createClient();
    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      sender: "seller",
      timestamp: new Date().toISOString(),
    };
    const merged = [...chat.messages, newMsg];
    const { error } = await supabase
      .from("chats")
      .update({
        messages: merged as unknown as Json,
        last_message_at: new Date().toISOString(),
        pending_ai_suggestion: null,
      })
      .eq("id", chat.id);
    setSellerSending(false);
    if (error) {
      toast.error(locale === "ru" ? "Не отправилось" : "Send failed");
      return;
    }
    onPatch({ messages: merged, pending_ai_suggestion: null });
    setMsg("");
    setDraft("");
  }

  async function sendMessage() {
    if (!msg.trim()) return;
    setSending(true);
    const supabase = createClient();

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: msg.trim(),
      sender: isSeller ? "seller" : "buyer",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...chat.messages, newMsg];

    const { error } = await supabase
      .from("chats")
      .update({
        messages: updatedMessages as unknown as Json,
        last_message_at: new Date().toISOString(),
        ...(isSeller ? { pending_ai_suggestion: null } : {}),
      })
      .eq("id", chat.id);

    if (error) {
      toast.error(locale === "ru" ? "Ошибка" : "Error");
      setSending(false);
      return;
    }

    onPatch({
      messages: updatedMessages,
      ...(isSeller ? { pending_ai_suggestion: null } : {}),
    });
    setMsg("");
    setSending(false);

    if (!isSeller && chat.is_claw_managed) {
      setSuggestLoading(true);
      setTimeout(() => {
        void fetch("/api/ai/chat-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: chat.id, messages: updatedMessages }),
        }).finally(() => setSuggestLoading(false));
      }, 500);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-white/5 border-black/5">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{chat.listing_title}</p>
          {chat.is_claw_managed && (
            <p className="text-xs text-orange-400 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {locale === "ru" ? "Do4U-черновики включены" : "Do4U drafts on"}
            </p>
          )}
        </div>
      </div>

      {isSeller && (
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-white/5 border-black/5">
          <span className="text-xs font-semibold text-muted-foreground">
            {locale === "ru" ? "Включить Do4U-ответы" : "Do4U reply drafts"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={chat.is_claw_managed}
            onClick={() => void toggleClaw(!chat.is_claw_managed)}
            className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${
              chat.is_claw_managed ? "brand-gradient" : "dark:bg-white/15 bg-black/15"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                chat.is_claw_managed ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-none">
        <AnimatePresence>
          {chat.messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.sender === "buyer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  isDo4UAiSender(m.sender)
                    ? "brand-gradient text-white"
                    : m.sender === "buyer"
                      ? "dark:bg-white/10 bg-black/10"
                      : "dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5"
                }`}
              >
                {isDo4UAiSender(m.sender) && (
                  <span className="flex items-center gap-1 text-[10px] text-white/70 mb-0.5">
                    <Bot className="h-3 w-3" />
                    Do4U AI
                  </span>
                )}
                {m.sender === "seller" && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                    <User className="h-3 w-3" />
                    {locale === "ru" ? "Вы" : "You"}
                  </span>
                )}
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {suggestLoading && !isSeller && (
          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 py-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {locale === "ru" ? "Do4U готовит черновик…" : "Do4U is drafting…"}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {isSeller && chat.is_claw_managed && pendingText ? (
        <div className="px-4 py-2 border-t dark:border-white/5 border-black/5 space-y-2">
          <div className="p-3 rounded-xl border border-orange-500/35 bg-orange-500/[0.08] space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-orange-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {locale === "ru" ? "Черновик Do4U" : "Do4U draft"}
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full text-xs rounded-lg px-2 py-1.5 border dark:border-white/10 border-black/10
                dark:bg-black/20 bg-white/80 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400/50"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="brand"
                size="sm"
                className="rounded-xl flex-1 text-xs"
                disabled={sellerSending}
                onClick={() => void sendSellerText(pendingText)}
              >
                {locale === "ru" ? "Отправить как есть" : "Send as-is"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl flex-1 text-xs border-orange-500/30"
                disabled={sellerSending || !draft.trim()}
                onClick={() => void sendSellerText(draft)}
              >
                {locale === "ru" ? "Отправить правки" : "Send edited"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-4 py-3 border-t dark:border-white/5 border-black/5">
        <div className="flex gap-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendMessage()}
            placeholder={locale === "ru" ? "Сообщение…" : "Message…"}
            disabled={sending || suggestLoading}
            className="flex-1 h-10 px-3 rounded-xl text-sm border dark:border-white/10 border-black/10
              dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || suggestLoading || !msg.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl brand-gradient disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
