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
import { articleOg, pageOg, type OgEntry } from './presets';

export type { OgEntry };
export { OG_HEIGHT, OG_WIDTH } from './presets';

const DEFAULT_ROUTE = '/';

async function collect(): Promise<OgEntry[]> {
  const [articles, news] = await Promise.all([getPublishedArticles(), getNews()]);
  // Wpis aktualności: preset strony z tytułem i leadem wpisu — bez daty na obrazku (na OG nic, co się zmienia)
  const newsOg = news.map((entry) =>
    pageOg(newsHref(entry), {
      eyebrow: 'Aktualności',
      title: entry.data.title,
      lead: entry.data.summary,
      photo: newsImage(entry).src,
      position: entry.data.cover ? '0% 0%' : '70% 50%',
      footer: { text: 'Co nowego w projekcie' },
    }),
  );
  return [...Object.entries(ogPages).map(([route, page]) => pageOg(route, page)), ...articles.map((a) => articleOg(a, ogArticleMedia[articleHref(a)])), ...newsOg];
}

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

/** Obrazek dla strony; trasy bez wpisu dostają obrazek domyślny (strona główna). */
export async function ogImageFor(pathname: string): Promise<{ url: string; alt: string }> {
  const entries = await getOgEntries();
  const path = withSlash(pathname);
  let entry = entries.find((e) => e.route === path);
  if (!entry) {
    if (!warned.has(path)) {
      warned.add(path);
      console.warn(`[og] ${path}: brak obrazka OG — użyto domyślnego (dodaj wpis w src/data/og.ts lub preset)`);
    }
    entry = entries.find((e) => e.route === DEFAULT_ROUTE)!;
  }
  return { url: ogUrl(entry), alt: entry.alt };
}
