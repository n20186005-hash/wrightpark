import tl from './tl.json';
import en from './en.json';
import { siteConfig } from '../config';

export const defaultLang = 'en';
export const languagesList = ['tl', 'en'] as const;

export const languages: Record<string, string> = {
  tl: 'Tagalog',
  en: 'English',
};

export const ui: Record<string, any> = { tl, en };

export function getLangFromUrl(url: URL): string {
  const seg = url.pathname.split('/').filter(Boolean);
  const lang = seg[0];
  return (languagesList as readonly string[]).includes(lang) ? lang : defaultLang;
}

export function getI18n(url: URL) {
  const lang = getLangFromUrl(url);
  const messages = ui[lang];
  const t = (key: string): string => {
    const found = key
      .split('.')
      .reduce<any>((o, i) => (o == null ? undefined : o[i]), messages);
    return found ?? '';
  };
  return { lang, messages, t };
}

export function buildAlternates(path = ''): Record<string, string> {
  const base = siteConfig.baseUrl;
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const mk = (l: string) => `${base}/${l}${clean ? '/' + clean : ''}`;
  return {
    tl: mk('tl'),
    en: mk('en'),
    xDefault: mk('en'),
  };
}

export function htmlLangAttr(lang: string): string {
  if (lang === 'tl') return 'fil';
  return lang;
}
