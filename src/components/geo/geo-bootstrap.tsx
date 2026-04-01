"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * On first authenticated visit, fills users.country_code, city, latitude, longitude
 * using optional GPS + server-side IP/geo merge (/api/geo/resolve).
 *
 * If public.users row is missing (e.g. no auth trigger), inserts it with geo fields
 * so listings FK and marketplace country work.
 */
export function GeoBootstrap() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("users")
        .select("id, country_code")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.country_code || cancelled) return;

      let latitude: number | undefined;
      let longitude: number | undefined;
      let geoDeniedOrFailed = false;

      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          geoDeniedOrFailed = true;
        }
      } else {
        geoDeniedOrFailed = true;
      }

      if (cancelled) return;

      if (
        geoDeniedOrFailed &&
        typeof window !== "undefined" &&
        !sessionStorage.getItem("do4u_geo_hint_shown")
      ) {
        sessionStorage.setItem("do4u_geo_hint_shown", "1");
        toast.message("Регион по IP", {
          description:
            "Точная геолокация недоступна или отклонена — подставляем страну и город по сети. Для ленты «Рядом» разрешите доступ в настройках браузера или укажите страну в профиле.",
          duration: 6500,
        });
      }

      const res = await fetch("/api/geo/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          latitude != null && longitude != null ? { latitude, longitude } : {},
        ),
      });

      const payload = (await res.json()) as {
        country_code?: string;
        city?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        error?: string;
      };

      if (!res.ok || !payload.country_code || cancelled) return;

      const lat = payload.latitude ?? latitude ?? null;
      const lng = payload.longitude ?? longitude ?? null;
      const location =
        lat != null && lng != null ? `POINT(${lng} ${lat})` : null;

      const geoPayload = {
        country_code: payload.country_code,
        city: payload.city ?? null,
        latitude: lat,
        longitude: lng,
        ...(location ? { location } : {}),
        updated_at: new Date().toISOString(),
      };

      if (!profile) {
        const { error: insErr } = await supabase.from("users").insert({
          id: user.id,
          email: user.email ?? "",
          name:
            (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
            (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
            null,
          avatar_url:
            typeof user.user_metadata?.avatar_url === "string"
              ? user.user_metadata.avatar_url
              : null,
          ...geoPayload,
        });
        if (insErr?.code === "23505") {
          await supabase.from("users").update(geoPayload).eq("id", user.id);
        }
      } else {
        await supabase.from("users").update(geoPayload).eq("id", user.id);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
