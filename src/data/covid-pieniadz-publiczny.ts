/**
 * Analiza /analizy/covid-pieniadz-publiczny/: pieniądz publiczny w pandemii COVID-19 (2020–2022).
 * Tekst i przypisy są w content/articles/covid-pieniadz-publiczny.mdx; tu są adresy dla bloków
 * (StatRow, Figure) i dwa szeregi do wykresów.
 *
 * DWIE SUMY FUNDUSZU — nie mieszać:
 * - wydatki OGÓŁEM 2020–2022: 189 819,6 mln zł („blisko 190 mld”, NIK) — z obsługą obligacji
 *   i prowizją BGK;
 * - wydatki NA ZADANIA (wszyscy dysponenci): 184 636,0 mln zł = 92 735,4 + 48 701,1 + 43 199,5.
 *   Różnica 5,18 mld zł to obsługa obligacji i wynagrodzenie prowizyjne BGK.
 * Udział Ministra Zdrowia (53 587,3 mln zł = 29,0%) liczy się od 184 636,0, nie od 189 819,6.
 *
 * RACHUNEK ZDROWIA (GUS, NRZ): bieżące wydatki na ochronę zdrowia ogółem, dane ostateczne.
 * 2021 = 169 418,4 mln zł (obwieszczenie z 29.09.2023); 172,9 mld z wydania 2019–2021 było
 * szacunkiem wstępnym. 2023 = 243 798,9 mln zł (obwieszczenie z 30.09.2025); wydanie 2021–2023
 * podaje jeszcze wstępne 241,6 mld. Weryfikacja wszystkich wartości: 16.10.2026.
 *
 * Liczby (FUND, DISPONENTS, NRZ, NATIONAL_HOSPITAL) czyta też wersja angielska — src/data/en/covid-pieniadz-publiczny.ts.
 */

import type { BarRow } from '@/types';
import { formatPL } from '@/lib/format';

export const LINKS = {
  /** NIK, informacja o wynikach kontroli Funduszu Przeciwdziałania COVID-19 (28.09.2023) */
  nikFund: 'https://www.nik.gov.pl/aktualnosci/finanse-publiczne/fundusz-przeciwdzialania-covid-19.html',
  nikFundPdf: 'https://www.nik.gov.pl/plik/id,28245,vp,31071.pdf',
  /** NIK, dodatki covidowe (12.09.2023) */
  nikBonus: 'https://www.nik.gov.pl/najnowsze-informacje-o-wynikach-kontroli/9-mld-zlotych-na-dodatki-covidowe.html',
  /** NIK, szpitale tymczasowe (12.09.2023) */
  nikHospitals: 'https://www.nik.gov.pl/najnowsze-informacje-o-wynikach-kontroli/14-zbednych-szpitali-tymczasowych.html',
  /** GUS, obwieszczenie w sprawie NRZ za 2023 r. (30.09.2025) */
  gus2023: 'https://stat.gov.pl/sygnalne/komunikaty-i-obwieszczenia/lista-komunikatow-i-obwieszczen/obwieszczenie-w-sprawie-narodowego-rachunku-zdrowia-za-2023-r-,283,12.html',
} as const;

const mld = (mln: number) => mln / 1000;

/* ---------- Fundusz Przeciwdziałania COVID-19 (NIK, mln zł) ---------- */

export const FUND = {
  /** wydatki ogółem 2020–2022, z obsługą obligacji i prowizją BGK */
  total: 189_819.6,
  /** wydatki na zadania wszystkich dysponentów */
  tasks: 184_636.0,
  tasksByYear: [
    { year: 2020, value: 92_735.4 },
    { year: 2021, value: 48_701.1 },
    { year: 2022, value: 43_199.5 },
  ],
  health: 53_587.3,
} as const;

/** Najwięksi dysponenci (NIK, infografika „Wydatki głównych dysponentów Funduszu w latach 2020-2022”). */
export const DISPONENTS = [
  { label: 'Minister Zdrowia', value: 53_587.3, highlight: true },
  { label: 'Minister właściwy ds. pracy', value: 39_341.2 },
  { label: 'Zakład Ubezpieczeń Społecznych', value: 28_300.0 },
  { label: 'Szef Kancelarii Prezesa Rady Ministrów', value: 27_469.5 },
  { label: 'Minister właściwy ds. energii', value: 21_453.7 },
];

const share = (mln: number) => (mln / FUND.tasks) * 100;
const othersMln = FUND.tasks - DISPONENTS.reduce((s, d) => s + d.value, 0);

export const fundRows: BarRow[] = [
  ...DISPONENTS.map((d) => ({
    label: d.label,
    note: `${formatPL(share(d.value), 1)}%`,
    value: mld(d.value),
    display: `${formatPL(mld(d.value), 1)} mld zł`,
    highlight: d.highlight,
  })),
  {
    label: 'Pozostali dysponenci razem',
    note: `${formatPL(share(othersMln), 1)}%`,
    value: mld(othersMln),
    display: `${formatPL(mld(othersMln), 1)} mld zł`,
  },
];

export const fundFmt = {
  total: formatPL(mld(FUND.total), 1),
  tasks: formatPL(mld(FUND.tasks), 1),
  gap: formatPL(mld(FUND.total - FUND.tasks), 2),
  health: formatPL(mld(FUND.health), 1),
  healthShare: formatPL(share(FUND.health), 0),
  nonHealthShare: formatPL(100 - share(FUND.health), 0),
  years: FUND.tasksByYear.map((y) => formatPL(mld(y.value), 1)),
};

/* ---------- Narodowy Rachunek Zdrowia (GUS, mln zł, dane ostateczne) ---------- */

export const NRZ = [
  { year: 2019, value: 147_838.5 },
  { year: 2020, value: 151_873.5 },
  { year: 2021, value: 169_418.4 },
  { year: 2022, value: 196_205.1 },
  { year: 2023, value: 243_798.9 },
];

const growth = (i: number) => (i === 0 ? undefined : (NRZ[i].value / NRZ[i - 1].value - 1) * 100);

export const nrzGrowth = NRZ.map((r, i) => ({ year: r.year, pct: growth(i) }));

export const nrzRows: BarRow[] = NRZ.map((r, i) => {
  const g = growth(i);
  return {
    label: String(r.year),
    note: g === undefined ? undefined : `+${formatPL(g, 1)}% r/r`,
    value: mld(r.value),
    display: `${formatPL(mld(r.value), 1)} mld zł`,
    highlight: r.year === 2021,
  };
});

export const nrzCaption = `Bieżące wydatki na ochronę zdrowia ogółem według Narodowego Rachunku Zdrowia GUS, mld zł: ${NRZ.map(
  (r, i) => `${r.year} — ${formatPL(mld(r.value), 1)}${i ? ` (+${formatPL(growth(i)!, 1)}%)` : ''}`,
).join('; ')}.`;

/* ---------- Szpital Narodowy (za TVN24/Menedżerem Zdrowia, zł): działanie z odpowiedzi na kontrolę poselską, adaptacja wg KPRM ---------- */

export const NATIONAL_HOSPITAL = {
  adaptation: 29_036_636.77,
  /** funkcjonowanie XI 2020 – IV 2021, sześć miesięcy */
  operation: 78_068_660,
  months: 6,
  patients: 1843,
};

const nh = NATIONAL_HOSPITAL;
export const nhFmt = {
  adaptation: formatPL(nh.adaptation / 1e6, 2),
  operation: formatPL(nh.operation / 1e6, 2),
  total: formatPL((nh.adaptation + nh.operation) / 1e6, 1),
  perMonth: formatPL(nh.operation / nh.months / 1e6, 1),
  perMonthAll: formatPL((nh.adaptation + nh.operation) / nh.months / 1e6, 1),
  patients: formatPL(nh.patients),
};
