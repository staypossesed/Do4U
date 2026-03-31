// Supabase Edge Function: country/city/lat/lng from caller IP via ipapi.co
// Deploy: supabase functions deploy geo-from-ip --no-verify-jwt
// Optional secret: IPAPI_TOKEN for paid tier (append ?key= to URL)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface IpApiResponse {
  country_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  error?: boolean;
  reason?: string;
}

function clientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = Deno.env.get("IPAPI_TOKEN");
  const ip = clientIp(req);
  const base =
    ip && ip !== "127.0.0.1" && !ip.startsWith("192.168.")
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";
  const url = token ? `${base}?key=${encodeURIComponent(token)}` : base;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `ipapi HTTP ${res.status}` }),
        { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }
    const data = (await res.json()) as IpApiResponse;
    if (data.error || !data.country_code) {
      return new Response(
        JSON.stringify({ error: data.reason || "ipapi error", raw: data }),
        { status: 422, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const body = {
      country_code: String(data.country_code).toUpperCase().slice(0, 2),
      city: data.city ?? null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      source: "ip" as const,
    };

    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
