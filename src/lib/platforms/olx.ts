import type {
  PlatformAdapter,
  PlatformConnection,
  ListingData,
  ExternalPostingResult,
  ExternalMessage,
} from "./types";

const OLX_AUTH = "https://www.olx.ua/api/open/oauth/token";
const OLX_API = "https://api.olxgroup.com";

export const olxAdapter: PlatformAdapter = {
  slug: "olx",
  displayName: "OLX",

  getAuthUrl(userId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.OLX_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "read write v2",
      state: userId,
    });
    return `https://www.olx.ua/oauth/authorize/?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    const res = await fetch(OLX_AUTH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.OLX_CLIENT_ID ?? "",
        client_secret: process.env.OLX_CLIENT_SECRET ?? "",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "OLX auth failed");

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      expires_in: data.expires_in ?? null,
      platform_user_id: null,
      platform_user_name: null,
      extra: {},
    };
  },

  async refreshToken(refreshToken: string) {
    const res = await fetch(OLX_AUTH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: process.env.OLX_CLIENT_ID ?? "",
        client_secret: process.env.OLX_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "OLX refresh failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? refreshToken,
      expires_in: data.expires_in ?? null,
    };
  },

  async publishListing(
    connection: PlatformConnection,
    listing: ListingData,
  ): Promise<ExternalPostingResult> {
    try {
      const token = connection.access_token;

      const body = {
        title: listing.title.slice(0, 70),
        description: listing.description.slice(0, 9000),
        category_urn: `urn:category:${listing.category}`,
        contact: {
          name: "Do4U Seller",
        },
        price: {
          value: listing.price,
          currency: listing.currency || "UAH",
        },
        location: {
          latitude: listing.latitude,
          longitude: listing.longitude,
          use_exact_coordinates: true,
        },
        images: listing.image_urls.slice(0, 8).map((url) => ({ url })),
        site_urn: "urn:site:olxua",
      };

      const res = await fetch(`${OLX_API}/advert/v1`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-API-KEY": process.env.OLX_API_KEY ?? "",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        return {
          platform_slug: "olx",
          success: false,
          external_id: null,
          external_url: null,
          error: data.message ?? JSON.stringify(data),
        };
      }

      return {
        platform_slug: "olx",
        success: true,
        external_id: data.transaction_id ?? null,
        external_url: null,
        error: null,
      };
    } catch (e) {
      return {
        platform_slug: "olx",
        success: false,
        external_id: null,
        external_url: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },

  async fetchMessages(connection, since): Promise<ExternalMessage[]> {
    try {
      const res = await fetch(`${OLX_API}/messaging/v1/threads?limit=20`, {
        headers: { Authorization: `Bearer ${connection.access_token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();

      const messages: ExternalMessage[] = [];
      for (const thread of data.data ?? []) {
        const msgsRes = await fetch(
          `${OLX_API}/messaging/v1/threads/${thread.id}/messages?limit=20`,
          { headers: { Authorization: `Bearer ${connection.access_token}` } },
        );
        if (!msgsRes.ok) continue;
        const msgsData = await msgsRes.json();
        for (const m of msgsData.data ?? []) {
          if (since && new Date(m.created_at) <= new Date(since)) continue;
          if (!m.is_incoming) continue;
          messages.push({
            id: String(m.id),
            user_id: "",
            listing_id: null,
            external_post_id: null,
            platform_slug: "olx",
            sender_name: m.user?.name ?? "Покупатель",
            sender_platform_id: String(m.user?.id ?? ""),
            text: m.text ?? "",
            is_incoming: true,
            read: false,
            platform_chat_id: String(thread.id),
            created_at: m.created_at,
          });
        }
      }
      return messages;
    } catch {
      return [];
    }
  },

  async sendMessage(connection, chatId, text) {
    try {
      const res = await fetch(
        `${OLX_API}/messaging/v1/threads/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        },
      );
      return { success: res.ok, error: res.ok ? null : `HTTP ${res.status}` };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
