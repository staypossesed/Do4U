import type {
  PlatformAdapter,
  PlatformConnection,
  ListingData,
  ExternalPostingResult,
  ExternalMessage,
} from "./types";

const AVITO_AUTH_URL = "https://avito.ru/oauth";
const AVITO_API = "https://api.avito.ru";

function avitoCategory(cat: string): number {
  const map: Record<string, number> = {
    clothing: 27,
    shoes: 29,
    accessories: 28,
    electronics: 6,
    books: 82,
    toys: 84,
    furniture: 36,
  };
  return map[cat] ?? 27;
}

export const avitoAdapter: PlatformAdapter = {
  slug: "avito",
  displayName: "Авито",

  getAuthUrl(userId: string, redirectUri: string): string {
    const clientId = process.env.AVITO_CLIENT_ID ?? "";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "autoload messenger:read messenger:write items:apply",
      state: userId,
    });
    return `${AVITO_AUTH_URL}?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    const res = await fetch(`${AVITO_API}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.AVITO_CLIENT_ID ?? "",
        client_secret: process.env.AVITO_CLIENT_SECRET ?? "",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "Avito auth failed");

    const profileRes = await fetch(`${AVITO_API}/core/v1/accounts/self`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const profile = profileRes.ok ? await profileRes.json() : {};

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      expires_in: data.expires_in ?? null,
      platform_user_id: String(profile.id ?? ""),
      platform_user_name: profile.name ?? null,
      extra: { profile_url: profile.profile_url },
    };
  },

  async refreshToken(refreshToken: string) {
    const res = await fetch(`${AVITO_API}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.AVITO_CLIENT_ID ?? "",
        client_secret: process.env.AVITO_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "Avito refresh failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      expires_in: data.expires_in ?? null,
    };
  },

  async publishListing(
    connection: PlatformConnection,
    listing: ListingData,
  ): Promise<ExternalPostingResult> {
    try {
      const token = connection.access_token;
      const userId = connection.platform_user_id;

      const imageIds: number[] = [];
      for (const url of listing.image_urls.slice(0, 10)) {
        const uploadRes = await fetch(
          `${AVITO_API}/core/v1/accounts/${userId}/images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          },
        );
        if (uploadRes.ok) {
          const img = await uploadRes.json();
          if (img.id) imageIds.push(img.id);
        }
      }

      const body = {
        title: listing.title.slice(0, 50),
        description: listing.description.slice(0, 7500),
        category_id: avitoCategory(listing.category),
        price: listing.price,
        images: imageIds,
        address: listing.city ?? undefined,
        params: {} as Record<string, string>,
      };

      const res = await fetch(
        `${AVITO_API}/core/v1/accounts/${userId}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        return {
          platform_slug: "avito",
          success: false,
          external_id: null,
          external_url: null,
          error: data.error?.message ?? JSON.stringify(data),
        };
      }

      return {
        platform_slug: "avito",
        success: true,
        external_id: String(data.id),
        external_url: `https://avito.ru/items/${data.id}`,
        error: null,
      };
    } catch (e) {
      return {
        platform_slug: "avito",
        success: false,
        external_id: null,
        external_url: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },

  async removeListing(connection, externalId) {
    try {
      const res = await fetch(
        `${AVITO_API}/core/v1/accounts/${connection.platform_user_id}/items/${externalId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "removed" }),
        },
      );
      return { success: res.ok, error: res.ok ? null : `HTTP ${res.status}` };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async fetchMessages(connection, since): Promise<ExternalMessage[]> {
    try {
      const userId = connection.platform_user_id;
      const params = new URLSearchParams({ unread_only: "true" });
      const res = await fetch(
        `${AVITO_API}/messenger/v2/accounts/${userId}/chats?${params}`,
        { headers: { Authorization: `Bearer ${connection.access_token}` } },
      );
      if (!res.ok) return [];
      const data = await res.json();

      const messages: ExternalMessage[] = [];
      for (const chat of data.chats ?? []) {
        const msgRes = await fetch(
          `${AVITO_API}/messenger/v3/accounts/${userId}/chats/${chat.id}/messages/`,
          { headers: { Authorization: `Bearer ${connection.access_token}` } },
        );
        if (!msgRes.ok) continue;
        const msgData = await msgRes.json();
        for (const m of msgData.messages ?? []) {
          if (since && new Date(m.created * 1000) <= new Date(since)) continue;
          if (String(m.author_id) === userId) continue;
          messages.push({
            id: String(m.id),
            user_id: "",
            listing_id: null,
            external_post_id: null,
            platform_slug: "avito",
            sender_name: m.author?.name ?? "Покупатель",
            sender_platform_id: String(m.author_id),
            text: m.content?.text ?? "",
            is_incoming: true,
            read: false,
            platform_chat_id: String(chat.id),
            created_at: new Date(m.created * 1000).toISOString(),
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
        `${AVITO_API}/messenger/v1/accounts/${connection.platform_user_id}/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${connection.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: { text } }),
        },
      );
      return { success: res.ok, error: res.ok ? null : `HTTP ${res.status}` };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};
