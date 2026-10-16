/**
 * Polska typografia w treści Markdown/MDX — ta sama funkcja `typo()` co dla tekstów z danych:
 * twarda spacja w grupach tysięcy („12 910,16”), między liczbą a jednostką („240 zł”, „5 mln”),
 * po jednoliterowych spójnikach i przed myślnikiem. Dzięki temu na wąskim ekranie liczba nie łamie się
 * w środku. Komponenty osadzone w MDX dostają teksty przez propsy i same wołają `typo()`/`formatPL()`.
 *
 * Wizytator tekstu nie zna rodzica, więc działa też w `code` — w artykułach nie ma bloków kodu.
 * Gdyby się pojawiły, trzeba przejść na wizytator elementów z pominięciem `code`/`pre`.
 */
import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import { typo } from '../format';

type HastPlugin = NonNullable<SatteriProcessorOptions['hastPlugins']>[number];

export const typography: HastPlugin = {
  name: 'zl-typography',
  text(node) {
    const value = typo(node.value);
    if (value !== node.value) return { type: 'text', value };
  },
};
