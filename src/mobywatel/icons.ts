/**
 * Ikony prototypów mObywatela: rejestr serwisu (src/icons.ts) + własne, których serwis nie potrzebuje.
 * Ta sama siatka 24×24 i obrys 1.5 px. Rysuje je mobywatel/components/MobIcon (inline, bez sprite'a).
 */
import { icons as siteIcons } from '@/icons';

const stroke = 'fill="none" stroke="currentColor" stroke-width="1.5"';

export const mobIcons = {
  ...siteIcons,
  home: `<path d="M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z" ${stroke} stroke-linejoin="round"/>`,
  chevron: `<path d="m9.5 5.5 6.5 6.5-6.5 6.5" ${stroke}/>`,
} as const;

export type MobIconName = keyof typeof mobIcons;
