/**
 * <head>: tytuł, opis, język, canonical, robots, obrazek podglądu oraz długości i duplikaty
 * tytułów i opisów między stronami.
 */
import { contentPages, grouped, type Finding, type Rule } from '../context';
import { isIndexable } from '../../facts';

/** Google pokazuje ok. 580 px tytułu (~60 znaków) i ok. 160 znaków opisu. */
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 160;

export const head: Rule = (ctx) => {
  const out: Finding[] = [];
  const err = (page: string, message: string) => out.push({ rule: 'head', level: 'error', message, pages: [page] });
  const warn = (page: string, message: string) => out.push({ rule: 'head', level: 'warn', message, pages: [page] });

  for (const p of ctx.pages.values()) {
    if (p.refresh) continue;
    const indexable = isIndexable(p);
    if (p.path === '/404.html') {
      if (indexable) err(p.path, 'strona 404 bez noindex');
      continue;
    }

    if (p.titles.length !== 1 || !p.titles[0]) err(p.path, `<title>: ${p.titles.length === 0 ? 'brak' : p.titles.length > 1 ? `${p.titles.length} znaczniki` : 'pusty'}`);
    if (!p.description) err(p.path, 'brak meta description');
    if (!p.lang) err(p.path, 'brak atrybutu lang w <html>');
    if (!p.robots) warn(p.path, 'brak meta robots');

    if (!p.canonical) err(p.path, 'brak canonical');
    else {
      const self = new URL(p.path, ctx.site).href;
      let canonical: URL | undefined;
      try {
        canonical = new URL(p.canonical);
      } catch {
        err(p.path, `canonical nie jest adresem absolutnym: ${p.canonical}`);
      }
      if (canonical && canonical.origin !== ctx.site.origin) err(p.path, `canonical spoza serwisu: ${p.canonical}`);
      if (canonical && !/\.[a-z0-9]+$/i.test(canonical.pathname) && !canonical.pathname.endsWith('/'))
        err(p.path, `canonical bez ukośnika na końcu: ${p.canonical}`);
      if (canonical && indexable && p.canonical !== self) warn(p.path, `canonical wskazuje inny adres (${p.canonical}) — upewnij się, że to duplikat`);
    }

    if (indexable) {
      if (!p.ogImage) err(p.path, 'brak og:image');
      else {
        const image = new URL(p.ogImage, ctx.site);
        if (image.origin === ctx.site.origin && !ctx.files.has(decodeURI(image.pathname))) err(p.path, `og:image nie istnieje w buildzie: ${image.pathname}`);
      }
      const title = p.titles[0] ?? '';
      if (title.length > TITLE_MAX) warn(p.path, `tytuł ma ${title.length} znaków (> ${TITLE_MAX}) — wyszukiwarka go utnie; rozważ seoTitle`);
      const d = p.description?.length ?? 0;
      if (d > DESCRIPTION_MAX) warn(p.path, `opis ma ${d} znaków (> ${DESCRIPTION_MAX}) — wyszukiwarka go utnie`);
      else if (d > 0 && d < DESCRIPTION_MIN) warn(p.path, `opis ma tylko ${d} znaków (< ${DESCRIPTION_MIN})`);
    }
  }

  // Duplikaty między stronami w indeksie: wyszukiwarka nie odróżni ich w wynikach
  const indexed = contentPages(ctx).filter(isIndexable);
  const dupes = (key: 'title' | 'description') =>
    grouped('head', 'warn', indexed.map((p) => [(key === 'title' ? p.titles[0] : p.description) ?? '', p.path] as [string, string]), (v) => `ten sam ${key === 'title' ? 'tytuł' : 'opis'} na kilku stronach: „${v.slice(0, 80)}”`)
      .filter((f) => (f.pages?.length ?? 0) > 1);
  out.push(...dupes('title'), ...dupes('description'));
  return out;
};
