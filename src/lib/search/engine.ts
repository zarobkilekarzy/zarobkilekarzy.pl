/**
 * Wyszukiwanie w przeglądarce na gotowym indeksie z /szukaj.json, bez serwera i bez zależności.
 * Zapytanie dzieli się na słowa tak samo jak treść przy budowaniu (./text). Każde słowo pasuje
 * do słów indeksu zaczynających się od jego rdzenia: „lekarzom” → „lekarz…”, „zadluz” → „zadłużenie”.
 * Wynik musi zawierać wszystkie słowa zapytania.
 */
import type { SearchHit, SearchIndex } from '@/types';
import { hasMatch, stem, words } from './text';

/** Adres indeksu: plik generuje src/pages/szukaj.json.ts. */
const INDEX_URL = '/szukaj.json';

/** Strona wyników (src/pages/szukaj/index.astro); zapytanie żyje w parametrze `q`. */
export const searchPageHref = (query = '') => (query ? `/szukaj/?q=${encodeURIComponent(query)}` : '/szukaj/');

/** Słowo indeksu, które tylko zaczyna się od rdzenia (inna forma, niedokończone słowo), waży o połowę mniej. */
const PREFIX_MATCH = 0.5;

export interface SearchResults {
  /** rdzenie słów zapytania, do podświetlenia trafień */
  roots: string[];
  hits: SearchHit[];
}

export type Search = (query: string, limit?: number) => SearchResults;

/**
 * Wiersz wyniku. Gdy zapytanie pasuje do nagłówka sekcji, a nie do tytułu,
 * link prowadzi prosto do tej sekcji.
 */
export function toHit({ title, category, href, sections }: SearchIndex['docs'][number], roots: string[] = []): SearchHit {
  const section = hasMatch(title, roots) ? undefined : sections?.find((s) => hasMatch(s.title, roots));
  return section ? { title, category, href: `${href}#${section.anchor}`, section: section.title } : { title, category, href };
}

/** Pierwsza pozycja posortowanej listy, która nie jest mniejsza od `key` (wyszukiwanie binarne). */
function lowerBound(list: string[], key: string): number {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (list[mid] < key) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function createSearch({ docs, words: vocabulary, postings }: SearchIndex): Search {
  // Rzadkie słowo mówi o dokumencie więcej niż obecne wszędzie „lekarz” (IDF)
  const rarity = postings.map((list) => Math.log(1 + docs.length / (list.length / 2)));

  /** Punkty dokumentów za jedno słowo zapytania: najlepsze trafienie w każdym dokumencie. */
  function scoresFor(word: string): Map<number, number> {
    const root = stem(word);
    const scores = new Map<number, number>();
    // Słowa o wspólnym początku leżą w posortowanym słowniku obok siebie
    for (let i = lowerBound(vocabulary, root); vocabulary[i]?.startsWith(root); i++) {
      const factor = (vocabulary[i] === word ? 1 : PREFIX_MATCH) * rarity[i];
      const list = postings[i];
      for (let j = 0; j < list.length; j += 2) {
        const score = list[j + 1] * factor;
        if (score > (scores.get(list[j]) ?? 0)) scores.set(list[j], score);
      }
    }
    return scores;
  }

  return (query, limit = 8) => {
    const terms = [...new Set(words(query))];
    const roots = terms.map(stem);
    if (!terms.length) return { roots, hits: [] };

    const [first, ...rest] = terms.map(scoresFor);
    const ranked: [doc: number, score: number][] = [];
    for (const [doc, score] of first) {
      if (rest.every((scores) => scores.has(doc))) {
        ranked.push([doc, rest.reduce((sum, scores) => sum + scores.get(doc)!, score)]);
      }
    }
    ranked.sort((a, b) => b[1] - a[1] || a[0] - b[0]);

    return { roots, hits: ranked.slice(0, limit).map(([doc]) => toHit(docs[doc], roots)) };
  };
}

let loading: Promise<Search> | undefined;

/** Pobiera indeks raz na stronę; kolejne wywołania dostają tę samą obietnicę, a po błędzie można spróbować znowu. */
export function loadSearch(): Promise<Search> {
  loading ??= fetch(INDEX_URL)
    .then((res) => (res.ok ? (res.json() as Promise<SearchIndex>) : Promise.reject(new Error(`${INDEX_URL}: ${res.status}`))))
    .then(createSearch)
    .catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
  return loading;
}

/** Zaczyna pobierać indeks z wyprzedzeniem (np. gdy kursor trafi na lupę); błąd obsłuży późniejsze wyszukiwanie. */
export const prefetchSearch = () => void loadSearch().catch(() => {});
