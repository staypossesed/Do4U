import type {
  PlatformAdapter,
  PlatformConnection,
  ListingData,
  ExternalPostingResult,
  ExternalMessage,
} from "./types";

const EBAY_AUTH = "https://auth.ebay.com/oauth2/authorize";
const EBAY_TOKEN = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_API = "https://api.ebay.com";

function ebayCondition(): string {
  return "USED_EXCELLENT";
}

function ebayCategoryId(cat: string): string {
  const map: Record<string, string> = {
    clothing: "11450",
    shoes: "63889",
    accessories: "4250",
    electronics: "293",
    books: "261186",
    toys: "220",
    furniture: "3197",
  };
  return map[cat] ?? "99";
}

export const ebayAdapter: PlatformAdapter = {
  slug: "ebay",
  displayName: "eBay",

  getAuthUrl(userId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.EBAY_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
      state: userId,
    });
    return `${EBAY_AUTH}?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    const credentials = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`,
    ).toString("base64");

    const res = await fetch(EBAY_TOKEN, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "eBay auth failed");

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
    const credentials = Buffer.from(
      `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`,
    ).toString("base64");
    const res = await fetch(EBAY_TOKEN, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: "https://api.ebay.com/oauth/api_scope/sell.inventory",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || "eBay refresh failed");
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
      const sku = `do4u-${listing.id.slice(0, 16)}`;
      const title = (listing.title_en || listing.title).slice(0, 80);
      const description = (listing.description_en || listing.description).slice(0, 4000);

      const priceUsd = Math.max(1, Math.round(listing.price / 90));
      const imageUrls = listing.image_urls.slice(0, 12);

      // 1. Create/replace inventory item
      const invRes = await fetch(
        `${EBAY_API}/sell/inventory/v1/inventory_item/${sku}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Content-Language": "en-US",
          },
          body: JSON.stringify({
            availability: {
              shipToLocationAvailability: { quantity: 1 },
            },
            condition: ebayCondition(),
            product: {
              title,
              description: `<p>${description}</p>`,
              imageUrls,
              aspects: {},
            },
          }),
        },
      );
      if (!invRes.ok && invRes.status !== 204) {
        const err = await invRes.json().catch(() => ({}));
        return {
          platform_slug: "ebay",
          success: false,
          external_id: null,
          external_url: null,
          error: `Inventory create failed: ${JSON.stringify(err)}`,
        };
      }

      // 2. Create offer
      const offerRes = await fetch(`${EBAY_API}/sell/inventory/v1/offer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Language": "en-US",
        },
        body: JSON.stringify({
          sku,
          marketplaceId: "EBAY_US",
          format: "FIXED_PRICE",
          listingDescription: `<p>${description}</p>`,
          availableQuantity: 1,
          categoryId: ebayCategoryId(listing.category),
          pricingSummary: {
            price: { value: String(priceUsd), currency: "USD" },
          },
          listingPolicies: {
            fulfillmentPolicyId: (connection.extra as Record<string, unknown>)?.fulfillment_policy_id ?? "",
            paymentPolicyId: (connection.extra as Record<string, unknown>)?.payment_policy_id ?? "",
            returnPolicyId: (connection.extra as Record<string, unknown>)?.return_policy_id ?? "",
          },
        }),
      });
      const offerData = await offerRes.json();
      if (!offerRes.ok) {
        return {
          platform_slug: "ebay",
          success: false,
          external_id: null,
          external_url: null,
          error: `Offer create failed: ${JSON.stringify(offerData)}`,
        };
      }
      const offerId = offerData.offerId;

      // 3. Publish offer
      const pubRes = await fetch(
        `${EBAY_API}/sell/inventory/v1/offer/${offerId}/publish`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const pubData = await pubRes.json();
      if (!pubRes.ok) {
        return {
          platform_slug: "ebay",
          success: false,
          external_id: offerId,
          external_url: null,
          error: `Publish failed: ${JSON.stringify(pubData)}`,
        };
      }

      return {
        platform_slug: "ebay",
        success: true,
        external_id: pubData.listingId ?? offerId,
        external_url: `https://www.ebay.com/itm/${pubData.listingId}`,
        error: null,
      };
    } catch (e) {
      return {
        platform_slug: "ebay",
        success: false,
        external_id: null,
        external_url: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },

  async fetchMessages(connection, since): Promise<ExternalMessage[]> {
    try {
      const token = connection.access_token;
      const endTime = new Date().toISOString();
      const startTime = since ?? new Date(Date.now() - 86400000).toISOString();

      const res = await fetch(
        `${EBAY_API}/commerce/messaging/v1/message?offset=0&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) return [];
      const data = await res.json();

      interface EbayMsg {
        messageId?: string;
        creationDate?: string;
        sender?: { loginName?: string; userId?: string };
        textContent?: string;
        threadId?: string;
      }
      return ((data.messages ?? []) as EbayMsg[])
        .filter((m) => !since || new Date(m.creationDate ?? 0) > new Date(since))
        .map((m) => ({
          id: String(m.messageId ?? ""),
          user_id: "",
          listing_id: null,
          external_post_id: null,
          platform_slug: "ebay" as const,
          sender_name: String(m.sender?.loginName ?? "Buyer"),
          sender_platform_id: String(m.sender?.userId ?? ""),
          text: String(m.textContent ?? ""),
          is_incoming: true,
          read: false,
          platform_chat_id: String(m.threadId ?? ""),
          created_at: String(m.creationDate ?? new Date().toISOString()),
        }));
    } catch {
      return [];
    }
  },
};
