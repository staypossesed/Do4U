"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Do4ULogo } from "@/components/icons/do4u-logo";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mail, Chrome, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup" | "magic";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        toast.success("Ссылка отправлена на почту!");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        toast.success("Проверьте почту для подтверждения!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>

        <div className="flex flex-col items-center gap-3">
          <Do4ULogo size={48} />
          <h1 className="text-2xl font-bold">
            <span className="brand-gradient-text">Do4U</span>
          </h1>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-base">
              {mode === "signin" && "Вход в аккаунт"}
              {mode === "signup" && "Создание аккаунта"}
              {mode === "magic" && "Вход по ссылке"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Войти через Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
              </div>
            </div>

            {/* Email form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleEmailAuth}
                className="space-y-3"
              >
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                {mode !== "magic" && (
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                  />
                )}
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : mode === "magic" ? (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Отправить ссылку
                    </>
                  ) : mode === "signup" ? (
                    "Зарегистрироваться"
                  ) : (
                    "Войти"
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            {/* Mode switchers */}
            <div className="flex flex-col gap-1 text-center">
              {mode === "signin" && (
                <>
                  <button
                    onClick={() => setMode("magic")}
                    className="text-xs text-primary hover:underline"
                  >
                    Войти по ссылке на почту
                  </button>
                  <button
                    onClick={() => setMode("signup")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Нет аккаунта? Зарегистрироваться
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button
                  onClick={() => setMode("signin")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Уже есть аккаунт? Войти
                </button>
              )}
              {mode === "magic" && (
                <button
                  onClick={() => setMode("signin")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Войти с паролем
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
