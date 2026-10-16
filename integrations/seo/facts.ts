/**
 * Fakty SEO z wygenerowanego HTML: to, co faktycznie trafia na serwer, a nie to, co strona „chciała”.
 * Czytają je sitemap (indeksowalność, lastmod) i audyt. Parser: ultrahtml (zależność Astro).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ELEMENT_NODE, TEXT_NODE, parse, walkSync, type Node } from 'ultrahtml';

export interface JsonLdBlock {
  data?: unknown;
  error?: string;
}

export interface PageFacts {
  /** ścieżka w serwisie: '/dane/' albo '/404.html' */
  path: string;
  lang?: string;
  titles: string[];
  description?: string;
  canonical?: string;
  robots?: string;
  /** meta refresh — przekierowanie zapisane przez Astro jako HTML */
  refresh?: string;
  ogImage?: string;
  h1: number;
  jsonLd: JsonLdBlock[];
  links: string[];
  /** id elementów (cele kotwic `#…`) — poza <template> */
  ids: string[];
  images: { src?: string; alt?: string }[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Encje HTML w atrybutach i tekście (parser zostawia je w surowej postaci). */
export const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e.toLowerCase()] ?? m;
  });

const textOf = (node: Node): string =>
  (node.children ?? []).map((c: Node) => (c.type === TEXT_NODE ? c.value : c.type === ELEMENT_NODE ? textOf(c) : '')).join('');

const insideSvg = (node: Node) => {
  for (let p = node.parent; p; p = p.parent) if (p.name === 'svg') return true;
  return false;
};

/** Zawartość <template> to wzór dla skryptu (np. wynik wyszukiwania), a nie część strony — robot jej nie widzi. */
const insideTemplate = (node: Node) => {
  for (let p = node.parent; p; p = p.parent) if (p.name === 'template') return true;
  return false;
};

export function factsFromHtml(html: string, path: string): PageFacts {
  const facts: PageFacts = { path, titles: [], h1: 0, jsonLd: [], links: [], ids: [], images: [] };

  walkSync(parse(html), (node) => {
    if (node.type !== ELEMENT_NODE) return;
    const a: Record<string, string> = node.attributes ?? {};
    if (a.id && !insideTemplate(node)) facts.ids.push(decode(a.id));
    switch (node.name) {
      case 'html':
        facts.lang = a.lang;
        break;
      case 'title':
        // <title> w <svg> to podpis grafiki, nie tytuł strony
        if (!insideSvg(node)) facts.titles.push(decode(textOf(node)).trim());
        break;
      case 'meta': {
        const key = (a.name ?? a.property ?? a['http-equiv'] ?? '').toLowerCase();
        const content = a.content === undefined ? undefined : decode(a.content);
        if (key === 'description') facts.description = content;
        else if (key === 'robots') facts.robots = content;
        else if (key === 'refresh') facts.refresh = content;
        else if (key === 'og:image') facts.ogImage = content;
        break;
      }
      case 'link':
        if (a.rel === 'canonical') facts.canonical = a.href && decode(a.href);
        break;
      case 'script':
        if (a.type === 'application/ld+json') {
          const raw = textOf(node);
          try {
            facts.jsonLd.push({ data: JSON.parse(raw) });
          } catch (error) {
            facts.jsonLd.push({ error: (error as Error).message });
          }
        }
        break;
      case 'h1':
        facts.h1++;
        break;
      case 'a':
        if (a.href !== undefined && !insideTemplate(node)) facts.links.push(decode(a.href));
        break;
      case 'img':
        facts.images.push({ src: a.src && decode(a.src), alt: a.alt === undefined ? undefined : decode(a.alt) });
        break;
    }
  });
  return facts;
}

/** Strona trafia do indeksu: bez noindex i nie jest przekierowaniem. */
export const isIndexable = (f: PageFacts) => !f.refresh && !/noindex/i.test(f.robots ?? '');

/** Węzły grafu JSON-LD strony (spłaszczone @graph). */
export function graphNodes(f: PageFacts): Record<string, unknown>[] {
  return f.jsonLd.flatMap((block) => {
    const data = block.data as Record<string, unknown> | undefined;
    if (!data) return [];
    const graph = (data['@graph'] as Record<string, unknown>[] | undefined) ?? [data];
    return graph.filter((n) => n && typeof n === 'object');
  });
}

/** Data ostatniej zmiany strony — z węzła WebPage w grafie (to samo, co widzi Google). */
export function modifiedOf(f: PageFacts): string | undefined {
  const page = graphNodes(f).find((n) => typeof n['@id'] === 'string' && (n['@id'] as string).endsWith('#webpage'));
  return page?.dateModified as string | undefined;
}

/** Plik HTML strony w katalogu buildu: '/dane/' → dane/index.html. */
export const htmlFileFor = (dir: URL, path: string) =>
  new URL(path.endsWith('/') ? `.${path}index.html` : `.${path}`, dir);

const cache = new Map<string, Promise<PageFacts | undefined>>();

/** Fakty strony z dysku (z cache na czas buildu); brak pliku → undefined. */
export function readFacts(dir: URL, path: string): Promise<PageFacts | undefined> {
  const file = fileURLToPath(htmlFileFor(dir, path));
  if (!cache.has(file)) {
    cache.set(
      file,
      readFile(file, 'utf8').then(
        (html) => factsFromHtml(html, path),
        () => undefined,
      ),
    );
  }
  return cache.get(file)!;
}

export const clearFactsCache = () => cache.clear();
