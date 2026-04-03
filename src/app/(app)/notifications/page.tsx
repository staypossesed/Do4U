"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import {
  Bell, BellOff, MessageCircle, Zap, MapPin,
  CheckCheck, Trash2, ShoppingBag, Clock, ChevronRight,
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

function dataString(data: Record<string, unknown> | null, key: string): string | null {
  if (!data || typeof data !== "object") return null;
  const v = data[key];
  return typeof v === "string" ? v : null;
}

export default function NotificationsPage() {
  const { locale } = useAppStore();
  const router = useRouter();
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
        (payload: { new: Record<string, unknown> }) => {
          const notif = payload.new as unknown as Notification;
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

      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
        } catch {
          /* dev */
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

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success(locale === "ru" ? "Все отмечены прочитанными" : "All marked as read");
  }

  async function clearAll() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notifications").delete().eq("user_id", user.id);

    setNotifications([]);
  }

  const iconWrap = (n: Notification) => {
    const map: Record<string, string> = {
      new_message: "bg-blue-500/15 text-blue-400",
      chat_message: "bg-sky-500/15 text-sky-400",
      listing_published: "bg-emerald-500/15 text-emerald-400",
      hot_buyer: "bg-orange-500/15 text-orange-400",
      nearby: "bg-teal-500/15 text-teal-400",
      sale: "bg-purple-500/15 text-purple-400",
    };
    const iconMap: Record<string, React.ReactNode> = {
      new_message: <MessageCircle className="h-5 w-5" />,
      chat_message: <MessageCircle className="h-5 w-5" />,
      listing_published: <ShoppingBag className="h-5 w-5" />,
      hot_buyer: <Zap className="h-5 w-5" />,
      nearby: <MapPin className="h-5 w-5" />,
      sale: <ShoppingBag className="h-5 w-5" />,
    };
    const ring = map[n.type] || "dark:bg-white/10 bg-black/10 text-muted-foreground";
    return (
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${ring}`}
      >
        {iconMap[n.type] || <Bell className="h-5 w-5" />}
      </div>
    );
  };

  const markOneRead = useCallback(
    async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [supabase],
  );

  const openNotification = useCallback(
    async (n: Notification) => {
      await markOneRead(n.id);
      const d = n.data;

      const chatId = dataString(d, "chat_id");
      if ((n.type === "chat_message" || n.type === "hot_buyer") && chatId) {
        router.push(`/chats?chat=${chatId}`);
        return;
      }

      const listingId = dataString(d, "listing_id");
      if (n.type === "listing_published" && listingId) {
        router.push(`/marketplace/${listingId}`);
        return;
      }
    },
    [markOneRead, router],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="px-4 py-6 space-y-5 pb-10">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl brand-gradient">
                <Bell className="h-5 w-5 text-white" />
              </span>
              {locale === "ru" ? "Уведомления" : "Notifications"}
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5 pl-0.5">
                {locale === "ru"
                  ? `${unreadCount} непрочитанных`
                  : `${unreadCount} unread`}
              </p>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => void clearAll()}
                aria-label={locale === "ru" ? "Очистить" : "Clear all"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            className="w-full rounded-2xl h-11 font-semibold border-orange-500/25 hover:bg-orange-500/10"
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="h-4 w-4 mr-2 text-orange-400" />
            {locale === "ru" ? "Отметить все как прочитанные" : "Mark all as read"}
          </Button>
        )}
      </div>

      {!pushEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-2xl brand-gradient"
        >
          <BellOff className="h-5 w-5 text-white shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">
              {locale === "ru" ? "Включи push-уведомления" : "Enable push notifications"}
            </p>
            <p className="text-[10px] text-white/70">
              {locale === "ru" ? "Не пропускай сообщения от покупателей" : "Never miss a buyer message"}
            </p>
          </div>
          <Button onClick={enablePush} size="sm" variant="secondary" className="rounded-full text-xs shrink-0">
            {locale === "ru" ? "Включить" : "Enable"}
          </Button>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl dark:bg-white/5 bg-black/5 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed dark:border-white/10 border-black/10">
          <Bell className="h-14 w-14 mx-auto mb-4 text-muted-foreground/15" />
          <p className="text-sm font-medium text-muted-foreground">
            {locale === "ru" ? "Пока тихо — Do4U пришлёт сюда важное" : "All quiet — Do4U will surface what matters"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {notifications.map((n, index) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <button
                  type="button"
                  onClick={() => void openNotification(n)}
                  className={`w-full text-left rounded-2xl border transition-all active:scale-[0.99] flex gap-3 p-3.5
                    ${n.read
                      ? "dark:bg-white/[0.03] bg-black/[0.02] dark:border-white/5 border-black/5"
                      : "dark:bg-white/[0.07] bg-white dark:border-orange-500/25 border-orange-200/50 shadow-sm shadow-orange-500/10"
                    }`}
                >
                  {iconWrap(n)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold leading-snug ${n.read ? "text-muted-foreground" : ""}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5 ring-2 ring-orange-500/30" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground font-medium">
                      <Clock className="h-3 w-3 shrink-0 opacity-70" />
                      {formatRelativeTime(n.created_at)}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 self-center" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
