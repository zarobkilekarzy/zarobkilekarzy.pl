/**
 * Linki wewnętrzne: cel istnieje, prowadzi wprost (nie przez przekierowanie) i ma formę kanoniczną
 * (strona z ukośnikiem). `href="#"` to placeholder — link donikąd dla czytelnika i robota.
 */
import { exists, grouped, hasPage, internalPath, redirectFrom, type Finding, type Rule } from '../context';
import { isFilePath, withSlash } from '../../../../src/lib/seo/urls';

export const links: Rule = (ctx) => {
  const missing: [string, string][] = [];
  const viaRedirect: [string, string][] = [];
  const noSlash: [string, string][] = [];
  const placeholders: [string, string][] = [];
  const badAnchors: [string, string][] = [];

  for (const p of ctx.pages.values()) {
    if (p.refresh) continue;
    for (const href of p.links) {
      if (href === '#' || href === '') {
        placeholders.push(['#', p.path]);
        continue;
      }
      if (href.startsWith('#')) {
        const id = decodeURIComponent(href.slice(1));
        if (!p.ids.includes(id)) badAnchors.push([`${p.path}#${id}`, p.path]);
        continue;
      }
      const path = internalPath(href, p.path, ctx.site);
      if (path === null) continue;
      const canonical = withSlash(path);

      // kotwica: element o tym id musi istnieć na stronie docelowej (zmiana nagłówka zrywa link)
      const hash = href.indexOf('#');
      if (hash >= 0 && href.length > hash + 1 && !isFilePath(path)) {
        const id = decodeURIComponent(href.slice(hash + 1));
        const target = ctx.pages.get(canonical);
        if (target && !target.refresh && !target.ids.includes(id)) badAnchors.push([`${canonical}#${id}`, p.path]);
      }
      if (!isFilePath(path) && path !== canonical) noSlash.push([path, p.path]);

      if (exists(ctx, canonical)) continue;
      const redirect = redirectFrom(ctx, canonical);
      const astroRedirect = ctx.pages.get(canonical)?.refresh;
      if (redirect || astroRedirect) viaRedirect.push([`${canonical} → ${redirect?.to ?? astroRedirect}`, p.path]);
      else missing.push([canonical, p.path]);
    }
  }

  const out: Finding[] = [
    ...grouped('links', 'error', missing, (t) => `link do nieistniejącej strony lub pliku: ${t}`),
    ...grouped('links', 'error', badAnchors, (t) => `kotwica bez celu na stronie: ${t}`),
    ...grouped('links', 'warn', viaRedirect, (t) => `link przez przekierowanie: ${t}`),
    ...grouped('links', 'warn', noSlash, (t) => `link bez ukośnika na końcu (dodatkowy skok 308): ${t}`),
  ];
  if (placeholders.length) {
    const pages = [...new Set(placeholders.map(([, page]) => page))];
    out.push({
      rule: 'links',
      level: 'warn',
      message: `${placeholders.length} linków href="#" na ${pages.length} stronach (zapowiedzi bez strony, puste pozycje stopki)`,
      pages,
    });
  }
  // Strony bez żadnego linku przychodzącego (sieroty) — robot znajdzie je tylko przez sitemapę
  const linked = new Set<string>(['/']);
  for (const p of ctx.pages.values())
    for (const href of p.links) {
      const path = internalPath(href, p.path, ctx.site);
      if (path) linked.add(withSlash(path));
    }
  for (const p of ctx.pages.values())
    if (hasPage(ctx, p.path) && p.path !== '/404.html' && !linked.has(p.path))
      out.push({ rule: 'links', level: 'warn', message: 'strona bez linków z innych stron (sierota)', pages: [p.path] });
  return out;
};
