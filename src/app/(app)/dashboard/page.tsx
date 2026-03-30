"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { getTranslations } from "@/lib/i18n";
import {
  Package,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tab = "sell" | "buy";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function DashboardPage() {
  const { locale } = useAppStore();
  const t = getTranslations(locale);
  const [activeTab, setActiveTab] = useState<Tab>("sell");

  return (
    <motion.div
      className="px-4 py-6 space-y-6"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      {/* Tab Switcher */}
      <motion.div variants={fadeUp} className="flex gap-2 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setActiveTab("sell")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "sell"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {t.sell.title}
        </button>
        <button
          onClick={() => setActiveTab("buy")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
            activeTab === "buy"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {t.buy.title}
          <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
            {t.buy.comingSoon}
          </Badge>
        </button>
      </motion.div>

      {activeTab === "sell" ? <SellTab /> : <BuyTab />}
    </motion.div>
  );
}

function SellTab() {
  const { locale } = useAppStore();
  const t = getTranslations(locale);

  return (
    <>
      {/* Hero CTA */}
      <motion.div variants={fadeUp}>
        <Link href="/sell/new">
          <Card className="overflow-hidden border-0 claw-gradient p-[1px] rounded-2xl">
            <CardContent className="bg-background rounded-[calc(1rem-1px)] p-5 flex items-center gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1">{t.sell.newListing}</h2>
                <p className="text-sm text-muted-foreground">
                  {t.sell.subtitle}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl claw-gradient">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Package className="h-5 w-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">{t.dashboard.activeListings}</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">{t.dashboard.soldListings}</p>
        </Card>
        <Card className="p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
          <p className="text-2xl font-bold">₽0</p>
          <p className="text-xs text-muted-foreground">{t.dashboard.earnings}</p>
        </Card>
      </motion.div>

      {/* How it works */}
      <motion.div variants={fadeUp} className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {locale === "ru" ? "Как работает Sell4U" : "How Sell4U Works"}
        </h3>
        {[
          {
            step: "1",
            title: locale === "ru" ? "Расскажи голосом" : "Tell by voice",
            desc:
              locale === "ru"
                ? "Опиши товар за 10–15 секунд"
                : "Describe the item in 10-15 seconds",
          },
          {
            step: "2",
            title: locale === "ru" ? "Сфотографируй" : "Take photos",
            desc:
              locale === "ru"
                ? "AI подскажет лучшие ракурсы"
                : "AI will suggest the best angles",
          },
          {
            step: "3",
            title: locale === "ru" ? "Claw сделает всё" : "Claw does the rest",
            desc:
              locale === "ru"
                ? "Описание, цена, публикация, чаты"
                : "Description, price, publishing, chats",
          },
        ].map((item) => (
          <Card key={item.step} className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full claw-gradient text-white text-sm font-bold shrink-0">
              {item.step}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Card>
        ))}
      </motion.div>

      {/* Recent listings placeholder */}
      <motion.div variants={fadeUp} className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {locale === "ru" ? "Мои объявления" : "My Listings"}
        </h3>
        <Card className="p-8 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {locale === "ru"
              ? "Пока пусто. Создай первое объявление!"
              : "Nothing here yet. Create your first listing!"}
          </p>
          <Button variant="claw" size="lg" className="mt-4" asChild>
            <Link href="/sell/new">{t.sell.newListing}</Link>
          </Button>
        </Card>
      </motion.div>
    </>
  );
}

function BuyTab() {
  const { locale } = useAppStore();
  const t = getTranslations(locale);

  return (
    <motion.div variants={fadeUp}>
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">{t.buy.title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {t.buy.subtitle}
        </p>
        <Badge variant="claw" className="mt-4">
          {t.buy.comingSoon}
        </Badge>
      </Card>
    </motion.div>
  );
}
