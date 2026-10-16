/** Sitemap = dokładnie strony w indeksie: bez noindex, przekierowań i duplikatów; żadnej nie brakuje. */
import { contentPages, type Finding, type Rule } from '../context';
import { isIndexable } from '../../facts';

export const sitemap: Rule = (ctx) => {
  const out: Finding[] = [];
  const add = (level: 'error' | 'warn', page: string, message: string) => out.push({ rule: 'sitemap', level, message, pages: [page] });

  if (!ctx.sitemap.size) {
    out.push({ rule: 'sitemap', level: 'error', message: 'brak sitemap-*.xml w buildzie' });
    return out;
  }
  for (const url of ctx.sitemap) {
    const path = decodeURI(new URL(url).pathname);
    const page = ctx.pages.get(path);
    if (!page) add('error', path, 'adres w sitemapie bez strony w buildzie');
    else if (page.refresh) add('error', path, 'przekierowanie w sitemapie');
    else if (!isIndexable(page)) add('error', path, 'strona z noindex w sitemapie');
  }
  for (const p of contentPages(ctx)) {
    const self = new URL(p.path, ctx.site).href;
    if (isIndexable(p) && (!p.canonical || p.canonical === self) && !ctx.sitemap.has(self)) add('error', p.path, 'strona w indeksie, której nie ma w sitemapie');
  }
  return out;
};
