/**
 * Id nagłówków w Markdown/MDX bez polskich znaków: „Sprawdź swoje IKP — instrukcja” → #sprawdz-swoje-ikp-instrukcja.
 * Domyślny slugger Astro zostawia diakrytyki (#sprawdź-swoje-ikp--instrukcja), a te w skopiowanym linku
 * zamieniają się w %C5%BA. Wtyczka nadaje id przed wbudowaną wtyczką Astro, która zastane id zachowuje —
 * spis treści i wyszukiwarka (render() → headings) dostają więc te same kotwice.
 */
import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import { slug } from '../format';

type HastPlugin = NonNullable<SatteriProcessorOptions['hastPlugins']>[number];

export const headingIds: HastPlugin = () => {
  // Fabryka wołana dla każdego dokumentu: powtórzenia liczymy osobno w każdym artykule
  const seen = new Map<string, number>();
  return {
    name: 'zl-heading-ids',
    element: {
      filter: ['h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        if (typeof node.properties?.id === 'string') return;
        const base = slug(ctx.textContent(node)) || 'sekcja';
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        ctx.setProperty(node, 'id', n ? `${base}-${n + 1}` : base);
      },
    },
  };
};
