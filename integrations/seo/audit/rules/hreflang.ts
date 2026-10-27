/**
 * Wersje językowe (hreflang): każda wskazana wersja jest stroną w indeksie, wskazuje z powrotem tę stronę
 * i ma ten sam zestaw wersji. Google pomija pary bez wzajemnego odnośnika, a build tego sam nie widzi —
 * strona EN i jej polski odpowiednik powstają osobno (src/i18n/pages.json, frontmatter `translation`).
 */
import { isIndexable } from '../../facts';
import { contentPages, type Finding, type Rule } from '../context';

export const hreflang: Rule = (ctx) => {
  const out: Finding[] = [];
  const add = (page: string, message: string) => out.push({ rule: 'hreflang', level: 'error', message, pages: [page] });

  for (const p of contentPages(ctx)) {
    if (!p.alternates.length) continue;
    const self = new URL(p.path, ctx.site).href;
    const set = (alternates: typeof p.alternates) => alternates.map((a) => `${a.hreflang} ${a.href}`).sort().join('\n');
    if (!isIndexable(p)) add(p.path, 'hreflang na stronie z noindex');
    if (!p.alternates.some((a) => a.href === self && a.hreflang !== 'x-default')) add(p.path, 'hreflang bez odnośnika do samej strony');

    // x-default wskazuje jedną z wersji — każdy adres sprawdzamy raz
    const others = p.alternates.filter((a, i) => a.href !== self && p.alternates.findIndex((b) => b.href === a.href) === i);
    for (const a of others) {
      const path = decodeURI(new URL(a.href).pathname);
      const target = ctx.pages.get(path);
      if (!target || target.refresh) add(p.path, `hreflang „${a.hreflang}” → ${path}: brak strony`);
      else if (!isIndexable(target)) add(p.path, `hreflang „${a.hreflang}” → ${path}: strona z noindex`);
      else if (set(target.alternates) !== set(p.alternates)) add(p.path, `hreflang „${a.hreflang}” → ${path}: ta strona nie podaje tych samych wersji (brak odnośnika zwrotnego)`);
    }
  }
  return out;
};
