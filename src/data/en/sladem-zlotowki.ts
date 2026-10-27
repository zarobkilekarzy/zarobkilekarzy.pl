/**
 * Wersja angielska modułu src/data/sladem-zlotowki.ts: te same liczby (importowane), tylko teksty
 * po angielsku — cztery przystanki diagramu (sladem/Route) i tabela przychodów z projektu planu NFZ
 * na 2026 r. Kwoty w tabeli w miliardach złotych, bez euro (tabela z wieloma kwotami).
 * Treść artykułu: src/content/en/articles/following-the-public-zloty.mdx.
 */
import type { CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { PLAN_2026_ITEMS, PLAN_2026_REST, PLAN_2026_TOTAL, STOPS as STOPS_PL, type Stop } from '@/data/sladem-zlotowki';

export { LINKS, PLAN_2026 } from '@/data/sladem-zlotowki';

/* ---------- Diagram: four stops ---------- */

/** Angielskie teksty przystanków, po polskiej nazwie; poziom jawności bierzemy z modułu polskiego. */
const STOP_TEXT: Record<string, Omit<Stop, 'level'>> = {
  Składka: {
    name: 'Health contribution',
    what: 'Employees and business owners pay a percentage of their income, farmers an amount per hectare, and for some people the state budget pays.',
    visible: 'Rates set out in the act and aggregate amounts in the NFZ plan.',
    hidden: 'Where your zloty will go — that is decided only at the next stops.',
    levelLabel: 'visible',
  },
  'Plan NFZ': {
    name: 'NFZ plan',
    what: 'The contribution, the subsidy from the state budget and smaller revenues go into a single financial plan of the Fund.',
    visible: 'The plan and its amendments: total revenue and costs.',
    hidden: 'The plan changes during the year, so an “NFZ budget” without the date of the version says nothing.',
    levelLabel: 'totals visible',
  },
  'Wycena i rozliczenie ze szpitalem': {
    name: 'Pricing and settlement with the hospital',
    what: 'The NFZ sets the price of services and pays the facility — hospitals in the hospital network mainly through a lump sum for the whole period.',
    visible: 'Prices in orders of the President of the NFZ and in AOTMiT tariffs.',
    hidden: 'What costs most prices were based on, and how much a single procedure actually cost.',
    levelLabel: 'price visible, cost not',
  },
  'Wypłata lekarzowi': {
    name: 'Payment to the doctor',
    what: 'The hospital pays the doctor a salary under an employment contract or — more often for specialists — an amount under a civil-law contract.',
    visible: 'The statutory minimum for employees and aggregate AOTMiT data from individual facilities.',
    hidden: 'The total paid to one person by several facilities. The state can collect it; citizens will not see it.',
    levelLabel: 'total per person not public',
  },
};

export const STOPS: Stop[] = STOPS_PL.map((stop) => {
  const text = STOP_TEXT[stop.name];
  if (!text) throw new Error(`[en] brak angielskiego opisu przystanku „${stop.name}”`);
  return { ...text, level: stop.level };
});

/* ---------- NFZ plan for 2026: revenue (draft of July 2025) ---------- */

const ITEM_LABEL: Record<string, string> = {
  'Składka zdrowotna (należna brutto)': 'Health contribution (gross amount due)',
  'Dotacja podmiotowa z budżetu państwa': 'Subsidy from the state budget',
  'Fundusz Medyczny i Fundusz Solidarnościowy': 'Medical Fund and Solidarity Fund',
  'Opłaty cukrowa i alkoholowa': 'Sugar and alcohol levies',
  'Przychody finansowe': 'Financial revenue',
};
const itemLabel = (label: string) => {
  const en = ITEM_LABEL[label];
  if (!en) throw new Error(`[en] brak angielskiej nazwy przychodu „${label}”`);
  return en;
};

/** PLN billion from PLN thousand */
const bn = (thousands: number, decimals = 2) => formatEN(thousands / 1_000_000, decimals);
const share = (thousands: number) => formatEN((thousands / PLAN_2026_TOTAL) * 100, 1);

export const PLAN_2026_TABLE: CompareTable = {
  columns: ['Revenue', 'PLN billion', 'Share'],
  rows: [
    ...[
      ...PLAN_2026_ITEMS.map((item) => ({ label: itemLabel(item.label), value: item.value })),
      { label: 'Other revenue (difference to the total)', value: PLAN_2026_REST },
    ].map((item) => ({
      cells: [item.label, bn(item.value), `${share(item.value)}%`],
    })),
    { cells: ['Total', bn(PLAN_2026_TOTAL), '100%'], marked: true },
  ],
};
