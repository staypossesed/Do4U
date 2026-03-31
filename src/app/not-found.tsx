import { Button } from "@/components/ui/button";
import { Do4ULogoStatic } from "@/components/icons/do4u-logo-static";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 p-6 text-center">
      <Do4ULogoStatic size={48} />
      <h2 className="text-xl font-semibold">404 — Страница не найдена</h2>
      <p className="text-sm text-muted-foreground">
        Do4U не нашёл эту страницу
      </p>
      <Button variant="brand" asChild>
        <Link href="/dashboard">На главную</Link>
      </Button>
    </div>
  );
}
