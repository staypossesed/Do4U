"use client";

import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useAppStore } from "@/lib/store";

// TODO: Этап 5 — Push-уведомления с Web Push + Supabase Realtime

export default function NotificationsPage() {
  const { locale } = useAppStore();

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-4">
        {locale === "ru" ? "Уведомления" : "Notifications"}
      </h1>
      <Card className="p-8 text-center">
        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "Нет новых уведомлений"
            : "No new notifications"}
        </p>
      </Card>
    </div>
  );
}
