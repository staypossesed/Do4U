"use server";

import { createClient } from "@/lib/supabase/server";
import type { ListingCategory } from "@/lib/types/database";

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
      title_en: input.titleEn,
      description: input.description,
      description_en: input.descriptionEn,
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

  // Create moderation log
  await supabase.from("moderation_logs").insert({
    listing_id: listing.id,
    status: "approved", // MVP: auto-approve, TODO: AI moderation
    ai_score: 0.95,
    ai_reason: "Auto-approved in MVP mode",
  });

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
