/**
 * Pozycja spisu materiałów (spisy działów, wyróżniony materiał): polski artykuł albo jego tłumaczenie
 * sprowadzone do tych samych pól. Bloki spisów (ArticleTable, TopicCatalog, QuestionBands, ArticleFeature)
 * i layouts/IndexLayout przyjmują polskie `Article` — jak dotąd — albo gotowe `Entry` (strony /en/).
 * Pozycje angielskie buduje src/data/en/spis.ts (tytuł i lead z tłumaczenia, liczba z karty po angielsku).
 */
import type { ImageMetadata } from 'astro';
import { articleHref, type Article } from '@/lib/content';
import type { Category } from '@/types';

export interface Entry {
  /** id polskiego artykułu (pozycja w kilku działach liczy się raz) */
  id: string;
  href: string;
  title: string;
  summary: string;
  category: Category;
  /** nazwa działu do wyświetlenia, gdy inna niż `category` (po angielsku) */
  label?: string;
  date?: Date;
  updated?: Date;
  /** forma zestawienia w języku strony („Wykresy”, „Charts”) */
  format?: string;
  stat?: { value: string; unit: string };
  cover?: ImageMetadata;
  coverAlt?: string;
  coverPosition?: string;
  badge?: string;
  kicker?: string;
  /** język strony docelowej, gdy inny niż strony ze spisem (link do strony tylko po polsku) */
  hreflang?: string;
}

export const isEntry = (item: Article | Entry): item is Entry => !('data' in item);

/** Polski artykuł jako pozycja spisu — te same pola, które bloki brały dotąd z `article.data`. */
export const entryOf = (a: Article): Entry => ({
  id: a.id,
  href: articleHref(a),
  title: a.data.title,
  summary: a.data.summary,
  category: a.data.category,
  date: a.data.date,
  updated: a.data.updated,
  format: a.data.format,
  stat: a.data.stat,
  cover: a.data.cover,
  coverAlt: a.data.coverAlt,
  coverPosition: a.data.coverPosition,
  badge: a.data.badge,
  kicker: a.data.kicker,
});

export const toEntry = (item: Article | Entry): Entry => (isEntry(item) ? item : entryOf(item));

/**
 * Najświeższa data w spisie (aktualizacja z historii zmian albo publikacja) — „Aktualizacja” stron działów.
 * Liczona z treści, więc nie starzeje się jak data wpisana ręcznie; spis bez dat — undefined.
 */
export function lastUpdated(items: (Article | Entry | undefined)[]): Date | undefined {
  const times = items.flatMap((item) => {
    const entry = item && toEntry(item);
    const when = entry && (entry.updated ?? entry.date);
    return when ? [when.getTime()] : [];
  });
  return times.length ? new Date(Math.max(...times)) : undefined;
}
