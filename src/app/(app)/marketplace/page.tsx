"use client";

import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { useAppStore } from "@/lib/store";

// TODO: Этап 4 — Внутренний маркетплейс с фильтрами по расстоянию

export default function MarketplacePage() {
  const { locale } = useAppStore();

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold mb-4">
        {locale === "ru" ? "Маркетплейс" : "Marketplace"}
      </h1>
      <Card className="p-8 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {locale === "ru"
            ? "Маркетплейс скоро откроется. Станьте первым продавцом!"
            : "Marketplace coming soon. Be the first seller!"}
        </p>
      </Card>
    </div>
  );
}
