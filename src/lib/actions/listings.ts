"use server";

import { createClient } from "@/lib/supabase/server";
import type { ListingCategory } from "@/lib/types/database";
import { moderateListingContent } from "@/lib/ai/moderation";
import { ensurePublicUserRow } from "@/lib/ensure-user-profile";

interface CreateListingInput {
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  price: number;
  category: ListingCategory;
  tags: string[];
  voiceTranscript: string | null;
  imageUrls: { original: string; enhanced: string | null; order: number }[];
  lat: number | null;
  lng: number | null;
  aiMetadata: Record<string, unknown> | null;
}

export async function createListing(input: CreateListingInput) {
  const supabase = await createClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { error: "Not authenticated" };
  }

  const ensured = await ensurePublicUserRow(supabase, user);
  if (!ensured.ok) {
    return { error: ensured.message };
  }

  const mod = await moderateListingContent({
    title: input.title,
    description: input.description,
    transcript: input.voiceTranscript,
  });
  if (!mod.allowed) {
    return {
      error: "MODERATION_BLOCKED",
      moderationReason: mod.reason,
    };
  }

  // Build location point if coordinates provided
  const location = input.lat && input.lng
    ? `POINT(${input.lng} ${input.lat})`
    : null;

  // Insert listing
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      title: input.title,
      title_en: input.titleEn?.trim() ? input.titleEn.trim() : null,
      description: input.description,
      description_en: input.descriptionEn?.trim() ? input.descriptionEn.trim() : null,
      price: input.price,
      suggested_price: input.price,
      category: input.category,
      tags: input.tags,
      voice_transcript: input.voiceTranscript,
      ai_metadata: input.aiMetadata ?? {},
      location,
      status: "active",
    })
    .select("id")
    .single();

  if (listingErr || !listing) {
    console.error("Create listing error:", listingErr);
    return { error: listingErr?.message || "Failed to create listing" };
  }

  // Insert images
  if (input.imageUrls.length > 0) {
    const imageRows = input.imageUrls.map((img) => ({
      listing_id: listing.id,
      url_original: img.original,
      url_enhanced: img.enhanced,
      order: img.order,
    }));

    const { error: imgErr } = await supabase
      .from("listing_images")
      .insert(imageRows);

    if (imgErr) {
      console.error("Insert images error:", imgErr);
    }
  }

  await supabase.from("moderation_logs").insert({
    listing_id: listing.id,
    status: "approved",
    ai_score: 1,
    ai_reason: "Passed AI moderation before publish",
  });

  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: user.id,
    type: "listing_published",
    title: "Объявление опубликовано",
    message: "Модерация пройдена. Do4U показывает его покупателям рядом с тобой.",
    data: { listing_id: listing.id },
  });
  if (notifErr) {
    console.warn("Listing published notification:", notifErr.message);
  }

  return { success: true, listingId: listing.id };
}

export async function fetchUserListings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", listings: [] };

  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      listing_images ( id, url_original, url_enhanced, "order" )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, listings: [] };
  }

  return { listings: data || [] };
}

export async function fetchMarketplaceListings(filters?: {
  category?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(`
      *,
      listing_images ( id, url_original, url_enhanced, "order" ),
      users!inner ( name, avatar_url )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // TODO: PostGIS distance filter when user location is available
  // .rpc('nearby_listings', { user_lat, user_lng, radius_km })

  const { data, error } = await query;

  if (error) {
    return { error: error.message, listings: [] };
  }

  return { listings: data || [] };
}

export async function fetchListingById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      listing_images ( id, url_original, url_enhanced, "order" ),
      users!inner ( id, name, avatar_url )
    `)
    .eq("id", id)
    .single();

  if (error) {
    return { error: error.message, listing: null };
  }

  // Increment views (fire-and-forget)
  supabase.rpc("increment_views", { listing_id: id }).then(() => {}, () => {});

  return { listing: data };
}
