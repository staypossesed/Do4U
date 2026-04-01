/** Countries where listing copy is typically Russian */
export const RUSSOPHONE_COUNTRIES = new Set(["RU", "BY", "KZ", "UA"]);

export type ListingPrimaryLocale = "ru" | "en";

/**
 * Primary language for generated title/description: Russian for RU/BY/KZ/UA, English for other countries.
 * If country is unknown, follows app UI locale.
 */
export function deriveListingPrimaryLocale(
  countryCode: string | null | undefined,
  appLocale: "ru" | "en",
): ListingPrimaryLocale {
  const cc =
    countryCode && String(countryCode).length >= 2
      ? String(countryCode).toUpperCase().slice(0, 2)
      : "";
  if (cc && RUSSOPHONE_COUNTRIES.has(cc)) return "ru";
  if (cc) return "en";
  return appLocale === "ru" ? "ru" : "en";
}

/** Short price hint for AI + labels */
export function priceCurrencyHint(countryCode: string | null | undefined, primary: ListingPrimaryLocale): string {
  if (primary === "ru") {
    return "integer in RUB (Russian rubles), typical for local resale apps";
  }
  const cc =
    countryCode && String(countryCode).length >= 2
      ? String(countryCode).toUpperCase().slice(0, 2)
      : "";
  if (cc === "US") return "integer in USD, typical second-hand prices in that region";
  if (cc === "GB") return "integer in GBP";
  if (
    ["AT", "BE", "DE", "ES", "FR", "IE", "IT", "NL", "PT", "FI", "GR"].includes(cc)
  ) {
    return "integer in EUR, typical second-hand prices in that country";
  }
  if (cc === "PL") return "integer in PLN";
  return "integer in the main local currency for the seller's country (USD, EUR, GBP, etc. as appropriate)";
}
