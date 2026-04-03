import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

function readSupabasePublicEnv(): { url: string; anon: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const rawAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !rawAnon) return null;
  try {
    new URL(rawUrl);
  } catch {
    return null;
  }
  return { url: rawUrl, anon: rawAnon };
}

function configErrorResponse(): NextResponse {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Do4U — configuration</title></head>
<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem">
<h1>Supabase environment missing</h1>
<p>In <strong>Vercel → Project → Settings → Environment Variables</strong>, add:</p>
<ul>
<li><code>NEXT_PUBLIC_SUPABASE_URL</code></li>
<li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
</ul>
<p>Redeploy after saving. See <code>.env.local.example</code> in the repo.</p>
</body></html>`;
  return new NextResponse(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const AUTH_GET_USER_TIMEOUT_MS = 8000;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/auth" || pathname.startsWith("/auth/");
  const isPublicPage = pathname === "/" || isAuthPage || pathname === "/offline";

  const env = readSupabasePublicEnv();
  if (!env) {
    if (isPublicPage) {
      return NextResponse.next({ request });
    }
    return configErrorResponse();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null as Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), AUTH_GET_USER_TIMEOUT_MS),
      ),
    ]);
    if (result === "timeout") {
      console.warn(
        "[middleware] supabase.auth.getUser() timed out — check network / Supabase URL. Treating as signed out.",
      );
      user = null;
    } else {
      user = result.data.user;
    }
  } catch (e) {
    console.error("[middleware] supabase.auth.getUser failed:", e);
    user = null;
  }

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/auth") {
    const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
    const url = request.nextUrl.clone();
    url.pathname = next;
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
