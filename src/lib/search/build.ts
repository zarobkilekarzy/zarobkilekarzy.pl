/**
 * Indeks wyszukiwarki budowany w czasie budowania z istniejących źródeł (artykuły, także zestawienia
 * danych, i słowniczek), bez ręcznego przepisywania tytułów. Trafia do pliku /szukaj.json (src/pages/szukaj.json.ts).
 */
import type { SearchDoc, SearchHit, SearchIndex } from '@/types';
import { articleHref, getAllArticles, getGlossary, getSections, isPublished, plainText, termHref, type Article } from '@/lib/content';
import { popularSearchIds, searchExtras } from '@/data/navigation';
import { toHit } from './engine';
import { words } from './text';

/** Przeszukiwane pola i ich wagi: słowo w tytule waży więcej niż to samo słowo w treści. */
const FIELDS: { weight: number; text: (doc: SearchDoc) => string | undefined }[] = [
  { weight: 8, text: (doc) => doc.title },
  { weight: 4, text: (doc) => doc.keywords?.join(' ') },
  { weight: 4, text: (doc) => doc.sections?.map((s) => s.title).join(' ') },
  { weight: 2, text: (doc) => doc.summary },
  { weight: 1, text: (doc) => doc.body },
];

/** Powtórzenia słowa w jednym polu liczą się najwyżej tyle razy, więc długi tekst nie wygrywa samą objętością. */
const MAX_REPEATS = 3;

const articleDoc = (article: Article): SearchDoc => ({
  id: article.id,
  title: article.data.title,
  category: article.data.category,
  href: articleHref(article),
  // Adres to redakcyjna, krótka nazwa tematu, której może nie być w tekście
  keywords: article.id.split('-'),
  summary:[article.data.summary, ...(article.data.keyPoints ?? [])].join(' '),
});

/** Opublikowany artykuł z treścią: dochodzą nagłówki sekcji (kotwice jak w spisie treści) i pełny tekst. */
async function articleWithContent(article: Article): Promise<SearchDoc> {
  if (!isPublished(article)) return articleDoc(article);
  const sections = await getSections(article);
  return {
    ...articleDoc(article),
    sections: sections.map((h) => ({ title: h.text, anchor: h.slug })),
    body: plainText(article),
  };
}

/** Adresy z `searchExtras`: wpis kolekcji kierujący na tę samą stronę (np. do listy „Co nowego”) się nie dubluje. */
const extraHrefs = new Set(searchExtras.map((d) => d.href));

/** Wszystkie cele wyszukiwania. `describe` decyduje, ile treści artykułu trafia do pozycji. */
async function collectDocs(describe: (article: Article) => SearchDoc | Promise<SearchDoc>): Promise<SearchDoc[]> {
  const [all, glossary] = await Promise.all([getAllArticles(), getGlossary()]);
  const articles = all.filter((a) => !extraHrefs.has(articleHref(a)));
  return [
    ...(await Promise.all(articles.map(describe))),
    ...glossary.map((g) => ({
      id: `pojecie-${g.id}`,
      title: `${g.term} — ${g.full}`,
      category: 'Słownik',
      href: termHref(g),
      summary: g.def,
    })),
    ...searchExtras,
  ];
}

/** Pozycje „Popularne” pokazywane, zanim użytkownik coś wpisze. Nie wymagają wczytania indeksu. */
export async function getPopularSearches(): Promise<SearchHit[]> {
  const docs = await collectDocs(articleDoc);
  return popularSearchIds.flatMap((id) => {
    const doc = docs.find((d) => d.id === id);
    return doc ? [toHit(doc)] : [];
  });
}

/** Ile razy występuje każde słowo tekstu. */
const countWords = (text = '') =>
  words(text).reduce((counts, word) => counts.set(word, (counts.get(word) ?? 0) + 1), new Map<string, number>());

export async function buildSearchIndex(): Promise<SearchIndex> {
  const docs = await collectDocs(articleWithContent);

  // słowo → (nr dokumentu → waga)
  const weights = new Map<string, Map<number, number>>();
  docs.forEach((doc, i) => {
    for (const field of FIELDS) {
      for (const [word, count] of countWords(field.text(doc))) {
        const perDoc = weights.get(word) ?? new Map<number, number>();
        perDoc.set(i, (perDoc.get(i) ?? 0) + field.weight * Math.min(count, MAX_REPEATS));
        weights.set(word, perDoc);
      }
    }
  });

  // Domyślne sortowanie porównuje kody znaków, tak jak operator < w wyszukiwaniu binarnym (engine.ts)
  const vocabulary = [...weights.keys()].sort();

  return {
    docs: docs.map(({ title, category, href, sections }) => ({ title, category, href, sections })),
    words: vocabulary,
    postings: vocabulary.map((word) => [...weights.get(word)!].flat()),
  };
}
