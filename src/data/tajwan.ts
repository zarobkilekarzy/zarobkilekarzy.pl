/**
 * Analiza /analizy/tajwan-ochrona-zdrowia/: liczby do ilustracji (dopłaty, wartość punktu,
 * przykładowy rachunek, karta ubezpieczenia). Tekst artykułu i przypisy są w
 * content/articles/tajwan-ochrona-zdrowia.mdx — tu tylko dane, które rysują komponenty tajwan/*.
 *
 * Złote liczymy z jednego kursu (TWD.rate). Przy aktualizacji kursu zmień rate i date —
 * przeliczą się wszystkie ilustracje; kwoty „ok. … zł” w treści artykułu trzeba poprawić ręcznie.
 */
import { formatPL } from '@/lib/format';

/** Kurs NBP (tabela B) do przeliczeń w ilustracjach. */
export const TWD = { rate: 0.1208, date: '30.09.2026' } as const;

/** 420 → „≈ 51 zł”; z `decimals` — „≈ 50,74 zł” */
export const zl = (twd: number, decimals = 0) => `≈ ${formatPL(twd * TWD.rate, decimals)} zł`;

/** Publikacje, na które powołują się podpisy ilustracji (w treści — przypisy). */
export const LINKS = {
  annualReport: 'https://media.nhi.gov.tw/md/dl-95246-fa6dcd93ece54f16a73a5760d5415591-3.pdf',
  pointValues: 'https://www.mohw.gov.tw/dl-101188-2731268d-970b-46d6-a1c6-b75e4b92faf5.html',
  pointValuesSectors:
    'https://www.tma.tw/NhiLumpSum/files/2_%E8%87%B3113%E5%B9%B4Q3%E5%90%84%E7%B8%BD%E9%A1%8D%E9%83%A8%E9%96%80%E7%B5%90%E7%AE%97%E9%BB%9E%E5%80%BC%E4%B8%A6%E6%9B%B4%E6%96%B0113Q4%E9%A0%90%E4%BC%B0%E9%BB%9E%E5%80%BC.pdf',
  receipt: 'https://x.com/rafaltwn/status/2100592679717601520',
} as const;

/* ---------- Dopłata za wizytę ambulatoryjną (NHI Annual Report 2025–2026, tab. 3-3) ---------- */

export interface CopayLevel {
  level: string;
  /** nazwa poziomu po chińsku, jak na szyldach i rachunkach */
  zh: string;
  /** TWD: ze skierowaniem, bez skierowania, SOR */
  values: [number, number, number];
}

export const COPAY = {
  columns: ['ze skierowaniem', 'bez skierowania', 'SOR'],
  /** od najtańszego poziomu — im większa placówka, tym wyższa dopłata */
  levels: [
    { level: 'Przychodnia', zh: '診所', values: [50, 50, 150] },
    { level: 'Szpital lokalny', zh: '地區醫院', values: [50, 80, 150] },
    { level: 'Szpital regionalny', zh: '區域醫院', values: [100, 240, 400] },
    { level: 'Centrum medyczne', zh: '醫學中心', values: [170, 420, 750] },
  ] satisfies CopayLevel[],
  /** komórka z przykładowego rachunku niżej: szpital lokalny, bez skierowania */
  receipt: { level: 1, column: 1 },
} as const;

/* ---------- Wartość punktu: ile naprawdę wart jest 1 punkt z cennika ---------- */

export interface PointValue {
  label: string;
  detail: string;
  /** jedna wartość albo przedział [od, do] */
  value: number | [number, number];
}

export const POINT_VALUES: PointValue[] = [
  { label: 'Wartość nominalna', detail: 'leki i część świadczeń w szpitalach — stała', value: 1 },
  { label: 'Szpitale, średnio', detail: 'średnia roczna 2023–2025', value: [0.9506, 0.982] },
  { label: 'Przychodnie, region Tajpej', detail: 'IV kw. 2023', value: 0.813 },
  { label: 'Medycyna chińska, region Północny', detail: 'IV kw. 2023', value: 0.694 },
];

/* ---------- Przykładowy rachunek (neurolog, szpital lokalny, bez skierowania) ----------
   Regiony jak na wydruku z wpisu @rafaltwn (LINKS.receipt): pozycje po dwie w wierszu, ramka z rozbiciem
   dopłaty po lewej, kolumna rozliczenia z NHI i ramka płatności w okienku po prawej. Nagłówek jest nasz. */

export interface ReceiptMeta {
  zh: string;
  pl: string;
  value: string;
  /** objaśnienie po polsku w nawiasie */
  hint?: string;
}

export interface ReceiptLine {
  zh: string;
  pl: string;
  amount: number;
  /** objaśnienie: dymek przy kwocie, na wąskim ekranie lista pod rachunkiem (numer = kolejność czytania) */
  note?: string;
}

export const RECEIPT: {
  meta: ReceiptMeta[];
  /** pozycje w kolejności z wydruku — wierszami, po dwie */
  items: ReceiptLine[];
  /** 部份負擔明細表 — rozbicie dopłaty pacjenta */
  copay: { zh: string; pl: string; lines: ReceiptLine[] };
  /** rozliczenie z ubezpieczycielem */
  points: ReceiptLine[];
  /** ramka płatności w okienku: pozycje spoza ubezpieczenia i ulgi, pod nimi kwota do zapłaty */
  counter: ReceiptLine[];
  due: ReceiptLine;
  split: { label: string; amount: number; tone: 'blue' | 'ink' | 'muted' }[];
} = {
  meta: [
    { zh: '醫院', pl: 'placówka', value: '○○地區醫院', hint: 'szpital lokalny' },
    { zh: '姓名', pl: 'pacjent', value: 'Janusz Kowalski' },
    { zh: '就醫日期', pl: 'data wizyty', value: '115/09/17', hint: '17.09.2026' },
    { zh: '科別', pl: 'poradnia', value: '神經科', hint: 'neurologia' },
  ],
  items: [
    { zh: '藥費', pl: 'leki', amount: 308 },
    { zh: '診察費', pl: 'porada lekarska', amount: 286 },
    { zh: '掛號費', pl: 'opłata rejestracyjna', amount: 100, note: 'Opłata administracyjna spoza ubezpieczenia — nie wchodzi do punktów NHI. Wysokość ustala placówka.' },
    { zh: '檢查費', pl: 'badania', amount: 1110 },
  ],
  copay: {
    zh: '部份負擔明細表',
    pl: 'Dopłata pacjenta',
    lines: [
      { zh: '基本部份負擔', pl: 'dopłata za wizytę', amount: 80, note: 'Stała stawka za wizytę bez skierowania w szpitalu lokalnym — ta sama co w tabeli wyżej.' },
      { zh: '藥費部份負擔', pl: 'dopłata do leków', amount: 60, note: 'Leki za 308 TWD mieszczą się w przedziale 301–400 TWD, za który pacjent dopłaca 60 TWD.' },
    ],
  },
  points: [
    { zh: '健保申報點數', pl: 'zgłoszone do NHI', amount: 1704, note: 'Punkty wynikają z krajowego cennika, nie z decyzji szpitala: 286 + 1110 + 308 = 1704.' },
    { zh: '健保給付', pl: 'pokrywa NHI (punkty)', amount: 1564, note: '1704 − 140 = 1564 punkty. Leki NHI płaci 1:1, wartość pozostałych punktów zależy od rozliczenia kwartału.' },
    { zh: '部份負擔', pl: 'dopłata pacjenta', amount: 140 },
  ],
  counter: [
    { zh: '自付金額合計', pl: 'płatne prywatnie', amount: 100 },
    { zh: '減免金額', pl: 'ulgi i zwolnienia', amount: 0 },
  ],
  due: { zh: '應繳(退)金額', pl: 'do zapłaty w okienku', amount: 240, note: '140 TWD dopłaty i 100 TWD opłaty rejestracyjnej. Resztę wizyty rozlicza NHI.' },
  /** kto płaci za wizytę — od największej części */
  split: [
    { label: 'NHI', amount: 1564, tone: 'blue' },
    { label: 'dopłata pacjenta', amount: 140, tone: 'ink' },
    { label: 'opłata rejestracyjna', amount: 100, tone: 'muted' },
  ],
};

/* ---------- Karta ubezpieczenia: objaśnienia do numerów na ilustracji ---------- */

export const CARD_PARTS: { title: string; text?: string }[] = [
  { title: 'Chip', text: 'Placówka zapisuje na nim każdą wizytę z kolejnym numerem; w ciągu doby dane trafiają do NHIA. Hasło ustawione przez pacjenta blokuje odczyt.' },
  { title: 'Imię i nazwisko', text: '雅努什·科瓦爾斯基 to „Janusz Kowalski” zapisany chińskimi znakami (w pinyinie: Yǎnǔshí Kēwǎ’ěrsījī).' },
  { title: 'Numer identyfikacyjny posiadacza' },
  { title: 'Data urodzenia', text: 'W kalendarzu Republiki Chińskiej: 89/01/01 to 1 stycznia 2000 r.' },
  { title: 'Zdjęcie posiadacza' },
  { title: 'Numer karty' },
];
