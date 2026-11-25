/**
 * Zadowolenie z ochrony zdrowia a oczekiwana długość życia — zestawienie do /analizy/zadowolenie-z-ochrony-zdrowia/.
 * Wyniki badań: src/data/zadowolenie-z-ochrony-zdrowia.ts; tu tylko długość życia i obliczenia (trend, korelacja).
 * Długość życia: Bank Światowy, SP.DYN.LE00.IN (szacunki ONZ, World Population Prospects), 2024, obie płcie, lata;
 * aktualizacja bazy 11.11.2026, pobrane 25.11.2026. Jedno źródło dla wszystkich krajów z badań, także spoza Europy
 * (dla Polski 78,4; Eurostat i OECD „Health at a Glance: Europe 2026” podają 78,5).
 * Linia trendu i współczynnik korelacji Pearsona — obliczenie redakcji. Korelacja nie mówi nic o przyczynie.
 */
import { IPSOS_COUNTRIES, IRIS_COUNTRIES, OECD_COUNTRIES, STADA_COUNTRIES, type CountryRow } from './zadowolenie-z-ochrony-zdrowia';

export const LIFE_SOURCE = { label: 'Bank Światowy, oczekiwana długość życia przy urodzeniu, 2024', href: 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN' };

/** Oczekiwana długość życia przy urodzeniu, 2024, lata (Bank Światowy, SP.DYN.LE00.IN), zaokrąglona do 0,1. */
export const LIFE_EXPECTANCY: Record<string, number> = { 'Argentyna': 77.5, 'Australia': 83.1, 'Austria': 82.0, 'Belgia': 82.3, 'Brazylia': 76.0, 'Bułgaria': 75.8, 'Chile': 81.4, 'Czechy': 80.0, 'Dania': 82.3, 'Dominikana': 73.9, 'Estonia': 79.3, 'Finlandia': 82.3, 'Francja': 83.0, 'Grecja': 81.8, 'Hiszpania': 83.9, 'Holandia': 82.0, 'Indie': 72.2, 'Indonezja': 71.3, 'Irlandia': 83.0, 'Islandia': 82.8, 'Izrael': 83.2, 'Japonia': 84.0, 'Kanada': 82.1, 'Kazachstan': 74.5, 'Kolumbia': 77.9, 'Korea Płd.': 83.6, 'Kostaryka': 81.0, 'Litwa': 77.2, 'Luksemburg': 83.2, 'Malezja': 76.8, 'Meksyk': 75.3, 'Niemcy': 80.8, 'Norwegia': 83.2, 'Nowa Zelandia': 82.0, 'Peru': 77.9, 'Polska': 78.4, 'Portugalia': 82.4, 'RPA': 66.3, 'Rumunia': 76.5, 'Serbia': 76.0, 'Singapur': 83.3, 'Szwajcaria': 84.4, 'Szwecja': 84.1, 'Słowacja': 78.4, 'Słowenia': 82.3, 'Tajlandia': 76.6, 'Turcja': 77.4, 'USA': 78.9, 'Uzbekistan': 72.5, 'Wielka Brytania': 81.4, 'Wietnam': 74.7, 'Węgry': 76.7, 'Włochy': 84.0, 'Łotwa': 76.4 };

export interface LifePanel {
  key: 'oecd' | 'iris' | 'ipsos' | 'stada';
  /** nazwa kraju Polski w tym panelu (w wersji EN „Poland”) */
  subject: string;
  name: string;
  measure: string;
  points: { name: string; satisfaction: number; life: number }[];
  /** współczynnik korelacji Pearsona */
  r: number;
  /** linia trendu (regresja liniowa zadowolenia względem długości życia) */
  fit: (life: number) => number;
}

const panel = (key: LifePanel['key'], name: string, measure: string, rows: CountryRow[]): LifePanel => {
  const points = rows.map(([n, satisfaction]) => {
    const life = LIFE_EXPECTANCY[n];
    if (life === undefined) throw new Error(`Brak długości życia dla kraju: ${n}`);
    return { name: n, satisfaction, life };
  });
  const k = points.length;
  const mx = points.reduce((s, p) => s + p.life, 0) / k;
  const my = points.reduce((s, p) => s + p.satisfaction, 0) / k;
  const sxy = points.reduce((s, p) => s + (p.life - mx) * (p.satisfaction - my), 0);
  const sxx = points.reduce((s, p) => s + (p.life - mx) ** 2, 0);
  const syy = points.reduce((s, p) => s + (p.satisfaction - my) ** 2, 0);
  const slope = sxy / sxx;
  return { key, subject: 'Polska', name, measure, points, r: sxy / Math.sqrt(sxx * syy), fit: (x) => my + slope * (x - mx) };
};

export const LIFE_PANELS: LifePanel[] = [
  panel('oecd', 'OECD (Gallup), 2024', 'zadowoleni z dostępności opieki w okolicy', OECD_COUNTRIES),
  panel('stada', 'STADA, 2026', 'zadowoleni z publicznego systemu', STADA_COUNTRIES),
  panel('iris', 'IRIS Network, 2025', 'system „doskonały” lub „zasadniczo dobry”', IRIS_COUNTRIES),
  panel('ipsos', 'Ipsos, 2026', 'indeks jakości opieki z pięciu pytań', IPSOS_COUNTRIES),
];


/** Długość życia w Polsce (Bank Światowy, 2024). */
export const PL_LIFE = LIFE_EXPECTANCY['Polska'];

/** O ile punktów procentowych wynik Polski leży pod linią trendu danego badania (zaokrąglone). */
export const polandGap = (key: LifePanel['key']) => {
  const panel = LIFE_PANELS.find((p) => p.key === key)!;
  return Math.round(panel.fit(PL_LIFE) - panel.points.find((p) => p.name === 'Polska')!.satisfaction);
};

/** Miejsce Polski w danym badaniu: w zadowoleniu i w długości życia (1 = najwyżej). */
export const polandRanks = (key: LifePanel['key']) => {
  const { points } = LIFE_PANELS.find((p) => p.key === key)!;
  const pl = points.find((p) => p.name === 'Polska')!;
  return {
    of: points.length,
    satisfaction: points.filter((p) => p.satisfaction > pl.satisfaction).length + 1,
    life: points.filter((p) => p.life > pl.life).length + 1,
  };
};
