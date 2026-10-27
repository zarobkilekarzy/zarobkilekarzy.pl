/**
 * Tłumaczenia aktualności (kolekcja `newsEn`, src/content/en/news/): adresy, pary PL↔EN i stan względem polskiego wpisu.
 * Szkic idzie za polskim wpisem: polski `draft` = strona EN tylko w `astro dev`, z noindex — jak w src/lib/news.ts.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { News } from '@/lib/news';
import type { Freshness } from './translations';
import { lastChange, sourceHash } from '../../integrations/i18n/source.mjs';

export type NewsEn = CollectionEntry<'newsEn'>;

export interface TranslatedNews {
  entry: NewsEn;
  /** polski wpis */
  source: News;
}

export const newsPageEn = {
  href: '/en/news/',
  title: 'News',
  lead: 'What changes on the site and in the project: new sections, questions and letters sent, further stages of our work. Data and analyses are in the sections of the site.',
  description: 'News from zarobkilekarzy.pl: changes to the site and new stages of the project, each entry dated.',
};

export const newsEnHref = ({ entry }: TranslatedNews) => `${newsPageEn.href}${entry.id}/`;

const byDate = (a: TranslatedNews, b: TranslatedNews) => b.source.data.date.valueOf() - a.source.data.date.valueOf();

/** Tłumaczenia z polskimi wpisami; brak wpisu to błąd budowania. W buildzie bez szkiców. */
export async function getNewsTranslations(): Promise<TranslatedNews[]> {
  const all = await Promise.all(
    (await getCollection('newsEn')).map(async (entry) => {
      const source = await getEntry(entry.data.translation.of);
      if (!source) throw new Error(`[i18n] ${entry.id}: brak polskiego wpisu „${entry.data.translation.of.id}”`);
      return { entry, source };
    }),
  );
  return all.filter((t) => import.meta.env.DEV || !t.source.data.draft).sort(byDate);
}

/** Opublikowane tłumaczenia od najnowszego — lista /en/news/. */
export const getPublishedNewsTranslations = async () => (await getNewsTranslations()).filter((t) => !t.source.data.draft);

/** Tłumaczenie polskiego wpisu, jeśli istnieje. */
export async function newsTranslationOf(source: News): Promise<TranslatedNews | undefined> {
  return (await getNewsTranslations()).find((t) => t.source.id === source.id);
}

/** Porównanie stempla z bieżącym skrótem polskiego wpisu. Nieaktualne tłumaczenie to ostrzeżenie, nie błąd. */
export function newsFreshnessOf({ entry, source }: TranslatedNews): Freshness {
  const files = [source.filePath!, ...entry.data.translation.files];
  const stale = sourceHash(files) !== entry.data.translation.hash;
  if (stale) console.warn(`[i18n] ${entry.id}: polski wpis zmienił się od tłumaczenia — przejrzyj i uruchom npm run i18n:stamp`);
  return { stale, changed: stale ? lastChange(files) : undefined };
}
