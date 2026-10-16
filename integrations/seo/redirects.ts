/**
 * Rejestr przekierowań (src/data/seo/redirects.ts) w dwóch formatach:
 * - `redirects` dla astro.config — dev i zapasowe przekierowania HTML w buildzie (tylko strony),
 * - plik `_redirects` dla Cloudflare — prawdziwe 301 na krawędzi, także dla plików.
 */
import { expiredRedirects, redirects, type Redirect } from '../../src/data/seo/redirects';
import { isFilePath } from '../../src/lib/seo/urls';

export { expiredRedirects, redirects, type Redirect };

/** Przekierowania stron dla `redirects` w astro.config (Astro nie obsługuje tu plików). */
export const astroRedirects = (): Record<string, string> =>
  Object.fromEntries(redirects.filter((r) => !isFilePath(r.from)).map((r) => [r.from, r.to]));

/** Warianty źródła: strona z ukośnikiem i bez (Cloudflare dopasowuje ścieżkę dokładnie). */
const sources = (from: string) => (isFilePath(from) ? [from] : [from, from.replace(/\/$/, '')]);

/** Treść dist/_redirects: najpierw reguły statyczne, potem z gwiazdką (wymóg Cloudflare). */
export function redirectsFile(list: Redirect[] = redirects): string {
  const isDynamic = (r: Redirect) => r.from.includes('*') || r.from.includes(':');
  const ordered = [...list.filter((r) => !isDynamic(r)), ...list.filter(isDynamic)];
  // komentarz z powodem raz na grupę kolejnych reguł o tym samym powodzie
  const lines = ordered.flatMap((r, i) => [
    ...(ordered[i - 1]?.note === r.note ? [] : [`# ${r.note}`]),
    ...sources(r.from).map((src) => `${src} ${r.to} ${r.status ?? 301}`),
  ]);
  return ['# Wygenerowane przez integrations/seo z src/data/seo/redirects.ts — nie edytować ręcznie.', ...lines, ''].join('\n');
}
