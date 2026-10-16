import type { Link } from '@/types';

export const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Atrybuty dla linku: zewnętrzne otwierają się w nowej karcie. */
export const linkAttrs = (href: string) =>
  isExternal(href) ? { href, target: '_blank', rel: 'noopener' } : { href };

/**
 * Czy pozycja menu wskazuje bieżącą stronę (do aria-current).
 * `match` pozwala oznaczyć całą sekcję, np. '/mechanizmy/' dla wszystkich artykułów w niej.
 */
export function isCurrent(link: Link, pathname: string): boolean {
  if (link.match) return pathname.startsWith(link.match);
  if (link.href.includes('#') || isExternal(link.href)) return false;
  const clean = (p: string) => p.replace(/\/+$/, '') || '/';
  return clean(link.href) === clean(pathname);
}
