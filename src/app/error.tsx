"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Что-то пошло не так</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{error.message}</p>
      <Button onClick={reset} variant="outline">
        Попробовать снова
      </Button>
    </div>
  );
}
