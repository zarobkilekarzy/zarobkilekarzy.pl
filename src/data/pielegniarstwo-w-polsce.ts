/**
 * Analiza /analizy/pielegniarstwo-w-polsce/: liczby do wykresów i tabel (drabina wieku, gęstość,
 * dopływ do zawodu, prognoza NIPiP a dane). Tekst i przypisy są w
 * content/articles/pielegniarstwo-w-polsce.mdx — tu tylko dane, które rysują bloki.
 *
 * Aktualizacja:
 * - REGISTRY i EMPLOYED_2021: tabela CRPiP na nipip.pl (aktualizowana w styczniu za koniec roku);
 * - NEW_LICENSES: dopisz rok na końcu (ta sama strona NIPiP co liczba PWZ);
 * - AGE_LADDER: tylko gdy NIPiP opublikuje nowy rozkład wieku (ostatni: styczeń 2023).
 * Liczby wpisane w treść artykułu trzeba poprawić ręcznie.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatPL } from '@/lib/format';

/** Publikacje, na które powołują się podpisy wykresów i StatRow (w treści — przypisy). */
export const LINKS = {
  report2023:
    'https://nipip.pl/wp-content/uploads/2023/12/RAPORT-O-STANIE-PIELEGNIARSTWA-I-P-OLOZNICTWA-W-POLSCE-MAJ-2023.pdf',
  report2022: 'https://nipip.pl/wp-content/uploads/2022/06/2022_Raport-NIPiP-struktura-wiekowa-kadr.pdf',
  registry: 'https://nipip.pl/liczba-pielegniarek-poloznych-zarejestrowanych-zatrudnionych/',
  licenses: 'https://nipip.pl/liczba-osob-ktore-uzyskaly-prawo-wykonywania-zawodu/',
  certificates: 'https://nipip.pl/liczba-zaswiadczen-wydanych-na-potrzeby-uznawania-kwalifikacji-zawodowych/',
  stateOfHealth:
    'https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/12/country-health-profile-2025-country-notes_7e72146d/poland_388161c0/5b674a77-en.pdf',
  oecdMigration:
    'https://www.oecd.org/en/publications/2025/11/health-at-a-glance-2025_a894f72e/full-report/international-migration-of-nurses_9f4ba769.html',
  gus2024:
    'https://stat.gov.pl/files/gfx/portalinformacyjny/pl/defaultaktualnosci/5468/40/5/1/sytuacja_demograficzna_polski_do_2024.pdf',
  gusProjection:
    'https://stat.gov.pl/files/gfx/portalinformacyjny/pl/defaultaktualnosci/5469/12/1/1/prognoza_ludnosci_rezydujacej_dla_polski_na_lata_2023-2060.pdf',
  bgk: 'https://www.bgk.pl/files/public/Pliki/Raporty/Opieka_d%C5%82ugoterminowa_w_Polsce_raport_BGK_luty_2026.pdf',
} as const;

/* ---------- Drabina wieku: zarejestrowane pielęgniarki, styczeń 2023 (NIPiP 2023, wykres 3) ---------- */

/** Udział grup wieku (%) wśród 315 670 pielęgniarek w CRPiP; od najstarszych, jak szczeble drabiny. */
export const AGE_LADDER = [
  { group: '71 lat i więcej', pct: 8.7, over60: true },
  { group: '61–70 lat', pct: 25.3, over60: true },
  { group: '51–60 lat', pct: 31.5 },
  { group: '41–50 lat', pct: 18.0 },
  { group: '31–40 lat', pct: 9.2 },
  { group: '20–30 lat', pct: 7.3 },
] as const;

export const AGE_BASE = { nurses: 315_670, date: 'styczeń 2023' } as const;

const share = (pick: (g: (typeof AGE_LADDER)[number]) => boolean) =>
  Math.round(AGE_LADDER.filter(pick).reduce((sum, g) => sum + g.pct, 0) * 10) / 10;

/** 61+ — „34% w wieku emerytalnym” z raportu NIPiP */
export const OVER_60 = share((g) => 'over60' in g);
/** poniżej 40 lat — 16,5% */
export const UNDER_40 = share((g) => g.group === '20–30 lat' || g.group === '31–40 lat');

/**
 * Szacunek redakcji przy równym rozkładzie roczników w przedziale 51–60 (po 1/10 na rocznik).
 * Kobiety (ok. 97% zawodu) nabywają prawo do emerytury w wieku 60 lat.
 * - teraz: 61+ oraz 60-latki z przedziału 51–60 → 34,0 + 3,15 ≈ 37%;
 * - do końca 2030 r.: kto w styczniu 2023 r. miał co najmniej 52 lata → 34,0 + 9/10 × 31,5 ≈ 62%.
 */
const BAND_51_60 = AGE_LADDER.find((g) => g.group === '51–60 lat')!.pct;
export const RETIREMENT_NOW = Math.round(OVER_60 + BAND_51_60 / 10);
export const RETIREMENT_2030 = Math.round(OVER_60 + (BAND_51_60 * 9) / 10);

export const ageRows: BarRow[] = AGE_LADDER.map((g) => ({
  label: g.group,
  value: g.pct,
  display: `${formatPL(g.pct, 1)}%`,
  highlight: 'over60' in g,
}));

/* ---------- Rejestr i zatrudnienie: CRPiP, stan na 31.12.2025 (aktualizacja 14.01.2026) ---------- */

export const REGISTRY = {
  date: '31.12.2025',
  nurses: { registered: 333_336, women: 321_832, men: 11_504, employed: 243_596 },
  midwives: { registered: 43_965, employed: 30_682 },
} as const;

/** Zatrudnione pielęgniarki i położne na koniec 2021 r. — punkt wyjścia prognoz NIPiP z lat 2021–2022. */
export const EMPLOYED_2021 = { nurses: 234_117, midwives: 28_899 } as const;

export const employed2025 = REGISTRY.nurses.employed + REGISTRY.midwives.employed;
export const employed2021 = EMPLOYED_2021.nurses + EMPLOYED_2021.midwives;
/** odsetek zarejestrowanych pielęgniarek, które pracują: 73,1% */
export const employedShare = (REGISTRY.nurses.employed / REGISTRY.nurses.registered) * 100;

/* ---------- Gęstość: praktykujące pielęgniarki na 1000 mieszkańców, 2023 (OECD) ---------- */

export const densityRows: BarRow[] = [
  { label: 'Polska', value: 5.9, display: '5,9', highlight: true },
  { label: 'Średnia UE', note: '(nieważona)', value: 8.5, display: '8,5' },
  { label: 'Średnia OECD', value: 9.2, display: '9,2' },
];

/* ---------- Dopływ: nowe prawa wykonywania zawodu (NIPiP), pielęgniarki + położne ---------- */

export const NEW_LICENSES = [
  { year: 2014, nurses: 3443, midwives: 759 },
  { year: 2015, nurses: 3745, midwives: 735 },
  { year: 2016, nurses: 3976, midwives: 803 },
  { year: 2017, nurses: 4197, midwives: 836 },
  { year: 2018, nurses: 4618, midwives: 869 },
  { year: 2019, nurses: 5142, midwives: 827 },
  { year: 2020, nurses: 4777, midwives: 916 },
  { year: 2021, nurses: 6004, midwives: 948 },
  { year: 2022, nurses: 6782, midwives: 978 },
  { year: 2023, nurses: 7374, midwives: 1059 },
  { year: 2024, nurses: 8734, midwives: 1087 },
  { year: 2025, nurses: 9153, midwives: 999 },
] as const;

export const licensesTotal = (year: number) => {
  const row = NEW_LICENSES.find((r) => r.year === year)!;
  return row.nurses + row.midwives;
};

/* ---------- Prognoza NIPiP z kwietnia 2022 r. (raport „zawody deficytowe”, rozdz. V) ---------- */

/** Założony stały dopływ: średnia nowych PWZ z lat 2019–2021, pielęgniarki i położne łącznie. */
export const MODEL_INFLOW = 6205;

/** Zatrudnione pielęgniarki i położne, które w danym roku osiągną 60 lat (prognoza NIPiP). */
export const MODEL_RETIREMENTS = [
  { year: 2022, people: 8821 },
  { year: 2023, people: 8659 },
  { year: 2024, people: 9533 },
  { year: 2025, people: 9470 },
  { year: 2026, people: 9206 },
  { year: 2027, people: 9238 },
  { year: 2028, people: 9807 },
  { year: 2029, people: 10101 },
  { year: 2030, people: 9899 },
] as const;

/** Suma różnic „nowe PWZ − osiągający 60 lat” w latach od–do przy zamrożonym dopływie (ujemna = ubytek). */
export const modelGap = (from: number, to: number) =>
  MODEL_RETIREMENTS.filter((r) => r.year >= from && r.year <= to).reduce((sum, r) => sum + MODEL_INFLOW - r.people, 0);

/** −317 / +288 — ze znakiem minus typograficznym */
export const signed = (n: number) => (n > 0 ? `+${formatPL(n)}` : n < 0 ? `−${formatPL(-n)}` : '0');

/** Lata, za które są już faktyczne liczby nowych PWZ. */
const CHECKED = MODEL_RETIREMENTS.filter((r) => NEW_LICENSES.some((l) => l.year === r.year));

export const checkedYears = { from: CHECKED[0].year, to: CHECKED.at(-1)!.year } as const;
export const actualGap = CHECKED.reduce((sum, r) => sum + licensesTotal(r.year) - r.people, 0);

/** Tabela: założenie prognozy a faktyczny dopływ w latach 2022–2025. */
export const modelTable: CompareTable = {
  columns: ['', 'Osiągają 60 lat (prognoza)', 'Nowe PWZ: założenie', 'Nowe PWZ: faktycznie', 'Bilans faktyczny'],
  rows: [
    ...CHECKED.map((r) => ({
      cells: [
        String(r.year),
        formatPL(r.people),
        formatPL(MODEL_INFLOW),
        formatPL(licensesTotal(r.year)),
        signed(licensesTotal(r.year) - r.people),
      ],
    })),
    {
      cells: [
        `Razem ${checkedYears.from}–${checkedYears.to}`,
        formatPL(CHECKED.reduce((sum, r) => sum + r.people, 0)),
        formatPL(MODEL_INFLOW * CHECKED.length),
        formatPL(CHECKED.reduce((sum, r) => sum + licensesTotal(r.year), 0)),
        signed(actualGap),
      ],
      marked: true,
    },
  ],
};

export const licenseRows: BarRow[] = NEW_LICENSES.map((r) => ({
  label: String(r.year),
  value: r.nurses + r.midwives,
  display: formatPL(r.nurses + r.midwives),
  highlight: r.year >= MODEL_RETIREMENTS[0].year,
}));
