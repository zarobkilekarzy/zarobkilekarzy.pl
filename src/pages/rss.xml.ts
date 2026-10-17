import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { identity } from '@/data/seo/identity';
import { getFeedItems } from '@/lib/seo/feeds';
import { getNews, newsHref, newsPage } from '@/lib/news';

/**
 * Kanał RSS: nowe i zaktualizowane materiały serwisu (z datą) i wpisy aktualności, od najświeższych.
 * Uwaga: na dotychczasowej stronie /rss.xml był kanałem „bazy źródeł” (linki do prasy).
 */
export const GET: APIRoute = async ({ site }) => {
  const articles = (await getFeedItems())
    .filter((i) => i.published)
    .map(({ article, href, section, published, fresh }) => ({
      title: article.data.title,
      link: href,
      pubDate: published!,
      description: article.data.summary,
      categories: [section],
      fresh: fresh!,
    }));
  const news = (await getNews()).map((entry) => ({
    title: entry.data.title,
    link: newsHref(entry),
    pubDate: entry.data.date,
    description: entry.data.summary,
    categories: [newsPage.title],
    fresh: entry.data.date,
  }));
  const items = [...articles, ...news].sort((a, b) => b.fresh.valueOf() - a.fresh.valueOf());

  return rss({
    title: identity.name,
    description: identity.description,
    site: site!,
    items: items.map(({ fresh: _fresh, ...item }) => item),
    customData: `<language>pl-pl</language>`,
  });
};
