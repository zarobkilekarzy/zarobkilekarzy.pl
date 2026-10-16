/**
 * Rejestr przekierowań: źródła w formie kanonicznej, bez powtórzeń, nieprzykryte istniejącą stroną;
 * cel istnieje i nie jest kolejnym przekierowaniem (łańcuch).
 */
import { exists, hasPage, redirectFrom, type Finding, type Rule } from '../context';
import { isFilePath, withSlash } from '../../../../src/lib/seo/urls';

export const redirects: Rule = (ctx) => {
  const out: Finding[] = [];
  const add = (level: 'error' | 'warn', message: string) => out.push({ rule: 'redirects', level, message });
  const seen = new Set<string>();

  for (const r of ctx.redirects) {
    const label = `${r.from} → ${r.to}`;
    if (seen.has(r.from)) add('error', `źródło powtórzone w rejestrze: ${r.from}`);
    seen.add(r.from);
    if (!r.from.startsWith('/')) add('error', `źródło musi być ścieżką w serwisie: ${label}`);
    if (!isFilePath(r.from) && !r.from.endsWith('/') && !r.from.includes('*')) add('error', `źródło strony bez ukośnika na końcu: ${label}`);
    if (hasPage(ctx, withSlash(r.from)) || (isFilePath(r.from) && ctx.files.has(r.from)))
      add('error', `źródło przykryte istniejącą stroną lub plikiem — przekierowanie nie zadziała: ${label}`);

    if (/^https?:\/\//.test(r.to)) continue;
    // cel może mieć fragment (/dzialaj/#napisz) — Cloudflare go przenosi, sprawdzamy samą ścieżkę
    const target = r.to.replace(/[?#].*$/, '');
    if (redirectFrom(ctx, target)) add('error', `łańcuch przekierowań: ${label} → ${redirectFrom(ctx, target)!.to}`);
    else if (!exists(ctx, target)) add('error', `cel przekierowania nie istnieje w buildzie: ${label}`);
  }
  return out;
};
