/**
 * Tłumaczenia stron spoza kolekcji artykułów (strony .astro: FAQ, słownik, o projekcie…).
 * Rejestr par w ./pages.json — jeden wpis na stronę: adresy PL i EN, polskie pliki, z których strona powstaje
 * (moduł danych i sama strona), stempel jak przy artykułach (`npm run i18n:stamp -- /en/faq/`) i flaga szkicu.
 * BaseLayout bierze stąd przełącznik języka i hreflang; strona EN pokazuje notę przez article/PageTranslationNote.
 */
import registry from './pages.json';
import { lastChange, sourceHash } from '../../integrations/i18n/source.mjs';
import type { Freshness } from './translations';
import type { SeoInput } from '@/lib/seo';

export interface PagePair {
  pl: string;
  en: string;
  files: string[];
  hash: string;
  date: string;
  /** szkic: strona EN poza indeksem i bez hreflang (przełącznik języka działa) */
  draft: boolean;
}

const pairs = registry as PagePair[];

export const pagePairOf = (pathname: string) => pairs.find((p) => p.pl === pathname || p.en === pathname);

/** Odpowiednik strony dla przełącznika i hreflang (hreflang tylko dla stron poza szkicem — lib/seo/meta.ts). */
export function pageTranslations(pathname: string): SeoInput['translations'] {
  const pair = pagePairOf(pathname);
  if (!pair) return undefined;
  // Polska strona z rejestru jest w indeksie; gdyby nie była, hreflang z EN nie miałby pary — wyłapie to audyt SEO (rules/hreflang.ts)
  if (pathname === pair.en) return [{ locale: 'pl', path: pair.pl, indexable: true }];
  return [{ locale: 'en', path: pair.en, indexable: !pair.draft }];
}

export function pageFreshness(pair: PagePair): Freshness {
  const stale = sourceHash(pair.files) !== pair.hash;
  if (stale) console.warn(`[i18n] ${pair.en}: polska strona zmieniła się od tłumaczenia — przejrzyj i uruchom npm run i18n:stamp -- ${pair.en}`);
  return { stale, changed: stale ? lastChange(pair.files) : undefined };
}
