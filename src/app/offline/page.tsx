import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
      <WifiOff className="h-16 w-16 text-muted-foreground/30" />
      <h1 className="text-xl font-extrabold">Нет подключения</h1>
      <p className="text-sm text-muted-foreground text-center">
        Проверь интернет-соединение и попробуй снова.
      </p>
    </div>
  );
}
