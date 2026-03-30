"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClawLogo } from "@/components/icons/claw-logo";
import { fadeUp, staggerChildren as stagger } from "@/lib/motion";
import { ArrowRight, Mic, Camera, Zap, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background overflow-hidden relative">

      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-pink-500/8 blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 flex-1 flex flex-col px-5 pt-16 pb-10 max-w-lg mx-auto w-full"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Logo + badge */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full claw-gradient blur-xl opacity-40 scale-150" />
            <ClawLogo size={72} animated />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10">
            <Star className="h-3 w-3 text-orange-400 fill-orange-400" />
            <span className="text-xs text-orange-400 font-medium">Sell4U • Zero комиссий</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div variants={fadeUp} className="mt-6 text-center space-y-2">
          <h1 className="text-[2.6rem] font-extrabold leading-[1.1] tracking-tight">
            <span className="claw-gradient-text">Claw</span>
            <span className="dark:text-white text-gray-900">Everything</span>
          </h1>
          <p className="text-lg dark:text-gray-300 text-gray-600 leading-snug">
            Продаёшь — <strong className="dark:text-white text-gray-900">Claw делает всё</strong><br />
            за тебя 24/7
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div variants={stagger} className="mt-10 space-y-3">
          {[
            {
              icon: Mic,
              color: "from-orange-500 to-rose-500",
              bg: "bg-orange-500/10 dark:bg-orange-500/10",
              title: "Расскажи голосом 10 сек",
              desc: "AI создаёт идеальное описание на RU + EN",
            },
            {
              icon: Camera,
              color: "from-rose-500 to-purple-600",
              bg: "bg-rose-500/10 dark:bg-rose-500/10",
              title: "4–8 фото с AI-улучшением",
              desc: "Авто убирает фон, добавляет свет, 360°",
            },
            {
              icon: Zap,
              color: "from-purple-600 to-blue-500",
              bg: "bg-purple-600/10 dark:bg-purple-600/10",
              title: "Claw ведёт чаты за тебя",
              desc: "Авто-ответы, горячие покупатели, эскроу",
            },
            {
              icon: ShieldCheck,
              color: "from-blue-500 to-teal-500",
              bg: "bg-blue-500/10 dark:bg-blue-500/10",
              title: "0% комиссии навсегда",
              desc: "Avito, VK, eBay — готовые шаблоны",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              className={`flex items-center gap-4 p-4 rounded-2xl border dark:border-white/5 border-black/5 ${f.bg}`}
            >
              <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} shrink-0 shadow-lg`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{f.title}</p>
                <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="mt-8 space-y-3">
          <Button variant="claw" size="xl" className="w-full rounded-2xl font-bold glow-orange" asChild>
            <Link href="/auth">
              Начать продавать бесплатно
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-center text-xs dark:text-gray-500 text-gray-400">
            Без карты · Без комиссий · Только одежда, электроника, книги и мебель
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
