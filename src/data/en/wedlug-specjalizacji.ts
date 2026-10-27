/**
 * Wersja angielska zestawienia src/data/wedlug-specjalizacji.ts: te same liczby (importowane),
 * tylko teksty po angielsku — nazwy dziedzin, wykres obsadzenia, tabela prognozy i krótkie listy do treści.
 * Treść artykułu: src/content/en/articles/residents-pay-by-specialty.mdx; tabelę rysuje
 * components/wedlug-specjalizacji/SpecTable (na /en/ bierze stąd nazwy dziedzin).
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN, formatDateIn } from '@/lib/format';
import {
  FORECAST_2028,
  PAY_ACT,
  PRIORITY_AS_OF,
  PRIORITY_OUTSIDE_TABLE,
  SPECIALTIES,
  spec,
  type Specialty,
} from '@/data/wedlug-specjalizacji';

export {
  AUTUMN_2025,
  COMMITMENT,
  LINKS,
  OFFERS_2023,
  PRIORITY_FIELDS,
  PRIORITY_OUTSIDE_TABLE,
  RATE_MEDIAN,
  RESIDENT_COEF,
  RESIDENT_PAY,
  SPECIALTIES,
  TABLE,
  spec,
} from '@/data/wedlug-specjalizacji';
export { BASE } from '@/data/personel-medyczny';

/** „15.10.2026” → „15 October 2026” */
const enDate = (pl: string) => {
  const [d, m, y] = pl.split('.').map(Number);
  return formatDateIn(new Date(Date.UTC(y, m - 1, d)), 'en');
};

/** Rozporządzenie o pensjach rezydentów — opis po angielsku, adres bez zmian. */
export const PAY_ACT_EN = {
  label: PAY_ACT.label.replace('poz.', 'item'),
  from: '1 July 2026',
  href: PAY_ACT.href,
} as const;

export const PRIORITY_AS_OF_EN = enDate(PRIORITY_AS_OF);

/** Nazwy dziedzin z tabeli (id z modułu polskiego) → angielskie; `short` — krótsza nazwa do wykresu. */
const SPEC_NAMES: Record<string, { name: string; short?: string }> = {
  'chirurgia-plastyczna': { name: 'Plastic surgery' },
  'dermatologia': { name: 'Dermatology and venereology' },
  'endokrynologia': { name: 'Endocrinology' },
  'gastroenterologia': { name: 'Gastroenterology' },
  'urologia': { name: 'Urology' },
  'okulistyka': { name: 'Ophthalmology' },
  'kardiologia': { name: 'Cardiology' },
  'radiologia': { name: 'Radiology and diagnostic imaging' },
  'ortopedia': { name: 'Orthopaedics and traumatology of the musculoskeletal system', short: 'Orthopaedics and traumatology' },
  'otorynolaryngologia': { name: 'Otorhinolaryngology' },
  'poloznictwo-ginekologia': { name: 'Obstetrics and gynaecology' },
  'choroby-pluc': { name: 'Lung diseases' },
  'medycyna-pracy': { name: 'Occupational medicine' },
  'rehabilitacja-medyczna': { name: 'Medical rehabilitation' },
  'anestezjologia': { name: 'Anaesthesiology and intensive care', short: 'Anaesthesiology' },
  'chirurgia-ogolna': { name: 'General surgery' },
  'onkologia-kliniczna': { name: 'Clinical oncology' },
  'hematologia': { name: 'Haematology' },
  'psychiatria': { name: 'Psychiatry' },
  'neurologia': { name: 'Neurology' },
  'medycyna-paliatywna': { name: 'Palliative medicine' },
  'pediatria': { name: 'Paediatrics' },
  'medycyna-rodzinna': { name: 'Family medicine' },
  'choroby-zakazne': { name: 'Infectious diseases' },
  'geriatria': { name: 'Geriatrics' },
  'neonatologia': { name: 'Neonatology' },
  'choroby-wewnetrzne': { name: 'Internal medicine' },
  'medycyna-ratunkowa': { name: 'Emergency medicine' },
  'patomorfologia': { name: 'Pathology' },
};

const specText = (s: Specialty) => {
  const en = SPEC_NAMES[s.id];
  if (!en) throw new Error(`[en] brak angielskiej nazwy dziedziny „${s.id}”`);
  return en;
};

/** Angielska nazwa dziedziny z tabeli (wielką literą, jak w tabeli). */
export const specName = (s: Specialty) => specText(s).name;
const specShort = (s: Specialty) => specText(s).short ?? specText(s).name;
const lower = (s: Specialty) => specName(s).toLowerCase();

/** Dziedziny z listy priorytetów i prognozy MZ, których nie ma w tabeli albo które są pod inną nazwą. */
const FIELD_NAMES: Record<string, string> = {
  'chirurgia dziecięca': 'paediatric surgery',
  'chirurgia onkologiczna': 'surgical oncology',
  'kardiologia dziecięca': 'paediatric cardiology',
  'neurologia dziecięca': 'paediatric neurology',
  'onkologia i hematologia dziecięca': 'paediatric oncology and haematology',
  'psychiatria dzieci i młodzieży': 'child and adolescent psychiatry',
  'radioterapia onkologiczna': 'radiation oncology',
  'stomatologia dziecięca': 'paediatric dentistry',
  'choroby wewnętrzne': 'internal medicine',
  'chirurgia ogólna': 'general surgery',
  'medycyna pracy': 'occupational medicine',
  'rehabilitacja medyczna': 'medical rehabilitation',
  'choroby płuc': 'lung diseases',
  'balneologia i medycyna fizykalna': 'balneology and physical medicine',
  'otorynolaryngologia': 'otorhinolaryngology',
  'choroby zakaźne': 'infectious diseases',
  'pediatria': 'paediatrics',
  'medycyna rodzinna': 'family medicine',
};

const field = (pl: string) => {
  const en = FIELD_NAMES[pl.toLowerCase()];
  if (!en) throw new Error(`[en] brak angielskiej nazwy dziedziny „${pl}”`);
  return en;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** „a, b and c” */
export const and = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** „1 place” / „7 places” */
export const count = (n: number, one: string, many: string) => `${formatEN(n)} ${n === 1 ? one : many}`;

export const pct = (part: number, whole: number) => formatEN((part / whole) * 100);

/** Dziedziny priorytetowe spoza tabeli, po angielsku. */
export const priorityOutside = and(PRIORITY_OUTSIDE_TABLE.map(field));

/* ── Kandydaci na miejsce ─────────────────────────────────────────────────────── */

export const top = SPECIALTIES.filter((s) => typeof s.candidates === 'number');
export const topRez = top.reduce((n, s) => n + s.rez, 0);
export const topList = and(top.map((s) => `${lower(s)} (${formatEN(s.candidates as number, 2)})`));
const below = SPECIALTIES.filter((s) => s.candidates === 'below-1');
export const belowPriority = and(below.filter((s) => s.priority).map(lower));
export const belowOther = and(below.filter((s) => !s.priority).map(lower));

/** „93 of 981” — miejsca pozarezydenckie zajęte z dostępnych */
export const nonRez = (id: string) => `${formatEN(spec(id).takenNonRez ?? 0)} of ${formatEN(spec(id).nonRez)}`;

/* ── Obsadzenie rezydentur (wykres) ───────────────────────────────────────────── */

export const fillRows: BarRow[] = SPECIALTIES.filter((s) => s.takenRez !== undefined)
  .map((s) => ({ s, v: ((s.takenRez as number) / s.rez) * 100 }))
  .sort((a, b) => b.v - a.v)
  .map(({ s, v }) => ({
    label: specShort(s),
    note: `· ${formatEN(s.takenRez as number)} of ${formatEN(s.rez)}${s.priority ? '' : ' · not on the list'}`,
    value: v,
    display: `${formatEN(v)}%`,
    highlight: !s.priority,
  }));

export const fillCaption = `Share of resident places filled, autumn 2025: ${fillRows.map((r) => `${r.label}: ${r.display}`).join('; ')}.`;

/* ── Prognoza MZ do 2028 r. (tabela) ──────────────────────────────────────────── */

const signed = (n: number) => `${n < 0 ? '−' : '+'}${formatEN(Math.abs(n))}`;
export const gaps = FORECAST_2028.filter((r) => r.gap < 0);
export const gapsOutside = gaps.filter((r) => !r.priority);

export const forecastTable: CompareTable = {
  columns: ['', 'New specialists minus those reaching retirement age, by 2028', 'On the priority list'],
  rows: FORECAST_2028.map((r) => ({
    cells: [cap(field(r.name)), signed(r.gap), r.priority ? 'yes' : 'no'],
    marked: r.gap < 0 && !r.priority,
  })),
};
