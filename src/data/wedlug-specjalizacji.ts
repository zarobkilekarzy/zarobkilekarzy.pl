/**
 * Zestawienie /dane/wedlug-specjalizacji/: pensja rezydenta, stawka z ogłoszeń, miejsca szkoleniowe
 * i kandydaci na miejsce w 29 dziedzinach. Tabelę rysuje components/wedlug-specjalizacji/SpecTable,
 * tekst i przypisy są w content/articles/wedlug-specjalizacji.mdx.
 *
 * Aktualizacja:
 * - 1 lipca: nowa kwota bazowa przychodzi z data/personel-medyczny.ts (BASE) i przelicza RESIDENT_PAY.
 *   Porównaj wynik co do grosza z nowym rozporządzeniem o pensjach rezydentów i podmień PAY_ACT
 *   (w 2025 r. MZ zaokrąglał kwoty w górę do pełnego złotego, w 2026 r. — do grosza).
 * - po sesji jesiennej: miejsca z wykazu CMKP (suma 16 województw), kandydaci na miejsce
 *   (zestawienie dyrektora CMKP), obsadzenie (wyniki postępowania) — pola w SPECIALTIES i AUTUMN_2025.
 * - lista priorytetów (rozporządzenie MZ wydane na podstawie art. 16g ust. 4 ustawy o zawodach
 *   lekarza): PRIORITY_FIELDS; status dziedzin w tabeli i w prognozie liczy się z tej listy.
 */
import { minimum } from '@/data/personel-medyczny';

/** Adresy przy liczbach w komponentach; te same publikacje są w przypisach artykułu. */
export const LINKS = {
  payAct: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000856',
  physiciansAct: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000037',
  cmkpPlaces: 'https://www.cmkp.edu.pl/wp-content/uploads/2025/08/Liczba-miejsc-szkoleniowych-jesien-2025.pdf',
  cmkpResults:
    'https://www.termedia.pl/wartowiedziec/Ostateczne-wyniki-rekrutacji-na-specjalizacje-w-sesji-jesiennej-2025,64937.html',
  candidates:
    'https://beautyrazem.pl/chirurgia-plastyczna-i-dermatologia-na-czele-najbardziej-obleganych-specjalizacji-lekarskich/',
  offers2023: 'https://www.termedia.pl/pobierz/28761ac10ff69d4055cd0f793cfa9175',
  forecast:
    'https://www.rynekzdrowia.pl/Polityka-zdrowotna/Choc-ksztalcimy-coraz-wiecej-w-tych-dziedzinach-nadal-bedzie-brakowac-lekarzy,273691,14.html',
} as const;

/* ── Pensja rezydenta ─────────────────────────────────────────────────────────── */

/** Rozporządzenie MZ o wynagrodzeniu zasadniczym rezydentów, które obowiązuje. */
export const PAY_ACT = {
  label: 'Dz.U. 2026 poz. 856',
  signed: '25 czerwca 2026 r.',
  from: '1 lipca 2026 r.',
  href: LINKS.payAct,
} as const;

/** Współczynnik lekarza bez specjalizacji z ustawy z 8 czerwca 2017 r. — punkt wyjścia MZ dla pensji rezydenta. */
export const RESIDENT_COEF = 1.19;

const grosz = (x: number) => Math.round(x * 100) / 100;
/** 1,19 × kwota bazowa = 10 595,24 zł od 1 lipca 2026 r. (wyliczenie MZ) */
const basic = minimum(RESIDENT_COEF);

/**
 * Wynagrodzenie zasadnicze brutto miesięcznie: w pierwszych dwóch latach rezydentury i później.
 * Relacje do kwoty podstawowej odtwarzają kwoty rozporządzenia co do grosza: dziedzina priorytetowa
 * 110% (po dwóch latach 120%), pozostałe po dwóch latach 103%.
 */
export const RESIDENT_PAY = {
  priority: { first: grosz(basic * 1.1), later: grosz(basic * 1.2) },
  other: { first: basic, later: grosz(basic * 1.03) },
} as const;

/**
 * Zobowiązanie do pracy w Polsce po specjalizacji (art. 16j ust. 2b ustawy o zawodach lekarza):
 * łącznie 2 lata z 5 po jej zakończeniu, w placówce z publicznym finansowaniem, co najmniej na etat.
 * W zamian pensja zasadnicza wyższa o 700 zł (priorytetowa) albo 600 zł; niedotrzymanie — kara
 * w wysokości 75% otrzymanych zwiększeń, proporcjonalnie mniejsza za przepracowany okres (ust. 2l, 2n).
 */
export const COMMITMENT = { priority: 700, other: 600, years: 2, window: 5, penaltyShare: 0.75 } as const;

/* ── Lista priorytetów ───────────────────────────────────────────────────────── */

/**
 * Priorytetowe dziedziny medycyny: rozporządzenie MZ z 27 grudnia 2022 r. (Dz.U. 2022 poz. 2814),
 * neurologia od 1 lipca 2023 r. (Dz.U. 2023 poz. 1503), tekst jednolity Dz.U. 2024 poz. 791.
 * Ta sama lista stoi w § 1 rozporządzenia o pensjach (Dz.U. 2026 poz. 856). Stan na 15.10.2026.
 */
export const PRIORITY_FIELDS = [
  'anestezjologia i intensywna terapia',
  'chirurgia dziecięca',
  'chirurgia ogólna',
  'chirurgia onkologiczna',
  'choroby wewnętrzne',
  'choroby zakaźne',
  'geriatria',
  'hematologia',
  'kardiologia dziecięca',
  'medycyna paliatywna',
  'medycyna ratunkowa',
  'medycyna rodzinna',
  'neonatologia',
  'neurologia',
  'neurologia dziecięca',
  'onkologia i hematologia dziecięca',
  'onkologia kliniczna',
  'patomorfologia',
  'pediatria',
  'psychiatria',
  'psychiatria dzieci i młodzieży',
  'radioterapia onkologiczna',
  'stomatologia dziecięca',
] as const;

export const PRIORITY_AS_OF = '15.10.2026';

const isPriority = (name: string) => (PRIORITY_FIELDS as readonly string[]).includes(name.toLowerCase());

/* ── 29 dziedzin ─────────────────────────────────────────────────────────────── */

export interface Specialty {
  id: string;
  /** nazwa dziedziny jak w wykazie CMKP i w rozporządzeniu */
  name: string;
  /** krótsza nazwa do wykresu */
  short?: string;
  priority: boolean;
  /** średnia stawka godzinowa brutto z ogłoszeń w 2023 r. (raport „Lekarze – oferty pracy”); brak = dziedziny nie ma w raporcie */
  rate?: number;
  /** nazwa wiersza w raporcie, gdy inna niż dziedzina */
  rateRow?: string;
  /** miejsca rezydenckie (w tym doktoranckie), sesja jesień 2025, suma 16 województw */
  rez: number;
  /** miejsca pozarezydenckie, sesja jesień 2025 */
  nonRez: number;
  /** kandydaci (pierwszy wybór we wniosku) na jedno miejsce; 'below-1' = więcej miejsc niż chętnych; brak = nie opublikowano */
  candidates?: number | 'below-1';
  /** miejsca zajęte po dwóch etapach jesieni 2025 — CMKP podało tylko dziesięć dziedzin w każdym trybie */
  takenRez?: number;
  takenNonRez?: number;
}

type Row = Omit<Specialty, 'priority'>;

/** Kolejność: najpierw kandydaci na miejsce (opublikowane wartości), dalej jak w wydaniu poprzednim. */
const ROWS: Row[] = [
  { id: 'chirurgia-plastyczna', name: 'Chirurgia plastyczna', rez: 7, nonRez: 10, candidates: 7.47 },
  { id: 'dermatologia', name: 'Dermatologia i wenerologia', rate: 286.63, rez: 35, nonRez: 15, candidates: 6.94 },
  { id: 'endokrynologia', name: 'Endokrynologia', rate: 251.89, rez: 25, nonRez: 26, candidates: 5.88 },
  { id: 'gastroenterologia', name: 'Gastroenterologia', rate: 231.88, rez: 16, nonRez: 21, candidates: 3.86 },
  { id: 'urologia', name: 'Urologia', rate: 242.08, rez: 62, nonRez: 12, candidates: 2.38 },
  { id: 'okulistyka', name: 'Okulistyka', rate: 215.71, rez: 79, nonRez: 72, candidates: 2.06, takenNonRez: 65 },
  { id: 'kardiologia', name: 'Kardiologia', rate: 246.56, rez: 143, nonRez: 496, takenRez: 137, takenNonRez: 93 },
  { id: 'radiologia', name: 'Radiologia i diagnostyka obrazowa', rate: 222.5, rez: 100, nonRez: 208, takenNonRez: 124 },
  {
    id: 'ortopedia',
    name: 'Ortopedia i traumatologia narządu ruchu',
    short: 'Ortopedia i traumatologia',
    rate: 214.11,
    rez: 101,
    nonRez: 464,
    takenRez: 97,
    takenNonRez: 80,
  },
  { id: 'otorynolaryngologia', name: 'Otorynolaryngologia', rate: 215.17, rateRow: 'laryngologia', rez: 71, nonRez: 4 },
  {
    id: 'poloznictwo-ginekologia',
    name: 'Położnictwo i ginekologia',
    rate: 205.6,
    rateRow: 'ginekologia',
    rez: 144,
    nonRez: 202,
    takenRez: 137,
    takenNonRez: 36,
  },
  { id: 'choroby-pluc', name: 'Choroby płuc', rate: 260.45, rateRow: 'pulmonologia', rez: 104, nonRez: 41 },
  { id: 'medycyna-pracy', name: 'Medycyna pracy', rate: 260.53, rez: 31, nonRez: 47, takenNonRez: 34 },
  { id: 'rehabilitacja-medyczna', name: 'Rehabilitacja medyczna', rate: 155, rez: 207, nonRez: 273, candidates: 'below-1' },
  {
    id: 'anestezjologia',
    name: 'Anestezjologia i intensywna terapia',
    short: 'Anestezjologia',
    rate: 201.36,
    rez: 225,
    nonRez: 57,
    takenRez: 210,
  },
  { id: 'chirurgia-ogolna', name: 'Chirurgia ogólna', rate: 205.64, rateRow: 'chirurgia', rez: 378, nonRez: 150, takenRez: 250 },
  { id: 'onkologia-kliniczna', name: 'Onkologia kliniczna', rez: 214, nonRez: 110 },
  { id: 'hematologia', name: 'Hematologia', rez: 116, nonRez: 49 },
  { id: 'psychiatria', name: 'Psychiatria', rate: 304.14, rez: 315, nonRez: 90, takenRez: 281, takenNonRez: 49 },
  { id: 'neurologia', name: 'Neurologia', rate: 216.91, rez: 349, nonRez: 214, takenRez: 246 },
  { id: 'medycyna-paliatywna', name: 'Medycyna paliatywna', rez: 25, nonRez: 95, takenNonRez: 45 },
  { id: 'pediatria', name: 'Pediatria', rate: 175.37, rez: 516, nonRez: 260, takenRez: 327 },
  { id: 'medycyna-rodzinna', name: 'Medycyna rodzinna', rate: 178.08, rez: 863, nonRez: 981, takenRez: 507, takenNonRez: 66 },
  { id: 'choroby-zakazne', name: 'Choroby zakaźne', rez: 151, nonRez: 84, candidates: 'below-1' },
  { id: 'geriatria', name: 'Geriatria', rez: 84, nonRez: 90, candidates: 'below-1' },
  { id: 'neonatologia', name: 'Neonatologia', rez: 149, nonRez: 102, candidates: 'below-1' },
  { id: 'choroby-wewnetrzne', name: 'Choroby wewnętrzne', rate: 173.34, rez: 755, nonRez: 2329, candidates: 'below-1', takenRez: 376 },
  { id: 'medycyna-ratunkowa', name: 'Medycyna ratunkowa', rate: 185.67, rez: 307, nonRez: 266, candidates: 'below-1' },
  { id: 'patomorfologia', name: 'Patomorfologia', rez: 93, nonRez: 24, candidates: 'below-1' },
];

export const SPECIALTIES: Specialty[] = ROWS.map((r) => ({ ...r, priority: isPriority(r.name) }));

export const spec = (id: string) => {
  const s = SPECIALTIES.find((x) => x.id === id);
  if (!s) throw new Error(`Brak dziedziny ${id}`);
  return s;
};

/** Dziedziny z listy priorytetów, których nie ma w tabeli. */
export const PRIORITY_OUTSIDE_TABLE = PRIORITY_FIELDS.filter(
  (f) => !SPECIALTIES.some((s) => s.name.toLowerCase() === f),
);

/** Raport „PRACA. Lekarze – oferty pracy za cały 2023 rok” (grupa LOP, partner: OZZL). */
export const OFFERS_2023 = { year: 2023, offers: 1473, average: 198.29, median: 180 } as const;

const median = (xs: number[]) => {
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const group = (priority: boolean) => SPECIALTIES.filter((s) => s.priority === priority);
const rates = (priority: boolean) => group(priority).flatMap((s) => (s.rate === undefined ? [] : [s.rate]));

/** Mediana średnich stawek dziedzin z każdej grupy (nie mediana ogłoszeń) — obliczenia redakcji. */
export const RATE_MEDIAN = { priority: median(rates(true)), other: median(rates(false)) };

/** Liczba dziedzin w tabeli i ich miejsca rezydenckie, według grup. */
export const TABLE = {
  priority: { fields: group(true).length, rez: group(true).reduce((n, s) => n + s.rez, 0) },
  other: { fields: group(false).length, rez: group(false).reduce((n, s) => n + s.rez, 0) },
};

/* ── Sesja jesień 2025 w całym kraju ─────────────────────────────────────────── */

export const AUTUMN_2025 = {
  /** miejsca dostępne w postępowaniu (wykaz CMKP z 28.08.2025) */
  rez: 6653,
  nonRez: 7945,
  /** formalnie poprawne wnioski */
  applications: 7995,
  /** lekarze, którzy potwierdzili przyjęcie miejsca po dwóch etapach (CMKP, 20.11.2025) */
  takenRez: 4096,
  takenNonRez: 1387,
  /** dodatkowy, trzeci etap: wyłącznie rezydentury w dziedzinach priorytetowych (10.12.2025) */
  thirdStageRez: 181,
} as const;

/* ── Prognoza MZ: nowi specjaliści a osiągający wiek emerytalny do 2028 r. ───── */

export interface ForecastRow {
  name: string;
  /** różnica: lekarze kończący specjalizację minus lekarze osiągający wiek emerytalny, do 2028 r. */
  gap: number;
  priority: boolean;
}

/** Mapy potrzeb zdrowotnych MZ za: Rynek Zdrowia, 21.07.2025 — dziedziny wymienione w tekście (lista niepełna). */
export const FORECAST_2028: ForecastRow[] = [
  { name: 'Choroby wewnętrzne', gap: -1717 },
  { name: 'Chirurgia ogólna', gap: -507 },
  { name: 'Medycyna pracy', gap: -241 },
  { name: 'Rehabilitacja medyczna', gap: -187 },
  { name: 'Choroby płuc', gap: -154 },
  { name: 'Balneologia i medycyna fizykalna', gap: -53 },
  { name: 'Otorynolaryngologia', gap: -50 },
  { name: 'Chirurgia dziecięca', gap: -42 },
  { name: 'Choroby zakaźne', gap: -12 },
  { name: 'Pediatria', gap: 51 },
  { name: 'Medycyna rodzinna', gap: 891 },
].map((r) => ({ ...r, priority: isPriority(r.name) }));
