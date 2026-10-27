/**
 * Przypisy GFM (`tekst[^id]` + `[^id]: …` na końcu pliku) jako zwijana lista:
 * <section data-footnotes> → <details class="footnotes" id="przypisy"> z liczbą przypisów w nagłówku.
 * Te same znaczniki składa article/NoteList na stronach spoza MDX (lib/notes).
 * Teksty angielskie (src/content/en/) dostają etykiety „Notes” i id „notes”.
 *
 * Tytuł listy nie jest <h2>, tylko role="heading" — nie trafia do spisu treści ani do sekcji
 * wyszukiwarki (wbudowana wtyczka Astro zbiera nagłówki po tej). Id „footnote-label” zostaje,
 * bo wskazują na nie odnośniki w tekście (aria-describedby). Link do przypisu rozwija listę
 * (scripts/open-target), wygląd — styles/footnotes.css.
 */
import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import type { HastPluginDefinition } from 'satteri';
import type { Element, ElementContent } from 'hast';
import { ui } from '../../i18n/ui';
import { isEnglishSource } from '../../i18n/source-files';
import type { Locale } from '../../i18n/locales';

type HastPlugin = NonNullable<SatteriProcessorOptions['hastPlugins']>[number];

const el = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string): ElementContent => ({ type: 'text', value });

/** Lista przypisów w języku pliku: treść z src/content/en/ dostaje angielskie etykiety (src/i18n/ui.ts). */
const footnotesIn = (locale: Locale): HastPluginDefinition => {
  const t = ui[locale].article;
  return {
    name: 'zl-footnotes',
    element: {
      filter: ['section', 'a'],
      visit(node, ctx) {
        // Etykieta powrotu z features.gfm (astro.config.mjs) jest polska — w tekstach angielskich ją podmieniamy
        if (node.tagName === 'a') {
          const label = node.properties?.ariaLabel;
          const ref = typeof label === 'string' ? /\(przypis (.+)\)$/.exec(label)?.[1] : undefined;
          if (locale === 'en' && node.properties?.dataFootnoteBackref !== undefined && ref) {
            ctx.replaceNode(node, { ...node, properties: { ...node.properties, ariaLabel: t.noteBack(ref) } });
          }
          return;
        }
        if (node.properties?.dataFootnotes === undefined) return;
        const list = node.children.find((c): c is Element => c.type === 'element' && c.tagName === 'ol');
        if (!list) return;
        const count = list.children.filter((c) => c.type === 'element' && c.tagName === 'li').length;

        ctx.replaceNode(
          node,
          el('details', { className: ['footnotes'], id: t.notesId }, [
            el('summary', { className: ['footnotes__head'] }, [
              el('span', { className: ['footnotes__title'], id: 'footnote-label', role: 'heading', ariaLevel: '2' }, [
                text(`${t.notes} `),
                el('span', {}, [text(String(count))]),
              ]),
              el('span', { className: ['footnotes__hint'] }, [text(t.notesHint)]),
            ]),
            list,
          ]),
        );
      },
    },
  };
};

const pl = footnotesIn('pl');
const en = footnotesIn('en');

export const footnotes: HastPlugin = ({ fileURL }) => (isEnglishSource(fileURL) ? en : pl);
