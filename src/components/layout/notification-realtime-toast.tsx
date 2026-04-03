"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Subscribes to new rows in `notifications` for the signed-in user and shows Sonner toasts.
 * Requires Realtime enabled on `notifications` in Supabase.
 */
export function NotificationRealtimeToast() {
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const channelRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null };

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const ch = supabase
        .channel(`notifications-toast:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            const row = payload.new as { id?: string; title?: string; message?: string };
            if (!row?.id || seenRef.current.has(row.id)) return;
            seenRef.current.add(row.id);
            toast(row.title ?? "Do4U", {
              description: row.message ?? "",
              duration: 6500,
            });
          },
        )
        .subscribe();
      if (!cancelled) channelRef.current = ch;
    })();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return null;
}
