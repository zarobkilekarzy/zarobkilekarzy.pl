import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

// Kanał RSS = baza źródeł. Każdy wpis prowadzi WPROST do oryginalnego,
// ogólnodostępnego materiału (stron wewnętrznych per-artykuł nie mamy).
// Pomijamy wpisy poglądowe (`example: true`) — nie syndykujemy placeholderów.
export async function GET(context) {
  const articles = (await getCollection('articles'))
    .filter((a) => !a.data.example)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'zarobkilekarzy.pl — baza źródeł',
    description:
      'Odnośniki do ogólnodostępnych materiałów o wynagrodzeniach w ochronie zdrowia: prasy, raportów i danych publicznych.',
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.date,
      description: a.data.excerpt,
      link: a.data.url,
      categories: [a.data.category],
    })),
    customData: '<language>pl-pl</language>',
  });
}
