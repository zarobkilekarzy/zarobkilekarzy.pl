/**
 * `serialize` dla @astrojs/sitemap: o tym, czy strona trafia do mapy i z jaką datą, decyduje
 * jej wygenerowany HTML. Strona z noindex albo z canonical wskazującym gdzie indziej wypada sama,
 * a `lastmod` to dateModified z jej grafu JSON-LD — mapa nie może się rozjechać ze stronami.
 */
import type { SitemapItem } from '@astrojs/sitemap';
import { isIndexable, modifiedOf, readFacts } from './facts';

export function createSitemapSerializer(getOutDir: () => URL | undefined) {
  return async (item: SitemapItem): Promise<SitemapItem | undefined> => {
    const dir = getOutDir();
    if (!dir) return item;
    const facts = await readFacts(dir, new URL(item.url).pathname);
    if (!facts) return item;
    if (!isIndexable(facts)) return undefined;
    if (facts.canonical && facts.canonical !== item.url) return undefined;
    const lastmod = modifiedOf(facts);
    return lastmod ? { ...item, lastmod } : item;
  };
}
