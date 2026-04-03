/**
 * Approximate country centroids (capital-ish) for listing map/feed when GPS was denied
 * but user has country_code in profile. ISO 3166-1 alpha-2 → WGS84.
 */
export const APPROX_COUNTRY_CENTROID: Record<string, { lat: number; lng: number }> = {
  RU: { lat: 55.7558, lng: 37.6173 },
  US: { lat: 39.8283, lng: -98.5795 },
  GB: { lat: 51.5074, lng: -0.1278 },
  DE: { lat: 51.1657, lng: 10.4515 },
  FR: { lat: 46.6034, lng: 1.8883 },
  BE: { lat: 50.8503, lng: 4.3517 },
  NL: { lat: 52.1326, lng: 5.2913 },
  ES: { lat: 40.4168, lng: -3.7038 },
  IT: { lat: 41.8719, lng: 12.5674 },
  PL: { lat: 51.9194, lng: 19.1451 },
  PT: { lat: 38.7223, lng: -9.1393 },
  UA: { lat: 50.4501, lng: 30.5234 },
  KZ: { lat: 51.1694, lng: 71.4491 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
  AT: { lat: 47.5162, lng: 14.5501 },
  CH: { lat: 46.8182, lng: 8.2275 },
  SE: { lat: 60.1282, lng: 18.6435 },
  NO: { lat: 60.472, lng: 8.4689 },
  DK: { lat: 56.2639, lng: 9.5018 },
  CZ: { lat: 49.8175, lng: 15.473 },
};

export function centroidForCountry(countryCode: string | null | undefined): { lat: number; lng: number } | null {
  if (!countryCode || countryCode.length < 2) return null;
  const k = countryCode.slice(0, 2).toUpperCase();
  return APPROX_COUNTRY_CENTROID[k] ?? null;
}
