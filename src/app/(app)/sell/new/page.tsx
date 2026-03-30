"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import {
  Mic, Camera, Sparkles, Check, X, ArrowLeft,
  ArrowRight, Zap, ImagePlus, RotateCcw, MapPin,
} from "lucide-react";
import Link from "next/link";

// TODO: Stage 3 — Wire up real APIs:
//   - Web Speech API for voice recording
//   - navigator.mediaDevices for camera
//   - Supabase Storage for photo uploads
//   - Edge Function: POST /api/ai/analyze (Grok vision + GPT-4o)
//   - Edge Function: POST /api/ai/price (market comp analysis)
//   - Cross-posting template generation

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1 as Step, icon: Mic,      labelRu: "Голос",    labelEn: "Voice"   },
  { n: 2 as Step, icon: Camera,   labelRu: "Фото",     labelEn: "Photos"  },
  { n: 3 as Step, icon: Sparkles, labelRu: "AI",       labelEn: "AI"      },
  { n: 4 as Step, icon: Zap,      labelRu: "Старт",    labelEn: "Launch"  },
];

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  exit:   (d: number) => ({ x: d < 0 ? 280 : -280, opacity: 0, transition: { duration: 0.18 } }),
};

export default function NewListingPage() {
  const { locale } = useAppStore();
  const [step, setStep]     = useState<Step>(1);
  const [dir, setDir]       = useState(0);
  const [recording, setRecording] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  function next() { if (step < 4) { setDir(1); setStep(s => (s + 1) as Step); } }
  function back() { if (step > 1) { setDir(-1); setStep(s => (s - 1) as Step); } }

  const pct = ((step - 1) / 3) * 100;

  return (
    <div className="flex flex-col min-h-dvh pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b
        dark:border-white/5 border-black/5">
        <Link href="/dashboard" className="flex items-center justify-center w-9 h-9
          rounded-xl dark:bg-white/5 bg-black/5">
          <X className="h-5 w-5" />
        </Link>

        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">
            {locale === "ru" ? "Новое объявление" : "New Listing"}
          </p>
          <p className="text-sm font-bold">
            {locale === "ru"
              ? STEPS[step - 1].labelRu
              : STEPS[step - 1].labelEn}
          </p>
        </div>

        <div className="w-9" />
      </div>

      {/* Progress bar */}
      <div className="h-1 dark:bg-white/5 bg-black/5">
        <motion.div
          className="h-full claw-gradient"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step icons */}
      <div className="flex items-center justify-center gap-0 px-8 py-4">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full
              text-xs font-bold transition-all duration-300 ${
              s.n === step
                ? "claw-gradient text-white scale-110 shadow-lg"
                : s.n < step
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "dark:bg-white/5 bg-black/5 text-muted-foreground"
            }`}>
              {s.n < step
                ? <Check className="h-4 w-4" />
                : <s.icon className="h-4 w-4" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 transition-colors duration-300 ${
                s.n < step ? "bg-emerald-500/40" : "dark:bg-white/5 bg-black/5"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            className="h-full"
          >
            {step === 1 && (
              <Step1Voice locale={locale} recording={recording} setRecording={setRecording} />
            )}
            {step === 2 && (
              <Step2Photos locale={locale} photos={photos} setPhotos={setPhotos} />
            )}
            {step === 3 && (
              <Step3AI locale={locale} />
            )}
            {step === 4 && (
              <Step4Preview locale={locale} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-4 pt-4">
        {step > 1 && (
          <Button variant="outline" className="rounded-xl h-12" onClick={back}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {locale === "ru" ? "Назад" : "Back"}
          </Button>
        )}
        {step < 4 ? (
          <Button variant="claw" className="flex-1 rounded-xl h-12 font-bold" onClick={next}>
            {locale === "ru" ? "Далее" : "Next"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="claw" className="flex-1 rounded-xl h-12 font-bold glow-orange" asChild>
            <Link href="/dashboard">
              <Zap className="h-4 w-4 mr-1.5 fill-white" />
              {locale === "ru" ? "Запустить Claw 🚀" : "Launch Claw 🚀"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Step1Voice({ locale, recording, setRecording }: {
  locale: string; recording: boolean; setRecording: (v: boolean) => void;
}) {
  const AI_HINTS = [
    locale === "ru" ? "💡 Назови материал и цвет" : "💡 State material and color",
    locale === "ru" ? "📏 Укажи размер" : "📏 State the size",
    locale === "ru" ? "🏷️ Когда куплено?" : "🏷️ When purchased?",
    locale === "ru" ? "⚡ Есть дефекты?" : "⚡ Any defects?",
  ];

  return (
    <div className="space-y-5">
      <div className="text-center pt-2">
        <h2 className="text-xl font-extrabold">
          {locale === "ru" ? "Расскажи о товаре" : "Tell us about it"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ru" ? "Говори 10–15 секунд — Claw поймёт всё" : "Speak 10-15 seconds — Claw understands everything"}
        </p>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          {recording && (
            <motion.div
              className="absolute inset-0 rounded-full claw-gradient"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <motion.button
            className={`relative flex items-center justify-center w-24 h-24 rounded-full
              ${recording ? "bg-rose-500" : "claw-gradient"} shadow-2xl`}
            whileTap={{ scale: 0.92 }}
            onClick={() => setRecording(!recording)}
          >
            <Mic className={`h-10 w-10 text-white ${recording ? "animate-pulse" : ""}`} />
          </motion.button>
        </div>

        <p className={`text-sm font-semibold transition-colors ${
          recording ? "text-rose-500" : "text-muted-foreground"
        }`}>
          {recording
            ? (locale === "ru" ? "Говори… нажми ещё раз чтобы остановить" : "Speaking… tap again to stop")
            : (locale === "ru" ? "Нажми и говори" : "Tap and speak")}
        </p>

        {/* Waveform */}
        {recording && (
          <div className="flex items-end justify-center gap-0.5 h-8">
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-rose-500"
                animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.04 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI hints */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {locale === "ru" ? "Что сказать" : "What to say"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {AI_HINTS.map((hint) => (
            <div key={hint}
              className="px-3 py-2.5 rounded-xl text-xs font-medium
                dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5">
              {hint}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Photos({ locale, photos, setPhotos }: {
  locale: string;
  photos: string[];
  setPhotos: (p: string[]) => void;
}) {
  const ANGLES = [
    locale === "ru" ? "📸 Спереди" : "📸 Front",
    locale === "ru" ? "🔄 Сзади"   : "🔄 Back",
    locale === "ru" ? "🔎 Детали"  : "🔎 Detail",
    locale === "ru" ? "🏷️ Бирка"   : "🏷️ Label",
  ];

  function addMockPhoto() {
    const MOCK = [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80",
    ];
    if (photos.length < 8) {
      setPhotos([...photos, MOCK[photos.length % MOCK.length]]);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center pt-2">
        <h2 className="text-xl font-extrabold">
          {locale === "ru" ? "Сфотографируй товар" : "Photograph your item"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ru" ? `${photos.length}/8 фото · AI улучшит каждое` : `${photos.length}/8 photos · AI enhances each`}
        </p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div key={i}
            whileTap={{ scale: 0.95 }}
            onClick={addMockPhoto}
            className="relative aspect-square rounded-xl overflow-hidden
              dark:bg-white/5 bg-black/5 border-2 dark:border-white/10 border-black/10
              flex items-center justify-center cursor-pointer"
          >
            {photos[i] ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full
                  bg-emerald-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setPhotos(photos.filter((_, j) => j !== i)); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full
                    bg-black/60 flex items-center justify-center"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                {i === photos.length
                  ? <ImagePlus className="h-6 w-6 text-primary" />
                  : <Camera className="h-5 w-5" />}
                {i === photos.length && (
                  <span className="text-[10px] text-primary font-semibold">
                    {ANGLES[i] || "+"}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Angle hints */}
      <div className="grid grid-cols-2 gap-2">
        {ANGLES.map((a, i) => (
          <div key={a}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs
              border transition-colors ${
              i < photos.length
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "dark:border-white/5 border-black/5 dark:bg-white/3 bg-black/3 text-muted-foreground"
            }`}>
            {i < photos.length && <Check className="h-3 w-3 shrink-0" />}
            {a}
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full rounded-xl h-11" onClick={addMockPhoto}>
        <Camera className="h-4 w-4 mr-2" />
        {locale === "ru" ? "Открыть камеру" : "Open Camera"}
      </Button>
    </div>
  );
}

function Step3AI({ locale }: { locale: string }) {
  const tasks = [
    { label: locale === "ru" ? "Анализ фотографий"     : "Analyzing photos",       done: true  },
    { label: locale === "ru" ? "Распознавание голоса"  : "Voice recognition",       done: true  },
    { label: locale === "ru" ? "Генерация описания"    : "Generating description",  done: true  },
    { label: locale === "ru" ? "Определение цены"      : "Pricing analysis",        done: false },
    { label: locale === "ru" ? "SEO-оптимизация"       : "SEO optimization",        done: false },
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="text-center">
        <h2 className="text-xl font-extrabold">
          {locale === "ru" ? "Claw анализирует…" : "Claw is analyzing…"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ru" ? "Обычно 5–10 секунд" : "Usually 5–10 seconds"}
        </p>
      </div>

      {/* Animated logo */}
      <div className="flex justify-center py-2">
        <div className="relative">
          <motion.div
            className="w-20 h-20 rounded-full claw-gradient"
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-9 w-9 text-white" />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 p-3 rounded-xl
              dark:bg-white/5 bg-black/5"
          >
            {t.done ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-emerald-400" />
              </div>
            ) : (
              <motion.div
                className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent shrink-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className={`text-sm ${t.done ? "text-foreground" : "text-muted-foreground"}`}>
              {t.label}
            </span>
            {t.done && (
              <Badge variant="secondary" className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border-0">
                ✓
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Step4Preview({ locale }: { locale: string }) {
  const PLATFORMS = [
    { name: "ClawEverything", active: true  },
    { name: "Avito",          active: false },
    { name: "VK",             active: false },
    { name: "eBay",           active: false },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div className="text-center">
        <h2 className="text-xl font-extrabold">
          {locale === "ru" ? "Превью объявления" : "Listing Preview"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ru" ? "Всё выглядит хорошо?" : "Everything looks good?"}
        </p>
      </div>

      {/* Listing card preview */}
      <div className="rounded-2xl overflow-hidden border dark:border-white/10 border-black/10">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80"
            alt="Preview"
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="absolute top-2 left-2 flex items-center gap-1
            px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
            <Sparkles className="h-2.5 w-2.5" />
            AI
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-base leading-tight">
              {locale === "ru" ? "Кожаная куртка чёрная, размер M" : "Black Leather Jacket, Size M"}
            </h3>
            <p className="text-xl font-extrabold claw-gradient-text price-tag shrink-0 ml-2">
              ₽4 500
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {locale === "ru"
              ? "Кожаная куртка чёрного цвета, размер M. Небольшая царапина на рукаве. Куплена в 2023 году. Отличное состояние."
              : "Black leather jacket, size M. Small scratch on the sleeve. Purchased 2023. Excellent condition."}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {["Одежда", "Кожа", "M", "2023"].map(tag => (
              <Badge key={tag} variant="secondary" className="text-[11px] rounded-full px-2 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {locale === "ru" ? "Москва · 0 км" : "Moscow · 0 km"}
            <RotateCcw className="h-3 w-3 ml-2 text-primary" />
            <span className="text-primary font-medium">
              {locale === "ru" ? "Изменить" : "Edit"}
            </span>
          </div>
        </div>
      </div>

      {/* Publishing targets */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {locale === "ru" ? "Публикуется на" : "Publishing to"}
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <div key={p.name}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              p.active
                ? "claw-gradient text-white border-transparent"
                : "dark:border-white/10 border-black/10 text-muted-foreground"
            }`}>
              {p.active ? <Check className="h-3 w-3" /> : null}
              {p.name}
              {!p.active && (
                <span className="text-[10px] opacity-60">
                  {locale === "ru" ? "(шаблон)" : "(template)"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
