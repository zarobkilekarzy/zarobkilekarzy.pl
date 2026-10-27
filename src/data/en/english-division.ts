/**
 * Wersja angielska modułu src/data/english-division.ts: te same liczby (importowane), tylko teksty
 * po angielsku. Kwoty w złotych — z euro w nawiasie po kursie z buildu (src/i18n/rates.ts); czesne UJ
 * zostaje w euro. Tabelę limitów rysuje components/english-division/LimitTable.astro (dwujęzyczny).
 * Treść artykułu: src/content/en/articles/english-division-medical-studies.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN, formatPL } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { eurApprox, money, withEur } from '@/i18n/money';
import { ESTIMATE, FEES, LINKS, LUBLIN, UNIVERSITIES, WUM_RATES } from '@/data/english-division';

export { ESTIMATE, LATEST, LINKS } from '@/data/english-division';

const rates = await getRates();

/* ── Places in a foreign language by university (latest year) ─────────────────── */

/** nazwy uczelni z modułu polskiego → angielskie (nazwy, jakich uczelnie używają po angielsku) */
const UNIVERSITY: Record<string, string> = {
  'Uniwersytet Medyczny w Poznaniu': 'Poznan University of Medical Sciences',
  'Uniwersytet Medyczny w Lublinie': 'Medical University of Lublin',
  'Warszawski Uniwersytet Medyczny': 'Medical University of Warsaw',
  'Śląski Uniwersytet Medyczny w Katowicach': 'Medical University of Silesia in Katowice',
  'Uniwersytet Medyczny we Wrocławiu': 'Wroclaw Medical University',
  'Uniwersytet Medyczny w Białymstoku': 'Medical University of Bialystok',
  'Uniwersytet Jagielloński': 'Jagiellonian University',
  'Pomorski Uniwersytet Medyczny w Szczecinie': 'Pomeranian Medical University in Szczecin',
  'Uniwersytet Medyczny w Łodzi': 'Medical University of Lodz',
  'Uniwersytet Warmińsko-Mazurski w Olsztynie': 'University of Warmia and Mazury in Olsztyn',
  'Uniwersytet Mikołaja Kopernika w Toruniu': 'Nicolaus Copernicus University in Toruń',
  'Gdański Uniwersytet Medyczny': 'Medical University of Gdańsk',
  'Akademia Śląska': 'Silesian Academy (Akademia Śląska)',
  'Uniwersytet Jana Kochanowskiego w Kielcach': 'Jan Kochanowski University in Kielce',
  'Uniwersytet Rzeszowski': 'University of Rzeszów',
  'Uniwersytet Andrzeja Frycza Modrzewskiego w Krakowie': 'Andrzej Frycz Modrzewski Krakow University',
  'Akademia WSB': 'WSB University (Akademia WSB)',
  // tabela czesnego używa krótszej nazwy
  'Śląski Uniwersytet Medyczny': 'Medical University of Silesia',
};
const university = (name: string) => {
  const en = UNIVERSITY[name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy uczelni „${name}”`);
  return en;
};

/** Wiersze wykresu; wyróżniona największa pula — jak w module polskim. */
export const universityRows: BarRow[] = UNIVERSITIES.map((u, i) => ({
  label: university(u.name),
  value: u.seats,
  display: String(u.seats),
  highlight: i === 0,
}));

/* ── Tuition fees (medicine in English, 2026/27 intake) ───────────────────────── */

/**
 * Kwoty czesnego jako liczby. W module polskim stoją w tekście (FEES.year/total), więc są przepisane —
 * build sprawdza, że każda kwota występuje w polskim wierszu tej samej uczelni.
 */
interface FeeAmounts {
  currency: 'PLN' | 'EUR';
  /** kwoty z kolumny „czesne za rok”, w kolejności z tekstu polskiego */
  year: number[];
  total: number;
  /** tekst komórki „za rok” z kwot sformatowanych przez `fmt` */
  yearText: (fmt: (n: number) => string, year: number[]) => string;
}

const FEE_AMOUNTS: Record<string, FeeAmounts> = {
  'Uniwersytet Medyczny w Poznaniu': { currency: 'PLN', year: [71000, 85750], total: 485000, yearText: (fmt, [a, b]) => `${fmt(a!)} (years 1–2), ${fmt(b!)} (years 3–6)` },
  'Uniwersytet Medyczny we Wrocławiu': { currency: 'PLN', year: [67900], total: 407400, yearText: (fmt, [a]) => fmt(a!) },
  'Śląski Uniwersytet Medyczny': { currency: 'PLN', year: [65500, 32750], total: 393000, yearText: (fmt, [a, b]) => `${fmt(a!)}, 2 × ${money(b!, 'PLN')}` },
  'Gdański Uniwersytet Medyczny': { currency: 'PLN', year: [64200], total: 385200, yearText: (fmt, [a]) => fmt(a!) },
  'Uniwersytet Jagielloński': { currency: 'EUR', year: [16000], total: 96000, yearText: (fmt, [a]) => fmt(a!) },
};

/** spacje zwykłe i twarde — do porównania kwot z tekstem polskim */
const plain = (s: string) => s.replace(/\s/g, ' ');

/** Wiersze tabeli czesnego (SourcedTable) w kolejności FEES. */
export const FEE_ROWS = FEES.map((f) => {
  const fee = FEE_AMOUNTS[f.school];
  if (!fee) throw new Error(`[en] brak kwot czesnego dla „${f.school}”`);
  for (const n of [...fee.year, fee.total]) {
    if (!plain(`${f.year} ${f.total}`).includes(plain(formatPL(n)))) {
      throw new Error(`[en] kwota ${n} nie zgadza się z czesnym „${f.school}” w module polskim`);
    }
  }
  const fmt = (n: number) => withEur(n, fee.currency, rates);
  return {
    cells: [university(f.school), fee.yearText(fmt, fee.year), fmt(fee.total)],
    source: { label: 'university website', href: f.href },
  };
});

/** „≈ €114,000” — sześć lat w Poznaniu, do opisu w StatRow */
export const FEE_TOP_EUR = eurApprox(FEE_AMOUNTS['Uniwersytet Medyczny w Poznaniu']!.total, 'PLN', rates);

/* ── Estimate of tuition revenue (not a reported figure) ──────────────────────── */

/** 6 305 × czesne za rok (zł) — do <Money scale="billion"> w treści */
export const estimateTotal = (fee: number) => ESTIMATE.students * fee;

/* ── Hourly rates ──────────────────────────────────────────────────────────────── */

/** „2.08×” */
const ratio = (a: number, b: number) => `${formatEN(a / b, 2)}×`;

/** WUM: formy zajęć w kolejności WUM_RATES.forms (Wykład, Seminarium, Ćwiczenia) */
export const WUM_FORMS = ['Lecture', 'Seminar', 'Classes'];
if (WUM_FORMS.length !== WUM_RATES.forms.length) throw new Error('[en] WUM_FORMS nie odpowiada WUM_RATES.forms');

export const WUM_ROWS = [
  { cells: ['English-language (maximum rate)', ...WUM_RATES.english.map((v) => `PLN ${v}`)], source: { label: 'annex 1', href: LINKS.wum1 } },
  { cells: ['Part-time in Polish', ...WUM_RATES.extramural.map((v) => `PLN ${v}`)], source: { label: 'annex 2', href: LINKS.wum2 } },
  { cells: ['Ratio', ...WUM_RATES.english.map((v, i) => ratio(v, WUM_RATES.extramural[i]!))] },
];

/** UM w Lublinie: stanowiska w kolejności LUBLIN.positions */
const POSITION: Record<string, string> = {
  Profesor: 'Professor',
  'Profesor uczelni, adiunkt z habilitacją': 'University professor, assistant professor with habilitation',
  Adiunkt: 'Assistant professor',
  'Asystent, młodszy asystent': 'Assistant, junior assistant',
};

export const LUBLIN_TABLE: CompareTable = {
  columns: ['', 'In Polish', 'Lecture in English', 'Other classes in English'],
  rows: LUBLIN.positions.map((p) => {
    const title = POSITION[p.title];
    if (!title) throw new Error(`[en] brak angielskiej nazwy stanowiska „${p.title}”`);
    return { cells: [title, `PLN ${p.rate}`, `PLN ${p.rate + LUBLIN.bonus.lecture}`, `PLN ${p.rate + LUBLIN.bonus.other}`] };
  }),
};
