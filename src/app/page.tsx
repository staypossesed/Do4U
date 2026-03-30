"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClawLogo } from "@/components/icons/claw-logo";
import { ArrowRight, Sparkles, Camera, MessageCircle, Zap } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {/* Logo */}
        <motion.div variants={fadeUp}>
          <ClawLogo size={72} animated />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="mt-6 text-4xl font-extrabold tracking-tight"
        >
          <span className="claw-gradient-text">Claw</span>Everything
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          className="mt-3 text-lg text-muted-foreground"
        >
          Продавай одним голосовым сообщением.
          <br />
          <span className="font-semibold text-foreground">
            Claw делает ВСЁ за тебя.
          </span>
        </motion.p>

        {/* Features */}
        <motion.div variants={fadeUp} className="mt-8 grid gap-3 w-full">
          {[
            {
              icon: Camera,
              title: "Сфотографируй",
              desc: "AI подскажет ракурсы и улучшит фото",
            },
            {
              icon: Sparkles,
              title: "Расскажи голосом",
              desc: "10 секунд — и описание готово",
            },
            {
              icon: MessageCircle,
              title: "Claw ведёт чаты",
              desc: "Авто-ответы, отсев троллей, 24/7",
            },
            {
              icon: Zap,
              title: "Мгновенная продажа",
              desc: "GPS-встреча, эскроу, автоматический отзыв",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg claw-gradient shrink-0">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} className="mt-8 w-full space-y-3">
          <Button variant="claw" size="xl" className="w-full" asChild>
            <Link href="/auth">
              Начать продавать
              <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Бесплатно · 0% комиссии на внутреннем маркетплейсе
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
