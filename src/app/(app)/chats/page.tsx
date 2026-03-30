"use client";

import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

// TODO: Этап 4 — Realtime чаты с Supabase Realtime + авто-ответы Claw

export default function ChatsPage() {
  const { locale } = useAppStore();

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-4">
        {locale === "ru" ? "Чаты" : "Chats"}
      </h1>
      <Card className="p-8 text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "Пока нет сообщений. Claw начнёт отвечать, когда появятся покупатели."
            : "No messages yet. Claw will start responding when buyers appear."}
        </p>
      </Card>
    </div>
  );
}
