/**
 * Analiza /analizy/lekarze-ze-wschodu/: liczby do wykresów i tabel. Tekst i przypisy są
 * w content/articles/lekarze-ze-wschodu.mdx — liczby w zdaniach są tam wpisane ręcznie,
 * więc przy nowym odczycie trzeba je poprawić razem z tym plikiem.
 *
 * Źródła (odczyt 16.10.2026):
 * - LEW: dane CEM przygotowane dla „Rzeczpospolitej” (16.06.2026) — podejścia i zdane od 2021 r.;
 * - wygaszenia PWZ po terminie B1 (1.05.2026): Rzeczpospolita (13.05 i 11.06.2026, dane NIL),
 *   Rynek Zdrowia (2.06 i 12.06.2026);
 * - stan PWZ: NIL, „Zestawienie ilościowe wg rodzaju PWZ” (zestawienie nr 7) na 31.12.2024 i 30.06.2026.
 * Odsetki liczymy tu z liczb bezwzględnych, żeby wykres i tekst nie rozjechały się z danymi.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatPL } from '@/lib/format';

/** Publikacje, na które powołują się podpisy ilustracji i StatRow (w treści — przypisy). */
export const LINKS = {
  nil2026: 'https://nil.org.pl/uploaded_files/1783510889_30062026-zestawienie-nr-7.pdf',
  nil2024: 'https://nil.org.pl/uploaded_files/1737380333_zestawienie-nr-7-31122024.pdf',
  rzLew: 'https://www.rp.pl/zdrowie/art44618561-lekarze-z-ukrainy-i-bialorusi-oblewaja-polski-egzamin-medyczny',
  rzWeto: 'https://www.rp.pl/ochrona-zdrowia/art44609441-prezydent-wetuje-lekarzy-bez-znajomosci-polskiego-czesc-medykow-z-ukrainy-straci-prawo-do-wykonywania-zawodu',
  rzMaj: 'https://www.rp.pl/ochrona-zdrowia/art44364801-lekarze-z-ukrainy-traca-prawo-do-pracy-szpitale-alarmuja-zabraknie-rak-do-leczenia',
  rynek300: 'https://www.rynekzdrowia.pl/Prawo/Juz-300-lekarzy-spoza-Unii-stracilo-uprawnienia-Czekaja-na-decyzje-prezydenta,285018,2.html',
  rynek800: 'https://www.rynekzdrowia.pl/Prawo/Efekt-weta-nawet-800-lekarzy-z-Ukrainy-straci-uprawnienia-Moga-nostryfikowac-dyplom,285405,2.html',
} as const;

const share = (part: number, whole: number) => (part / whole) * 100;
/** 8,55 → „8,6%” */
const pct = (v: number, decimals = 1) => `${formatPL(v, decimals)}%`;
const MINUS = '−';
const signed = (v: number) => `${v < 0 ? MINUS : '+'}${formatPL(Math.abs(v))}`;

/* ---------- 1. LEW od 2021 r. do sesji wiosennej 2026: podejścia i zdane (CEM dla Rz) ---------- */

interface Attempts {
  label: string;
  passed: number;
  attempts: number;
}

/** Liczby podejść, nie osób: ta sama osoba może zdawać kilka razy. Bez „innych narodowości” — źródło ich nie sumuje. */
export const LEW: Attempts[] = [
  { label: 'Obywatele Białorusi', passed: 280, attempts: 1925 },
  { label: 'Polacy z dyplomem spoza UE', passed: 26, attempts: 279 },
  { label: 'Obywatele Ukrainy', passed: 165, attempts: 1928 },
];

export const LEW_TOTAL: Attempts = {
  label: 'Trzy grupy razem',
  passed: LEW.reduce((s, r) => s + r.passed, 0),
  attempts: LEW.reduce((s, r) => s + r.attempts, 0),
};

/** 471 z 4 132 → 11,4% */
export const lewTotalPct = pct(share(LEW_TOTAL.passed, LEW_TOTAL.attempts));

export const lewRows: BarRow[] = [...LEW, LEW_TOTAL].map((r) => ({
  label: r.label,
  note: `· ${formatPL(r.passed)} z ${formatPL(r.attempts)} podejść`,
  value: share(r.passed, r.attempts),
  display: pct(share(r.passed, r.attempts)),
  highlight: r === LEW_TOTAL,
}));

/* ---------- 2. Wygaszone PWZ po terminie B1 (1.05.2026): narastająco ---------- */

/** Jedna seria w kolejnych dniach, a nie różne miary; ostatni wiersz to szacunek, nie dane. */
export const lapsedRows: BarRow[] = [
  { label: 'do 12 maja 2026', note: '· Rzeczpospolita', value: 207, display: '207' },
  { label: 'początek czerwca', note: '· Rynek Zdrowia', value: 300, display: 'ok. 300' },
  { label: 'do 11 czerwca', note: '· dane NIL', value: 441, display: '441', highlight: true },
  { label: 'docelowo', note: '· szacunek NIL', value: 800, display: 'ok. 800', secondary: true },
];

/* ---------- 3. Wygaszone PWZ do 12 maja 2026 według województw (Rzeczpospolita) ---------- */

/** Osiem województw podanych przez Rz; razem 200, a „łącznie 207” — 7 źródło nie przypisuje. */
export const REGIONS_MAY: { label: string; n: number }[] = [
  { label: 'mazowieckie', n: 107 },
  { label: 'warmińsko-mazurskie', n: 26 },
  { label: 'podlaskie', n: 19 },
  { label: 'lubelskie', n: 16 },
  { label: 'śląskie', n: 15 },
  { label: 'dolnośląskie', n: 8 },
  { label: 'wielkopolskie', n: 5 },
  { label: 'małopolskie', n: 4 },
];

export const REGIONS_MAY_TOTAL = 207;
export const regionsListed = REGIONS_MAY.reduce((s, r) => s + r.n, 0); // 200

export const regionRows: BarRow[] = [
  ...REGIONS_MAY.map((r, i) => ({ label: r.label, value: r.n, display: formatPL(r.n), highlight: i === 0 })),
  {
    label: 'bez przypisania w źródle',
    value: REGIONS_MAY_TOTAL - regionsListed,
    display: formatPL(REGIONS_MAY_TOTAL - regionsListed),
    secondary: true,
  },
];

/* ---------- 4. Prawa wykonywania zawodu lekarzy spoza UE i cudzoziemców (NIL, zestawienie nr 7) ---------- */

interface Stock {
  label: string;
  /** 31.12.2024 */
  before: number;
  /** 30.06.2026 */
  after: number;
}

/** Tylko lekarze (bez lekarzy dentystów). Pozycje zestawienia: 17, 18 oraz 13+14. */
export const STOCK: Stock[] = [
  { label: 'Warunkowe PWZ lekarza spoza UE (poz. 18)', before: 2607, after: 1867 },
  { label: 'PWZ lekarza spoza UE na określony zakres czynności (poz. 17)', before: 756, after: 619 },
  { label: 'PWZ lekarza cudzoziemca, bez obywateli UE (poz. 13 i 14)', before: 36 + 1296, after: 32 + 2783 },
];

export const stockTable: CompareTable = {
  columns: ['', '31.12.2024', '30.06.2026', 'Zmiana'],
  rows: STOCK.map((s) => ({
    cells: [
      s.label,
      formatPL(s.before),
      formatPL(s.after),
      `${signed(s.after - s.before)} (${s.after < s.before ? MINUS : '+'}${formatPL(Math.abs(share(s.after - s.before, s.before)))}%)`,
    ],
  })),
};
