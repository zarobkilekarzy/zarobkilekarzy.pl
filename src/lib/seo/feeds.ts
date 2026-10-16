/**
 * Materiały do kanałów dla maszyn (rss.xml, llms.txt): wpisy kolekcji, które mają własny adres
 * w serwisie — opublikowane artykuły i zapowiedzi kierujące do osobnej trasy (narzędzia).
 */
import { articleHref, getAllArticles, sectionOf, type Article } from '@/lib/content';

export interface FeedItem {
  article: Article;
  href: string;
  section: string;
  /** publikacja (albo aktualizacja, gdy materiał nie ma daty publikacji) */
  published?: Date;
  /** ostatnia zmiana — do sortowania „od najświeższych” */
  fresh?: Date;
}

export async function getFeedItems(): Promise<FeedItem[]> {
  const all = await getAllArticles();
  return all
    .map((article) => ({
      article,
      href: articleHref(article),
      section: sectionOf(article).label,
      published: article.data.date ?? article.data.updated,
      fresh: article.data.updated ?? article.data.date,
    }))
    .filter(({ article, href }) => href.startsWith('/') && !href.includes('#') && !article.data.noindex);
}
