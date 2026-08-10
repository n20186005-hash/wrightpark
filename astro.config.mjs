import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.CURRENT_SITE_DOMAIN
    ? `https://${process.env.CURRENT_SITE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
    : 'https://wrightpark.org',
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'tl',
    locales: ['tl', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
