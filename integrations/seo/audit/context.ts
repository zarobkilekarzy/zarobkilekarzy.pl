/** Wspólny kontekst reguł audytu: strony, pliki, sitemap, przekierowania i kontrakt starych adresów. */
import type { PageFacts } from '../facts';
import type { Redirect } from '../redirects';
import { isFilePath, withSlash } from '../../../src/lib/seo/urls';

export type Level = 'error' | 'warn';

export interface Finding {
  rule: string;
  level: Level;
  message: string;
  /** strona, na której wystąpił problem (albo lista stron przy problemach zbiorczych) */
  pages?: string[];
}

export interface AuditContext {
  site: URL;
  /** strony HTML z buildu: ścieżka → fakty */
  pages: Map<string, PageFacts>;
  /** wszystkie pliki buildu jako ścieżki: '/og/index.png', '/dane/index.html' */
  files: Set<string>;
  /** adresy z sitemapy (absolutne) */
  sitemap: Set<string>;
  redirects: Redirect[];
  legacy: { urls: readonly string[]; removed: Readonly<Record<string, string>> };
  strict: boolean;
}

export type Rule = (ctx: AuditContext) => Finding[];

/** Strona z treścią (nie przekierowanie Astro) pod tą ścieżką. */
export const hasPage = (ctx: AuditContext, path: string) => {
  const page = ctx.pages.get(path);
  return Boolean(page && !page.refresh);
};

/** Strona albo plik pod tą ścieżką. */
export const exists = (ctx: AuditContext, path: string) =>
  isFilePath(path) ? ctx.files.has(path) : hasPage(ctx, withSlash(path));

export const redirectFrom = (ctx: AuditContext, path: string) => ctx.redirects.find((r) => r.from === path);

/** Strony błędów (404, 503): noindex, bez linków przychodzących, poza audytem treści. */
export const isErrorPage = (path: string) => path === '/404.html' || path === '/503/';

/** Strony, które pokazują się wyszukiwarkom (bez przekierowań i bez stron błędów). */
export const contentPages = (ctx: AuditContext) => [...ctx.pages.values()].filter((p) => !p.refresh && !isErrorPage(p.path));

/**
 * Link → ścieżka w serwisie (bez query i fragmentu) albo null dla linków zewnętrznych
 * i specjalnych (mailto:, tel:, sam fragment). Absolutne adresy własnej domeny to też linki wewnętrzne.
 */
export function internalPath(href: string, from: string, site: URL): string | null {
  if (/^(mailto|tel|javascript|data|sms):/i.test(href) || href.startsWith('#')) return null;
  let url: URL;
  try {
    url = new URL(href, new URL(from, site));
  } catch {
    return null;
  }
  if (url.host !== site.host) return null;
  if (url.pathname.startsWith('/cdn-cgi/')) return null;
  return decodeURI(url.pathname);
}

/** Zbiorcze znalezisko: jedna pozycja na cel, z listą stron, na których występuje. */
export function grouped(rule: string, level: Level, entries: [key: string, page: string][], message: (key: string) => string): Finding[] {
  const map = new Map<string, Set<string>>();
  for (const [key, page] of entries) map.set(key, (map.get(key) ?? new Set()).add(page));
  return [...map].map(([key, pages]) => ({ rule, level, message: message(key), pages: [...pages] }));
}
