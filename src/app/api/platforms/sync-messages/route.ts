import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/platforms/registry";
import type { PlatformSlug } from "@/lib/platforms/types";

/**
 * POST /api/platforms/sync-messages
 * Polls all connected platforms for new buyer messages and inserts them
 * into external_messages. Can be called from client or cron.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: connections } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "connected");

  if (!connections || connections.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  let totalSynced = 0;

  for (const conn of connections) {
    const adapter = getAdapter(conn.platform_slug as PlatformSlug);
    if (!adapter?.fetchMessages) continue;

    try {
      const { data: lastMsg } = await supabase
        .from("external_messages")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("platform_slug", conn.platform_slug)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const since = lastMsg?.created_at ?? undefined;
      const messages = await adapter.fetchMessages(conn, since);

      for (const msg of messages) {
        const { data: extPost } = await supabase
          .from("external_posts")
          .select("id, listing_id")
          .eq("platform_slug", conn.platform_slug)
          .maybeSingle();

        await supabase.from("external_messages").insert({
          user_id: user.id,
          listing_id: extPost?.listing_id ?? null,
          external_post_id: extPost?.id ?? null,
          platform_slug: msg.platform_slug,
          sender_name: msg.sender_name,
          sender_platform_id: msg.sender_platform_id,
          text: msg.text,
          is_incoming: msg.is_incoming,
          read: false,
          platform_chat_id: msg.platform_chat_id,
        });
        totalSynced++;
      }
    } catch (e) {
      console.error(`Message sync error (${conn.platform_slug}):`, e);
    }
  }

  return NextResponse.json({ synced: totalSynced });
}
