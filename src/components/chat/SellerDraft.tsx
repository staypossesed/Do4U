"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { Json } from "@/lib/types/database";
import { toast } from "sonner";

export interface SellerDraftMessage {
  id: string;
  text: string;
  sender: "buyer" | "seller" | "do4u" | "claw";
  timestamp: string;
}

export interface SellerDraftProps {
  chatId: string;
  pendingSuggestion: string | null;
  isClawManaged: boolean;
  messages: SellerDraftMessage[];
  locale: "ru" | "en";
  /** After send or decline: update parent state */
  onSuccess: (next: { messages?: SellerDraftMessage[]; pendingCleared: boolean }) => void;
  className?: string;
}

/**
 * Shared Do4U seller draft: textarea + send as-is / send edited / decline (clear pending only).
 */
export function SellerDraft({
  chatId,
  pendingSuggestion,
  isClawManaged,
  messages,
  locale,
  onSuccess,
  className = "",
}: SellerDraftProps) {
  const [draft, setDraft] = useState(pendingSuggestion ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(pendingSuggestion ?? "");
  }, [pendingSuggestion]);

  if (!isClawManaged || !pendingSuggestion) return null;

  async function sendSellerText(text: string) {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const newMsg: SellerDraftMessage = {
        id: crypto.randomUUID(),
        text: text.trim(),
        sender: "seller",
        timestamp: new Date().toISOString(),
      };
      const merged = [...messages, newMsg];
      const { error } = await supabase
        .from("chats")
        .update({
          messages: merged as unknown as Json,
          last_message_at: new Date().toISOString(),
          pending_ai_suggestion: null,
        })
        .eq("id", chatId);
      if (error) throw error;
      onSuccess({ messages: merged, pendingCleared: true });
      setDraft("");
    } catch {
      toast.error(locale === "ru" ? "Не отправилось" : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function declineDraft() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("chats")
        .update({ pending_ai_suggestion: null })
        .eq("id", chatId);
      if (error) throw error;
      onSuccess({ pendingCleared: true });
      setDraft("");
    } catch {
      toast.error(locale === "ru" ? "Не удалось отклонить" : "Could not dismiss");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`p-3 rounded-xl border border-orange-500/35 bg-orange-500/[0.08] space-y-2 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-orange-400 flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        {locale === "ru" ? "Черновик Do4U" : "Do4U draft"}
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        disabled={busy}
        className="w-full text-xs rounded-lg px-2 py-1.5 border dark:border-white/10 border-black/10
          dark:bg-black/20 bg-white/80 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400/50 disabled:opacity-60"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="brand"
          size="sm"
          className="rounded-xl flex-1 text-xs min-h-9 gap-2"
          disabled={busy || !pendingSuggestion.trim()}
          onClick={() => void sendSellerText(pendingSuggestion)}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> : null}
          {locale === "ru" ? "Отправить как есть" : "Send as-is"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl flex-1 text-xs min-h-9 border-orange-500/30"
          disabled={busy || !draft.trim()}
          onClick={() => void sendSellerText(draft)}
        >
          {locale === "ru" ? "Редактировать и отправить" : "Edit and send"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs min-h-9 text-muted-foreground"
          disabled={busy}
          onClick={() => void declineDraft()}
        >
          {locale === "ru" ? "Отклонить" : "Decline"}
        </Button>
      </div>
    </div>
  );
}
