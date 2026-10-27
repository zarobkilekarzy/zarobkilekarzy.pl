/**
 * Wersje językowe serwisu. Polski jest źródłem prawdy i stoi pod adresami bez prefiksu,
 * angielski — pod /en/ (decyzje i proces: AGENTS.md → „Wersja angielska”).
 *
 * Język strony wynika z jej adresu, więc komponenty nie dostają go w propsach:
 * `localeOf(Astro.url.pathname)` na serwerze, `pageLocale()` (src/i18n/client.ts) w przeglądarce.
 * Wbudowanego i18n Astro celowo nie włączamy — jego middleware nie jest potrzebne statycznej stronie.
 */
export const LOCALES = ['pl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, {
  /** atrybut lang na <html> */
  html: string;
  /** hreflang w <link rel="alternate"> */
  hreflang: string;
  /** inLanguage w JSON-LD */
  schema: string;
  /** og:locale */
  og: string;
  /** prefiks adresów */
  prefix: string;
  /** nazwa języka w przełączniku, w tym języku */
  name: string;
}> = {
  pl: { html: 'pl', hreflang: 'pl', schema: 'pl-PL', og: 'pl_PL', prefix: '', name: 'Polski' },
  // brytyjska odmiana: pisownia jak w dokumentach UE i OECD („licence”, „programme”)
  en: { html: 'en-GB', hreflang: 'en', schema: 'en-GB', og: 'en_GB', prefix: '/en', name: 'English' },
};

export const localeOf = (pathname: string): Locale => (pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pl');
