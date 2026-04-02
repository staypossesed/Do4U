import type { PlatformAdapter, PlatformSlug } from "./types";
import { avitoAdapter } from "./avito";
import { vkAdapter } from "./vk";
import { ebayAdapter } from "./ebay";
import { olxAdapter } from "./olx";

const adapters: Record<PlatformSlug, PlatformAdapter> = {
  avito: avitoAdapter,
  vk_marketplace: vkAdapter,
  ebay: ebayAdapter,
  olx: olxAdapter,
  facebook_marketplace: ebayAdapter, // placeholder — FB has no open listing API
};

export function getAdapter(slug: PlatformSlug): PlatformAdapter | null {
  return adapters[slug] ?? null;
}

export function allAdapters(): PlatformAdapter[] {
  return [avitoAdapter, vkAdapter, ebayAdapter, olxAdapter];
}

export const SUPPORTED_SLUGS: PlatformSlug[] = ["avito", "vk_marketplace", "ebay", "olx"];
