function resolveBaseUrl(): string {
  const raw =
    (typeof process !== 'undefined' ? process.env.CURRENT_SITE_DOMAIN : undefined) ||
    (import.meta.env.CURRENT_SITE_DOMAIN as string | undefined) ||
    (import.meta.env.SITE_DOMAIN as string | undefined) ||
    'wrightpark.org';
  const host = String(raw).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return `https://${host}`;
}

export const siteConfig = {
  name: 'Wright Park Guide',
  baseUrl: resolveBaseUrl(),
  locales: ['tl', 'en'] as const,
};

export default siteConfig;

export const ogLocale: Record<string, string> = {
  tl: 'fil_PH',
  en: 'en_PH',
};

export const mapsUrl = 'https://maps.app.goo.gl/SZpr74QGHKPqBvu5A';

export const mapsEmbedSrc = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3827.1796557335597!2d120.61464837704183!3d16.415699684315094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391a6aab90f501d%3A0xd60c1ab088f168b0!2sWright%20Park!5e0!3m2!1szh-CN!2sus!4v1786340761471!5m2!1szh-CN!2sus';

/** Local government / official tourism portal (authoritative outbound link). */
export const govtTourismUrl = 'https://www.tourism.gov.ph';

export const attraction = {
  /** Official full name of the attraction (used for entity binding). */
  name: {
    tl: 'Wright Park (Luneta ng mga Pino)',
    en: 'Wright Park (Pool of Pines)',
  },
  /** Common short name / domain-equivalent meaning. */
  shortName: {
    tl: 'Luneta ng mga Pino',
    en: 'Pool of Pines',
  },
  city: {
    tl: 'Lungsod ng Baguio',
    en: 'Baguio City',
  },
  region: {
    tl: 'Benguet',
    en: 'Benguet',
  },
  country: {
    tl: 'Pilipinas',
    en: 'Philippines',
  },
  countryCode: 'PH',
  postalCode: '2600',
  plusCode: 'CJ88+7V Baguio',
  /** Latest Google Maps rating & review count (synced September 2026). */
  rating: '4.4',
  ratingMax: '5',
  reviews: '8075',
  ratingCountLabel: {
    tl: '8,075',
    en: '8,075',
  },
  /** Sync timestamp displayed next to every rating/review mention. */
  ratingSyncedAt: {
    tl: 'Setyembre 2026',
    en: 'September 2026',
  },
  lat: 16.4156997,
  lng: 120.6146484,
  address: {
    tl: 'The Mansion, Romulo Dr, Lungsod ng Baguio, Benguet, Pilipinas',
    en: 'The Mansion, Romulo Dr, Baguio City, Benguet, Philippines',
  },
  streetAddress: {
    tl: 'The Mansion, Romulo Dr',
    en: 'The Mansion, Romulo Dr',
  },
  isAccessibleForFree: true,
  nearbyLandmarks: {
    tl: ['The Mansion', 'Baguio Botanical Garden'],
    en: ['The Mansion', 'Baguio Botanical Garden'],
  },
};

/** Google Maps review source disclosure — reused by reviews & sources sections. */
export const reviewSource = {
  provider: 'Google Maps',
  syncedAt: attraction.ratingSyncedAt,
  copyright: {
    tl: 'Nakasabay mula sa mga pagsusuri ng gumagamit ng Google Maps, oras ng pag-sync Setyembre 2026; ang karapatang-ari ay pagmamay-ari ng mga orihinal na may-akda at ng Google Maps.',
    en: 'Synced from Google Maps user reviews, sync date September 2026; copyright belongs to the original authors and Google Maps.',
  },
};
