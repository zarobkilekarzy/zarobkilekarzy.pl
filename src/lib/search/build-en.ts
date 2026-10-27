/**
 * Indeks wyszukiwarki wersji angielskiej (/en/search.json, src/pages/en/search.json.ts): tylko to, co ma
 * tłumaczenie — artykuły EN, hasła słownika z objaśnieniem po angielsku i strony z src/data/en/navigation.ts.
 * Pozycje artykułów mają id polskiego oryginału, więc „Popularne” bierze tę samą listę co wersja polska.
 */
import type { SearchDoc, SearchHit } from '@/types';
import { getGlossary, getSections, plainText } from '@/lib/content';
import { enHref, getTranslations, SECTIONS_EN, type Translated } from '@/i18n/translations';
import { glossaryEn } from '@/data/en/glossary';
import { searchExtras } from '@/data/en/navigation';
import { popularSearchIds } from '@/data/navigation';
import { toHit } from './engine';
import { indexDocs } from './build';

async function articleDoc({ article, source }: Translated, full: boolean): Promise<SearchDoc> {
  const doc: SearchDoc = {
    id: source.id,
    title: article.data.title,
    category: SECTIONS_EN[source.data.category].label,
    href: enHref({ article, source }),
    keywords: article.id.split('-'),
    summary: [article.data.summary, ...(article.data.keyPoints ?? [])].join(' '),
  };
  if (!full) return doc;
  const sections = await getSections(article);
  return { ...doc, sections: sections.map((h) => ({ title: h.text, anchor: h.slug })), body: plainText(article) };
}

async function collectDocs(full: boolean): Promise<SearchDoc[]> {
  const [translations, glossary] = await Promise.all([getTranslations(), getGlossary()]);
  return [
    ...(await Promise.all(translations.map((tr) => articleDoc(tr, full)))),
    // hasło zostaje po polsku (tak jak na /en/glossary/), objaśnienie po angielsku
    ...glossary.flatMap((g) => {
      const en = glossaryEn[g.id];
      return en ? [{ id: `pojecie-${g.id}`, title: `${g.term} — ${en.full}`, category: 'Glossary', href: `/en/glossary/#${g.id}`, summary: en.def }] : [];
    }),
    ...searchExtras,
  ];
}

let popular: Promise<SearchHit[]> | undefined;

/** Pozycje „Popularne” — jedna lista dla wszystkich stron EN, w buildzie liczona raz (jak getTranslations). */
export const getPopularSearchesEn = (): Promise<SearchHit[]> => (import.meta.env.DEV ? popularHits() : (popular ??= popularHits()));

async function popularHits(): Promise<SearchHit[]> {
  const docs = await collectDocs(false);
  return popularSearchIds.flatMap((id) => {
    const doc = docs.find((d) => d.id === id);
    return doc ? [toHit(doc)] : [];
  });
}

export const buildSearchIndexEn = async () => indexDocs(await collectDocs(true), 'en');
