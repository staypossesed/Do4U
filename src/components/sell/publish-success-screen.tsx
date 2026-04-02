"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSellStore } from "@/lib/store-sell";
import { toast } from "sonner";
import {
  Check, Copy, PartyPopper, FileText, MessageCircle, Bell, Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.35,
        duration: 2.2 + Math.random() * 1.4,
        color: ["#f97316", "#a855f7", "#22c55e", "#3b82f6", "#eab308", "#ec4899"][i % 6],
        rot: Math.random() * 720 - 360,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
      })),
    [],
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-[100]"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-[2px] top-[-12%] shadow-sm"
          style={{
            left: `${p.x}%`,
            width: p.w,
            height: p.h,
            background: p.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: ["0vh", "108vh"],
            opacity: [1, 1, 0],
            rotate: p.rot,
            scale: [1, 0.85, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export function PublishSuccessScreen({
  locale,
  onGoHome,
}: {
  locale: "ru" | "en";
  onGoHome: () => void;
}) {
  const router = useRouter();
  const store = useSellStore();
  const pp = store.postPublish;
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  if (!pp) return null;
  const { listingId, templates } = pp;

  async function copyText(slug: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlug(slug);
      toast.success(locale === "ru" ? "Скопировано" : "Copied");
      setTimeout(() => setCopiedSlug(null), 2200);
    } catch {
      toast.error(locale === "ru" ? "Не удалось скопировать" : "Copy failed");
    }
  }

  function viewListing() {
    useSellStore.getState().reset();
    router.push(`/marketplace/${listingId}`);
  }

  const steps =
    locale === "ru"
      ? [
          {
            icon: FileText,
            title: "Шаблоны для Avito, VK, eBay",
            body: "Нажми «Скопировать» под нужной площадкой и вставь текст в приложение или сайт — фото уже в галерее.",
          },
          {
            icon: MessageCircle,
            title: "Чаты с покупателями",
            body: "Ответы приходят во вкладку «Чаты». Do4U может помогать с ответами — включи переключатель в диалоге.",
          },
          {
            icon: Bell,
            title: "Уведомления",
            body: "Мы напишем, когда придёт сообщение или будет интерес к объявлению. Колокольчик — в «Чаты → Уведомления».",
          },
        ]
      : [
          {
            icon: FileText,
            title: "Templates for Avito, VK, eBay",
            body: "Tap Copy under each platform and paste into the app or site — your photos are in the gallery.",
          },
          {
            icon: MessageCircle,
            title: "Buyer chats",
            body: "Replies land in Chats. Do4U can suggest replies — turn it on inside a conversation.",
          },
          {
            icon: Bell,
            title: "Notifications",
            body: "We’ll let you know about new messages and interest. Bell icon: Chats → Notifications.",
          },
        ];

  return (
    <div className="relative flex flex-col min-h-dvh px-4 pb-10 pt-6 space-y-6 max-w-lg mx-auto w-full">
      <ConfettiBurst />

      <motion.div
        layout
        className="text-center space-y-4 relative z-10"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="relative w-24 h-24 mx-auto"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-orange-500/25 blur-2xl scale-125"
            animate={{ scale: [1.15, 1.28, 1.15], opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="relative w-full h-full rounded-full brand-gradient flex items-center justify-center
              shadow-xl shadow-orange-500/30 ring-4 ring-white/20 dark:ring-white/10"
          >
            <motion.div
              initial={{ rotate: -25, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            >
              <PartyPopper className="h-11 w-11 text-white" strokeWidth={2.25} />
            </motion.div>
          </div>
          <motion.div
            className="absolute -right-1 -bottom-1 w-10 h-10 rounded-full bg-emerald-500 border-4
              border-background flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.45 }}
          >
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-[1.35rem] sm:text-2xl font-black tracking-tight leading-tight px-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          {locale === "ru"
            ? "Do4U начал работу над твоим объявлением!"
            : "Do4U is working on your listing!"}
        </motion.h1>

        <motion.p
          className="text-sm text-muted-foreground leading-relaxed px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.45 }}
        >
          {locale === "ru"
            ? "Объявление опубликовано на внутреннем маркетплейсе. Do4U уже ищет покупателя рядом с тобой."
            : "Your listing is live on our marketplace. Do4U is already looking for buyers near you."}
        </motion.p>
      </motion.div>

      <motion.div
        className="rounded-2xl border dark:border-white/10 border-black/10 dark:bg-white/[0.04] bg-black/[0.03] p-4 space-y-3 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.45 }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          {locale === "ru" ? "Что дальше" : "What’s next"}
        </p>
        <ul className="space-y-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
              className="flex gap-3 text-left"
            >
              <div
                className="shrink-0 w-9 h-9 rounded-xl dark:bg-white/10 bg-black/5 flex items-center justify-center
                  border dark:border-white/10 border-black/10"
              >
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        className="space-y-2 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <p className="text-xs font-bold text-muted-foreground px-1">
          {locale === "ru" ? "Внешние площадки" : "External platforms"}
        </p>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {locale === "ru"
              ? "Только Do4U — внешние площадки не выбраны."
              : "Do4U only — no external platforms selected."}
          </p>
        ) : (
          templates.map((t) => (
            <Button
              key={t.slug}
              type="button"
              variant="outline"
              className="w-full rounded-2xl h-auto py-3.5 px-4 justify-between gap-3 border dark:border-white/10"
              onClick={() => copyText(t.slug, t.text)}
            >
              <span className="flex items-center gap-2 text-left font-bold text-sm">
                <Copy className="h-4 w-4 shrink-0 opacity-70" />
                {locale === "ru" ? `Скопировать для ${t.platformName}` : `Copy for ${t.platformName}`}
              </span>
              {copiedSlug === t.slug ? (
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : null}
            </Button>
          ))
        )}
      </motion.div>

      <motion.div
        className="space-y-2.5 pt-2 relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.45 }}
      >
        <Button
          variant="brand"
          className="w-full rounded-2xl h-14 font-bold text-base glow-orange"
          onClick={viewListing}
        >
          {locale === "ru" ? "Посмотреть моё объявление" : "View my listing"}
        </Button>
        <Button variant="outline" className="w-full rounded-2xl h-12 font-semibold" onClick={onGoHome}>
          {locale === "ru" ? "Вернуться на главную" : "Back to home"}
        </Button>
      </motion.div>
    </div>
  );
}
