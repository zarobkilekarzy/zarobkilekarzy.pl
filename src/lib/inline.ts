/**
 * Minimalny zapis w tekstach z danych: **pogrubienie**, [link](adres) i przypis [^id].
 * Tekst jest escapowany i przechodzi przez polską typografię (typo).
 * Adresy `ref:<id>` rozwiązuje przekazana funkcja (np. przez articleHref). Link bez celu
 * (brak, „#”) zostaje zwykłym tekstem, więc zapowiedź artykułu nie daje martwego odnośnika.
 * Przypisy `[^id]` wymagają listy z lib/notes (`notes`), a ich treść pokazuje article/NoteList.
 */
import { typo } from './format';
import { isExternal } from './links';
import { noteRef, type Notes } from './notes';
import { ui } from '../i18n/ui';
import type { Locale } from '../i18n/locales';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]);
const NOTE = /\[\^([\w-]+)\]/g;

export type Resolve = (href: string) => string | undefined;

/** `locale` — język strony: podpis dla czytników ekranu przy linkach zewnętrznych („otwiera się w nowej karcie”). */
export function inline(text: string, resolve: Resolve = (href) => href, notes?: Notes, locale: Locale = 'pl'): string {
  return esc(typo(text))
    // przed linkami: „[^id]” nie może zostać początkiem „[…](…)”
    .replace(NOTE, (_, id: string) => noteRef(notes, id))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label: string, href: string) => {
      const target = resolve(href);
      if (!target || target === '#') return label;
      return isExternal(target)
        ? `<a href="${target}" target="_blank" rel="noopener">${label}<span class="sr-only"> (${ui[locale].newTab})</span></a>`
        : `<a href="${target}">${label}</a>`;
    });
}

/** Tytuł zakończony kropką — bez podwójnej, gdy kończy się skrótem („2023 r.”). */
export const sentence = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);

/** Ten sam tekst bez znaczników — do PDF, atrybutów i wyszukiwarki. */
export const plain = (text: string) =>
  typo(text).replace(NOTE, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1');
