/**
 * Zestawy infografik do pobrania (szablon: ./render.ts, endpoint: pages/infografiki/,
 * sekcja na stronie: blocks/Infographics). Klucz = ostatni człon trasy strony.
 *
 * Liczby wyłącznie z modułów danych stron — te same funkcje, z których liczy tekst artykułu,
 * więc aktualizacja danych zmienia grafiki w następnym buildzie.
 */
import { COUNTRIES, WINDOW, ratePer100k, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { formatPL } from '@/lib/format';
import type { ComparisonRow, InfographicSet } from './render';

const span = `${WINDOW.from}–${WINDOW.to}`;
// na grafice liczby całkowite: to porównanie rzędu wielkości, nie co do przecinka
const country = (key: CountryKey): ComparisonRow => {
  const c = COUNTRIES.find((x) => x.key === key)!;
  const value = ratePer100k(key);
  return { label: c.name, sub: c.body, value, display: formatPL(value), highlight: key === 'pl' };
};
const rows = [country('no'), country('se'), country('uk'), country('pl')];

const odpowiedzialnosc: InfographicSet = {
  route: '/analizy/odpowiedzialnosc-zawodowa-lekarzy/',
  page: 'Analiza: Najwyższa kara, której prawie się nie orzeka',
  filePrefix: 'zarobkilekarzy-prawo-do-zawodu',
  items: [
    {
      id: 'porownanie-krajow',
      title: 'Ilu lekarzom odebrano prawo do zawodu',
      measure: `na 100 tys. lekarzy rocznie · ${span}`,
      rows,
      sources: 'Źródła: Helsetilsynet, HSAN, GMC, NIL · definicje różnią się między krajami',
      alt: `Infografika: odebrania prawa do zawodu lekarzom na 100 tys. lekarzy, średnio rocznie w latach ${span}: ${rows.map((r) => `${r.label} ${r.display}`).join(', ')}. Definicje różnią się między krajami. Źródła: Helsetilsynet, HSAN, GMC, NIL.`,
    },
  ],
};

// odsetki z jednym miejscem po przecinku — tak podają je źródła (CEM liczymy z dwóch liczb)
const examRows: ComparisonRow[] = EXAMS_2025.map((e) => ({
  label: e.name,
  sub: e.note,
  value: passRate(e),
  display: formatPL(passRate(e), 1),
  highlight: e.key === 'lek',
}));

const egzamin: InfographicSet = {
  route: '/egzamin/',
  page: 'Egzamin LEK online: jawna baza pytań',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'zdawalnosc-egzaminow',
      title: 'Jaka część zdających zdaje egzamin',
      measure: 'odsetek przystępujących z wynikiem pozytywnym · 2025',
      unit: '%',
      rows: examRows,
      sources: 'Źródła: CEM, Min. Sprawiedliwości, PIIB, IARP, Min. Infrastruktury · wszystkie podejścia',
      alt: `Infografika: odsetek zdających, którzy zdali egzamin w 2025 r. (wszystkie podejścia): ${EXAMS_2025.map((e) => `${e.name} ${formatPL(passRate(e), 1)}% (${e.note})`).join(', ')}. Źródła: CEM, Ministerstwo Sprawiedliwości, PIIB, Izba Architektów RP, Ministerstwo Infrastruktury.`,
    },
  ],
};

export const infographicSets: Record<string, InfographicSet> = {
  egzamin,
  'odpowiedzialnosc-zawodowa-lekarzy': odpowiedzialnosc,
};
