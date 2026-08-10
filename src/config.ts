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

export const attraction = {
  name: {
    tl: 'Wright Park (Luneta ng mga Pino)',
    en: 'Wright Park (Pool of Pines)',
  },
  rating: '4.6',
  reviews: '12800',
  lat: 16.4157,
  lng: 120.6146,
  address: {
    tl: 'Leonard Wood Rd, Lungsod ng Baguio, Benguet, Pilipinas',
    en: 'Leonard Wood Road, Baguio City, Benguet, Philippines',
  },
};
