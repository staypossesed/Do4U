export interface ListingTemplateInput {
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  price: number;
  tags: string[];
}

function baseRu(l: ListingTemplateInput) {
  return `${l.title}\n\n${l.description}\n\n💰 Цена: ${l.price.toLocaleString("ru-RU")} ₽\n\n📱 Связь через Do4U\n${l.tags.map((t) => `#${t}`).join(" ")}`;
}

function baseEn(l: ListingTemplateInput) {
  const t = l.titleEn || l.title;
  const d = l.descriptionEn || l.description;
  return `${t}\n\n${d}\n\n💰 Price: ${l.price.toLocaleString("en-US")} RUB (approx)\n\n📱 Contact via Do4U\nTags: ${l.tags.join(", ")}`;
}

const bySlug: Record<string, (l: ListingTemplateInput) => string> = {
  avito: (l) => `📦 ${l.title}\n\n${l.description}\n\n💰 ${l.price.toLocaleString("ru-RU")} ₽\n\n📱 Do4U — напиши в приложении\n${l.tags.map((t) => `#${t}`).join(" ")}`,
  vk_marketplace: (l) =>
    `🔥 ${l.title}\n\n${l.description}\n\nЦена: ${l.price.toLocaleString("ru-RU")} ₽\n\nDo4U\n${l.tags.map((t) => `#${t}`).join(" ")}`,
  yula: baseRu,
  ebay: (l) => {
    const t = l.titleEn || l.title;
    const d = l.descriptionEn || l.description;
    return `${t}\n\n${d}\n\nPrice: ${Math.max(1, Math.round(l.price / 90))} USD (est.)\n\nShip via Do4U / local pickup\n${l.tags.join(", ")}`;
  },
  facebook_marketplace: (l) => baseEn(l),
  offerup: (l) => baseEn(l),
  craigslist: (l) => baseEn(l),
  kleinanzeigen: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\n${l.price.toLocaleString("de-DE")} € (guide)\n\nDo4U`,
  vinted: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\n${l.price} — Do4U`,
  vinted_fr: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U`,
  vinted_gb: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U UK`,
  vinted_it: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U`,
  leboncoin: (l) => `${l.title}\n\n${l.description}\n\n${l.price} €\nDo4U`,
  gumtree: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\n£ guide: Do4U`,
  wallapop: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U`,
  milanuncios: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U`,
  subito: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U`,
  olx_pl: (l) => `${l.titleEn || l.title}\n\n${l.descriptionEn || l.description}\n\nDo4U PL`,
  allegro: (l) => `${l.title}\n\n${l.description}\n\n${l.price} PLN\nDo4U`,
};

export function buildTemplateForSlug(slug: string, l: ListingTemplateInput): string {
  const fn = bySlug[slug];
  return fn ? fn(l) : baseRu(l);
}

export function buildTemplatesForPlatforms(
  platforms: { id: string; name: string; slug: string }[],
  selectedIds: string[],
  listing: ListingTemplateInput,
): { platformName: string; slug: string; text: string }[] {
  return platforms
    .filter((p) => selectedIds.includes(p.id))
    .map((p) => ({
      platformName: p.name,
      slug: p.slug,
      text: buildTemplateForSlug(p.slug, listing),
    }));
}
