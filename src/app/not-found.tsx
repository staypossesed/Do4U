import { Button } from "@/components/ui/button";
import { ClawLogoStatic } from "@/components/icons/claw-logo-static";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 p-6 text-center">
      <ClawLogoStatic size={48} />
      <h2 className="text-xl font-semibold">404 — Страница не найдена</h2>
      <p className="text-sm text-muted-foreground">
        Claw не смог найти эту страницу
      </p>
      <Button variant="claw" asChild>
        <Link href="/dashboard">На главную</Link>
      </Button>
    </div>
  );
}
