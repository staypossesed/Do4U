"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useSellStore, type SellStep } from "@/lib/store-sell";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { useCameraCapture, type CapturedPhoto } from "@/hooks/use-camera-capture";
import { useGeolocation } from "@/hooks/use-geolocation";
import { uploadListingPhoto } from "@/lib/supabase/storage";
import { createListing } from "@/lib/actions/listings";
import { createClient } from "@/lib/supabase/client";
import { correctBrandsInText, searchBrands } from "@/lib/brands";
import { toast } from "sonner";
import {
  Mic, Camera, Sparkles, Check, X, ArrowLeft,
  ArrowRight, Zap, ImagePlus, RotateCcw, MapPin,
  RefreshCw, MicOff, CameraOff, Loader2, Edit3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: store.transcript,
          imageUrls: urls,
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

    store.setPublishing(true);
    try {
      const result = await createListing({
        title: store.aiResult.title,
        titleEn: store.aiResult.titleEn,
        description: store.aiResult.description,
        descriptionEn: store.aiResult.descriptionEn,
        price: store.aiResult.price,
        category: store.aiResult.category as "clothing" | "shoes" | "accessories" | "electronics" | "books" | "toys" | "furniture",
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

      if (result.error) throw new Error(result.error);

      store.setPublished(true, result.listingId ?? undefined);
      toast.success(locale === "ru" ? "Объявление опубликовано!" : "Listing published!");

      setTimeout(() => router.push("/dashboard"), 1500);
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
            {store.step === 3 && <StepAI onRetry={runAIAnalysis} />}
            {store.step === 4 && <StepPreview />}
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
              : (locale === "ru" ? "Запустить Do4U 🚀" : "Launch Do4U 🚀")}
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

  return (
    <div className="space-y-5">
      <div className="text-center pt-2">
        <h2 className="text-xl font-extrabold">
          {locale === "ru" ? "Расскажи о товаре" : "Tell us about it"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {voice.isSupported
            ? (locale === "ru" ? "Говори 10–15 секунд — Do4U поймёт всё" : "Speak 10-15 sec — Do4U understands everything")
            : (locale === "ru" ? "Браузер не поддерживает запись голоса. Введи текст ниже." : "Browser doesn't support voice. Type below.")}
        </p>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          {voice.isRecording && (
            <motion.div className="absolute inset-0 rounded-full brand-gradient"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
          )}
          <motion.button className={`relative flex items-center justify-center w-24 h-24 rounded-full
            ${voice.isRecording ? "bg-rose-500" : "brand-gradient"} shadow-2xl`}
            whileTap={{ scale: 0.92 }} onClick={toggleRecording}
            disabled={!voice.isSupported && !store.transcript}>
            {voice.isSupported
              ? <Mic className={`h-10 w-10 text-white ${voice.isRecording ? "animate-pulse" : ""}`} />
              : <MicOff className="h-10 w-10 text-white/50" />}
          </motion.button>
        </div>

        {/* Timer */}
        {voice.isRecording && (
          <p className="text-sm font-bold text-rose-500 tabular-nums">{voice.duration}s / 30s</p>
        )}

        {/* Waveform */}
        {voice.isRecording && (
          <div className="flex items-end justify-center gap-0.5 h-8">
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.div key={i} className="w-1 rounded-full bg-rose-500"
                animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.04 }} />
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

function StepAI({ onRetry }: { onRetry: () => void }) {
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
      <div className="space-y-6 pt-2 text-center">
        <h2 className="text-xl font-extrabold">{locale === "ru" ? "Do4U анализирует…" : "Do4U is analyzing…"}</h2>
        <div className="flex justify-center py-2">
          <motion.div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles className="h-9 w-9 text-white" />
          </motion.div>
        </div>
        <div className="space-y-2 text-left px-2">
          {[
            { label: locale === "ru" ? "Загрузка фото…" : "Uploading photos…", done: store.uploadedUrls.length > 0 },
            { label: locale === "ru" ? "AI анализ…" : "AI analysis…", done: false },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-3 p-3 rounded-xl dark:bg-white/5 bg-black/5">
              {t.done
                ? <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><Check className="h-3 w-3 text-emerald-400" /></div>
                : <Loader2 className="w-5 h-5 animate-spin text-primary" />}
              <span className="text-sm">{t.label}</span>
            </div>
          ))}
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

      {/* Editable fields */}
      <div className="space-y-3">
        <Field label={locale === "ru" ? "Заголовок (RU)" : "Title (RU)"} value={r.title}
          onChange={(v) => store.updateAIField("title", v)} />
        <Field label={locale === "ru" ? "Заголовок (EN)" : "Title (EN)"} value={r.titleEn}
          onChange={(v) => store.updateAIField("titleEn", v)} />

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {locale === "ru" ? "Описание" : "Description"}
          </label>
          <textarea value={r.description}
            onChange={(e) => store.updateAIField("description", e.target.value)}
            className="w-full h-20 mt-1 p-3 rounded-xl border dark:border-white/10 border-black/10
              dark:bg-white/5 bg-black/5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {locale === "ru" ? "Цена ₽" : "Price ₽"}
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

function StepPreview() {
  const { locale } = useAppStore();
  const store = useSellStore();
  const r = store.aiResult;

  if (!r) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="text-center">
        <h2 className="text-xl font-extrabold">{locale === "ru" ? "Превью" : "Preview"}</h2>
      </div>

      <div className="rounded-2xl overflow-hidden border dark:border-white/10 border-black/10">
        {store.photos[0] && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.photos[0].dataUrl} alt="Preview" className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
            <Badge className="absolute top-2 left-2 brand-gradient text-white border-0 text-[10px]">
              <Sparkles className="h-2.5 w-2.5 mr-1" />AI
            </Badge>
          </div>
        )}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-base leading-tight">{r.title}</h3>
            <p className="text-xl font-extrabold brand-gradient-text price-tag shrink-0 ml-2">₽{r.price.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {r.tags.slice(0, 5).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[11px] rounded-full px-2 py-0.5">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {store.lat && store.lng ? `${store.lat.toFixed(2)}, ${store.lng.toFixed(2)}` : (locale === "ru" ? "Локация не определена" : "No location")}
          </div>
        </div>
      </div>

      {/* Cross-posting */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {locale === "ru" ? "Публикация" : "Publishing to"}
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Do4U", active: true },
            { name: "Avito", active: false },
            { name: "VK", active: false },
            { name: "eBay", active: false },
          ].map(p => (
            <div key={p.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              p.active ? "brand-gradient text-white border-transparent" : "dark:border-white/10 border-black/10 text-muted-foreground"
            }`}>
              {p.active && <Check className="h-3 w-3" />}
              {p.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
