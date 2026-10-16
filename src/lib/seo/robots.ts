/**
 * Dyrektywy dla robotów: meta robots stron i plik robots.txt.
 * Politykę wobec botów AI (Content Signals, blokady crawlerów) ustawia Cloudflare —
 * „managed robots.txt” dokleja swój blok przed tym plikiem. Tu jest tylko to, co wynika z buildu.
 */

/** max-image-preview:large — duże miniatury w wynikach i w Discover. */
export const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
/** Strona poza indeksem, ale jej linki dalej się liczą. */
export const ROBOTS_NOINDEX = 'noindex, follow';

/**
 * Ścieżki techniczne, których roboty nie mają odwiedzać. Strony poza indeksem oznaczamy `noindex`,
 * nie tutaj — zakaz w robots.txt uniemożliwiłby robotom przeczytanie tego `noindex`.
 */
const DISALLOW: string[] = [];

export function robotsTxt(site: URL | string): string {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const rules = ['User-agent: *', 'Allow: /', ...DISALLOW.map((path) => `Disallow: ${path}`)];
  return `${rules.join('\n')}\n\nSitemap: ${sitemap}\n`;
}
