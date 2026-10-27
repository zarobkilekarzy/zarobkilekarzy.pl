/**
 * Wersja angielska modułu src/data/tajwan.ts: te same liczby (importowane), tylko teksty po angielsku.
 * Czytają ją komponenty src/components/tajwan/* na stronach /en/ (wybór po adresie strony).
 * Kwoty zostają w dolarach tajwańskich bez przeliczenia: TWD nie ma w tabeli A NBP, z której strony
 * angielskie liczą euro (src/i18n/rates.ts), a złote z wersji polskiej liczy się z tabeli B.
 * Treść artykułu: src/content/en/articles/taiwan-healthcare-transparency.mdx.
 *
 * Tłumaczenia pozycji rachunku i poziomów placówek są przypięte do chińskich podpisów (`zh`) —
 * nowa pozycja w module polskim bez wpisu tutaj przerywa build.
 */
import {
  CARD_PARTS as CARD_PARTS_PL,
  COPAY as COPAY_PL,
  POINT_VALUES as POINT_VALUES_PL,
  RECEIPT as RECEIPT_PL,
  type PointValue,
  type ReceiptLine,
  type ReceiptMeta,
} from '@/data/tajwan';

export { LINKS } from '@/data/tajwan';

/* ---------- Copayment for an outpatient visit ---------- */

const COPAY_LEVELS: Record<string, string> = {
  '診所': 'Clinic',
  '地區醫院': 'Local hospital',
  '區域醫院': 'Regional hospital',
  '醫學中心': 'Medical centre',
};

/** Etykiety tabeli dopłat; liczby bierze komponent z COPAY modułu polskiego. */
export const COPAY_TEXT = {
  columns: ['with referral', 'without referral', 'emergency department'] as readonly string[],
  level: (zh: string) => {
    const en = COPAY_LEVELS[zh];
    if (!en) throw new Error(`[en] brak angielskiej nazwy poziomu placówki „${zh}”`);
    return en;
  },
};
// kontrola kompletności przy imporcie modułu
COPAY_PL.levels.forEach((l) => COPAY_TEXT.level(l.zh));

/* ---------- Point value ---------- */

const POINT_TEXT: Pick<PointValue, 'label' | 'detail'>[] = [
  { label: 'Nominal value', detail: 'medicines and some hospital services — fixed' },
  { label: 'Hospitals, average', detail: 'annual average 2023–2025' },
  { label: 'Clinics, Taipei region', detail: 'Q4 2023' },
  { label: 'Chinese medicine, Northern region', detail: 'Q4 2023' },
];

export const POINT_VALUES: PointValue[] = POINT_VALUES_PL.map((p, i) => {
  const text = POINT_TEXT[i];
  if (!text) throw new Error(`[en] brak angielskiego opisu wartości punktu „${p.label}”`);
  return { ...p, ...text };
});

/* ---------- Sample receipt ----------
   Pole `pl` typu ReceiptLine trzyma tu podpis w języku strony (angielski). */

const LINES: Record<string, { label: string; note?: string }> = {
  '藥費': { label: 'medicines' },
  '診察費': { label: 'consultation' },
  '掛號費': {
    label: 'registration fee',
    note: 'An administrative fee outside the insurance — it is not part of the NHI points. The amount is set by the facility.',
  },
  '檢查費': { label: 'tests' },
  '基本部份負擔': {
    label: 'visit copayment',
    note: 'A fixed rate for a visit without a referral at a local hospital — the same as in the table above.',
  },
  '藥費部份負擔': {
    label: 'medicine copayment',
    note: 'Medicines costing TWD 308 fall within the TWD 301–400 band, for which the patient pays a copayment of TWD 60.',
  },
  '健保申報點數': {
    label: 'claimed from the NHI',
    note: 'The points come from the national fee schedule, not from the hospital’s decision: 286 + 1110 + 308 = 1704.',
  },
  '健保給付': {
    label: 'covered by the NHI (points)',
    note: '1704 − 140 = 1564 points. The NHI pays for medicines 1:1; the value of the other points depends on the quarterly settlement.',
  },
  '部份負擔': { label: 'patient copayment' },
  '自付金額合計': { label: 'paid privately' },
  '減免金額': { label: 'discounts and exemptions' },
  '應繳(退)金額': {
    label: 'due at the counter',
    note: 'TWD 140 of copayment and TWD 100 of registration fee. The rest of the visit is settled by the NHI.',
  },
};

const line = (l: ReceiptLine): ReceiptLine => {
  const t = LINES[l.zh];
  if (!t) throw new Error(`[en] brak tłumaczenia pozycji rachunku „${l.zh}”`);
  if (Boolean(l.note) !== Boolean(t.note)) throw new Error(`[en] objaśnienie pozycji „${l.zh}” nie zgadza się z wersją polską`);
  return { ...l, pl: t.label, ...(t.note ? { note: t.note } : {}) };
};

const META: Record<string, Pick<ReceiptMeta, 'pl' | 'hint'>> = {
  '醫院': { pl: 'facility', hint: 'local hospital' },
  '姓名': { pl: 'patient' },
  '就醫日期': { pl: 'date of visit', hint: '17 September 2026' },
  '科別': { pl: 'department', hint: 'neurology' },
};

const SPLIT: Record<string, string> = {
  NHI: 'NHI',
  'dopłata pacjenta': 'patient copayment',
  'opłata rejestracyjna': 'registration fee',
};

export const RECEIPT: typeof RECEIPT_PL = {
  meta: RECEIPT_PL.meta.map((m) => {
    const t = META[m.zh];
    if (!t) throw new Error(`[en] brak tłumaczenia pola rachunku „${m.zh}”`);
    return { zh: m.zh, value: m.value, pl: t.pl, ...(t.hint ? { hint: t.hint } : {}) };
  }),
  items: RECEIPT_PL.items.map(line),
  copay: { ...RECEIPT_PL.copay, pl: 'Patient copayment', lines: RECEIPT_PL.copay.lines.map(line) },
  points: RECEIPT_PL.points.map(line),
  counter: RECEIPT_PL.counter.map(line),
  due: line(RECEIPT_PL.due),
  split: RECEIPT_PL.split.map((p) => {
    const label = SPLIT[p.label];
    if (!label) throw new Error(`[en] brak tłumaczenia części „${p.label}”`);
    return { ...p, label };
  }),
};

/* ---------- Insurance card: notes to the numbers on the illustration ---------- */

const CARD_TEXT: { title: string; text?: string }[] = [
  { title: 'Chip', text: 'The facility records every visit on it with a sequential number; within a day the data reach the NHIA. A password set by the patient blocks reading.' },
  { title: 'Name', text: '雅努什·科瓦爾斯基 is “Janusz Kowalski” written in Chinese characters (in pinyin: Yǎnǔshí Kēwǎ’ěrsījī).' },
  { title: 'Holder’s identification number' },
  { title: 'Date of birth', text: 'In the Republic of China calendar: 89/01/01 is 1 January 2000.' },
  { title: 'Holder’s photo' },
  { title: 'Card number' },
];

if (CARD_TEXT.length !== CARD_PARTS_PL.length) throw new Error('[en] liczba objaśnień karty nie zgadza się z wersją polską');

export const CARD_PARTS = CARD_TEXT;
