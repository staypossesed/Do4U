import type {
  PlatformAdapter,
  PlatformConnection,
  ListingData,
  ExternalPostingResult,
  ExternalMessage,
} from "./types";

const VK_AUTH = "https://oauth.vk.com/authorize";
const VK_TOKEN = "https://oauth.vk.com/access_token";
const VK_API = "https://api.vk.com/method";
const VK_VERSION = "5.199";

function vkCategory(cat: string): number {
  const map: Record<string, number> = {
    clothing: 2,
    shoes: 2,
    accessories: 2,
    electronics: 1,
    books: 10,
    toys: 12,
    furniture: 8,
  };
  return map[cat] ?? 1;
}

export const vkAdapter: PlatformAdapter = {
  slug: "vk_marketplace",
  displayName: "VK Маркет",

  getAuthUrl(userId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.VK_APP_ID ?? "",
      redirect_uri: redirectUri,
      display: "page",
      scope: "market,photos,messages",
      response_type: "code",
      state: userId,
      v: VK_VERSION,
    });
    return `${VK_AUTH}?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    const params = new URLSearchParams({
      client_id: process.env.VK_APP_ID ?? "",
      client_secret: process.env.VK_APP_SECRET ?? "",
      redirect_uri: redirectUri,
      code,
    });
    const res = await fetch(`${VK_TOKEN}?${params}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error_description || "VK auth failed");

    return {
      access_token: data.access_token,
      refresh_token: null,
      expires_in: data.expires_in ?? null,
      platform_user_id: String(data.user_id),
      platform_user_name: null,
      extra: { email: data.email },
    };
  },

  async publishListing(
    connection: PlatformConnection,
    listing: ListingData,
  ): Promise<ExternalPostingResult> {
    try {
      const token = connection.access_token;
      const groupId = (connection.extra as Record<string, unknown>)?.group_id;
      if (!groupId) {
        return {
          platform_slug: "vk_marketplace",
          success: false,
          external_id: null,
          external_url: null,
          error: "VK group_id not configured. Set it in platform connection settings.",
        };
      }
      const ownerId = `-${groupId}`;

      const photoIds: number[] = [];
      for (const url of listing.image_urls.slice(0, 5)) {
        try {
          const serverRes = await fetch(
            `${VK_API}/photos.getMarketUploadServer?` +
              new URLSearchParams({
                access_token: token,
                group_id: String(groupId),
                main_photo: photoIds.length === 0 ? "1" : "0",
                v: VK_VERSION,
              }),
          );
          const serverData = await serverRes.json();
          const uploadUrl = serverData.response?.upload_url;
          if (!uploadUrl) continue;

          const imgResp = await fetch(url);
          const imgBlob = await imgResp.blob();
          const form = new FormData();
          form.append("file", imgBlob, "photo.jpg");
          const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
          const uploadData = await uploadRes.json();

          const saveRes = await fetch(
            `${VK_API}/photos.saveMarketPhoto?` +
              new URLSearchParams({
                access_token: token,
                group_id: String(groupId),
                photo: uploadData.photo,
                server: String(uploadData.server),
                hash: uploadData.hash,
                crop_data: uploadData.crop_data ?? "",
                crop_hash: uploadData.crop_hash ?? "",
                v: VK_VERSION,
              }),
          );
          const saveData = await saveRes.json();
          if (saveData.response?.[0]?.id) {
            photoIds.push(saveData.response[0].id);
          }
        } catch {
          // skip failed photo
        }
      }

      if (photoIds.length === 0) {
        return {
          platform_slug: "vk_marketplace",
          success: false,
          external_id: null,
          external_url: null,
          error: "Failed to upload any photos to VK",
        };
      }

      const params = new URLSearchParams({
        access_token: token,
        owner_id: ownerId,
        name: listing.title.slice(0, 100),
        description: listing.description.slice(0, 15000),
        category_id: String(vkCategory(listing.category)),
        price: String(listing.price),
        main_photo_id: String(photoIds[0]),
        v: VK_VERSION,
      });
      if (photoIds.length > 1) {
        params.set("photo_ids", photoIds.slice(1).join(","));
      }

      const res = await fetch(`${VK_API}/market.add?${params}`);
      const data = await res.json();

      if (data.error) {
        return {
          platform_slug: "vk_marketplace",
          success: false,
          external_id: null,
          external_url: null,
          error: data.error.error_msg ?? JSON.stringify(data.error),
        };
      }

      const itemId = data.response?.market_item_id;
      return {
        platform_slug: "vk_marketplace",
        success: true,
        external_id: String(itemId),
        external_url: `https://vk.com/market${ownerId}?w=product${ownerId}_${itemId}`,
        error: null,
      };
    } catch (e) {
      return {
        platform_slug: "vk_marketplace",
        success: false,
        external_id: null,
        external_url: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },

  async removeListing(connection, externalId) {
    try {
      const groupId = (connection.extra as Record<string, unknown>)?.group_id;
      const params = new URLSearchParams({
        access_token: connection.access_token,
        owner_id: `-${groupId}`,
        item_id: externalId,
        v: VK_VERSION,
      });
      const res = await fetch(`${VK_API}/market.delete?${params}`);
      const data = await res.json();
      return { success: !data.error, error: data.error?.error_msg ?? null };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async fetchMessages(connection): Promise<ExternalMessage[]> {
    // VK market messages arrive as regular VK messages to the group
    // Polling requires long-poll server or callback API — handled at webhook level
    return [];
  },
};
