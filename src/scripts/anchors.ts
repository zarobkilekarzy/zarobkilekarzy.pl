/**
 * Kotwica nagłówka: pod jaki adres #… prowadzi link do sekcji. Jedna reguła dla całego serwisu —
 * korzystają z niej ikony przy nagłówkach (site/HeadingAnchors) i linki do zaznaczenia (site/SelectionShare).
 *
 * Kolejność:
 *   1. data-anchor="…" na nagłówku — gdy cel trzeba wskazać wprost;
 *   2. id regionu, który nagłówek nazywa (<section id="jawnosc" aria-labelledby="jawnosc-title">) —
 *      krótsze i to samo, do którego linkują już menu i wyszukiwarka;
 *   3. własne id nagłówka (Markdown/MDX dostaje je przy budowaniu — lib/markdown/heading-ids.ts);
 *   4. id najbliższego kontenera, który ten nagłówek otwiera (np. <li id="…"><h3>…</h3>);
 * Nagłówek bez żadnego z nich (tytuł karty, wiersz listy) nie dostaje kotwicy. data-no-anchor ją wyłącza.
 */
export const HEADINGS = 'main :is(h2, h3)';

export function anchorFor(h: HTMLElement): string | null {
  // Okna dialogowe i nagłówki będące linkiem (lub w linku) — tam kotwica nie ma sensu
  if (h.closest('[data-no-anchor], dialog, a') || h.querySelector('a:not(.h-anchor)')) return null;
  if (h.dataset.anchor) return h.dataset.anchor;
  if (h.id) {
    const region = h.closest<HTMLElement>(`[id][aria-labelledby~="${CSS.escape(h.id)}"]`);
    return region?.id || h.id;
  }
  const box = h.parentElement?.closest<HTMLElement>('[id]');
  if (box && box.localName !== 'main' && box.querySelector('h1, h2, h3, h4') === h) return box.id;
  return null;
}

/** Kotwica sekcji, w której leży węzeł: ostatni nagłówek z kotwicą przed nim (albo on sam). */
export function anchorBefore(node: Node): string | null {
  const headings = [...document.querySelectorAll<HTMLElement>(HEADINGS)].reverse();
  for (const h of headings) {
    const before = h.contains(node) || h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING;
    if (!before) continue;
    const id = anchorFor(h);
    if (id) return id;
  }
  return null;
}

/** Pełny adres strony z kotwicą (i opcjonalnie dyrektywą fragmentu tekstu #…:~:text=…). */
export const pageUrl = (anchor: string | null, directive = '') =>
  `${location.origin}${location.pathname}${location.search}${anchor || directive ? `#${anchor ?? ''}${directive}` : ''}`;
