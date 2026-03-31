import { Do4ULogoStatic } from "@/components/icons/do4u-logo-static";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="animate-pulse">
        <Do4ULogoStatic size={48} />
      </div>
    </div>
  );
}
