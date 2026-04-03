"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Mic, Wand2, Send, ShieldCheck, ChevronRight, type LucideIcon,
} from "lucide-react";
import type { Json } from "@/lib/types/database";

const EXIT_DELAY_MS = 360;

function mergePrefs(prefs: unknown): Json {
  const base =
    prefs && typeof prefs === "object" && !Array.isArray(prefs)
      ? (prefs as Record<string, unknown>)
      : {};
  return { ...base, has_completed_onboarding: true } as Json;
}

function lsKeyForUser(userId: string) {
  return `do4u_onboarding_v1_${userId}`;
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -22 }),
};

function OnboardingOverlay({
  locale,
  onRequestClose,
}: {
  locale: "ru" | "en";
  onRequestClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const isRu = locale === "ru";
  const total = 4;

  type StepRow = { t: string; d: string; Icon: LucideIcon };
  const stepsRu: StepRow[] = [
    { t: "Голос или фото", d: "Расскажи или сфоткай вещь — без длинных форм.", Icon: Mic },
    { t: "AI оформляет объявление", d: "Заголовок, описание и цена собираются за тебя.", Icon: Wand2 },
    { t: "Публикация и чаты", d: "Выкладываешь и ведёшь переписку; Do4U предлагает черновики ответов.", Icon: Send },
  ];
  const stepsEn: StepRow[] = [
    { t: "Voice or photos", d: "Describe or snap the item — no long forms.", Icon: Mic },
    { t: "AI builds the listing", d: "Title, description, and price drafted for you.", Icon: Wand2 },
    { t: "Publish & chat", d: "Go live and message buyers; Do4U suggests reply drafts.", Icon: Send },
  ];

  const copy: (
    | { title: string; body: string; icon: LucideIcon; steps?: undefined }
    | { title: string; body: null; icon: LucideIcon; steps: StepRow[] }
  )[] = [
    {
      title: isRu ? "Привет!" : "Welcome!",
      body: isRu
        ? "Do4U делает всё за тебя: Sell4U помогает быстро выложить вещь, Buy4U — найти рядом с домом. Один аккаунт — и продажи, и покупки."
        : "Do4U does the heavy lifting: Sell4U helps you list fast, Buy4U finds deals near home. One account for selling and buying.",
      icon: Sparkles,
    },
    {
      title: isRu ? "Как работает Sell4U" : "How Sell4U works",
      body: null,
      steps: isRu ? stepsRu : stepsEn,
      icon: Wand2,
    },
    {
      title: isRu ? "Безопасность и честные условия" : "Safety & fair terms",
      body: isRu
        ? "Сообщения и ответы ты подтверждаешь сам — никаких скрытых автоотправок. Внутри закрытой беты комиссия между пользователями Do4U — нулевая."
        : "You approve every message — nothing sends in the background. During the closed beta there is zero commission between Do4U users.",
      icon: ShieldCheck,
    },
    {
      title: isRu ? "Готово!" : "You're set!",
      body: isRu
        ? "Создай объявление или открой «Рядом с тобой» — район оживёт с первой продажи."
        : "Create a listing or open Near You — the feed grows with every new post.",
      icon: Sparkles,
    },
  ];

  const goNext = () => {
    if (step < total - 1) {
      setDir(1);
      setStep((s) => s + 1);
    } else {
      onRequestClose();
    }
  };

  const item = copy[step];
  const Icon = item.icon;
  const isLast = step === total - 1;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: "easeOut" }}
    >
      <motion.button
        type="button"
        aria-label={isRu ? "Закрыть" : "Close"}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        onClick={onRequestClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border dark:border-white/10 border-black/10
          dark:bg-[#1a1625] bg-white shadow-2xl overflow-hidden max-h-[min(92dvh,640px)] flex flex-col"
        initial={{ y: 52, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 48, opacity: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex gap-1.5 px-5 pt-4 pb-2">
          {Array.from({ length: total }).map((_, i) => (
            <motion.div
              key={i}
              className="h-1 flex-1 rounded-full overflow-hidden dark:bg-white/10 bg-black/10"
            >
              <motion.div
                className="h-full brand-gradient origin-left"
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0.15, opacity: i <= step ? 1 : 0.35 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </motion.div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                <Icon className="h-7 w-7" />
              </div>
              <h2 id="onboarding-title" className="text-xl font-extrabold leading-tight">
                {item.title}
              </h2>
              {item.body != null ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              ) : null}
              {item.steps ? (
                <ol className="space-y-3 pt-1">
                  {item.steps.map((row, idx) => (
                    <li
                      key={idx}
                      className="flex gap-3 rounded-2xl border dark:border-white/10 border-black/10 p-3
                        dark:bg-white/[0.04] bg-black/[0.03]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <row.Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {idx + 1}. {row.t}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{row.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4 pt-0 border-t dark:border-white/5 border-black/5 flex gap-2">
          {!isLast ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl flex-1"
                onClick={onRequestClose}
              >
                {isRu ? "Пропустить" : "Skip"}
              </Button>
              <Button
                type="button"
                variant="brand"
                className="rounded-xl flex-[1.4] font-bold gap-1"
                onClick={goNext}
              >
                {isRu ? "Далее" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <motion.div
              className="w-full"
              animate={{ scale: [1, 1.035, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button
                type="button"
                variant="brand"
                className="w-full rounded-2xl min-h-[52px] text-base font-extrabold
                  ring-4 ring-orange-400/45 ring-offset-2 ring-offset-background
                  shadow-xl shadow-orange-500/40 glow-orange
                  hover:ring-orange-400/60 hover:shadow-orange-500/50"
                onClick={goNext}
              >
                {isRu ? "Начать пользоваться" : "Get started"}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** First-time intro: once per user (localStorage key + `users.preferences` + auth metadata). */
export function FirstTimeOnboardingGate() {
  const { locale } = useAppStore();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setReady(true);
        return;
      }

      const ls = typeof window !== "undefined" ? window.localStorage.getItem(lsKeyForUser(user.id)) : null;
      if (ls === "1") {
        if (!cancelled) setReady(true);
        return;
      }
      if (user.user_metadata?.has_completed_onboarding === true) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();

      const prefs = profile?.preferences as Record<string, unknown> | null | undefined;
      if (prefs?.has_completed_onboarding === true) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(lsKeyForUser(user.id), "1");
        }
        if (!cancelled) setReady(true);
        return;
      }

      if (!cancelled) {
        setNeedsOnboarding(true);
        setOverlayVisible(true);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistCompletion = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(lsKeyForUser(user.id), "1");
    }

    await supabase.auth.updateUser({
      data: { has_completed_onboarding: true },
    });

    const { data: profile } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();

    await supabase
      .from("users")
      .update({
        preferences: mergePrefs(profile?.preferences ?? null),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }, []);

  const handleExitComplete = useCallback(() => {
    window.setTimeout(() => {
      void persistCompletion();
      setNeedsOnboarding(false);
    }, EXIT_DELAY_MS);
  }, [persistCompletion]);

  const requestClose = useCallback(() => {
    setOverlayVisible(false);
  }, []);

  if (!ready || !needsOnboarding) return null;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {overlayVisible ? (
        <OnboardingOverlay
          key="onboarding-overlay"
          locale={locale === "en" ? "en" : "ru"}
          onRequestClose={requestClose}
        />
      ) : null}
    </AnimatePresence>
  );
}
