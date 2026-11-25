/**
 * Wersja angielska modułu src/data/zadowolenie-dlugosc-zycia.ts: te same liczby i obliczenia (importowane),
 * tu tylko angielskie nazwy krajów i opisy badań.
 */
import { LIFE_PANELS, type LifePanel } from '@/data/zadowolenie-dlugosc-zycia';
import { countryEn } from '@/data/en/zadowolenie-z-ochrony-zdrowia';

export { LIFE_EXPECTANCY, PL_LIFE, polandGap, polandRanks } from '@/data/zadowolenie-dlugosc-zycia';

export const LIFE_SOURCE_EN = { label: 'World Bank, life expectancy at birth, 2024', href: 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN' };

const TEXT: Record<LifePanel['key'], { name: string; measure: string }> = {
  oecd: { name: 'OECD (Gallup), 2024', measure: 'satisfied with the availability of care locally' },
  stada: { name: 'STADA, 2026', measure: 'satisfied with the public system' },
  iris: { name: 'IRIS Network, 2025', measure: 'system “excellent” or “basically good”' },
  ipsos: { name: 'Ipsos, 2026', measure: 'quality of care index, five questions' },
};

export const LIFE_PANELS_EN: LifePanel[] = LIFE_PANELS.map((p) => ({
  ...p,
  ...TEXT[p.key],
  subject: countryEn(p.subject),
  points: p.points.map((pt) => ({ ...pt, name: countryEn(pt.name) })),
}));

/** angielski liczebnik porządkowy: 1st, 2nd, 3rd, 11th, 31st */
export const ordinal = (n: number) => {
  const rest = n % 100;
  const suffix = rest >= 11 && rest <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};
