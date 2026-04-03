"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSellStore } from "@/lib/store-sell";
import { toast } from "sonner";
import {
  Check, Copy, PartyPopper, MessageCircle, Bell, Sparkles,
  ExternalLink, PlusCircle, LayoutList, CheckCircle2, XCircle,
  Link2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 88 }, (_, i) => ({
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
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[100]" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-[2px] top-[-12%] shadow-sm"
          style={{ left: `${p.x}%`, width: p.w, height: p.h, background: p.color }}
          initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: ["0vh", "108vh"], opacity: [1, 1, 0], rotate: p.rot, scale: [1, 0.85, 0.6] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
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
  const { listingId, templates, platformResults } = pp;
  const hasAutoPublish = platformResults && platformResults.length > 0;
  const autoSucceeded = platformResults?.filter((r) => r.success) ?? [];
  const autoFailed = platformResults?.filter((r) => !r.success) ?? [];

  async function copyText(slug: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlug(slug);
      toast.success(locale === "ru" ? "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E" : "Copied");
      setTimeout(() => setCopiedSlug(null), 2200);
    } catch {
      toast.error(locale === "ru" ? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C" : "Copy failed");
    }
  }

  function viewListing() {
    useSellStore.getState().reset();
    router.push(`/marketplace/${listingId}`);
  }

  function goMyListings() {
    useSellStore.getState().reset();
    router.push("/profile/listings");
  }

  function createAnother() {
    useSellStore.getState().reset();
    router.push("/sell/new");
  }

  const heroText = hasAutoPublish
    ? locale === "ru"
      ? `Do4U \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043B \u0442\u0432\u043E\u0451 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 ${autoSucceeded.length} \u043F\u043B\u043E\u0449\u0430\u0434\u043A${autoSucceeded.length === 1 ? "\u0435" : "\u0430\u0445"}!`
      : `Do4U published your listing on ${autoSucceeded.length} platform${autoSucceeded.length === 1 ? "" : "s"}!`
    : locale === "ru"
      ? "Do4U \u043D\u0430\u0447\u0430\u043B \u0440\u0430\u0431\u043E\u0442\u0443 \u043D\u0430\u0434 \u0442\u0432\u043E\u0438\u043C \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435\u043C!"
      : "Do4U is working on your listing!";

  const heroSub = hasAutoPublish
    ? locale === "ru"
      ? "\u041F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u0438 \u0443\u0436\u0435 \u0432\u0438\u0434\u044F\u0442 \u0435\u0433\u043E. \u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u0434\u0443\u0442 \u0432 \u0435\u0434\u0438\u043D\u044B\u0439 \u0447\u0430\u0442 \u2014 \u0442\u0435\u0431\u0435 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0443\u0436\u043D\u043E \u0434\u0435\u043B\u0430\u0442\u044C."
      : "Buyers can already see it. Messages will land in your unified inbox \u2014 nothing to do on your end."
    : locale === "ru"
      ? "\u041E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u043C \u043C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441\u0435. \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0438 \u0432 \u041F\u0440\u043E\u0444\u0438\u043B\u0435, \u0447\u0442\u043E\u0431\u044B Do4U \u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043B \u0432\u0435\u0437\u0434\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438."
      : "Listed on our marketplace. Connect platforms in Profile so Do4U auto-publishes everywhere.";

  return (
    <div className="relative flex flex-col min-h-dvh px-4 pb-10 pt-6 space-y-6 max-w-lg mx-auto w-full overflow-hidden">
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        animate={{
          background: [
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(249,115,22,0.22), transparent 55%)",
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(168,85,247,0.2), transparent 55%)",
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(34,197,94,0.16), transparent 55%)",
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(249,115,22,0.22), transparent 55%)",
          ],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
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
          <div className="relative w-full h-full rounded-full brand-gradient flex items-center justify-center shadow-xl shadow-orange-500/30 ring-4 ring-white/20 dark:ring-white/10">
            <motion.div
              initial={{ rotate: -25, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            >
              <PartyPopper className="h-11 w-11 text-white" strokeWidth={2.25} />
            </motion.div>
          </div>
          <motion.div
            className="absolute -right-1 -bottom-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-background flex items-center justify-center shadow-lg"
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
          {heroText}
        </motion.h1>

        <motion.p
          className="text-sm text-muted-foreground leading-relaxed px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.45 }}
        >
          {heroSub}
        </motion.p>
      </motion.div>

      {/* Auto-publish results per platform */}
      {hasAutoPublish && (
        <motion.div
          className="space-y-2 relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
        >
          {platformResults!.map((r) => (
            <div
              key={r.platform_slug}
              className={`flex items-center gap-3 rounded-xl p-3 border ${
                r.success
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              {r.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{r.platform_slug}</p>
                {r.external_url && (
                  <a
                    href={r.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline truncate block"
                  >
                    {r.external_url}
                  </a>
                )}
                {r.error && (
                  <p className="text-xs text-red-400 truncate">{r.error}</p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* If no platforms connected — show CTA */}
      {!hasAutoPublish && (
        <motion.div
          className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3 relative z-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-orange-400" />
            <span className="text-sm font-bold">
              {locale === "ru" ? "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0438" : "Connect platforms"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {locale === "ru"
              ? "\u0417\u0430\u0439\u0434\u0438 \u0432 \u041F\u0440\u043E\u0444\u0438\u043B\u044C \u2192 \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D\u043D\u044B\u0435 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0438 \u0438 \u043F\u0440\u0438\u0432\u044F\u0436\u0438 \u0410\u0432\u0438\u0442\u043E, VK, eBay \u0438\u043B\u0438 OLX. \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435 Do4U \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442 \u0441\u0430\u043C."
              : "Go to Profile \u2192 Connected platforms and link Avito, VK, eBay, or OLX. Next listing, Do4U publishes automatically."}
          </p>
          <Button asChild variant="brand" size="sm" className="rounded-xl font-bold">
            <Link href="/profile">
              {locale === "ru" ? "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u041F\u0440\u043E\u0444\u0438\u043B\u044C" : "Go to Profile"}
            </Link>
          </Button>
        </motion.div>
      )}

      {/* What's next — messages & notifications */}
      <motion.div
        className="rounded-2xl border dark:border-white/10 border-black/10 dark:bg-white/[0.04] bg-black/[0.03] p-4 space-y-3 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.45 }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          {locale === "ru" ? "\u0427\u0442\u043E \u0434\u0430\u043B\u044C\u0448\u0435" : "What\u2019s next"}
        </p>
        <ul className="space-y-3">
          <li className="flex gap-3 text-left">
            <div className="shrink-0 w-9 h-9 rounded-xl dark:bg-white/10 bg-black/5 flex items-center justify-center border dark:border-white/10 border-black/10">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug">
                {locale === "ru" ? "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043E\u0442 \u043F\u043E\u043A\u0443\u043F\u0430\u0442\u0435\u043B\u0435\u0439" : "Buyer messages"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {locale === "ru"
                  ? "\u0412\u0441\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u2014 \u0441 \u043F\u043B\u043E\u0449\u0430\u0434\u043E\u043A \u0438 \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0435\u0433\u043E \u043C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441\u0430 \u2014 \u043F\u0440\u0438\u0445\u043E\u0434\u044F\u0442 \u0432 \u043E\u0434\u0438\u043D \u0447\u0430\u0442. Do4U \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u0437\u0430 \u0442\u0435\u0431\u044F."
                  : "All messages \u2014 from platforms and our marketplace \u2014 land in one chat. Do4U can reply for you."}
              </p>
            </div>
          </li>
          <li className="flex gap-3 text-left">
            <div className="shrink-0 w-9 h-9 rounded-xl dark:bg-white/10 bg-black/5 flex items-center justify-center border dark:border-white/10 border-black/10">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug">
                {locale === "ru" ? "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F" : "Notifications"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {locale === "ru"
                  ? "\u041C\u044B \u043D\u0430\u043F\u0438\u0448\u0435\u043C, \u043A\u043E\u0433\u0434\u0430 \u043F\u0440\u0438\u0434\u0451\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0438\u043D\u0442\u0435\u0440\u0435\u0441. \u041A\u043E\u043B\u043E\u043A\u043E\u043B\u044C\u0447\u0438\u043A \u2014 \u0432 \u00AB\u0427\u0430\u0442\u044B \u2192 \u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F\u00BB."
                  : "We\u2019ll let you know about new messages and interest. Bell icon: Chats \u2192 Notifications."}
              </p>
            </div>
          </li>
        </ul>
      </motion.div>

      {/* Fallback template copy — only for unconnected platforms */}
      {templates.length > 0 && !hasAutoPublish && (
        <motion.div
          className="space-y-2 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <p className="text-xs font-bold text-muted-foreground px-1">
            {locale === "ru" ? "\u0420\u0443\u0447\u043D\u043E\u0435 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 (\u043F\u043E\u043A\u0430 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0438 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u044B)" : "Manual copy (while platforms not connected)"}
          </p>
          {templates.map((t) => (
            <Button
              key={t.slug}
              type="button"
              variant="outline"
              className="w-full rounded-2xl h-auto py-3.5 px-4 justify-between gap-3 border dark:border-white/10"
              onClick={() => copyText(t.slug, t.text)}
            >
              <span className="flex items-center gap-2 text-left font-bold text-sm">
                <Copy className="h-4 w-4 shrink-0 opacity-70" />
                {locale === "ru" ? `\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u043B\u044F ${t.platformName}` : `Copy for ${t.platformName}`}
              </span>
              {copiedSlug === t.slug ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : null}
            </Button>
          ))}
        </motion.div>
      )}

      <motion.div
        className="space-y-2.5 pt-2 relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.45 }}
      >
        <Button
          variant="brand"
          className="w-full rounded-2xl h-14 font-bold text-base glow-orange shadow-lg shadow-orange-500/30 gap-2"
          onClick={viewListing}
        >
          <ExternalLink className="h-4 w-4 shrink-0 opacity-90" />
          {locale === "ru" ? "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435" : "View listing"}
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-2xl h-12 font-semibold border dark:border-white/15 border-black/15 gap-2"
          onClick={goMyListings}
        >
          <LayoutList className="h-4 w-4 shrink-0" />
          {locale === "ru" ? "\u041C\u043E\u0438 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u044F" : "My listings"}
        </Button>
        <Button
          variant="secondary"
          className="w-full rounded-2xl h-12 font-semibold gap-2 dark:bg-white/10 bg-black/5"
          onClick={createAnother}
        >
          <PlusCircle className="h-4 w-4 shrink-0" />
          {locale === "ru" ? "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0435\u0449\u0451 \u043E\u0434\u043D\u043E \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0435" : "Create another listing"}
        </Button>
        <Button variant="ghost" className="w-full rounded-2xl h-11 font-medium text-muted-foreground" onClick={onGoHome}>
          {locale === "ru" ? "\u041D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E" : "Home"}
        </Button>
      </motion.div>
    </div>
  );
}
