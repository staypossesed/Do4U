"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export interface Do4UToggleProps {
  chatId: string;
  isClawManaged: boolean;
  onToggle: (next: boolean) => void;
  locale: "ru" | "en";
  className?: string;
}

/**
 * Updates `chats.is_claw_managed` in Supabase and notifies parent via onToggle.
 */
export function Do4UToggle({
  chatId,
  isClawManaged,
  onToggle,
  locale,
  className = "",
}: Do4UToggleProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending || !chatId) return;
    const next = !isClawManaged;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chats")
      .update({ is_claw_managed: next })
      .eq("id", chatId);
    setPending(false);
    if (error) {
      toast.error(locale === "ru" ? "Не удалось сохранить настройку" : "Could not save setting");
      return;
    }
    onToggle(next);
  }

  const label =
    locale === "ru"
      ? "Включить Do4U-ответы (AI поможет вести чат)"
      : "Enable Do4U replies (AI helps run the chat)";

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 border-b dark:border-white/5 border-black/5 ${className}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs font-bold text-foreground leading-snug">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
          {locale === "ru"
            ? "Покупателю не уйдёт автоответ — ты получишь черновик и решишь сам."
            : "No auto-reply to buyers — you get a draft and decide what to send."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isClawManaged}
        aria-label={label}
        disabled={pending}
        onClick={() => void handleClick()}
        className={`relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          isClawManaged ? "brand-gradient" : "dark:bg-white/15 bg-black/15"
        }`}
      >
        {pending ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
          </span>
        ) : (
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
              isClawManaged ? "translate-x-5" : "translate-x-0"
            }`}
          />
        )}
      </button>
    </div>
  );
}
