/**
 * Analiza /analizy/apteka-pieniadz-publiczny/: refundacja leków, sprzedaż leków na receptę,
 * receptomaty i nadużycia przy recepturze. Tekst i przypisy są w
 * content/articles/apteka-pieniadz-publiczny.mdx; tu są dane bloków (BarChart, Comparison,
 * StatRow) i adresy dla nich.
 *
 * JEDNA DEFINICJA REFUNDACJI: „całkowity budżet na refundację” z komunikatu NFZ „DEF”
 * (art. 102 ust. 5 pkt 27 ustawy o świadczeniach), koszty narastająco, tys. zł. Suma pozycji
 * 1–7 równa się „całkowitemu budżetowi” co do grosza (sprawdzone 16.10.2026):
 *   2024: 25 538 247,60 · 2025: 30 038 673,16 · I–VIII 2026: 20 473 321,41.
 * Przez apteki ogólnodostępne idą pozycje 4 (4.1–4.3), 6 (art. 43a) i 7 (art. 43b), reszta
 * (programy lekowe, chemioterapia, RDTL) głównie przez podmioty lecznicze. Komunikat DEF nie
 * dzieli kosztów na kanały — podział wynika z rodzaju pozycji.
 *
 * NIE MIESZAĆ z GUS „Sprzedaż leków na receptę” (dane aptek z SIM, ceny detaliczne) ani z PEX
 * (cały rynek apteczny z lekami bez recepty). GUS-owska „refundacja z NFZ” (15,3 mld zł w 2025 r.)
 * jest o ok. 0,37 mld zł niższa niż suma poz. 4.1 i 6 z DEF; źródła tego nie wyjaśniają.
 *
 * Aktualizacja: DEF za pełny rok NFZ publikuje latem następnego roku (2025 → 1.07.2026);
 * komunikaty śródroczne — co miesiąc z opóźnieniem ok. 1,5 mies. GUS: czerwiec.
 */

import type { BarRow, CompareTable } from '@/types';
import { formatPL } from '@/lib/format';
import { budget } from '@/data/budzet-nfz';

export const LINKS = {
  /** NFZ, Komunikat DEF za I–XII 2024 (25.07.2025) */
  def2024: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/komunikat-def,8808.html',
  /** NFZ, Komunikat DEF za I–XII 2025 (1.07.2026; literówka „komunkat” w adresie jest w oryginale) */
  def2025: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/komunkat-def,8972.html',
  /** NFZ, Komunikat DEF za I–VIII 2026 (2.10.2026) */
  def2026: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/komunikat-def,9024.html',
  /** GUS, Sprzedaż leków na receptę w 2025 r. (25.06.2026) */
  gus: 'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/sprzedaz-lekow-na-recepte-w-2025-r-,29,4.html',
  /** MZ, Raport Zespołu ds. preskrypcji i realizacji recept (2024), s. 40 — receptomaty */
  mzRaport: 'https://www.gov.pl/attachment/ef0cc14f-47c4-4af0-8073-c86a45a680ac',
  /** RPP, stan na 25.08.2026 (publ. 27.08.2026) */
  rpp: 'https://www.gov.pl/web/rpp/rzecznik-praw-pacjenta-reaguje-na-naduzycia-w-receptomatach',
  /** NFZ, akcja CBŚP, prokuratury i NFZ — leki recepturowe (30.07.2025) */
  nfzReceptura: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/skoordynowana-akcja-organow-scigania-i-narodowego-funduszu-zdrowia-rozbito-grupy-przestepcze-ktore-wyludzaly-srodki-z-nfz,8812.html',
  /** Prawo.pl, kontrole NFZ w II kw. 2024 (6.09.2024) */
  kontrole: 'https://www.prawo.pl/zdrowie/prawie-polowa-recept-zawierala-bledy-kontrola-nfz,528905.html',
} as const;

/* ---------- Refundacja NFZ: komunikaty DEF (tys. zł) ---------- */

export type Period = '2024' | '2025' | '2026';
export type Channel = 'apteka' | 'podmioty';

export const PERIODS: { key: Period; label: string; href: string; published: string; partial?: boolean }[] = [
  { key: '2024', label: '2024', href: LINKS.def2024, published: '25.07.2025' },
  { key: '2025', label: '2025', href: LINKS.def2025, published: '1.07.2026' },
  { key: '2026', label: 'I–VIII 2026', href: LINKS.def2026, published: '2.10.2026', partial: true },
];

interface RefundItem {
  /** numer pozycji w komunikacie DEF */
  pos: string;
  label: string;
  channel: Channel;
  /** koszty narastająco, tys. zł */
  values: Record<Period, number>;
}

/** Pozycje 1–7 komunikatu DEF (poz. 5 — rezerwa — we wszystkich okresach 0, pominięta). */
export const REFUND: RefundItem[] = [
  { pos: '1', label: 'Programy lekowe', channel: 'podmioty', values: { '2024': 10_883_515.63, '2025': 12_906_490.5, '2026': 9_032_025.23 } },
  { pos: '2', label: 'Chemioterapia', channel: 'podmioty', values: { '2024': 712_047.23, '2025': 959_063.82, '2026': 616_951.02 } },
  { pos: '3', label: 'Ratunkowy dostęp do technologii lekowej (RDTL)', channel: 'podmioty', values: { '2024': 298_199.04, '2025': 384_661.53, '2026': 224_690.85 } },
  { pos: '4.1', label: 'Leki, środki spożywcze i wyroby na receptę w aptece', channel: 'apteka', values: { '2024': 10_543_856.29, '2025': 12_002_420.49, '2026': 7_911_934.76 } },
  { pos: '4.2', label: 'Leki z art. 15 ust. 2 pkt 17 ustawy refundacyjnej', channel: 'apteka', values: { '2024': 39_437.41, '2025': 51_722.99, '2026': 22_274.76 } },
  { pos: '4.3', label: 'Środki spożywcze z art. 15 ust. 2 pkt 18 ustawy refundacyjnej', channel: 'apteka', values: { '2024': 20_347.91, '2025': 22_482.0, '2026': 15_435.25 } },
  { pos: '6', label: 'Bezpłatne leki dla osób od 65 lat i dzieci do 18 lat (art. 43a)', channel: 'apteka', values: { '2024': 3_025_125.29, '2025': 3_672_577.5, '2026': 2_618_144.77 } },
  { pos: '7', label: 'Bezpłatne leki dla kobiet w ciąży (art. 43b)', channel: 'apteka', values: { '2024': 15_718.8, '2025': 39_254.33, '2026': 31_864.77 } },
];

/** Plan „całkowitego budżetu na refundację” na rok (tys. zł) — z tych samych komunikatów. */
export const REFUND_PLAN: Record<Period, number> = { '2024': 26_213_488, '2025': 31_013_210, '2026': 32_753_310 };

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** tys. zł → mld zł */
const mld = (tys: number) => tys / 1e6;

/** Całkowity budżet na refundację w okresie, mld zł. */
export const refundTotal = (p: Period) => mld(sum(REFUND.map((r) => r.values[p])));
/** Część budżetu w kanale (apteka / podmioty lecznicze), mld zł. */
export const refundChannel = (p: Period, c: Channel) => mld(sum(REFUND.filter((r) => r.channel === c).map((r) => r.values[p])));
/** Jedna pozycja DEF, mld zł. */
export const refundItem = (p: Period, pos: string) => mld(REFUND.find((r) => r.pos === pos)!.values[p]);
/** Plan budżetu refundacyjnego, mld zł. */
export const refundPlan = (p: Period) => mld(REFUND_PLAN[p]);

/** mld zł z przecinkiem: 30,04 */
export const fmt = (n: number, decimals = 1) => formatPL(Math.round(n * 10 ** decimals + 1e-9) / 10 ** decimals, decimals);

/** Wzrost 2025 wobec 2024, %. */
export const refundGrowth = (refundTotal('2025') / refundTotal('2024') - 1) * 100;

/** Udział planu refundacyjnego w kosztach ogółem planu NFZ na 2025 r. (plan do planu; nasz rachunek). */
export const PLAN_SHARE_2025 = (refundPlan('2025') / budget(2025).costs) * 100;
export const NFZ_COSTS_2025 = budget(2025).costs;

/** Wiersze wykresu: pozycje 2025 od największej; trzy drobne pozycje apteczne razem. */
export const refundRows = (p: Period = '2025'): BarRow[] => {
  const small = ['4.2', '4.3', '7'];
  const rows = REFUND.filter((r) => !small.includes(r.pos)).map((r) => ({
    label: r.label,
    note: r.channel === 'apteka' ? 'apteka' : 'podmioty lecznicze',
    value: mld(r.values[p]),
    highlight: r.channel === 'apteka',
  }));
  rows.push({
    label: 'Pozostałe pozycje apteczne',
    note: 'art. 15 ust. 2 pkt 17 i 18, art. 43b',
    value: sum(small.map((pos) => refundItem(p, pos))),
    highlight: true,
  });
  return rows
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ ...r, display: `${fmt(r.value, r.value < 1 ? 2 : 1)} mld zł` }));
};

const CHANNEL_LABEL: Record<Channel, string> = { apteka: 'apteka', podmioty: 'podmioty lecznicze' };

/** Tabela wszystkich pozycji DEF w trzech okresach, z sumami liczonymi z danych. */
export const REFUND_TABLE: CompareTable = {
  columns: ['', ...PERIODS.map((p) => `${p.label}, mld zł`), 'Kanał'],
  rows: [
    ...REFUND.map((r) => ({
      cells: [`${r.pos}. ${r.label}`, ...PERIODS.map((p) => fmt(mld(r.values[p.key]), 2)), CHANNEL_LABEL[r.channel]],
    })),
    { cells: ['Razem — całkowity budżet na refundację', ...PERIODS.map((p) => fmt(refundTotal(p.key), 2)), '—'], marked: true },
    { cells: ['w tym przez apteki (poz. 4, 6, 7)', ...PERIODS.map((p) => fmt(refundChannel(p.key, 'apteka'), 2)), 'apteka'], marked: true },
    { cells: ['w tym programy lekowe, chemioterapia, RDTL (poz. 1–3)', ...PERIODS.map((p) => fmt(refundChannel(p.key, 'podmioty'), 2)), 'podmioty lecznicze'], marked: true },
  ],
};

/* ---------- GUS: sprzedaż leków na receptę w aptekach, 2025 ---------- */

/** GUS, informacja sygnalna z 25.06.2026 (dane SIM; ceny detaliczne). Kwoty w mld zł. */
export const GUS_2025 = {
  sales: 33.4,
  salesGrowth: 13.1,
  refund: 15.3,
  refundShare: 45.9,
  refundShare2022: 39.3,
  patients: 18.1,
  /** zrealizowane recepty, mln */
  prescriptions: 515.6,
  eShare: 97.8,
} as const;

/** Refundacja w GUS wobec poz. 4.1 + 6 z DEF za 2025 r. (mld zł) — różnica bez wyjaśnienia w źródłach. */
export const GUS_VS_DEF_2025 = refundItem('2025', '4.1') + refundItem('2025', '6') - GUS_2025.refund;

/* ---------- Receptomaty: raport Zespołu MZ (2024), s. 40 ---------- */

export const RECEPTOMATY = {
  firms: { 2019: 3, 2023: 28 },
  prescriptions: { 2019: 583_196, 2023: 2_850_621 },
  people: { 2019: 63_968, 2023: 1_010_401 },
  /** wartość leków kupionych na te recepty, zł */
  value: { 2019: 21_742_742.49, 2023: 275_081_403.59 },
  /** udział leków refundowanych w wartości sprzedaży, % */
  refundedShare: { 2019: 60.69, 2023: 1.33 },
} as const;

/** Wartość sprzedanych leków refundowanych z receptomatów w 2023 r., mln zł (nasz rachunek; górna granica dla NFZ). */
export const RECEPTOMATY_REFUNDED_2023 = (RECEPTOMATY.value[2023] * RECEPTOMATY.refundedShare[2023]) / 100 / 1e6;
export const RECEPTOMATY_GROWTH = RECEPTOMATY.value[2023] / RECEPTOMATY.value[2019];

/** Rzecznik Praw Pacjenta wobec receptomatów — stan na 25.08.2026. */
export const RPP = {
  asOf: '25.08.2026',
  decisions: 72,
  /** kary za niewykonanie decyzji, mln zł („blisko 1 mln 300 tys. zł”) */
  fines: 1.3,
  complaints: 14,
  judgments: 7,
  /** zawiadomienia do rzeczników odpowiedzialności zawodowej (ok.) */
  professional: 30,
  prosecutor: 6,
} as const;

/* ---------- Kontrole NFZ i receptura ---------- */

/** Kontrole NFZ w II kw. 2024 (Prawo.pl za NFZ). */
export const CONTROLS_Q2_2024 = {
  total: 648,
  contracts: 285,
  prescribing: 188,
  pharmacies: 175,
  checked: 10_715,
  withErrors: 5_077,
  undueRefund: 3_883,
  /** kary nałożone na apteki, zł */
  fines: 3_112_784,
} as const;
export const CONTROL_ERROR_SHARE = (CONTROLS_Q2_2024.withErrors / CONTROLS_Q2_2024.checked) * 100;
export const CONTROL_UNDUE_SHARE = (CONTROLS_Q2_2024.undueRefund / CONTROLS_Q2_2024.checked) * 100;

/** Sprawa leków recepturowych ujawniona 30.07.2025 (NFZ, Prokuratura Okręgowa w Zielonej Górze). */
export const RECEPTURA = {
  /** straty NFZ co najmniej, mln zł */
  loss: 82,
  /** recepty z nieprawdziwymi informacjami, tys. (blisko) */
  prescriptions: 40,
  charged: 21,
  /** refundacja maści w jednej przychodni POZ, zł */
  ointment2019: 230_000,
  ointment2022: 10_800_000,
  /** recepty na tę maść w lutym 2023 r. i ich udział w kraju */
  febPrescriptions: 730,
  febShare: 83,
  /** sankcje NFZ po kontrolach 2022–2024, mln zł (ponad) */
  sanctions: 15,
} as const;
export const OINTMENT_GROWTH = RECEPTURA.ointment2022 / RECEPTURA.ointment2019;
