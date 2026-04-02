"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import {
  Bell, BellOff, MessageCircle, Zap, MapPin,
  CheckCheck, Trash2, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { locale } = useAppStore();
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications((data as Notification[]) ?? []);
      setLoading(false);

      if ("Notification" in window) {
        setPushEnabled(Notification.permission === "granted");
      }
    }
    load();
  }, [supabase]);

  // Realtime: only this user's rows (filter requires Replication on notifications)
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`notifications-realtime:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev]);
          if (pushEnabled && "Notification" in window) {
            new window.Notification(notif.title, { body: notif.message });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pushEnabled, supabase, currentUserId]);

  async function enablePush() {
    if (!("Notification" in window)) {
      toast.error(locale === "ru" ? "Push не поддерживается" : "Push not supported");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPushEnabled(true);
      toast.success(locale === "ru" ? "Push-уведомления включены!" : "Push notifications enabled!");

      // Register service worker
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
        } catch {
          // SW registration may fail in dev
        }
      }
    }
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success(locale === "ru" ? "Все прочитано" : "All read");
  }

  async function clearAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    setNotifications([]);
  }

  const iconMap: Record<string, React.ReactNode> = {
    new_message: <MessageCircle className="h-4 w-4 text-blue-400" />,
    chat_message: <MessageCircle className="h-4 w-4 text-sky-400" />,
    listing_published: <ShoppingBag className="h-4 w-4 text-emerald-400" />,
    hot_buyer: <Zap className="h-4 w-4 text-orange-400" />,
    nearby: <MapPin className="h-4 w-4 text-emerald-400" />,
    sale: <ShoppingBag className="h-4 w-4 text-purple-400" />,
  };

  async function markOneRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {locale === "ru" ? "Уведомления" : "Notifications"}
        </h1>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={markAllRead}>
                <CheckCheck className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {!pushEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-2xl brand-gradient"
        >
          <BellOff className="h-5 w-5 text-white shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-white">
              {locale === "ru" ? "Включи push-уведомления" : "Enable push notifications"}
            </p>
            <p className="text-[10px] text-white/70">
              {locale === "ru" ? "Узнавай о горячих покупателях мгновенно" : "Know about hot buyers instantly"}
            </p>
          </div>
          <Button onClick={enablePush} size="sm" variant="secondary" className="rounded-full text-xs shrink-0">
            {locale === "ru" ? "Включить" : "Enable"}
          </Button>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl dark:bg-white/5 bg-black/5 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            {locale === "ru" ? "Нет уведомлений" : "No notifications"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.button
                type="button"
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => void markOneRead(n.id)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
                  n.read
                    ? "dark:bg-white/3 bg-black/3 dark:border-white/5 border-black/5"
                    : "dark:bg-white/5 bg-black/5 dark:border-white/10 border-black/10"
                }`}
              >
                <div className="w-8 h-8 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center shrink-0 mt-0.5">
                  {iconMap[n.type] || <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? "" : "text-muted-foreground"}`}>{n.title}</p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
