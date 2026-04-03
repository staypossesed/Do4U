import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { GeoBootstrap } from "@/components/geo/geo-bootstrap";
import { AppMainShell } from "@/components/layout/app-main-shell";
import { NotificationRealtimeToast } from "@/components/layout/notification-realtime-toast";
import { FirstTimeOnboardingGate } from "@/components/onboarding/FirstTimeOnboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <FirstTimeOnboardingGate />
      <GeoBootstrap />
      <NotificationRealtimeToast />
      <Header />
      <AppMainShell>{children}</AppMainShell>
      <BottomNav />
    </div>
  );
}
