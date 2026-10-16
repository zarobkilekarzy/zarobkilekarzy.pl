import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { identity } from '@/data/seo/identity';
import { getFeedItems } from '@/lib/seo/feeds';

/**
 * Kanał RSS: nowe i zaktualizowane materiały serwisu (z datą), od najświeższych.
 * Uwaga: na dotychczasowej stronie /rss.xml był kanałem „bazy źródeł” (linki do prasy) — zob. docs/seo-system.md § 12.
 */
export const GET: APIRoute = async ({ site }) => {
  const items = (await getFeedItems())
    .filter((i) => i.published)
    .sort((a, b) => b.fresh!.valueOf() - a.fresh!.valueOf());

  return rss({
    title: identity.name,
    description: identity.description,
    site: site!,
    items: items.map(({ article, href, section, published }) => ({
      title: article.data.title,
      link: href,
      pubDate: published,
      description: article.data.summary,
      categories: [section],
    })),
    customData: `<language>pl-pl</language>`,
  });
};
