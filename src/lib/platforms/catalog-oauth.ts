import type { PlatformSlug } from "./types";

/** marketplace_platforms.slug -> OAuth adapter slug (must exist in registry). */
const CATALOG_SLUG_TO_ADAPTER: Partial<Record<string, PlatformSlug>> = {
  avito: "avito",
  vk_marketplace: "vk_marketplace",
  ebay: "ebay",
  olx: "olx",
  facebook_marketplace: "facebook_marketplace",
};

export function getOAuthAdapterSlug(catalogSlug: string): PlatformSlug | null {
  return CATALOG_SLUG_TO_ADAPTER[catalogSlug] ?? null;
}
