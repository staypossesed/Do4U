"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdapter } from "./registry";
import type { PlatformSlug, ListingData, ExternalPostingResult } from "./types";

/**
 * After listing is created in our DB, auto-publish to every connected platform.
 * Returns per-platform results so the UI can show status.
 */
export async function autoPublishToAllPlatforms(
  listingId: string,
): Promise<ExternalPostingResult[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch listing + images
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();
  if (!listing) return [];

  const { data: images } = await supabase
    .from("listing_images")
    .select("url_original, order")
    .eq("listing_id", listingId)
    .order("order");

  const { data: profile } = await supabase
    .from("users")
    .select("country_code, city, latitude, longitude")
    .eq("id", user.id)
    .maybeSingle();

  const listingData: ListingData = {
    id: listing.id,
    title: listing.title,
    title_en: listing.title_en,
    description: listing.description,
    description_en: listing.description_en,
    price: listing.price,
    currency: listing.currency ?? "RUB",
    category: listing.category,
    tags: listing.tags ?? [],
    image_urls: (images ?? []).map((i: { url_original: string }) => i.url_original),
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    city: profile?.city ?? null,
    country_code: profile?.country_code ?? null,
  };

  // Get all connected platforms for this user
  const { data: connections } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "connected");

  if (!connections || connections.length === 0) return [];

  const results: ExternalPostingResult[] = [];

  for (const conn of connections) {
    const adapter = getAdapter(conn.platform_slug as PlatformSlug);
    if (!adapter) continue;

    // Check if already posted to this platform
    const { data: existing } = await supabase
      .from("external_posts")
      .select("id")
      .eq("listing_id", listingId)
      .eq("platform_slug", conn.platform_slug)
      .maybeSingle();

    if (existing) continue;

    // Create pending record
    const { data: post } = await supabase
      .from("external_posts")
      .insert({
        listing_id: listingId,
        platform_slug: conn.platform_slug,
        status: "pending",
      })
      .select("id")
      .single();

    const result = await adapter.publishListing(conn, listingData);
    results.push(result);

    // Update record with result
    if (post) {
      await supabase
        .from("external_posts")
        .update({
          status: result.success ? "posted" : "failed",
          external_id: result.external_id,
          external_url: result.external_url,
          error: result.error,
          posted_at: result.success ? new Date().toISOString() : null,
        })
        .eq("id", post.id);
    }

    // Notify user
    const statusText = result.success
      ? `Опубликовано на ${adapter.displayName}`
      : `Ошибка на ${adapter.displayName}: ${result.error}`;

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: result.success ? "platform_published" : "platform_error",
      title: result.success ? "Авто-публикация" : "Ошибка публикации",
      message: statusText,
      data: {
        listing_id: listingId,
        platform: conn.platform_slug,
        external_url: result.external_url,
      },
    });
  }

  return results;
}
