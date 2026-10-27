/**
 * Rejestr obrazków OG: wszystkie trasy, które mają obrazek, i adres obrazka dla danej strony.
 * Konwencja adresu: trasa /mechanizmy/fikcyjne-wizyty/ → /og/mechanizmy/fikcyjne-wizyty.png,
 * strona główna → /og/index.png. Strony niczego nie wpinają — BaseLayout liczy adres ze ścieżki.
 */
import { createHash } from 'node:crypto';
import type { ImageMetadata } from 'astro';
import { raw } from '@/lib/images';
import { articleHref, getPublishedArticles } from '@/lib/content';
import { getNews, newsHref, newsImage } from '@/lib/news';
import { ogArticleMedia, ogPages } from '@/data/og';
import { ogArticleMediaEn, ogPagesEn } from '@/data/en/og';
import { getTranslations } from '@/i18n/translations';
import { getPublishedNewsTranslations, newsEnHref } from '@/i18n/news';
import { articleOg, articleOgEn, pageOg, type OgEntry } from './presets';

export type { OgEntry };
export { OG_HEIGHT, OG_WIDTH } from './presets';

const DEFAULT_ROUTE = '/';
const DEFAULT_ROUTE_EN = '/en/';

async function collect(): Promise<OgEntry[]> {
  const [articles, news] = await Promise.all([getPublishedArticles(), getNews()]);
  // Wpis aktualności: preset strony z tytułem i leadem wpisu — bez daty na obrazku (na OG nic, co się zmienia).
  // Grafika z ogArticleMedia (np. ta sama co na stronie, której dotyczy wpis) zastępuje zdjęcie.
  const newsOg = news.map((entry) =>
    pageOg(newsHref(entry), {
      eyebrow: 'Aktualności',
      title: entry.data.title,
      lead: entry.data.summary,
      ...(ogArticleMedia[newsHref(entry)] ?? { photo: newsImage(entry).src, position: entry.data.cover ? '0% 0%' : '70% 50%' }),
      footer: { text: 'Co nowego w projekcie' },
    }),
  );
  return [...Object.entries(ogPages).map(([route, page]) => pageOg(route, page)), ...articles.map((a) => articleOg(a, ogArticleMedia[articleHref(a)])), ...newsOg, ...(await collectEn())];
}

/**
 * Strony angielskie: ten sam szablon z napisami po angielsku. Wykresy z podpisami biorą wersję z src/data/en/og.ts
 * (klucz = adres polskiego oryginału); grafika bez tekstu (ilustracja, zdjęcie) przechodzi z polskiej strony.
 */
async function collectEn(): Promise<OgEntry[]> {
  const [translations, news] = await Promise.all([getTranslations(), getPublishedNewsTranslations()]);
  const newsOg = news.map((t) => {
    const route = newsHref(t.source);
    const media = ogArticleMediaEn[route] ?? ogArticleMedia[route] ?? { photo: newsImage(t.source).src, position: t.source.data.cover ? '0% 0%' : '70% 50%' };
    return pageOg(newsEnHref(t), { eyebrow: 'News', title: t.entry.data.title, lead: t.entry.data.summary, ...media, footer: { text: 'What’s new in the project' } }, 'en');
  });
  return [
    ...Object.entries(ogPagesEn).map(([route, page]) => pageOg(route, page, 'en')),
    ...translations.map((t) => articleOgEn(t, ogArticleMediaEn[articleHref(t.source)] ?? textless(ogArticleMedia[articleHref(t.source)]))),
    ...newsOg,
  ];
}

/** Media polskiego artykułu, które nie mają napisów (np. wirus na obrazku COVID-19) — reszta wymaga wersji EN. */
const textless = (media?: (typeof ogArticleMedia)[string]) =>
  media?.panels?.every((p) => !p.head && !p.svg.includes('<text')) ? { panels: media.panels } : undefined;

// W buildzie liczymy raz; w dev za każdym razem, żeby zmiana frontmattera była od razu widoczna
let cached: Promise<OgEntry[]> | undefined;
export const getOgEntries = () => (import.meta.env.PROD ? (cached ??= collect()) : collect());

/** Trasa → parametr endpointu: '/' → 'index', '/a/b/' → 'a/b' */
export const ogSlug = (route: string) => route.replace(/^\/|\/$/g, '') || 'index';

/** Krótki skrót treści obrazka — zmiana treści zmienia adres, więc platformy pobiorą nowy obrazek. */
// Zdjęcia do hasha przez raw(): zwykły JSON.stringify czyta pola obrazka i Astro kopiuje oryginał do dist (lib/images)
const imageSafe = (_key: string, value: unknown) => {
  if (value && typeof value === 'object' && 'src' in value && 'format' in value) {
    const { src, width, height, format } = raw(value as ImageMetadata);
    return { src, width, height, format };
  }
  return value;
};
const version = (entry: OgEntry) => createHash('sha1').update(JSON.stringify(entry, imageSafe)).digest('hex').slice(0, 8);

export const ogUrl = (entry: OgEntry) => `/og/${ogSlug(entry.route)}.png?v=${version(entry)}`;

const withSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);
const warned = new Set<string>();

/**
 * Obrazek dla strony; trasy bez wpisu dostają obrazek domyślny (strona główna).
 * `fallback: false` — tylko własny wpis, bez domyślnego (strony poza indeksem, np. prototyp udostępniany linkiem).
 */
export async function ogImageFor(pathname: string, fallback = true): Promise<{ url: string; alt: string } | undefined> {
  const entries = await getOgEntries();
  const path = withSlash(pathname);
  let entry = entries.find((e) => e.route === path);
  if (!entry && !fallback) return undefined;
  if (!entry) {
    if (!warned.has(path)) {
      warned.add(path);
      console.warn(`[og] ${path}: brak obrazka OG — użyto domyślnego (dodaj wpis w src/data/og.ts lub preset)`);
    }
    // strony angielskie bez własnego wpisu dostają angielską okładkę
    entry = entries.find((e) => e.route === (path.startsWith('/en/') ? DEFAULT_ROUTE_EN : DEFAULT_ROUTE))!;
  }
  return { url: ogUrl(entry), alt: entry.alt };
}
