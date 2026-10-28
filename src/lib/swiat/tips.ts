/**
 * Kontury i dymki globu płac w języku strony — treść plików swiat.json (PL) i world.json (EN), które skrypt globu
 * pobiera przy pierwszym ruchu nad mapą (components/swiat/client.ts). Dymek = nazwa i dwie linie w każdym widoku;
 * kraj bez danych — sama nazwa.
 */
import topology from '@/data/geo/swiat-110m.json';
import namesPl from '@/data/swiat/nazwy.json';
import namesEn from '@/data/en/swiat/nazwy.json';
import type { Locale } from '@/i18n/locales';
import { obsMeta, VIEW_KEYS, worldModel, type CountryModel, type View, type WorldText } from './index';

function lines(c: CountryModel, view: View, t: WorldText): [string, string] {
  if (view.measure === 'j') return c.transparency ? [t.tips.level(t.level[c.transparency.level]!), t.scope[c.transparency.scope]] : [t.tips.notStudied, ''];
  const v = view.value(c);
  if (!v) return [t.tips.noValue, t.tips.click];
  return [`${view.format(v.value)} ${view.context}`, [v.head.group.split(',')[0], v.head.src === 'oecd' ? 'OECD' : t.tips.nat, obsMeta(v.obs, t)].join(' · ')];
}

export async function globePayload(locale: Locale) {
  const model = await worldModel(locale);
  const { t } = model;
  const names = (locale === 'en' ? namesEn : namesPl) as Record<string, string>;
  const tips: Record<string, { n: string; k?: Record<string, [string, string]> }> = {};
  for (const [id, n] of Object.entries(names)) tips[id] = { n };
  for (const c of model.countries) {
    const known = c.oecd || c.note || c.transparency || (c.nat && c.nat.kind !== 'none');
    const k = (key: (typeof VIEW_KEYS)[number]): [string, string] => (known ? lines(c, model.views[key], t) : [t.tips.noOfficial, t.tips.click]);
    tips[c.id] = { n: c.name, k: Object.fromEntries(VIEW_KEYS.map((key) => [key, k(key)])) };
  }
  return { topology, tips };
}
