/**
 * Tłumaczenia artykułów: adresy, pary PL↔EN i stan względem polskiego oryginału.
 * Komponenty i strony nie wołają getCollection('articlesEn') bezpośrednio — tak jak lib/content.ts dla polskich.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Category } from '@/types';
import type { Article } from '@/lib/content';
import { readFileSync } from 'node:fs';
import { lastChange, sourceHash } from '../../integrations/i18n/source.mjs';

export type ArticleEn = CollectionEntry<'articlesEn'>;

/**
 * Działy po angielsku: Analiza → /en/analysis/…. `page: false` — dział nie ma jeszcze strony /en/<path>/,
 * więc okruszek działu w artykule jest bez linku (ArticleLayout).
 */
export const SECTIONS_EN: Record<Category, { path: string; label: string; page?: false }> = {
  Mechanizm: { path: 'mechanisms', label: 'Mechanisms' },
  Analiza: { path: 'analysis', label: 'Analysis' },
  Dane: { path: 'data', label: 'Data' },
  Przewodnik: { path: 'guides', label: 'Guides', page: false },
  // /en/demand/ to strona postulatu (src/pages/en/demand/)
  'Projekt ustawy': { path: 'demand', label: 'Our demand' },
  Narzędzie: { path: 'tools', label: 'Tools', page: false },
};

export interface Translated {
  article: ArticleEn;
  /** polski oryginał */
  source: Article;
}

let cached: Promise<Translated[]> | undefined;

/**
 * Tłumaczenia z oryginałami; brak oryginału to błąd budowania. Build liczy listę raz (woła ją każda strona
 * artykułu i każda strona EN), `astro dev` — za każdym razem, żeby widać było zmiany w treści.
 */
export const getTranslations = (): Promise<Translated[]> => (import.meta.env.DEV ? load() : (cached ??= load()));

async function load(): Promise<Translated[]> {
  const all = await getCollection('articlesEn');
  return Promise.all(
    all.map(async (article) => {
      const source = await getEntry(article.data.translation.of);
      if (!source) throw new Error(`[i18n] ${article.id}: brak polskiego oryginału „${article.data.translation.of.id}”`);
      return { article, source };
    }),
  );
}

export const enHref = ({ article, source }: Translated) => `/en/${SECTIONS_EN[source.data.category].path}/${article.id}/`;

/** Tłumaczenie polskiego artykułu, jeśli istnieje. */
export async function translationOf(source: Article): Promise<Translated | undefined> {
  return (await getTranslations()).find((t) => t.source.id === source.id);
}

/** Polskie pliki, z których powstało tłumaczenie: oryginał i pliki dodatkowe (np. moduł danych). */
export const sourceFiles = ({ article, source }: Translated) => [source.filePath!, ...article.data.translation.files];

export interface Freshness {
  /** oryginał zmienił się od tłumaczenia */
  stale: boolean;
  /** kiedy (z gita); brak, gdy nie da się ustalić */
  changed?: Date;
}

const warned = new Set<string>();

/** Porównanie stempla z bieżącym skrótem oryginału. Nieaktualne tłumaczenie to ostrzeżenie, nie błąd. */
export function freshnessOf(t: Translated): Freshness {
  const files = sourceFiles(t);
  const stale = sourceHash(files) !== t.article.data.translation.hash;
  if (stale && !warned.has(t.article.id)) {
    warned.add(t.article.id);
    console.warn(`[i18n] ${t.article.id}: polski oryginał zmienił się od tłumaczenia — przejrzyj i uruchom npm run i18n:stamp`);
  }
  return { stale, changed: stale ? lastChange(files) : undefined };
}

/**
 * Czy tłumaczenie pokazuje kwoty przeliczone na euro — w treści (`<Money>`) albo w module danych z src/data/en/
 * (`withEur`, `eurApprox`). Tylko wtedy pod treścią stoi linijka o kursie NBP.
 */
export function usesEuro(article: ArticleEn): boolean {
  const body = article.body ?? '';
  if (body.includes('<Money')) return true;
  return [...body.matchAll(/from '@\/data\/en\/([^']+)'/g)].some(([, name]) =>
    /\b(withEur|eurApprox)\(/.test(readFileSync(`src/data/en/${name}.ts`, 'utf8')),
  );
}
