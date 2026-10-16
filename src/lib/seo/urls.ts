/**
 * Adresy w formie kanonicznej: strony kończą się ukośnikiem (trailingSlash: 'always'),
 * pliki (z rozszerzeniem) — nie. Bez importów z aliasem `@/`: moduł czyta też integracja buildu.
 */

/** Czy ostatni segment ścieżki ma rozszerzenie (plik: .pdf, .png, .xml…). */
export const isFilePath = (path: string) => /\.[a-z0-9]+$/i.test(path.split('/').pop() ?? '');

/** Ścieżka strony z ukośnikiem na końcu; pliki bez zmian. */
export const withSlash = (path: string) => (isFilePath(path) || path.endsWith('/') ? path : `${path}/`);

/** Absolutny adres w serwisie. */
export const absoluteUrl = (path: string, site: URL | string) => new URL(path, site).href;
