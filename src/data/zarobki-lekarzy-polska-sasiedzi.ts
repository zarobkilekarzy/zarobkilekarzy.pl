/**
 * Analiza /analizy/zarobki-lekarzy-polska-sasiedzi/: wykresy (BarChart) i tabele (Comparison).
 * Tekst i przypisy są w content/articles/zarobki-lekarzy-polska-sasiedzi.mdx.
 *
 * Jedna miara płac między krajami: relacja przeciętnego wynagrodzenia specjalisty do przeciętnej
 * płacy w kraju (OECD, Health at a Glance 2025, rys. 8.11 — dane z StatLink, 2023 r. albo najbliższy).
 * Stawki z tabel płac są osobno (TARIFF_TABLE) i nie stoją w jednej kolumnie z polskim minimum.
 *
 * Aktualizacja:
 * - nowa edycja Health at a Glance (listopad): podmień RATIO i DENSITY (StatLink rysunków
 *   „Remuneration of specialists” i „Practising doctors per 1 000 population”), potem liczby
 *   w treści, keyPoints i stat we frontmatterze;
 * - nowe stawki w tabelach (TV-Ärzte/VKA, rozporządzenie czeskie, KAGes): podmień TARIFFS;
 *   złote przeliczy `zl()`, ale kurs NBP i data w RATES muszą się zgadzać z przypisem [^nbp].
 *
 * Liczby (RATIO, DENSITY, TARIFFS) czyta też wersja angielska — src/data/en/zarobki-lekarzy-polska-sasiedzi.ts.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatPL } from '@/lib/format';

/** Publikacje, na które powołują się liczby w blokach (w treści — przypisy). */
export const LINKS = {
  /** OECD, Health at a Glance 2025 — „Remuneration of specialists” (rys. 8.11, s. 187) */
  oecdRemun:
    'https://www.oecd.org/en/publications/2025/11/health-at-a-glance-2025_a894f72e/full-report/remuneration-of-specialists_a50d2aa8.html',
  /** dane do rys. 8.11 (xlsx) */
  oecdRemunData: 'https://stat.link/xq8zct',
  /** dane do rys. 8.4 „Practising doctors per 1 000 population” (xlsx) */
  oecdDoctorsData: 'https://stat.link/mzifb7',
  /** Rzeczpospolita, 18.06.2026 — dokument roboczy AOTMiT z lutego 2026 r. (73% specjalistów na umowach cywilnoprawnych) */
  aotmit:
    'https://www.rp.pl/ochrona-zdrowia/art44649861-wyplaty-lekarzy-na-kontraktach-wieksze-niz-100-tys-zl-tylko-w-1-proc-przypadkow',
  /** Marburger Bund — TV-Ärzte/VKA w brzmieniu 10. zmiany, z tabelami od 1.08.2025 i 1.06.2026 */
  tvAerzte:
    'https://www.marburger-bund.de/sites/default/files/tarifvertraege/2025-06/25-06-16%20TV-%C3%84rzte%20VKA%20i.d.F.%2010.%20%C3%84ndTV.pdf',
} as const;

/* ── Kurs NBP ─────────────────────────────────────────────────────────────────── */

/** Kurs średni NBP, tabela 201/A/NBP/2026 z 15.10.2026 (api.nbp.pl), zł za jednostkę waluty. */
export const RATES = { EUR: 4.3691, CZK: 0.1794, SEK: 0.3906 } as const;
export const RATES_DATE = '15.10.2026';

type Currency = keyof typeof RATES;

const CURRENCY_LABEL: Record<Currency, string> = { EUR: '€', CZK: 'CZK', SEK: 'SEK' };

/** 7552.19, 'EUR' → „7 552,19 €”; kwoty całkowite bez groszy */
export const money = (amount: number, cur: Currency) =>
  `${formatPL(amount, Number.isInteger(amount) ? 0 : 2)} ${CURRENCY_LABEL[cur]}`;

/** 7552.19, 'EUR' → „ok. 33,0 tys. zł” (kurs z RATES) */
export const zl = (amount: number, cur: Currency) => `ok. ${formatPL((amount * RATES[cur]) / 1000, 1)} tys. zł`;

/* ── Płace: wielokrotność przeciętnej płacy (OECD) ────────────────────────────── */

/**
 * Specjaliści na etacie, stosunek przeciętnego rocznego wynagrodzenia brutto do przeciętnej płacy
 * pracownika pełnoetatowego w kraju. Rys. 8.11, lewy panel „Salaried”; 2023 r., Polska — 2022 r.
 * Austria nie ma danych dla etatów (tylko praktyki: 4,6 w 2021 r.; Niemcy: 4,9 w 2023 r.).
 */
export const RATIO = [
  { country: 'Niemcy', value: 3.2 },
  { country: 'Polska', value: 2.91, year: 2022 },
  { country: 'Czechy', value: 2.45 },
  { country: 'Szwecja', value: 2.2 },
];

/** średnia 31 krajów OECD z danymi dla specjalistów na etacie */
export const RATIO_OECD = 2.79;
export const RATIO_MAX = 4;

/**
 * Średnia OECD jako cienki słupek porównawczy na końcu, a nie linia średniej: przy 2,45 i 2,2 linia
 * na 2,79 przecinałaby podpisy wartości (zwłaszcza na telefonie).
 */
export const ratioRows: BarRow[] = [
  ...RATIO.map((r) => ({
    label: r.country,
    note: r.year ? `dane za ${r.year} r.` : undefined,
    value: r.value,
    display: `${formatPL(r.value, 1)} raza`,
    highlight: r.country === 'Polska',
  })),
  { label: 'Średnia 31 krajów OECD', value: RATIO_OECD, display: `${formatPL(RATIO_OECD, 1)} raza`, secondary: true },
];

export const ratioCaption = `Przeciętne wynagrodzenie specjalisty na etacie jako wielokrotność przeciętnej płacy w kraju, 2023 r.: ${RATIO.map((r) => `${r.country} ${formatPL(r.value, 1)}${r.year ? ` (${r.year} r.)` : ''}`).join(', ')}; średnia OECD ${formatPL(RATIO_OECD, 1)}.`;

/* ── Lekarze praktykujący na 1000 mieszkańców (OECD) ──────────────────────────── */

/** Rys. 8.4, 2023 r.; Szwecja — 2022 r. Średnia OECD (w pliku „OECD37”: 3,896) = 3,9. */
export const DENSITY = [
  { country: 'Austria', value: 5.51 },
  { country: 'Niemcy', value: 4.66 },
  { country: 'Szwecja', value: 4.47, year: 2022 },
  { country: 'Czechy', value: 4.22 },
  { country: 'Polska', value: 3.86 },
];

export const DENSITY_OECD = 3.9;
/** średnia UE z profilu Polski (State of Health in the EU 2025) — tylko w treści i podpisie */
export const DENSITY_EU = 4.3;
export const DENSITY_MAX = 6;

export const densityRows: BarRow[] = DENSITY.map((r) => ({
  label: r.country,
  note: r.year ? `dane za ${r.year} r.` : undefined,
  value: r.value,
  display: formatPL(r.value, 1),
  highlight: r.country === 'Polska',
}));

export const densityCaption = `Lekarze praktykujący na 1000 mieszkańców, 2023 r.: ${DENSITY.map((r) => `${r.country} ${formatPL(r.value, 1)}${r.year ? ` (${r.year} r.)` : ''}`).join(', ')}; średnia OECD ${formatPL(DENSITY_OECD, 1)}, średnia UE ${formatPL(DENSITY_EU, 1)}.`;

/* ── Co jest jawne: przegląd pięciu krajów ────────────────────────────────────── */

/** Kolejność wierszy: od najwęższego do najszerszego zakresu jawności. Bez kwot — te są w tekście i w TARIFF_TABLE. */
export const OVERVIEW_TABLE: CompareTable = {
  columns: ['', 'Płaca lekarza w szpitalu publicznym', 'Co jest publiczne', 'Czego nie widać'],
  rows: [
    {
      cells: [
        'Polska',
        'Etat z ustawowym minimum albo kontrakt ze stawką uzgodnioną ze szpitalem',
        'Minimum z ustawy, pensje rezydentów z rozporządzenia, mediany z jednorazowego zestawienia AOTMiT',
        'Stawki kontraktów i łączne wypłaty jednej osoby z wielu placówek',
      ],
      marked: true,
    },
    {
      cells: [
        'Czechy',
        'Tarif z rządowej tabeli w placówkach publicznych; w spółkach i placówkach prywatnych płaca umowna',
        'Tabela tarifów, przeciętne płace z urzędowej statystyki',
        'Wypłata konkretnego lekarza, w tym dyżury i nadgodziny',
      ],
    },
    {
      cells: [
        'Niemcy',
        'Pensja z tabeli układu zbiorowego; ordynatorzy i część starszych lekarzy poza tabelą',
        'Pełna tabela: grupa stanowisk i stopień stażu',
        'Umowy pozatabelowe, dochody poszczególnych praktyk',
      ],
    },
    {
      cells: [
        'Austria',
        'Pensja z tabeli pracodawcy w danym kraju związkowym',
        'Tabele płac szpitali; dochody praktyk tylko w badaniach na danych pseudonimizowanych',
        'Dochody poszczególnych praktyk',
      ],
    },
    {
      cells: [
        'Szwecja',
        'Płaca ustalana indywidualnie w ramach układu zbiorowego',
        'Średnie z urzędowej statystyki; płaca każdego pracownika publicznego na wniosek',
        'Płace u pracodawców prywatnych, także w przychodniach finansowanych przez regiony',
      ],
    },
  ],
};

/* ── Jawne tabele płac: stawka specjalisty na etacie ──────────────────────────── */

export interface Tariff {
  country: string;
  /** która tabela, grupa i od kiedy */
  table: string;
  currency: Currency;
  /** najniższy stopień grupy specjalistów */
  first: number;
  /** najwyższy stopień i jego opis */
  top: number;
  topLabel: string;
  /** liczba wypłat w roku albo inne zastrzeżenie, gdy wynika ze źródła */
  payments: string;
}

export const TARIFFS: Tariff[] = [
  {
    country: 'Niemcy',
    table: 'TV-Ärzte/VKA (szpitale komunalne), grupa II — specjalista; od 1.06.2026',
    currency: 'EUR',
    first: 7552.19,
    top: 9698.91,
    topLabel: '6. stopień, po 12 latach pracy jako specjalista',
    payments: '12 wypłat w roku; układ nie przewiduje dodatkowej wypłaty rocznej',
  },
  {
    country: 'Czechy',
    table: 'rozporządzenie 341/2017 Sb., tabela nr 3 (lekarze), klasa 14; od 1.04.2026',
    currency: 'CZK',
    first: 52000,
    top: 70010,
    topLabel: '12. stopień, ponad 32 lata praktyki',
    payments: 'tarif miesięczny; dodatków i nagród tabela nie obejmuje',
  },
  {
    country: 'Austria',
    table: 'Styria, KAGes, schemat SI/N, grupa SI/N4 — specjaliści i Oberarzt; od 1.07.2026',
    currency: 'EUR',
    first: 8752.4,
    top: 13187,
    topLabel: '19. stopień',
    payments: '14 wypłat w roku: co kwartał dodatkowo pół pensji',
  },
];

export const TARIFF_TABLE: CompareTable = {
  columns: ['', 'Tabela', 'Najniższy stopień', 'Najwyższy stopień', 'Uwagi'],
  rows: TARIFFS.map((t) => ({
    cells: [
      t.country,
      t.table,
      `${money(t.first, t.currency)} (${zl(t.first, t.currency)})`,
      `${money(t.top, t.currency)} (${zl(t.top, t.currency)}) — ${t.topLabel}`,
      t.payments,
    ],
  })),
};
