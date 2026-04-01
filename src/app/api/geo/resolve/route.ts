import { NextRequest, NextResponse } from "next/server";

/**
 * Merges browser geolocation (optional) with IP-based geo (ipapi.co).
 * Called on first app load to fill users.country_code, city, lat, lng.
 */

interface IpApiResponse {
  country_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
}

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const ip = vercel.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip");
}

async function fetchIpApi(ip: string | null): Promise<IpApiResponse | null> {
  const key = process.env.IPAPI_TOKEN;
  const base =
    ip && ip !== "127.0.0.1" && !ip.startsWith("192.168.") && !ip.startsWith("10.")
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";
  const path = key ? `${base}?key=${encodeURIComponent(key)}` : base;

  const res = await fetch(path, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return (await res.json()) as IpApiResponse;
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ country_code: string | null; city: string | null }> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Do4U/1.0 (https://github.com/staypossesed/Do4U)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return { country_code: null, city: null };

  const data = (await res.json()) as {
    address?: { country_code?: string; city?: string; town?: string; village?: string; municipality?: string };
  };
  const cc = data.address?.country_code?.toUpperCase() ?? null;
  const city =
    data.address?.city ??
    data.address?.town ??
    data.address?.village ??
    data.address?.municipality ??
    null;
  return { country_code: cc, city };
}

export async function POST(request: NextRequest) {
  try {
    let bodyLat: number | undefined;
    let bodyLng: number | undefined;
    try {
      const body = (await request.json()) as { latitude?: number; longitude?: number };
      if (typeof body.latitude === "number" && typeof body.longitude === "number") {
        bodyLat = body.latitude;
        bodyLng = body.longitude;
      }
    } catch {
      /* empty body OK */
    }

    const ip = getClientIp(request);
    const ipData = await fetchIpApi(ip);

    let country_code: string | null = null;
    let city: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;
    const sources: string[] = [];

    if (ipData && !ipData.error && ipData.country_code) {
      country_code = String(ipData.country_code).toUpperCase().slice(0, 2);
      city = ipData.city ?? null;
      latitude = typeof ipData.latitude === "number" ? ipData.latitude : null;
      longitude = typeof ipData.longitude === "number" ? ipData.longitude : null;
      sources.push("ip");
    }

    if (bodyLat != null && bodyLng != null) {
      latitude = bodyLat;
      longitude = bodyLng;
      sources.push("gps");

      const rev = await reverseGeocode(bodyLat, bodyLng);
      if (rev.country_code) {
        country_code = rev.country_code;
        sources.push("nominatim");
      }
      if (rev.city) city = rev.city;
    }

    if (!country_code) {
      return NextResponse.json(
        { error: "Could not determine country", sources },
        { status: 422 },
      );
    }

    return NextResponse.json({
      country_code,
      city,
      latitude,
      longitude,
      sources,
    });
  } catch (e) {
    console.error("geo/resolve:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Geo resolve failed" },
      { status: 500 },
    );
  }
}
