"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import {
  Mic,
  Camera,
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";
import Link from "next/link";

// TODO: Этап 3 — Полная реализация:
// - Web Speech API для голосового описания
// - Камера с AI-подсказками (Voice-to-Claw)
// - Загрузка фото в Supabase Storage
// - Edge Function для AI анализа (Grok/GPT-4o vision)
// - Генерация title/description/price
// - Кросс-постинг шаблоны

type Step = 1 | 2 | 3 | 4;

const steps = [
  { key: 1 as Step, icon: Mic, labelRu: "Голос", labelEn: "Voice" },
  { key: 2 as Step, icon: Camera, labelRu: "Фото", labelEn: "Photos" },
  { key: 3 as Step, icon: Sparkles, labelRu: "AI", labelEn: "AI" },
  { key: 4 as Step, icon: Check, labelRu: "Готово", labelEn: "Done" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function NewListingPage() {
  const { locale } = useAppStore();
  const t = getTranslations(locale);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [direction, setDirection] = useState(0);

  function goNext() {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((s) => (s + 1) as Step);
    }
  }

  function goBack() {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => (s - 1) as Step);
    }
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold">{t.sell.newListing}</h1>
        <div className="w-5" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                step.key === currentStep
                  ? "claw-gradient text-white scale-110"
                  : step.key < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step.key < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            {step.key < 4 && (
              <div
                className={`w-6 h-0.5 rounded ${
                  step.key < currentStep ? "bg-primary" : "bg-secondary"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {currentStep === 1 && <StepVoice locale={locale} />}
          {currentStep === 2 && <StepPhotos locale={locale} />}
          {currentStep === 3 && <StepAI locale={locale} />}
          {currentStep === 4 && <StepPublish locale={locale} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {currentStep > 1 && (
          <Button variant="outline" className="flex-1" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        )}
        {currentStep < 4 ? (
          <Button variant="claw" className="flex-1" onClick={goNext}>
            {t.common.next}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="claw" className="flex-1" asChild>
            <Link href="/dashboard">{t.sell.publish}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function StepVoice({ locale }: { locale: string }) {
  const [recording, setRecording] = useState(false);

  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <h2 className="text-lg font-semibold">
          {locale === "ru" ? "Расскажи о товаре" : "Describe Your Item"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "Нажми на микрофон и говори 10–15 секунд. Опиши что продаёшь, состояние, размер, когда купил."
            : "Tap the mic and speak for 10-15 sec. Describe what you're selling, condition, size, when purchased."}
        </p>

        <motion.button
          className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full ${
            recording ? "bg-destructive" : "claw-gradient"
          } shadow-lg`}
          whileTap={{ scale: 0.9 }}
          onClick={() => setRecording(!recording)}
        >
          <Mic className={`h-8 w-8 text-white ${recording ? "animate-pulse" : ""}`} />
        </motion.button>

        {recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex justify-center gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{
                    height: [8, Math.random() * 24 + 8, 8],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "ru" ? "Слушаю..." : "Listening..."}
            </p>
          </motion.div>
        )}

        {/* AI hints area */}
        <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-dashed">
          <Badge variant="claw" className="mb-2">AI</Badge>
          <p className="text-xs text-muted-foreground">
            {locale === "ru"
              ? "AI-подсказки появятся здесь во время записи"
              : "AI hints will appear here during recording"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StepPhotos({ locale }: { locale: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <h2 className="text-lg font-semibold">
          {locale === "ru" ? "Сфотографируй товар" : "Take Photos"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "Сделай 4–8 фото. AI подскажет лучшие ракурсы и автоматически улучшит каждое."
            : "Take 4-8 photos. AI will suggest angles and auto-enhance each one."}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-secondary/30 cursor-pointer"
            >
              <Camera className="h-6 w-6 text-muted-foreground/50" />
            </motion.div>
          ))}
        </div>

        <Button variant="outline" className="w-full">
          <Camera className="h-4 w-4 mr-2" />
          {locale === "ru" ? "Открыть камеру" : "Open Camera"}
        </Button>
      </CardContent>
    </Card>
  );
}

function StepAI({ locale }: { locale: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-12 w-12 mx-auto text-primary" />
        </motion.div>
        <h2 className="text-lg font-semibold">
          {locale === "ru" ? "Claw анализирует..." : "Claw is analyzing..."}
        </h2>
        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "AI обрабатывает фото и голос, генерирует описание, определяет цену"
            : "AI is processing photos and voice, generating description, determining price"}
        </p>

        <div className="space-y-3 text-left">
          {[
            { label: locale === "ru" ? "Анализ фото" : "Photo analysis", done: true },
            { label: locale === "ru" ? "Распознавание голоса" : "Voice recognition", done: true },
            { label: locale === "ru" ? "Генерация описания" : "Generating description", done: false },
            { label: locale === "ru" ? "Определение цены" : "Pricing", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.done ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StepPublish({ locale }: { locale: string }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-center">
          {locale === "ru" ? "Превью объявления" : "Listing Preview"}
        </h2>

        {/* Mock preview */}
        <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="font-semibold">
              {locale === "ru"
                ? "Кожаная куртка чёрная, размер M"
                : "Black Leather Jacket, Size M"}
            </h3>
            <p className="text-2xl font-bold claw-gradient-text mt-1">₽4 500</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === "ru"
              ? "Кожаная куртка чёрного цвета, размер M. Небольшая царапина на рукаве. Куплена в 2023 году. Отличное состояние."
              : "Black leather jacket, size M. Small scratch on the sleeve. Purchased in 2023. Excellent condition."}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant="secondary">{locale === "ru" ? "Одежда" : "Clothing"}</Badge>
            <Badge variant="secondary">{locale === "ru" ? "Кожа" : "Leather"}</Badge>
            <Badge variant="secondary">M</Badge>
          </div>
        </div>

        {/* Cross-posting */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {locale === "ru" ? "Публикация" : "Publishing to"}
          </p>
          <div className="flex gap-2 flex-wrap">
            {["ClawEverything", "Avito", "VK", "eBay"].map((platform) => (
              <Badge
                key={platform}
                variant={platform === "ClawEverything" ? "claw" : "outline"}
              >
                {platform}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
