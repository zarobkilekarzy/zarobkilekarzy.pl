/**
 * Przypisy GFM (`tekst[^id]` + `[^id]: …` na końcu pliku) jako zwijana lista:
 * <section data-footnotes> → <details class="footnotes" id="przypisy"> z liczbą przypisów w nagłówku.
 * Te same znaczniki składa article/NoteList na stronach spoza MDX (lib/notes).
 *
 * Tytuł listy nie jest <h2>, tylko role="heading" — nie trafia do spisu treści ani do sekcji
 * wyszukiwarki (wbudowana wtyczka Astro zbiera nagłówki po tej). Id „footnote-label” zostaje,
 * bo wskazują na nie odnośniki w tekście (aria-describedby). Link do przypisu rozwija listę
 * (scripts/open-target), wygląd — styles/footnotes.css.
 */
import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import type { Element, ElementContent } from 'hast';

type HastPlugin = NonNullable<SatteriProcessorOptions['hastPlugins']>[number];

const el = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string): ElementContent => ({ type: 'text', value });

/** Podpis obok tytułu „Przypisy” — wspólny z article/NoteList. */
export const FOOTNOTES_HINT = 'ustawy, dane i komunikaty, z których korzystaliśmy';

export const footnotes: HastPlugin = {
  name: 'zl-footnotes',
  element: {
    filter: ['section'],
    visit(node, ctx) {
      if (node.properties?.dataFootnotes === undefined) return;
      const list = node.children.find((c): c is Element => c.type === 'element' && c.tagName === 'ol');
      if (!list) return;
      const count = list.children.filter((c) => c.type === 'element' && c.tagName === 'li').length;

      ctx.replaceNode(
        node,
        el('details', { className: ['footnotes'], id: 'przypisy' }, [
          el('summary', { className: ['footnotes__head'] }, [
            el('span', { className: ['footnotes__title'], id: 'footnote-label', role: 'heading', ariaLevel: '2' }, [
              text('Przypisy '),
              el('span', {}, [text(String(count))]),
            ]),
            el('span', { className: ['footnotes__hint'] }, [text(FOOTNOTES_HINT)]),
          ]),
          list,
        ]),
      );
    },
  },
};
