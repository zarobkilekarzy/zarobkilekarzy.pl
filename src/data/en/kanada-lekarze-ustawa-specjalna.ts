/**
 * Wersja angielska modułu src/data/kanada-lekarze-ustawa-specjalna.ts: te same liczby i daty (importowane),
 * tylko teksty po angielsku. Kwoty zostają w CAD, a złote — jak w oryginale — po średnim ROCZNYM kursie NBP
 * z roku, którego dotyczy kwota (NBP_CAD z modułu polskiego), a nie po bieżącym kursie z buildu:
 * to porównania historyczne (kwoty z 2002, 2012… 2025 r.).
 * Treść artykułu: src/content/en/articles/canada-doctors-special-legislation.mdx.
 */
import type { CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { money, type Scale } from '@/i18n/money';
import {
  ALBERTA as ALBERTA_PL,
  NBP_CAD,
  ONTARIO as ONTARIO_PL,
  PAYMENTS,
  PENALTIES,
  QUEBEC as QUEBEC_PL,
  SPECIALISTS_BUDGET,
  type ChronoEvent,
  type RateYear,
} from '@/data/kanada-lekarze-ustawa-specjalna';

export { LINKS } from '@/data/kanada-lekarze-ustawa-specjalna';

const NBSP = '\u00A0';

type Amount = number | readonly [number, number];

const SCALES: { min: number; scale: Scale; decimals: number }[] = [
  { min: 1e9, scale: 'billion', decimals: 2 },
  { min: 1e6, scale: 'million', decimals: 2 },
  { min: 0, scale: 'thousand', decimals: 1 },
];

const DIV: Record<Scale, number> = { thousand: 1e3, million: 1e6, billion: 1e9 };

function scaled(value: number) {
  const s = SCALES.find((x) => value >= x.min) ?? SCALES[SCALES.length - 1];
  return { text: formatEN(value / DIV[s.scale], s.decimals), unit: s.scale };
}

/** 500,000 CAD z 2025 r. → „about PLN 1.34 million”; przedział → „about PLN 10.8–53.8 thousand” */
function pln(cad: Amount, year: RateYear): string {
  const rate = NBP_CAD[year];
  if (typeof cad === 'number') {
    const v = scaled(cad * rate);
    return `about PLN${NBSP}${v.text}${NBSP}${v.unit}`;
  }
  const a = scaled(cad[0] * rate);
  const b = scaled(cad[1] * rate);
  return a.unit === b.unit
    ? `about PLN${NBSP}${a.text}–${b.text}${NBSP}${b.unit}`
    : `about PLN${NBSP}${a.text}${NBSP}${a.unit}–${b.text}${NBSP}${b.unit}`;
}

/** 4000 → „CAD 4,000”; [4000, 20000] → „CAD 4,000–20,000” */
const cad = (v: Amount) => (typeof v === 'number' ? money(v, 'CAD') : `CAD${NBSP}${formatEN(v[0])}–${formatEN(v[1])}`);

/* ---------- Average gross clinical payment per physician, 2023–24 (CIHI, NPDB, tables A.1.1–A.1.3, A.3.1) ---------- */

const PROVINCE: Record<string, string> = {
  Kanada: 'Canada',
  Alberta: 'Alberta',
  Ontario: 'Ontario',
  Quebec: 'Quebec',
};
const province = (name: string) => {
  const en = PROVINCE[name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy „${name}”`);
  return en;
};

export const PAYMENTS_TABLE: CompareTable = {
  columns: ['', 'Average payment per physician', 'Fee-for-service share'],
  rows: PAYMENTS.map((p) => ({
    cells: [
      province(p.name),
      `${p.floor ? 'at least ' : ''}${cad(p.avg)} (${pln(p.avg, 2023)})`,
      `${formatEN(p.ffs, 1)}%`,
    ],
    marked: p.name === 'Quebec',
  })),
};

/* ---------- Bill 2 (LQ 2025, c. 25): main elements according to the original text ---------- */

export const LAW2_TABLE: CompareTable = {
  columns: ['', 'What it provided', 'Provision'],
  rows: [
    {
      cells: [
        'Pay tied to targets',
        'Up to 15% of pay as a “collective supplement” for groups of doctors for meeting targets for access to care',
        's. 65 (new s. 29.20)',
      ],
    },
    {
      cells: [
        'Fee cut',
        'Every fee paid to doctors by the public insurer (RAMQ) replaced with a fee equal to 86.96% of the previous one, i.e. 13.04% lower, with exceptions, including family doctors on fixed fees and salaried specialists. Effective date: 1 January 2026; after the amendment by Bill 16 — 28 February 2026',
        's. 108',
      ],
    },
    {
      cells: [
        'Extension of agreements and the specialists’ budget',
        `Agreements with doctors extended to 31 March 2028. Budget for specialists’ pay: CAD${NBSP}${formatEN(SPECIALISTS_BUDGET.from / 1e6, 1)}${NBSP}million in 2024–25 (${pln(SPECIALISTS_BUDGET.from, 2025)}) and CAD${NBSP}${formatEN(SPECIALISTS_BUDGET.to / 1e6, 1)}${NBSP}million in 2027–28 (${pln(SPECIALISTS_BUDGET.to, 2025)})`,
        'ss. 107, 124',
      ],
    },
    {
      cells: [
        'Ban on concerted action',
        'A ban on jointly reducing work and on jointly leaving the public plan. The act presumed concerted action when several doctors acted at the same time or in line with a suggestion from a doctors’ organisation',
        'ss. 131–134',
      ],
    },
    {
      cells: [
        'Sanctions',
        'Fines for each day of participation, doubled for a repeat offence (table below). In addition, half a year of professional practice deducted for each day, and disciplinary proceedings for an act derogatory to the dignity of the profession',
        'ss. 183–185, 201',
      ],
    },
    {
      cells: [
        'Capitation',
        'A fee for each registered patient for family doctors; the government could set the method of paying doctors by regulation',
        'amendments to the Health Insurance Act',
      ],
    },
  ],
};

/* ---------- Fine for each day of participation in concerted action ---------- */
/* Bill 114 (LQ 2002, c. 39), s. 20; Bill 2 (LQ 2025, c. 25), s. 201 — each 2025 amount = 4 × the 2002 amount */

const WHO: Record<string, string> = {
  Lekarz: 'Doctor',
  'Działacz lub pracownik organizacji lekarzy': 'Officer or employee of a doctors’ organisation',
  'Organizacja lekarzy (federacja)': 'Doctors’ organisation (federation)',
};
const who = (name: string) => {
  const en = WHO[name];
  if (!en) throw new Error(`[en] brak angielskiego opisu „${name}”`);
  return en;
};

export const PENALTIES_TABLE: CompareTable = {
  columns: ['', 'Bill 114 (2002)', 'Bill 2 (2025)'],
  rows: PENALTIES.map((p) => ({
    cells: [who(p.who), `${cad(p.y2002)} (${pln(p.y2002, 2002)})`, `${cad(p.y2025)} (${pln(p.y2025, 2025)})`],
  })),
};

/* ---------- Timelines: dates, kinds and links from the Polish module; English sentences here ---------- */

interface EventText {
  text: string;
  /** zapis daty, gdy w module polskim jest `when` (przedział) */
  when?: string;
  /** etykieta źródła, gdy polska jest po polsku */
  label?: string;
}

/** Teksty w kolejności zdarzeń z modułu polskiego; inna liczba zdarzeń to błąd budowania. */
function translate(name: string, events: ChronoEvent[], texts: EventText[]): ChronoEvent[] {
  if (events.length !== texts.length) {
    throw new Error(`[en] oś „${name}”: ${events.length} zdarzeń w module polskim, ${texts.length} tekstów angielskich`);
  }
  return events.map((e, i) => {
    const t = texts[i];
    if (e.when && !t.when) throw new Error(`[en] oś „${name}”, ${e.date}: brak angielskiego zapisu daty „${e.when}”`);
    return {
      ...e,
      when: e.when ? t.when : undefined,
      text: t.text,
      source: { ...e.source, label: t.label ?? e.source.label },
    };
  });
}

export const QUEBEC = translate('Quebec', QUEBEC_PL, [
  { text: 'The minister of health tables Bill 106, which links part of doctors’ pay to access to care.' },
  { when: '24–25 October 2025', text: 'Bill 2 is introduced and passed within a single night under closure (bâillon).' },
  { text: 'The doctors’ professional self-regulatory body calls for the application of the act to be suspended and for a return to talks.' },
  { text: 'The Superior Court does not suspend the act at the request of medical students; the challenge will be heard on the merits.' },
  { text: 'Preliminary agreement with the federation of family doctors.' },
  { text: 'Bill 16 repeals the chapter on concerted action and penalties and postpones the effective dates of Bill 2.' },
  { text: 'The minister of health who introduced Bill 2 leaves the government and the governing party.' },
  { text: 'Family doctors approve a five-year agreement with 97% of the vote.' },
  { text: 'The new minister of health tables Bill 19, which rewrites Bill 2.' },
  { text: 'Bill 19 is passed and in force: the fee cut and pay tied to targets are among the provisions that disappear.' },
  { when: '20–23 April 2026', text: 'Agreement with the federation of specialists; delegates approve it with 86% of the vote.' },
  { text: 'The government announces that the target for new patient registrations with family doctors has been reached ahead of schedule.' },
]);

export const ONTARIO = translate('Ontario', ONTARIO_PL, [
  { text: 'After talks with the doctors’ organisation (OMA) break down, the government unilaterally cuts the OHIP fee schedule.' },
  { text: 'An interim agreement softens some of the cuts.' },
  { text: 'The government imposes an across-the-board cut to fee-for-service payments; from June it also covers other forms of payment.' },
  { text: 'A second cut to fee-for-service payments.' },
  { text: 'OMA members reject the negotiated agreement.' },
  { text: 'The minister of health makes consent to arbitration conditional on, among other things, full transparency of doctors’ pay.' },
  { text: 'Doctors accept a binding arbitration framework.' },
  { text: 'Court of Appeal: the billings of the 100 highest-billing doctors may be disclosed with their names.' },
  { text: 'A new government terminates the arbitration framework, citing a lack of trust; the proceedings already under way continue.' },
  { text: 'Arbitration award: raises for 2017–2021 and, from 1 April 2019, an end to the across-the-board cuts.' },
  {
    text: 'The Supreme Court of Canada declines to hear the case on disclosure of billings; the 2018 ruling is final.',
    label: 'Supreme Court of Canada, case 38343',
  },
]);

export const ALBERTA = translate('Alberta', ALBERTA_PL, [
  { text: 'A new section 40.2 of the provincial health insurance act allows the minister to terminate the agreement with the doctors’ organisation (AMA).' },
  { text: 'The government terminates the agreement; new payment rules from 1 April 2020.' },
  { text: 'At the start of the pandemic the government suspends the cut to the add-on payment for longer visits.' },
  { text: 'Billing rules are changed to keep doctors in small communities.' },
  { text: 'AMA survey: some doctors say they plan to leave the province.' },
  { text: 'A regulation on disclosure of fee-for-service payments to individual doctors.' },
  { text: 'Doctors reject the first proposal for a new agreement.' },
  { text: 'Doctors ratify the agreement for 2022–26.' },
  { text: 'The legislature repeals section 40.2; the AMA undertakes to withdraw its lawsuit once the change comes into force.' },
]);
