export type PlatformSlug = "avito" | "vk_marketplace" | "ebay" | "olx" | "facebook_marketplace";

export type PlatformConnectionStatus = "connected" | "disconnected" | "expired" | "error";

export interface PlatformConnection {
  id: string;
  user_id: string;
  platform_slug: PlatformSlug;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  platform_user_id: string | null;
  platform_user_name: string | null;
  extra: Record<string, unknown>;
  status: PlatformConnectionStatus;
  created_at: string;
  updated_at: string;
}

export interface ExternalPostingResult {
  platform_slug: PlatformSlug;
  success: boolean;
  external_id: string | null;
  external_url: string | null;
  error: string | null;
}

export interface ExternalPost {
  id: string;
  listing_id: string;
  platform_slug: PlatformSlug;
  external_id: string | null;
  external_url: string | null;
  status: "pending" | "posted" | "failed" | "removed";
  error: string | null;
  posted_at: string | null;
  created_at: string;
}

export interface ExternalMessage {
  id: string;
  user_id: string;
  listing_id: string | null;
  external_post_id: string | null;
  platform_slug: PlatformSlug;
  sender_name: string;
  sender_platform_id: string | null;
  text: string;
  is_incoming: boolean;
  read: boolean;
  platform_chat_id: string | null;
  created_at: string;
}

export interface ListingData {
  id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  image_urls: string[];
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country_code: string | null;
}

export interface PlatformAdapter {
  slug: PlatformSlug;
  displayName: string;

  getAuthUrl(userId: string, redirectUri: string): string;

  exchangeCode(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string | null;
    expires_in: number | null;
    platform_user_id: string | null;
    platform_user_name: string | null;
    extra: Record<string, unknown>;
  }>;

  refreshToken?(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string | null;
    expires_in: number | null;
  }>;

  publishListing(
    connection: PlatformConnection,
    listing: ListingData,
  ): Promise<ExternalPostingResult>;

  removeListing?(
    connection: PlatformConnection,
    externalId: string,
  ): Promise<{ success: boolean; error: string | null }>;

  fetchMessages?(
    connection: PlatformConnection,
    since?: string,
  ): Promise<ExternalMessage[]>;

  sendMessage?(
    connection: PlatformConnection,
    chatId: string,
    text: string,
  ): Promise<{ success: boolean; error: string | null }>;
}
