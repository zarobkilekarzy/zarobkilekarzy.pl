/**
 * Dostęp do kolekcji treści. Komponenty i strony nie wołają getCollection()
 * bezpośrednio — sortowanie, filtrowanie, adresy i powiązania są zdefiniowane tylko tutaj.
 */
import { getCollection, getEntries, getEntry, render, type CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import type { Category, Term, TopicId } from '@/types';

export type Article = CollectionEntry<'articles'>;

/** Tekst z treścią i stanowiskiem redakcji — artykuł albo jego tłumaczenie (src/i18n/translations.ts). */
type Text = Pick<Article, 'body'> & { data: { editorial?: string[] } };

/** Segment adresu dla każdej kategorii: Mechanizm → /mechanizmy/… */
const SECTIONS: Record<Category, { path: string; label: string }> = {
  Mechanizm: { path: 'mechanizmy', label: 'Mechanizmy' },
  Analiza: { path: 'analizy', label: 'Analizy' },
  Dane: { path: 'dane', label: 'Dane' },
  Przewodnik: { path: 'przewodnik', label: 'Przewodnik' },
  'Projekt ustawy': { path: 'postulat', label: 'Postulat' },
  Narzędzie: { path: 'narzedzia', label: 'Narzędzia' },
};

export const sectionOf = (article: Article) => SECTIONS[article.data.category];

/** Artykuł ma własną podstronę, gdy ma treść (nie tylko frontmatter). */
export const isPublished = (article: Article) => Boolean(article.body?.trim());

/**
 * Adres artykułu: podstrona dla opublikowanych, w przeciwnym razie tymczasowy
 * `href` z frontmattera (np. kotwica na stronie głównej) albo „#”.
 */
export const articleHref = (article: Article) =>
  isPublished(article) ? `/${sectionOf(article).path}/${article.id}/` : (article.data.href ?? '#');

/** Data do sortowania „nowe i zaktualizowane”: aktualizacja ma pierwszeństwo przed publikacją. */
const freshness = (article: Article) => article.data.updated ?? article.data.date;

/** Artykuły z datą, od najświeższych. */
export async function getDatedArticles() {
  const all = await getCollection('articles', (a) => freshness(a) !== undefined);
  return all.sort((a, b) => freshness(b)!.valueOf() - freshness(a)!.valueOf());
}

/** Wyróżniony materiał + lista najnowszych (bez wyróżnionego). */
export async function getLatest(limit = 5) {
  const dated = await getDatedArticles();
  const featured = dated.find((a) => a.data.featured);
  const rest = dated.filter((a) => a !== featured).slice(0, limit);
  return { featured, rest };
}

export async function getAllArticles() {
  const all = await getCollection('articles');
  return all.sort((a, b) => a.data.title.localeCompare(b.data.title, 'pl'));
}

/** Artykuły z treścią — dla tras /[sekcja]/[id]/. */
export const getPublishedArticles = () => getCollection('articles', isPublished);

/**
 * Powiązane materiały: wskazane we frontmatterze (`related`),
 * a gdy ich brak — inne z tej samej kategorii.
 */
export async function getRelated(article: Article, limit = 3): Promise<Article[]> {
  if (article.data.related?.length) {
    const entries = await getEntries(article.data.related);
    return entries.filter((a): a is Article => Boolean(a)).slice(0, limit);
  }
  const same = await getCollection('articles', (a) => a.data.category === article.data.category && a.id !== article.id);
  return same.sort((a, b) => a.data.title.localeCompare(b.data.title, 'pl')).slice(0, limit);
}

/** Artykuł o danym id — brak wpisu to błąd budowania, a nie cichy martwy link. */
export async function getArticle(id: string): Promise<Article> {
  const entry = await getEntry('articles', id);
  if (!entry) throw new Error(`Brak wpisu „${id}” w src/content/articles`);
  return entry;
}

/** Elementy z odnośnikiem `ref` (id artykułu) uzupełnione o adres i tytuł celu. */
export function withTargets<T extends { ref: string }>(items: T[]) {
  return Promise.all(
    items.map(async ({ ref, ...rest }) => {
      const target = await getArticle(ref);
      return { ...rest, href: articleHref(target), target: target.data.title };
    }),
  );
}

/** Działy materiału jako lista (pole `topic` przyjmuje jeden dział albo kilka). */
const topicsOf = (article: Article): TopicId[] => [article.data.topic ?? []].flat();

const byOrder = (a: Article, b: Article) =>
  (a.data.order ?? Infinity) - (b.data.order ?? Infinity) || a.data.title.localeCompare(b.data.title, 'pl');

/**
 * Spis strony-indeksu: działy w kolejności `topics`, każdy z opisem z `info`,
 * a w dziale materiały według `order`, potem alfabetycznie.
 */
export async function getTopicGroups<T extends TopicId, I>(topics: readonly T[], info: Record<T, I>) {
  const entries = await getCollection('articles', (a) => a.data.topic !== undefined);
  return topics.map((topic) => ({
    topic,
    info: info[topic],
    articles: entries.filter((a) => topicsOf(a).includes(topic)).sort(byOrder),
  }));
}

/** Liczba różnych materiałów w spisie (materiał z kilkoma działami liczy się raz). */
export const countArticles = (groups: { articles: Article[] }[]) =>
  new Set(groups.flatMap((g) => g.articles.map((a) => a.id))).size;

/** Usuwa wyrażenia JSX `{…}`, także zagnieżdżone: ich zawartość to kod, nie tekst. */
function stripExpressions(source: string): string {
  let depth = 0;
  let text = '';
  for (const ch of source) {
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0) text += ch;
  }
  return text;
}

/** Definicja przypisu GFM w źródle artykułu: `[^id]: treść` (jedna linia). */
const FOOTNOTE_DEF = /^\[\^[^\]]+\]:.*$/gm;

/** Przypisy artykułu (`[^id]: …`): liczba i adresy, na które się powołują — do nagłówka i JSON-LD. */
export function getFootnotes(article: Text): { count: number; urls: string[] } {
  const defs = article.body?.match(FOOTNOTE_DEF) ?? [];
  const urls = defs.flatMap((d) => [...d.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]));
  return { count: defs.length, urls: [...new Set(urls)] };
}

/**
 * Tekst, który czytelnik widzi w artykule (treść i stanowisko redakcji), bez składni MDX i Markdown.
 * Ze znaczników bloków zostają wartości atrybutów (tytuł ramki, opis zrzutu ekranu),
 * z linków zostaje ich tekst, a adresy znikają. Przypisy (opisy źródeł) się nie liczą.
 * Do liczenia słów i do wyszukiwarki.
 */
export function plainText(article: Text): string {
  const body = stripExpressions(article.body ?? '')
    .replace(FOOTNOTE_DEF, ' ')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/^(?:import|export)\s.*$/gm, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, (tag) => (tag.match(/"[^"]*"/g) ?? []).join(' '))
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ');
  return [body, ...(article.data.editorial ?? [])].join(' ');
}

/** Szacowany czas czytania w minutach (≈200 słów/min). */
export function readingMinutes(article: Text): number {
  const words = plainText(article).match(/\p{L}+/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / 200));
}

/** Sekcje artykułu: nagłówki ## z kotwicami, te same, które pokazuje spis treści. */
export async function getSections(article: Article | CollectionEntry<'articlesEn'>): Promise<MarkdownHeading[]> {
  const { headings } = await render(article);
  return headings.filter((h) => h.depth === 2);
}

/**
 * Hasła słownika alfabetycznie (po polsku), z rozwiązanymi odnośnikami „Więcej”:
 * `ref` → adres i tytuł artykułu. Artykuł bez strony (zapowiedź bez `href`) to błąd budowania.
 */
export async function getGlossary(): Promise<Term[]> {
  const entries = await getCollection('glossary');
  const terms = await Promise.all(
    entries.map(async ({ id, data }) => {
      const more = await Promise.all(
        data.more.map(async (item) => {
          if (!('ref' in item)) return item;
          const article = await getArticle(item.ref.id);
          const href = articleHref(article);
          if (href === '#') throw new Error(`Hasło „${id}”: artykuł „${article.id}” nie ma jeszcze strony`);
          return { label: item.label ?? article.data.title, href: item.anchor ? `${href}#${item.anchor}` : href };
        }),
      );
      return { id, tab: data.tab ?? data.term, term: data.term, full: data.full, def: data.def, more, sources: data.sources, home: data.home };
    }),
  );
  return terms.sort((a, b) => a.term.localeCompare(b.term, 'pl'));
}

/** Hasła modułu „Słowniczek” na stronie głównej (pole `home`), w kolejności tego pola. */
export async function getHomeGlossary(): Promise<Term[]> {
  const terms = await getGlossary();
  return terms.filter((t) => t.home !== undefined).sort((a, b) => a.home! - b.home!);
}

/** Adres hasła na stronie słownika. */
export const termHref = (term: Pick<Term, 'id'>) => `/slownik/#${term.id}`;
