/**
 * Kolejka jednego SOR wobec norm czasu — wspólne dla buildu (lib/sor/map) i adaptera danych na żywo
 * (lib/sor/live). Schemat pliku z migawkami: workers/sor/src/index.js.
 *
 * Normy: rozporządzenie Ministra Zdrowia w sprawie szpitalnego oddziału ratunkowego, § 6 ust. 9
 * (t.j. Dz.U. 2025 poz. 1646) — najdłuższy czas oczekiwania na pierwszy kontakt z lekarzem w każdej
 * z pięciu kategorii pilności. Etapy API „Priorytet najwyższy … najniższy” przypisujemy kolorom
 * kategorii w tej samej kolejności.
 *
 * Czasy z portalu to „średnie przybliżone czasy oczekiwania” (rozporządzenie o TOPSOR, Dz.U. 2021
 * poz. 1182, § 3 pkt 1), podawane tekstem i ucinane: „powyżej 2 godzin” znaczy tylko, że więcej niż
 * 120 minut. W kategoriach czerwonej i pomarańczowej portal zawsze pokazuje tekst normy
 * („natychmiast”, „poniżej 10 minut”), więc tych dwóch nie da się porównać z normą.
 */
import { fill, SOR_TEXT_PL, type SorText } from './text';

export interface Stage {
  label: string;
  /** kolor kategorii pilności */
  color?: string;
  /** norma w minutach (0 = natychmiast) */
  norm?: number;
}

/** Etapy w kolejności pliku migawek (`etapy`). */
export const ETAPY = ['Rejestracja', 'Triaż', 'Priorytet najwyższy', 'Priorytet wysoki', 'Priorytet średni', 'Priorytet niski', 'Priorytet najniższy'] as const;

export const STAGES: Stage[] = [
  { label: 'Rejestracja' },
  { label: 'Triaż' },
  { label: 'Najwyższy', color: 'czerwony', norm: 0 },
  { label: 'Wysoki', color: 'pomarańczowy', norm: 10 },
  { label: 'Średni', color: 'żółty', norm: 60 },
  { label: 'Niski', color: 'zielony', norm: 120 },
  { label: 'Najniższy', color: 'niebieski', norm: 240 },
];

/** Norma tekstem: „natychmiast”, „do 60 min” — w języku napisów `t` (domyślnie po polsku, lib/sor/text). */
export const normText = (norm: number, t: Pick<SorText, 'normNow' | 'normUpTo'> = SOR_TEXT_PL) => (norm === 0 ? t.normNow : fill(t.normUpTo, { n: norm }));

/** Wpis jednego SOR w sor/teraz.json. */
export interface Entry {
  /** chwila zapytania (ISO, UTC) */
  t: string;
  /** chwila wygenerowania odpowiedzi przez portal */
  ts?: string;
  /** wszyscy pacjenci w SOR */
  w?: number | null;
  /** 7 par [liczba osób, czas tekstem] w kolejności ETAPY */
  e?: [number | null, string | null][];
  /** etapy spoza listy, surowo: [nazwa, liczba, czas] */
  inne?: [string, number | null, string | null][];
  blad?: string;
  /** ostatni poprawny pomiar przy błędzie */
  poprzedni?: Entry;
}

export interface Snapshot {
  zrodlo: string;
  aktualizacja: string;
  etapy: string[];
  sor: Record<string, Entry>;
}

/** Dolna granica czasu w minutach; null = „-”, brak albo tekst bez pomiaru („natychmiast”, „poniżej 10 minut”). */
export function lowerMinutes(wait: string | null): number | null {
  if (!wait) return null;
  const min = /^(\d+)\s*min/.exec(wait);
  if (min) return Number(min[1]);
  const hours = /^powyżej\s+(\d+)\s+godzin/.exec(wait);
  return hours ? Number(hours[1]) * 60 + 1 : null;
}

export interface Measure {
  /**
   * 0 = nikt nie czeka w kategoriach pilności, 1 = czas w normie, 2 = ponad normę, 3 = ponad
   * dwukrotność normy; null = czekają tylko pacjenci czerwoni i pomarańczowi (czasu nie podano)
   */
  cls: 0 | 1 | 2 | 3 | null;
  /** osoby przed kontaktem z lekarzem (suma etapów) */
  before: number;
  /** etap z najgorszym stosunkiem czasu do normy */
  worst: { stage: number; ratio: number; count: number; wait: string } | null;
  /** czas ponad normę, po etapach */
  over: boolean[];
}

export function measure(e: NonNullable<Entry['e']>): Measure {
  let anyone = false, cls: 0 | 1 | 2 | 3 = 0;
  let worst: Measure['worst'] = null;
  const over = e.map(([count, wait], i) => {
    const norm = STAGES[i].norm;
    if (norm == null || !count) return false;
    anyone = true;
    const low = lowerMinutes(wait);
    if (norm === 0 || low == null) return false;
    const ratio = low / norm;
    cls = Math.max(cls, ratio > 2 ? 3 : ratio > 1 ? 2 : 1) as 1 | 2 | 3;
    if (!worst || ratio > worst.ratio || (ratio === worst.ratio && count > worst.count)) worst = { stage: i, ratio, count, wait: wait! };
    return ratio > 1;
  });
  const before = e.reduce((sum, [count]) => sum + (count ?? 0), 0);
  return { cls: anyone && cls === 0 ? null : cls, before, worst, over };
}
