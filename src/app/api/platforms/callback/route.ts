import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/platforms/registry";
import type { PlatformSlug } from "@/lib/platforms/types";

/**
 * OAuth callback for all platform connections.
 * URL: /api/platforms/callback?platform=avito&code=...&state=userId
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform") as PlatformSlug | null;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!platform || !code) {
    return NextResponse.redirect(
      new URL("/profile?platform_error=missing_params", req.url),
    );
  }

  const adapter = getAdapter(platform);
  if (!adapter) {
    return NextResponse.redirect(
      new URL("/profile?platform_error=unknown_platform", req.url),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/callback?platform=${platform}`;

  try {
    const tokens = await adapter.exchangeCode(code, redirectUri);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await supabase.from("platform_connections").upsert(
      {
        user_id: user.id,
        platform_slug: platform,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        platform_user_id: tokens.platform_user_id,
        platform_user_name: tokens.platform_user_name,
        extra: tokens.extra ?? {},
        status: "connected",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform_slug" },
    );

    return NextResponse.redirect(
      new URL(`/profile?platform_connected=${platform}`, req.url),
    );
  } catch (e) {
    console.error(`Platform OAuth error (${platform}):`, e);
    return NextResponse.redirect(
      new URL(
        `/profile?platform_error=${encodeURIComponent(
          e instanceof Error ? e.message : "auth_failed",
        )}`,
        req.url,
      ),
    );
  }
}
