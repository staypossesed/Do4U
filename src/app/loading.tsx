import { ClawLogoStatic } from "@/components/icons/claw-logo-static";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="animate-pulse">
        <ClawLogoStatic size={48} />
      </div>
    </div>
  );
}
