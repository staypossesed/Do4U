"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Send, ArrowLeft, Zap, Bot,
  User, Loader2,
} from "lucide-react";
import type { Json } from "@/lib/types/database";
import { isDo4UAiSender } from "@/lib/utils";

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
  status: string;
  listing_title?: string;
}

export default function ChatsPage() {
  const { locale } = useAppStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("chats")
        .select("*, listings(title)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (data) {
        const mapped = data.map((c: Record<string, unknown>) => ({
          ...c,
          messages: (c.messages as ChatMessage[]) || [],
          listing_title: (c.listings as Record<string, string> | null)?.title || "Listing",
        })) as Chat[];
        setChats(mapped);
      }
      setLoading(false);
    }

    load();

    // Realtime subscription
    const channel = supabase
      .channel("chats-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        (payload) => {
          const updated = payload.new as Chat;
          setChats(prev => {
            const idx = prev.findIndex(c => c.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...updated, messages: (updated.messages as unknown as ChatMessage[]) || copy[idx].messages };
              return copy;
            }
            return [updated, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const chat = activeChat ? chats.find(c => c.id === activeChat) : null;

  if (chat && userId) {
    return <ChatView chat={chat} userId={userId} onBack={() => setActiveChat(null)} />;
  }

  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-extrabold mb-4">
        {locale === "ru" ? "Чаты" : "Chats"}
      </h1>

      {chats.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed dark:border-white/10 border-black/10 p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-semibold">{locale === "ru" ? "Пока нет чатов" : "No chats yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "ru"
              ? "Do4U начнёт отвечать, когда появятся покупатели"
              : "Do4U will respond when buyers appear"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {chats.map(c => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button key={c.id} onClick={() => setActiveChat(c.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl
                  dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5
                  hover:dark:bg-white/8 hover:bg-black/8 transition-colors text-left">
                <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.listing_title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastMsg?.text || "No messages"}
                  </p>
                </div>
                {c.is_claw_managed && (
                  <Badge className="brand-gradient text-white border-0 text-[10px] shrink-0">
                    <Bot className="h-3 w-3 mr-0.5" />Do4U
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

function ChatView({ chat, userId, onBack }: { chat: Chat; userId: string; onBack: () => void }) {
  const { locale } = useAppStore();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  async function sendMessage() {
    if (!msg.trim()) return;
    setSending(true);

    const supabase = createClient();
    const isSeller = chat.seller_id === userId;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: msg.trim(),
      sender: isSeller ? "seller" : "buyer",
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...chat.messages, newMsg];

    await supabase.from("chats").update({
      messages: updatedMessages as unknown as Json,
      last_message_at: new Date().toISOString(),
    }).eq("id", chat.id);

    setMsg("");
    setSending(false);

    // Do4U auto-response when listing is AI-managed (DB: is_claw_managed)
    if (chat.is_claw_managed && !isSeller) {
      setTimeout(async () => {
        try {
          const res = await fetch("/api/ai/chat-respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: chat.id, messages: updatedMessages }),
          });
          if (!res.ok) console.error("Do4U chat-respond failed");
        } catch { /* ignore */ }
      }, 1500);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-white/5 border-black/5">
        <button onClick={onBack} className="w-9 h-9 rounded-xl dark:bg-white/5 bg-black/5 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{chat.listing_title}</p>
          {chat.is_claw_managed && (
            <p className="text-xs text-orange-400 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {locale === "ru" ? "Do4U управляет" : "Do4U managed"}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-none">
        <AnimatePresence>
          {chat.messages.map(m => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.sender === "buyer" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                isDo4UAiSender(m.sender)
                  ? "brand-gradient text-white"
                  : m.sender === "buyer"
                  ? "dark:bg-white/10 bg-black/10"
                  : "dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5"
              }`}>
                {isDo4UAiSender(m.sender) && (
                  <span className="flex items-center gap-1 text-[10px] text-white/70 mb-0.5">
                    <Bot className="h-3 w-3" />Do4U AI
                  </span>
                )}
                {m.sender === "seller" && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                    <User className="h-3 w-3" />{locale === "ru" ? "Вы" : "You"}
                  </span>
                )}
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t dark:border-white/5 border-black/5">
        <div className="flex gap-2">
          <input value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={locale === "ru" ? "Сообщение…" : "Message…"}
            className="flex-1 h-10 px-3 rounded-xl text-sm border dark:border-white/10 border-black/10
              dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={sendMessage} disabled={sending || !msg.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl brand-gradient disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
