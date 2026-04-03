"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useSellStore, type SellStep, type ExternalMarketplaceRow } from "@/lib/store-sell";
import { useVoiceRecording, VOICE_RECORD_TARGET_SECONDS } from "@/hooks/use-voice-recording";
import { useCameraCapture, type CapturedPhoto } from "@/hooks/use-camera-capture";
import { useGeolocation } from "@/hooks/use-geolocation";
import { uploadListingPhoto } from "@/lib/supabase/storage";
import { createListing } from "@/lib/actions/listings";
import { createClient } from "@/lib/supabase/client";
import { buildTemplatesForPlatforms } from "@/lib/publish-templates";
import { Skeleton } from "@/components/ui/skeleton";
import { correctBrandsInText, searchBrands } from "@/lib/brands";
import { toast } from "sonner";
import {
  Mic, Camera, Sparkles, Check, X, ArrowLeft,
  ArrowRight, Zap, ImagePlus, RotateCcw, MapPin,
  RefreshCw, MicOff, CameraOff, Loader2, Edit3,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublishSuccessScreen } from "@/components/sell/publish-success-screen";
import { deriveListingPrimaryLocale, type ListingPrimaryLocale } from "@/lib/listing-locale";

const STEPS: { n: SellStep; icon: React.ElementType; ru: string; en: string }[] = [
  { n: 1, icon: Mic,      ru: "Голос",  en: "Voice"  },
  { n: 2, icon: Camera,   ru: "Фото",   en: "Photos" },
  { n: 3, icon: Sparkles, ru: "AI",     en: "AI"     },
  { n: 4, icon: Zap,      ru: "Старт",  en: "Launch" },
];

const slide = {
  enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d < 0 ? 280 : -280, opacity: 0 }),
};

export default function NewListingPage() {
  const { locale } = useAppStore();
  const router = useRouter();
  const store = useSellStore();
  const geo = useGeolocation();
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);

  const listingPrimary: ListingPrimaryLocale = deriveListingPrimaryLocale(userCountryCode, locale);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: u } = await supabase
        .from("users")
        .select("country_code, city")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const raw = u?.country_code;
      setUserCountryCode(
        raw && String(raw).length >= 2 ? String(raw).toUpperCase().slice(0, 2) : null,
      );
      setUserCity(u?.city ? String(u.city).trim() : null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (geo.lat && geo.lng) store.setLocation(geo.lat, geo.lng);
  }, [geo.lat, geo.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => { useSellStore.getState().reset(); };
  }, []);

  function next() {
    if (store.step < 4) {
      const nextStep = (store.step + 1) as SellStep;
      store.setStep(nextStep, 1);

      // Trigger AI analysis on entering step 3
      if (nextStep === 3 && !store.aiResult && !store.aiLoading) {
        runAIAnalysis();
      }
    }
  }

  function back() {
    if (store.step > 1) store.setStep((store.step - 1) as SellStep, -1);
  }

  async function runAIAnalysis() {
    store.setAILoading(true);
    store.setAIError(null);

    try {
      // Try uploading photos — but don't fail if upload breaks
      const urls: string[] = [];
      if (store.photos.length > 0) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not logged in");

          const tempId = crypto.randomUUID();
          for (let i = 0; i < store.photos.length; i++) {
            try {
              const { publicUrl } = await uploadListingPhoto(
                store.photos[i].blob, user.id, tempId, i
              );
              urls.push(publicUrl);
            } catch (uploadErr) {
              console.warn(`Photo ${i} upload failed:`, uploadErr);
            }
          }
        } catch (authErr) {
          console.warn("Photo upload auth failed, continuing text-only:", authErr);
        }
      }
      store.setUploadedUrls(urls);

      // Call AI — works with or without photos
      const primary = deriveListingPrimaryLocale(userCountryCode, locale);
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: store.transcript,
          imageUrls: urls,
          primaryLocale: primary,
          countryCode: userCountryCode || undefined,
          sellerCity: userCity || undefined,
        }),
      });

      // Safely parse response — handle non-JSON responses
      let data: Record<string, unknown>;
      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Server returned invalid response: ${responseText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(String(data.error) || `AI analysis failed (HTTP ${res.status})`);
      }

      store.setAIResult(data.listing as typeof store.aiResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      store.setAIError(msg);
      toast.error(msg);
    } finally {
      store.setAILoading(false);
    }
  }

  async function handlePublish() {
    if (!store.aiResult) return;

    toast.info(
      locale === "ru"
        ? "Do4U начал работу над твоим объявлением"
        : "Do4U started working on your listing",
      { duration: 4500 },
    );

    store.setPublishing(true);
    try {
      const cats = ["clothing", "shoes", "accessories", "electronics", "books", "toys", "furniture"] as const;
      const cat = store.aiResult.category as (typeof cats)[number];
      if (!cats.includes(cat)) {
        throw new Error(
          locale === "ru"
            ? "Категория не подходит для публикации. Измени описание."
            : "Category not allowed for publishing. Edit the description.",
        );
      }

      const result = await createListing({
        title: store.aiResult.title,
        titleEn: store.aiResult.titleEn.trim() ? store.aiResult.titleEn : null,
        description: store.aiResult.description,
        descriptionEn: store.aiResult.descriptionEn.trim() ? store.aiResult.descriptionEn : null,
        price: store.aiResult.price,
        category: cat,
        tags: store.aiResult.tags,
        voiceTranscript: store.transcript,
        imageUrls: store.uploadedUrls.map((url, i) => ({
          original: url,
          enhanced: null,
          order: i,
        })),
        lat: store.lat,
        lng: store.lng,
        aiMetadata: { condition: store.aiResult.condition },
      });

      if ("error" in result && result.error === "MODERATION_BLOCKED") {
        toast.error(
          result.moderationReason
            || (locale === "ru"
              ? "Модерация: объявление не может быть опубликовано"
              : "Moderation: listing cannot be published"),
        );
        return;
      }

      if ("error" in result && result.error) {
        throw new Error(result.error);
      }

      if (!("success" in result) || !result.success || !result.listingId) {
        throw new Error("Publish failed");
      }

      store.setPublished(true, result.listingId);

      // Auto-publish to connected external platforms in background
      const { autoPublishToAllPlatforms } = await import("@/lib/platforms/auto-publish");
      const platformResults = await autoPublishToAllPlatforms(result.listingId);

      const succeeded = platformResults.filter((r) => r.success);
      const failed = platformResults.filter((r) => !r.success);

      const templates = buildTemplatesForPlatforms(
        store.externalMarketplaces,
        store.selectedExternalIds,
        {
          title: store.aiResult.title,
          titleEn: store.aiResult.titleEn.trim() ? store.aiResult.titleEn : null,
          description: store.aiResult.description,
          descriptionEn: store.aiResult.descriptionEn.trim() ? store.aiResult.descriptionEn : null,
          price: store.aiResult.price,
          tags: store.aiResult.tags,
        },
      );

      store.setPostPublish({
        listingId: result.listingId,
        templates,
        platformResults: platformResults.length > 0 ? platformResults : undefined,
      });

      if (succeeded.length > 0) {
        toast.success(
          locale === "ru"
            ? `Опубликовано на ${succeeded.length} площадк${succeeded.length === 1 ? "е" : "ах"}!`
            : `Published on ${succeeded.length} platform${succeeded.length === 1 ? "" : "s"}!`,
        );
      }
      if (failed.length > 0) {
        for (const f of failed) {
          toast.error(`${f.platform_slug}: ${f.error}`);
        }
      }
      if (platformResults.length === 0) {
        toast.success(
          locale === "ru"
            ? "Опубликовано в Do4U! Подключи площадки в Профиле для авто-публикации."
            : "Published on Do4U! Connect platforms in Profile for auto-publishing.",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publishing failed");
    } finally {
      store.setPublishing(false);
    }
  }

  const pct = ((store.step - 1) / 3) * 100;

  const canGoNext =
    (store.step === 1 && store.transcript.length >= 5) ||
    (store.step === 2 && store.photos.length >= 1) ||
    (store.step === 3 && !!store.aiResult);

  if (store.postPublish) {
    return (
      <PublishSuccessScreen
        locale={locale}
        onGoHome={() => {
          useSellStore.getState().reset();
          router.push("/dashboard");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-dvh pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/5 border-black/5">
        <Link href="/dashboard" className="flex items-center justify-center w-9 h-9 rounded-xl dark:bg-white/5 bg-black/5">
          <X className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">
            {locale === "ru" ? "Новое объявление" : "New Listing"}
          </p>
          <p className="text-sm font-bold">{locale === "ru" ? STEPS[store.step - 1].ru : STEPS[store.step - 1].en}</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="h-1 dark:bg-white/5 bg-black/5">
        <motion.div className="h-full brand-gradient" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>

      {/* Step icons */}
      <div className="flex items-center justify-center gap-0 px-8 py-4">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 ${
              s.n === store.step ? "brand-gradient text-white scale-110 shadow-lg"
                : s.n < store.step ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "dark:bg-white/5 bg-black/5 text-muted-foreground"
            }`}>
              {s.n < store.step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-0.5 transition-colors duration-300 ${s.n < store.step ? "bg-emerald-500/40" : "dark:bg-white/5 bg-black/5"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4">
        <AnimatePresence custom={store.direction} mode="wait">
          <motion.div key={store.step} custom={store.direction} variants={slide}
            initial="enter" animate="center" exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }} className="h-full">
            {store.step === 1 && <StepVoice />}
            {store.step === 2 && <StepPhotos />}
            {store.step === 3 && (
              <StepAI onRetry={runAIAnalysis} listingPrimary={listingPrimary} />
            )}
            {store.step === 4 && (
              <StepPreview listingPrimary={listingPrimary} userCountryCode={userCountryCode} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-4 pt-4">
        {store.step > 1 && (
          <Button variant="outline" className="rounded-xl h-12" onClick={back}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {locale === "ru" ? "Назад" : "Back"}
          </Button>
        )}
        {store.step < 4 ? (
          <Button variant="brand" className="flex-1 rounded-xl h-12 font-bold" onClick={next} disabled={!canGoNext}>
            {store.step === 2 && store.photos.length === 0
              ? (locale === "ru" ? "Нужно хотя бы 1 фото" : "Need at least 1 photo")
              : (locale === "ru" ? "Далее" : "Next")}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="brand" className="flex-1 rounded-xl h-12 font-bold glow-orange"
            onClick={handlePublish} disabled={store.publishing || store.published || !store.aiResult}>
            {store.publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              : store.published ? <Check className="h-4 w-4 mr-1.5" />
              : <Zap className="h-4 w-4 mr-1.5 fill-white" />}
            {store.published
              ? (locale === "ru" ? "Опубликовано!" : "Published!")
              : (locale === "ru" ? "Запустить Do4U" : "Launch Do4U")}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Voice ──────────────────────────────────────────────────────────

function StepVoice() {
  const { locale } = useAppStore();
  const store = useSellStore();
  const voice = useVoiceRecording();
  const [brandHints, setBrandHints] = useState<string[]>([]);

  // Sync transcript to store WITH brand autocorrect
  useEffect(() => {
    if (voice.transcript) {
      const corrected = correctBrandsInText(voice.transcript);
      store.setTranscript(corrected);

      // Show detected brands as hints
      const words = corrected.split(/\s+/);
      const detected = words
        .map(w => searchBrands(w, 1)?.[0]?.name)
        .filter((b): b is string => !!b);
      setBrandHints([...new Set(detected)]);
    }
  }, [voice.transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (voice.audioBlob) store.setAudioBlob(voice.audioBlob);
  }, [voice.audioBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleRecording() {
    if (voice.isRecording) voice.stop();
    else voice.start();
  }

  const secondsLeft = Math.max(0, VOICE_RECORD_TARGET_SECONDS - voice.duration);
  const recordProgress = Math.min(1, voice.duration / VOICE_RECORD_TARGET_SECONDS);

  return (
    <div className="space-y-6">
      <motion.div
        className="text-center pt-2 space-y-3"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-2xl font-black tracking-tight">
          {locale === "ru" ? "Расскажи о товаре" : "Tell us about it"}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {voice.isSupported
            ? (locale === "ru"
              ? `До ${VOICE_RECORD_TARGET_SECONDS} секунд — Do4U всё запомнит`
              : `Up to ${VOICE_RECORD_TARGET_SECONDS} seconds — Do4U remembers all`)
            : (locale === "ru" ? "Браузер не поддерживает голос. Напиши текст ниже 👇" : "No voice in this browser. Type below 👇")}
        </p>
      </motion.div>

      {/* Friendly hints */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="rounded-2xl p-4 space-y-2.5
          dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-purple-500/10
          bg-gradient-to-br from-orange-50 to-violet-50
          border dark:border-white/10 border-orange-100/80"
      >
        <p className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
          {locale === "ru" ? "Что говорить" : "What to say"}
        </p>
        <ul className="text-sm sm:text-[15px] leading-relaxed font-medium text-foreground/90 space-y-1.5">
          {(locale === "ru"
            ? [
                "Как называется вещь и какой бренд?",
                "Состояние: новое, как новое, б/у?",
                "Желаемая цена и где удобно встретиться",
              ]
            : [
                "What is it, and which brand?",
                "Condition: new, like new, or used?",
                "Your price and a good meetup area",
              ]
          ).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-orange-500 font-bold">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Mic + countdown */}
      <div className="flex flex-col items-center gap-5 py-2">
        {voice.isRecording && (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-bold tabular-nums">
              <span className="text-muted-foreground">{locale === "ru" ? "Запись" : "Recording"}</span>
              <span className="brand-gradient-text text-sm">{secondsLeft}s</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden dark:bg-white/10 bg-black/10">
              <motion.div
                className="h-full rounded-full brand-gradient"
                initial={false}
                animate={{ width: `${recordProgress * 100}%` }}
                transition={{ type: "tween", ease: "linear", duration: 0.35 }}
              />
            </div>
            <p className="text-center text-[11px] text-muted-foreground font-medium">
              {locale === "ru"
                ? `Осталось секунд: ${secondsLeft} · идеально 10–15 сек`
                : `${secondsLeft}s left · aim for 10–15 sec`}
            </p>
          </div>
        )}

        <div className="relative flex items-center justify-center w-[7.5rem] h-[7.5rem]">
          {voice.isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 opacity-35"
                animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0.08, 0.35] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-400/40 to-purple-500/30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
          <motion.button
            type="button"
            className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full shadow-2xl
              ${voice.isRecording
                ? "bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 ring-4 ring-white/25"
                : "brand-gradient ring-2 ring-white/20"}`}
            whileTap={{ scale: 0.92 }}
            onClick={toggleRecording}
            disabled={!voice.isSupported && !store.transcript}
          >
            {voice.isSupported
              ? <Mic className={`h-12 w-12 text-white drop-shadow-md ${voice.isRecording ? "scale-105" : ""}`} />
              : <MicOff className="h-11 w-11 text-white/50" />}
          </motion.button>
        </div>

        {voice.isRecording && (
          <div className="flex items-end justify-center gap-0.5 h-10 w-full max-w-[280px]">
            {Array.from({ length: 32 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-orange-500 to-purple-500"
                animate={{ height: [6, 14 + (i % 5) * 8, 6] }}
                transition={{ duration: 0.45 + (i % 4) * 0.08, repeat: Infinity, delay: i * 0.03 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {locale === "ru" ? "Текст" : "Transcript"}
          </p>
          {store.transcript && (
            <button onClick={() => { store.setTranscript(""); voice.reset(); }}
              className="text-xs text-rose-500 flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              {locale === "ru" ? "Сбросить" : "Reset"}
            </button>
          )}
        </div>
        <textarea
          value={store.transcript + (voice.interimTranscript ? " " + voice.interimTranscript : "")}
          onChange={(e) => store.setTranscript(e.target.value)}
          placeholder={locale === "ru"
            ? "Описание появится здесь автоматически, или введи вручную..."
            : "Description will appear here, or type manually..."}
          className="w-full h-28 p-3 rounded-xl border dark:border-white/10 border-black/10
            dark:bg-white/5 bg-black/5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring
            placeholder:text-muted-foreground/60"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {store.transcript.length} {locale === "ru" ? "символов" : "chars"}
          </p>
        </div>

        {/* Detected brand hints */}
        {brandHints.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-emerald-400 font-semibold">
              {locale === "ru" ? "Бренды:" : "Brands:"}
            </span>
            {brandHints.map(b => (
              <span key={b}
                className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20
                  text-[11px] font-semibold text-emerald-400">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Photos ─────────────────────────────────────────────────────────

function StepPhotos() {
  const { locale } = useAppStore();
  const store = useSellStore();
  const cam = useCameraCapture();

  const handleCapture = useCallback(() => {
    const photo = cam.capturePhoto();
    if (photo) store.addPhoto(photo);
  }, [cam, store]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const photo: CapturedPhoto = {
          dataUrl: reader.result as string,
          blob: file,
          timestamp: Date.now(),
        };
        store.addPhoto(photo);
      };
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-center pt-2">
        <h2 className="text-xl font-extrabold">
          {locale === "ru" ? "Сфотографируй товар" : "Photograph your item"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {store.photos.length}/8 {locale === "ru" ? "фото" : "photos"}
        </p>
      </div>

      {/* Camera viewfinder */}
      {cam.isStreaming ? (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
          <video ref={cam.videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={cam.canvasRef} className="hidden" />

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4">
            <button onClick={cam.flipCamera}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-white" />
            </button>
            <motion.button onClick={handleCapture} whileTap={{ scale: 0.85 }}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center"
              disabled={store.photos.length >= 8}>
              <div className="w-12 h-12 rounded-full bg-white" />
            </motion.button>
            <button onClick={cam.stopCamera}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <CameraOff className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs font-bold">
            {store.photos.length}/8
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="brand" className="flex-1 rounded-xl h-12" onClick={cam.startCamera}>
            <Camera className="h-4 w-4 mr-2" />
            {locale === "ru" ? "Открыть камеру" : "Open Camera"}
          </Button>
          <label className="flex-1">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            <div className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl border
              dark:border-white/10 border-black/10 text-sm font-medium cursor-pointer
              dark:hover:bg-white/5 hover:bg-black/5 transition-colors">
              <ImagePlus className="h-4 w-4" />
              {locale === "ru" ? "Из галереи" : "Gallery"}
            </div>
          </label>
        </div>
      )}

      {/* Photo thumbnails */}
      {store.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {store.photos.map((p, i) => (
            <div key={p.timestamp} className="relative aspect-square rounded-xl overflow-hidden border dark:border-white/10 border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{i + 1}</span>
              </div>
              <button onClick={() => store.removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: AI Analysis ────────────────────────────────────────────────────

function formatListingPriceLine(
  primary: ListingPrimaryLocale,
  countryCode: string | null,
  price: number,
  uiLocale: "ru" | "en",
): string {
  if (primary === "ru") return `₽${price.toLocaleString("ru-RU")}`;
  const cc = countryCode?.toUpperCase() ?? "";
  if (cc === "US") return `$${price.toLocaleString("en-US")}`;
  if (cc === "GB") return `£${price.toLocaleString("en-GB")}`;
  if (["AT", "BE", "DE", "ES", "FR", "IE", "IT", "NL", "PT", "FI", "GR"].includes(cc)) {
    return `${price.toLocaleString("de-DE")} €`;
  }
  if (cc === "PL") return `${price.toLocaleString("pl-PL")} zł`;
  return uiLocale === "ru"
    ? `$${price.toLocaleString("en-US")} (USD)`
    : `$${price.toLocaleString("en-US")}`;
}

function StepAI({
  onRetry,
  listingPrimary,
}: {
  onRetry: () => void;
  listingPrimary: ListingPrimaryLocale;
}) {
  const { locale } = useAppStore();
  const store = useSellStore();

  if (store.aiError) {
    return (
      <div className="space-y-4 pt-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto">
          <X className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-extrabold">{locale === "ru" ? "Ошибка" : "Error"}</h2>
        <p className="text-sm text-muted-foreground">{store.aiError}</p>
        <Button variant="brand" onClick={onRetry} className="rounded-xl">
          <RotateCcw className="h-4 w-4 mr-2" />
          {locale === "ru" ? "Попробовать снова" : "Try Again"}
        </Button>
      </div>
    );
  }

  if (store.aiLoading) {
    return (
      <div className="space-y-6 pt-2">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold">{locale === "ru" ? "Do4U анализирует…" : "Do4U is analyzing…"}</h2>
          <p className="text-xs text-muted-foreground">
            {locale === "ru" ? "Загрузка и AI — обычно 10–30 сек" : "Upload + AI — usually 10–30 sec"}
          </p>
        </div>
        <div className="flex justify-center py-2">
          <motion.div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center shadow-xl"
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles className="h-9 w-9 text-white" />
          </motion.div>
        </div>
        <div className="space-y-4 px-1">
          <div className="rounded-2xl border dark:border-white/10 border-black/10 p-4 space-y-3">
            <Skeleton className="h-4 w-3/5 max-w-[200px]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="rounded-2xl border dark:border-white/10 border-black/10 p-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-24 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {store.uploadedUrls.length > 0
            ? (locale === "ru" ? "Фото загружены, идёт разбор…" : "Photos uploaded, analyzing…")
            : (locale === "ru" ? "Генерация объявления…" : "Generating listing…")}
        </div>
      </div>
    );
  }

  if (!store.aiResult) return null;

  const r = store.aiResult;

  return (
    <div className="space-y-4 pt-2">
      <div className="text-center">
        <h2 className="text-xl font-extrabold">{locale === "ru" ? "AI готов!" : "AI Ready!"}</h2>
        <p className="text-sm text-muted-foreground mt-1">{locale === "ru" ? "Проверь и измени если нужно" : "Review and edit if needed"}</p>
      </div>

      {/* Editable fields — one primary language; optional EN only on preview step */}
      <div className="space-y-3">
        <Field
          label={
            listingPrimary === "ru"
              ? locale === "ru"
                ? "Заголовок"
                : "Title (Russian)"
              : locale === "ru"
                ? "Заголовок (English)"
                : "Title"
          }
          value={r.title}
          onChange={(v) => store.updateAIField("title", v)}
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {listingPrimary === "ru"
              ? locale === "ru"
                ? "Описание"
                : "Description (Russian)"
              : locale === "ru"
                ? "Описание (English)"
                : "Description"}
          </label>
          <textarea value={r.description}
            onChange={(e) => store.updateAIField("description", e.target.value)}
            className="w-full h-20 mt-1 p-3 rounded-xl border dark:border-white/10 border-black/10
              dark:bg-white/5 bg-black/5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {listingPrimary === "ru"
                ? locale === "ru"
                  ? "Цена ₽"
                  : "Price (RUB)"
                : locale === "ru"
                  ? "Цена"
                  : "Price"}
            </label>
            <input type="number" value={r.price}
              onChange={(e) => store.updateAIField("price", Number(e.target.value))}
              className="w-full h-11 mt-1 px-3 rounded-xl border dark:border-white/10 border-black/10
                dark:bg-white/5 bg-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-bold" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {locale === "ru" ? "Категория" : "Category"}
            </label>
            <select value={r.category}
              onChange={(e) => store.updateAIField("category", e.target.value)}
              className="w-full h-11 mt-1 px-3 rounded-xl border dark:border-white/10 border-black/10
                dark:bg-white/5 bg-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {["clothing","shoes","accessories","electronics","books","toys","furniture"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {r.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="rounded-full text-xs">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        {label} <Edit3 className="h-3 w-3" />
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 mt-1 px-3 rounded-xl border dark:border-white/10 border-black/10
          dark:bg-white/5 bg-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

// ─── Step 4: Preview ────────────────────────────────────────────────────────

function StepPreview({
  listingPrimary,
  userCountryCode,
}: {
  listingPrimary: ListingPrimaryLocale;
  userCountryCode: string | null;
}) {
  const { locale, countryPlatformsRefreshKey } = useAppStore();
  const store = useSellStore();
  const r = store.aiResult;
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [editing, setEditing] = useState<null | "title" | "titleEn" | "desc" | "descEn" | "price">(null);
  const [showOptionalEn, setShowOptionalEn] = useState(
    () =>
      !!(store.aiResult?.titleEn?.trim() || store.aiResult?.descriptionEn?.trim()),
  );

  useEffect(() => {
    const cur = store.aiResult;
    if (!cur || listingPrimary !== "ru") return;
    if (cur.titleEn.trim() || cur.descriptionEn.trim()) setShowOptionalEn(true);
  }, [listingPrimary, store.aiResult]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: u } = await supabase.from("users").select("country_code").eq("id", user.id).maybeSingle();
      const raw = u?.country_code;
      const code =
        raw && String(raw).length >= 2 ? String(raw).toUpperCase().slice(0, 2) : "RU";
      const { data: rows } = await supabase
        .from("marketplace_platforms")
        .select("id, name, slug, posting_method, is_api_available")
        .eq("country_code", code)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      useSellStore.getState().setExternalMarketplaces((rows ?? []) as ExternalMarketplaceRow[]);
    })();
    return () => { cancelled = true; };
  }, [countryPlatformsRefreshKey]);

  useEffect(() => {
    setCarouselIdx(0);
  }, [store.photos.length, store.uploadedUrls.length]);

  if (!r) return null;

  const slides =
    store.uploadedUrls.length > 0
      ? store.uploadedUrls.map((url) => ({ src: url, remote: true }))
      : store.photos.map((p) => ({ src: p.dataUrl, remote: false }));
  const n = slides.length;
  const idx = n ? ((carouselIdx % n) + n) % n : 0;

  return (
    <motion.div
      className="space-y-5 pt-2"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight">{locale === "ru" ? "Превью объявления" : "Listing preview"}</h2>
        <p className="text-sm text-muted-foreground">
          {locale === "ru" ? "Нажми на поле, чтобы изменить" : "Tap a field to edit"}
        </p>
      </div>

      <div className="rounded-[1.25rem] overflow-hidden border dark:border-white/10 border-black/10 shadow-xl shadow-black/5 dark:shadow-black/40">
        {n > 0 && (
          <div className="relative aspect-[16/10] bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slides[idx].src} alt="" className="w-full h-full object-cover" />
            <Badge className="absolute top-3 left-3 brand-gradient text-white border-0 text-[10px] shadow-lg">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              {slides[idx].remote
                ? (locale === "ru" ? "Do4U · фото" : "Do4U · photos")
                : "AI"}
            </Badge>
            {n > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCarouselIdx((i) => (i - 1 + n) % n)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm"
                  aria-label="prev"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCarouselIdx((i) => (i + 1) % n)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm"
                  aria-label="next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCarouselIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
                      aria-label={`slide ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              {editing === "title" ? (
                <input
                  autoFocus
                  value={r.title}
                  onChange={(e) => store.updateAIField("title", e.target.value)}
                  onBlur={() => setEditing(null)}
                  className="w-full text-lg font-bold leading-tight p-2 rounded-xl border dark:border-white/15 border-black/10
                    dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing("title")}
                  className="text-left w-full rounded-xl p-2 -m-2 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
                >
                  <h3 className="font-bold text-lg leading-snug">{r.title}</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                    <Edit3 className="h-3 w-3" />
                    {listingPrimary === "ru"
                      ? locale === "ru"
                        ? "изменить заголовок"
                        : "edit title"
                      : locale === "ru"
                        ? "изменить заголовок (English)"
                        : "edit title"}
                  </span>
                </button>
              )}
            </div>
            <div className="shrink-0">
              {editing === "price" ? (
                <input
                  type="number"
                  autoFocus
                  value={r.price}
                  onChange={(e) => store.updateAIField("price", Number(e.target.value))}
                  onBlur={() => setEditing(null)}
                  className="w-32 text-xl font-black p-2 rounded-xl border dark:border-white/15 border-black/10
                    dark:bg-white/5 bg-black/5 brand-gradient-text focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing("price")}
                  className="text-right rounded-xl p-2 -m-2 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
                >
                  <p className="text-2xl font-black brand-gradient-text price-tag">
                    {formatListingPriceLine(listingPrimary, userCountryCode, r.price, locale)}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center justify-end gap-1">
                    <Edit3 className="h-3 w-3" />
                    {locale === "ru" ? "цена" : "price"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {editing === "desc" ? (
            <textarea
              autoFocus
              value={r.description}
              onChange={(e) => store.updateAIField("description", e.target.value)}
              onBlur={() => setEditing(null)}
              rows={5}
              className="w-full text-sm leading-relaxed p-3 rounded-xl border dark:border-white/15 border-black/10
                dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing("desc")}
              className="text-left w-full rounded-xl p-3 -m-1 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
            >
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{r.description}</p>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-2">
                <Edit3 className="h-3 w-3" />
                {listingPrimary === "ru"
                  ? locale === "ru"
                    ? "изменить описание"
                    : "edit description"
                  : locale === "ru"
                    ? "изменить описание (English)"
                    : "edit description"}
              </span>
            </button>
          )}

          {listingPrimary === "ru" && !showOptionalEn && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs"
              onClick={() => setShowOptionalEn(true)}
            >
              {locale === "ru"
                ? "+ Английский заголовок и описание (необязательно)"
                : "+ English title & description (optional)"}
            </Button>
          )}

          {listingPrimary === "ru" && showOptionalEn && (
            <div className="rounded-xl border border-dashed dark:border-orange-500/25 border-orange-400/30 p-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {locale === "ru" ? "На английском (необязательно)" : "In English (optional)"}
              </p>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground">
                  {locale === "ru" ? "Заголовок EN" : "Title (EN)"}
                </p>
                {editing === "titleEn" ? (
                  <input
                    autoFocus
                    value={r.titleEn}
                    onChange={(e) => store.updateAIField("titleEn", e.target.value)}
                    onBlur={() => setEditing(null)}
                    className="w-full text-sm font-semibold p-2 rounded-lg border dark:border-white/15 border-black/10
                      dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing("titleEn")}
                    className="text-left w-full rounded-lg p-1 -m-1 hover:bg-black/[0.04] dark:hover:bg-white/5"
                  >
                    <p className="text-sm font-semibold">{r.titleEn || "—"}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {locale === "ru" ? "нажми, чтобы править" : "tap to edit"}
                    </span>
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground">
                  {locale === "ru" ? "Описание EN" : "Description (EN)"}
                </p>
                {editing === "descEn" ? (
                  <textarea
                    autoFocus
                    value={r.descriptionEn}
                    onChange={(e) => store.updateAIField("descriptionEn", e.target.value)}
                    onBlur={() => setEditing(null)}
                    rows={4}
                    className="w-full text-sm leading-relaxed p-2 rounded-lg border dark:border-white/15 border-black/10
                      dark:bg-white/5 bg-black/5 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing("descEn")}
                    className="text-left w-full rounded-lg p-1 -m-1 hover:bg-black/[0.04] dark:hover:bg-white/5"
                  >
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.descriptionEn || "—"}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {locale === "ru" ? "нажми, чтобы править" : "tap to edit"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {r.tags.slice(0, 8).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[11px] rounded-full px-2.5 py-0.5">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {store.lat && store.lng
              ? `${store.lat.toFixed(2)}, ${store.lng.toFixed(2)}`
              : (locale === "ru" ? "Локация уточнится в профиле" : "Location from your profile")}
          </div>
        </div>
      </div>

      {/* Куда опубликовать */}
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {locale === "ru" ? "Куда опубликовать" : "Where to publish"}
        </p>

        <div className="rounded-2xl border dark:border-white/10 border-black/10 divide-y dark:divide-white/10 divide-black/10 overflow-hidden shadow-md shadow-black/[0.04]">
          <div className="flex items-center gap-3 p-3.5 bg-orange-500/5 dark:bg-orange-500/10">
            <div className="flex h-5 w-5 items-center justify-center rounded-md brand-gradient shrink-0">
              <Check className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Do4U</p>
              <p className="text-[11px] text-muted-foreground">
                {locale === "ru" ? "Внутренний маркетплейс (без комиссии)" : "In-app marketplace (zero fee)"}
              </p>
            </div>
          </div>

          {store.externalMarketplaces.map((p) => {
            const checked = store.selectedExternalIds.includes(p.id);
            const isApi = p.posting_method === "api" && p.is_api_available;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => store.toggleExternalMarketplace(p.id)}
                className="flex w-full items-start gap-3 p-3.5 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    checked
                      ? "border-transparent brand-gradient"
                      : "border-muted-foreground/35 dark:border-white/20"
                  }`}
                >
                  {checked && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold">{p.name}</p>
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md
                      dark:bg-white/10 bg-black/5 text-muted-foreground">
                      {isApi
                        ? (locale === "ru" ? "Авто" : "Auto")
                        : p.posting_method === "template"
                          ? (locale === "ru" ? "Шаблон" : "Template")
                          : (locale === "ru" ? "Вручную" : "Manual")}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {isApi
                      ? (locale === "ru"
                        ? "Автоматическая публикация (скоро)"
                        : "Automatic posting (soon)")
                      : p.posting_method === "template"
                        ? (locale === "ru"
                          ? "Текст для копирования после запуска"
                          : "Copy-paste text after launch")
                        : (locale === "ru" ? "Вручную на сайте площадки" : "Manual on platform site")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {store.externalMarketplaces.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">
            {locale === "ru"
              ? "Площадки для твоей страны появятся после сохранения региона в профиле."
              : "External platforms appear once your country is set on your profile."}
          </p>
        )}
      </div>
    </motion.div>
  );
}
