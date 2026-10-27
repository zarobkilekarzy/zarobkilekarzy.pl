/**
 * Wersja angielska modułu src/data/rekordy.ts: te same wiersze, w tej samej kolejności i z tymi samymi źródłami,
 * tylko teksty po angielsku. Kwoty w wierszach są w module polskim napisami („316 079 zł”, „ponad 2 mln zł”) —
 * `amountEN()` czyta je stamtąd i zapisuje po angielsku, a przybliżenie w euro (kurs z buildu, src/i18n/rates.ts)
 * stawia na początku linijki okresu.
 * Tabele z wieloma kolumnami kwot (Mazowsze, województwa) — same złote; przybliżenie kursu daje PLN_HINT w podpisie.
 * Nowy wiersz albo zmieniony opis w module polskim → dopisz tekst tutaj (build przerwie się na brakującym id
 * albo na niezgodnej uwadze). Treść artykułu: src/content/en/articles/record-doctor-payments.mdx.
 */
import type { CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { eurApprox, money, type Scale } from '@/i18n/money';
import { DAILY, MAZOWSZE, MONTHLY, REGIONS, YEARLY, type CaseStatus, type RecordRow } from '@/data/rekordy';

export { LINKS } from '@/data/rekordy';

const rates = await getRates();

/* ── Kwoty z napisów modułu polskiego ─────────────────────────────────────────── */

const AMOUNT = /^(ponad |prawie |ok\. )?(\d{1,3}(?:[\s  ]\d{3})+|\d+)(?:,(\d+))?( tys\.| mln)? zł$/;
const PREFIX: Record<string, string> = { 'ponad ': 'over ', 'prawie ': 'almost ', 'ok. ': 'about ' };
const SCALE: Record<string, { scale: Scale; factor: number }> = {
  ' tys.': { scale: 'thousand', factor: 1e3 },
  ' mln': { scale: 'million', factor: 1e6 },
};

function parseAmount(pl: string) {
  const m = AMOUNT.exec(pl.trim());
  if (!m) throw new Error(`[en] nieznany zapis kwoty „${pl}” w src/data/rekordy.ts`);
  const [, prefix, int, frac = '', unit] = m;
  const s = unit ? SCALE[unit] : undefined;
  const value = Math.round(Number(`${int.replace(/\D/g, '')}.${frac || '0'}`) * (s?.factor ?? 1) * 100) / 100;
  return { prefix: prefix ? PREFIX[prefix] : '', value, options: { scale: s?.scale, decimals: frac.length } };
}

/**
 * Kwota wiersza tabeli: „ponad 2 mln zł” → { amount: „over PLN 2 million”, eur: „(≈ €470,000)” }.
 * Euro idzie do linijki okresu, a nie obok kwoty: kolumna kwoty jest wąska, a kwota się nie łamie.
 */
const amountEN = (pl: string) => {
  const a = parseAmount(pl);
  return { amount: `${a.prefix}${money(a.value, 'PLN', a.options)}`, eur: `(${eurApprox(a.value, 'PLN', rates)})` };
};

/** „ponad 55 800 zł” → „over PLN 55,800” (bez euro — do tabel z wieloma kolumnami kwot) */
const plnEN = (pl: string) => {
  const a = parseAmount(pl);
  return `${a.prefix}${money(a.value, 'PLN', a.options)}`;
};

/** Przybliżenie kursu do podpisów tabel w samych złotych: „PLN 100,000 ≈ €23,500”. */
export const PLN_HINT = `${money(100000, 'PLN')} ${eurApprox(100000, 'PLN', rates)}`;

/* ── Daty stanu sprawy ────────────────────────────────────────────────────────── */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_PL = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];

/** „16.10.2026” → „16 October 2026”, „lipiec 2026” → „July 2026” */
function dateEN(pl: string): string {
  const full = /^(\d{1,2})\.(\d{2})\.(\d{4})$/.exec(pl);
  if (full) return `${Number(full[1])} ${MONTHS[Number(full[2]) - 1]} ${full[3]}`;
  const month = /^(\p{L}+) (\d{4})$/u.exec(pl);
  const i = month ? MONTHS_PL.indexOf(month[1]) : -1;
  if (month && i >= 0) return `${MONTHS[i]} ${month[2]}`;
  throw new Error(`[en] nieznany zapis daty „${pl}” w src/data/rekordy.ts`);
}

/* ── Wiersze tabel rekordów ───────────────────────────────────────────────────── */

/** Etykieta wiersza bez postępowania (NONE w module polskim). */
const NONE_PL = 'źródła nie opisują postępowania';
const NONE_EN = 'no proceedings described in the sources';

interface RowText {
  place: string;
  what: string;
  period: string;
  note?: string;
  /** etykieta i dopowiedzenie stanu sprawy — wymagane, gdy wiersz ma inny stan niż „brak postępowania” */
  status?: { label: string; note?: string };
}

/** Podpisy źródeł, które nie są nazwą redakcji. */
const SOURCE_LABEL: Record<string, string> = {
  'Dziennik Łódzki — sprostowanie': 'Dziennik Łódzki — correction',
  Prokuratura: 'Prosecutor’s office',
};

const TEXT: Record<string, RowText> = {
  /* za miesiąc */
  mazowsze: {
    place: 'Regional hospitals of Mazowsze',
    what: 'Highest contract in the regional government’s compilation',
    period: 'per month, 2025',
    note: 'The contract has been terminated. For contracts the source gives a single amount, without a gross/net split.',
  },
  dolnoslaskie: {
    place: 'Hospitals run by the Dolnośląskie regional government',
    what: 'Highest contract in the regional government’s compilation',
    period: 'net, per month, 2025',
    note: 'The office gave all amounts net, so we do not compare them directly with gross amounts from other regions. The hospital was not named.',
  },
  lublin: {
    place: 'Uniwersytecki Szpital Kliniczny nr 4 w Lublinie (a university hospital)',
    what: 'Highest rate in the hospital’s list of monthly contract rates (neurosurgeon)',
    period: 'per month',
    note: 'The source does not say which month the rate refers to or whether it is gross.',
  },
  lubuskie: {
    place: 'Hospitals run by the Lubuskie regional government',
    what: 'Highest contract in the regional government’s compilation',
    period: 'gross, per month, 2025',
    note: 'Includes on-call duty and recurring allowances. The hospital was not named.',
  },
  'belchatow-urolog': {
    place: 'Regional hospital in Bełchatów',
    what: 'Urologist under contract: an hourly rate plus a percentage of procedures',
    period: 'per month',
  },
  'lodzkie-ortopeda': {
    place: 'A hospital in the Łódzkie region',
    what: 'Orthopaedic surgeon under contract — in a compilation of rates from Łódź-region hospitals',
    period: 'per month',
    note: 'The source does not say which hospital.',
  },
  'wloclawek-maj': {
    place: 'Regional hospital in Włocławek',
    what: 'Highest monthly payment to a doctor (hospital data)',
    period: 'gross, May 2026',
  },
  tarnobrzeg: {
    place: 'Regional hospital in Tarnobrzeg',
    what: 'Highest contract in the Podkarpackie regional government’s compilation',
    period: 'gross, per month, 2025',
    note: '“Over PLN 1.66 million a year” in the source’s headline is this amount times 12, not an annual payment.',
  },
  warmia: {
    place: 'Hospitals run by the Warmińsko-Mazurskie regional government',
    what: 'Highest contract in the regional government’s compilation',
    period: 'gross, per month, 2025',
    note: 'Amount from the office’s table; the article text gives “over PLN 132.5 thousand” and does not explain the difference. The hospital was not named.',
  },
  ostroda: {
    place: 'County hospital in Ostróda (a company owned by the county)',
    what: 'Highest monthly pay of a doctor in the compilation for a county councillor',
    period: 'February 2026, for 117 hours',
    note: 'Civil-law contract. Another payment (PLN 91,462.26 for 56 hours in April) was converted by the media into about PLN 1,600 an hour; the hospital disputes this calculation because it counts only hours on the ward and in primary care (POZ).',
  },
  pila: {
    place: 'Specialist hospital in Piła',
    what: 'Highest payment to a contract doctor in the TVN24 survey',
    period: 'one collective invoice, May 2026',
    note: 'This is not payment for one month. According to the hospital director, the invoice covers services from four months, because the doctor is paid for procedures only after the money arrives from the NFZ.',
  },
  zgierz: {
    place: 'Regional hospital in Zgierz',
    what: 'Highest contract “for one month” in the compilation for a city councillor',
    period: 'contract described as monthly, 2025',
    note: 'The period cannot be confirmed. The hospital corrected the employment-period column: in some rows the HR and payroll system entered the date of the last change in the data rather than the actual contract period.',
    status: { label: 'hospital corrected the periods in the compilation; no proceedings described in the sources' },
  },

  /* za dzień i za godzinę */
  neurochirurdzy: {
    place: 'Two hospitals in smaller towns (Kujawsko-Pomorskie and Pomorskie regions)',
    what: 'Bills from a neurosurgeons’ company for a day of operations',
    period: 'per day; as much as PLN 26 thousand an hour',
    note: 'Amounts according to the findings of Wirtualna Polska: the company may have issued such bills. The NFZ fined one of the hospitals over PLN 2.6 million; the hospital has appealed.',
    status: {
      label: 'two investigations, no charges',
      note: 'Supervised by the regional prosecutor’s offices in Bydgoszcz and Słupsk; the second is conducted by the Central Anti-Corruption Bureau (CBA). In the first, the neurosurgeons have not yet been questioned.',
    },
  },
  wmc: {
    place: 'Private hospital in Warsaw with an NFZ contract',
    what: 'Orthopaedic surgeon — payment divided by the hours worked',
    period: 'per hour; about PLN 337 thousand for 43 hours',
    note: 'The hospital gave the amounts and the number of hours without the settlement period. This is a calculated figure, not an agreed rate: according to experts, the payment more likely results from a percentage of the value of procedures. The money comes from the contract with the NFZ.',
  },

  /* za rok */
  bialystok: {
    place: 'Public oncology centre in Białystok',
    what: 'One contract doctor paid a percentage of procedures',
    period: 'for 2024',
    note: 'A threshold from the audit findings, not an exact amount. Another 16 people: from PLN 1 million to almost PLN 1.5 million.',
    status: {
      label: 'audit by the owner',
      note: 'Audit by the regional government at the end of 2025: 48 recommendations to be implemented by 14 August 2026. We found no information on whether they were implemented.',
    },
  },
  zamosc: {
    place: 'Regional hospital in Zamość',
    what: 'Radiologist on a civil-law contract — the highest pay in the hospital',
    period: 'for 2025',
    note: 'The amount was confirmed by the hospital director. The hospital’s reply to an MP’s parliamentary question gives PLN 2,693,719.58 — the sources do not explain the difference. Over PLN 1.77 million was for reporting on imaging studies, the rest for, among other things, readiness to perform procedures and hours outside regular working hours.',
  },
  koszalin: {
    place: 'Regional hospital in Koszalin',
    what: 'Highest-paid doctor',
    period: 'for 2025',
    note: 'On average over PLN 216 thousand a month. The data were disclosed by a councillor, citing Sieć Obywatelska Watchdog Polska.',
  },
  konin: {
    place: 'Regional hospital in Konin',
    what: 'Highest annual pay of a doctor (all components)',
    period: 'gross, for 2025',
    note: 'A threshold, not an exact amount. The newsroom did not say where the compilation came from.',
  },
  sosnowiec: {
    place: 'Municipal hospital in Sosnowiec',
    what: 'ENT specialist (otorhinolaryngologist) under contract — the highest pay in the hospital',
    period: 'for 2025',
    note: 'Hospital data in reply to a councillor’s question. The source does not say whether the amount is gross.',
  },
  braniewo: {
    place: 'County hospital in Warmia and Mazury',
    what: 'Invoices from one contract doctor',
    period: 'for a year (2024)',
    note: 'In 2024 the doctor reported 11,577 hours of work — more than there are in a whole year.',
    status: {
      label: 'investigation suspended, no charges',
      note: 'The District Prosecutor’s Office in Elbląg is investigating the actions of the former CEO of the company running the hospital, not the doctor. The investigation is waiting for an expert opinion.',
    },
  },
  'wloclawek-rok': {
    place: 'Regional hospital in Włocławek',
    what: 'Highest-paid doctor (hospital data)',
    period: 'for 2025',
  },
  wadowice: {
    place: 'County hospital in Wadowice',
    what: 'Anaesthetist — the highest pay in the hospital',
    period: 'for 2025',
    note: 'The hospital pays 89 doctors on civil-law contracts, over PLN 43 million a year in total. The next two amounts: about PLN 1.31 and 1.20 million.',
  },
  kalisz: {
    place: 'Regional hospital in Kalisz',
    what: 'The four highest-paid contract doctors — combined',
    period: 'a year, for four people together',
    note: 'The amount was confirmed by the hospital director. The hospital has over PLN 40 million of debt.',
    status: {
      label: 'investigation, no charges',
      note: 'The Regional Prosecutor’s Office in Ostrów Wielkopolski is examining the period of the previous management, including drug purchases and the high pay of several doctors. The investigation has been extended to 14 December 2026.',
    },
  },
};

function statusEN(pl: CaseStatus, text: RowText['status'], id: string): CaseStatus {
  if (!text && pl.label !== NONE_PL) throw new Error(`[en] brak angielskiego stanu sprawy dla wiersza „${id}”`);
  if (Boolean(text?.note) !== Boolean(pl.note)) throw new Error(`[en] dopowiedzenie stanu sprawy „${id}” nie zgadza się z wersją polską`);
  return { stage: pl.stage, label: text?.label ?? NONE_EN, asOf: dateEN(pl.asOf), note: text?.note };
}

const rowsEN = (rows: RecordRow[]): RecordRow[] =>
  rows.map((r) => {
    const t = TEXT[r.id];
    if (!t) throw new Error(`[en] brak angielskiego tekstu dla wiersza „${r.id}” z src/data/rekordy.ts`);
    if (Boolean(t.note) !== Boolean(r.note)) throw new Error(`[en] uwaga wiersza „${r.id}” nie zgadza się z wersją polską`);
    const { amount, eur } = amountEN(r.amount);
    return {
      id: r.id,
      place: t.place,
      what: t.what,
      amount,
      period: `${eur} ${t.period}`,
      note: t.note,
      status: statusEN(r.status, t.status, r.id),
      sources: r.sources.map((s) => ({ label: SOURCE_LABEL[s.label] ?? s.label, href: s.href })),
    };
  });

export const MONTHLY_EN = rowsEN(MONTHLY);
export const DAILY_EN = rowsEN(DAILY);
export const YEARLY_EN = rowsEN(YEARLY);

/* ── Kontrakt a etat: Mazowsze i województwa ─────────────────────────────────── */

const pln = (n: number) => money(n, 'PLN');

export const MAZOWSZE_TABLE: CompareTable = {
  caption:
    'The ten highest monthly pay amounts in the regional hospitals of Mazowsze, 2025, separately for each form of employment. Employment contracts and civil-law contracts — gross; for B2B contracts the source gives a single amount.',
  columns: ['Rank', 'Employment contract', 'Contract (B2B)', 'Civil-law contract'],
  rows: MAZOWSZE.map((r, i) => ({
    cells: [`${i + 1}.`, pln(r.etat), r.rozwiazana ? `${pln(r.kontrakt)} (contract terminated)` : pln(r.kontrakt), pln(r.cywilna)],
    marked: i === 0,
  })),
};

/** „do 3,9” → „up to 3.9” */
function ratioEN(pl: string): string {
  const m = /^(do )?(\d+),(\d)$/.exec(pl);
  if (!m) throw new Error(`[en] nieznany zapis ilorazu „${pl}” w src/data/rekordy.ts`);
  return `${m[1] ? 'up to ' : ''}${formatEN(Number(`${m[2]}.${m[3]}`), 1)}`;
}

/** Nazwy województw zostają po polsku, wielką literą (jak w nazwach urzędów). */
const regionEN = (name: string) => name.replace(/(^|-)(\p{L})/gu, (_, sep: string, ch: string) => `${sep}${ch.toUpperCase()}`);

export const REGIONS_TABLE: CompareTable = {
  caption:
    'The highest monthly pay under a contract and under an employment contract in hospitals run by the regional government, 2025, gross, according to compilations from the marshal’s offices.',
  columns: ['Region (voivodeship)', 'Highest contract', 'Highest employment contract', 'Contract ÷ employment'],
  rows: REGIONS.map((r, i) => ({ cells: [regionEN(r.name), pln(r.kontrakt), plnEN(r.etat), `${ratioEN(r.ratio)}×`], marked: i === 0 })),
};
