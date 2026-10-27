/**
 * Wersja angielska modułu src/data/apteka-pieniadz-publiczny.ts: te same liczby (importowane), tylko teksty
 * po angielsku — wykres pozycji refundacji (BarChart) i tabela wszystkich pozycji komunikatu DEF (Comparison).
 * Kwoty na wykresie i w tabeli w „PLN bn”, bez euro; w tekście artykułu kwoty idą przez ui/Money z wartością
 * `bn()` / `mn()` (zaokrągloną jak `fmt` w module polskim, żeby liczba złotych była ta sama).
 * Treść artykułu: src/content/en/articles/pharmacies-public-and-private-money.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { PERIODS, REFUND, refundChannel, refundItem, refundTotal, type Channel, type Period } from '@/data/apteka-pieniadz-publiczny';

export {
  CONTROLS_Q2_2024,
  CONTROL_ERROR_SHARE,
  CONTROL_UNDUE_SHARE,
  GUS_2025,
  GUS_VS_DEF_2025,
  LINKS,
  NFZ_COSTS_2025,
  OINTMENT_GROWTH,
  PLAN_SHARE_2025,
  RECEPTOMATY,
  RECEPTOMATY_GROWTH,
  RECEPTOMATY_REFUNDED_2023,
  RECEPTURA,
  RPP,
  refundChannel,
  refundGrowth,
  refundItem,
  refundPlan,
  refundTotal,
} from '@/data/apteka-pieniadz-publiczny';

/** jednostka na wykresie i w tabeli */
export const UNIT = 'PLN bn';

const round = (n: number, decimals: number) => Math.round(n * 10 ** decimals + 1e-9) / 10 ** decimals;

/** liczba w zapisie angielskim, zaokrąglona jak `fmt` w module polskim: 30.04 */
export const fmt = (n: number, decimals = 1) => formatEN(round(n, decimals), decimals);

/** kwota w mld zł → złote dla <Money scale="billion" />, zaokrąglona jak w tekście polskim */
export const bn = (n: number, decimals = 1) => round(n, decimals) * 1e9;
/** kwota w mln zł → złote dla <Money scale="million" />, zaokrąglona jak w tekście polskim */
export const mn = (n: number, decimals = 1) => round(n, decimals) * 1e6;

/** „25.06.2026” → „25 June 2026” */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dateEN = (dmy: string) => {
  const [d, m, y] = dmy.split('.').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/** pozycje komunikatu DEF (numer pozycji z modułu polskiego) → angielskie nazwy */
const ITEM: Record<string, string> = {
  '1': 'Drug programmes',
  '2': 'Chemotherapy',
  '3': 'Emergency access to drug technologies (RDTL)',
  '4.1': 'Prescription medicines, foods and devices in pharmacies',
  '4.2': 'Medicines under Article 15(2)(17) of the Reimbursement Act',
  '4.3': 'Foods under Article 15(2)(18) of the Reimbursement Act',
  '6': 'Free medicines for people aged 65+ and children under 18 (Article 43a)',
  '7': 'Free medicines for pregnant women (Article 43b)',
};
const item = (pos: string) => {
  const en = ITEM[pos];
  if (!en) throw new Error(`[en] brak angielskiej nazwy pozycji DEF „${pos}”`);
  return en;
};

const CHANNEL: Record<Channel, string> = { apteka: 'pharmacy', podmioty: 'healthcare providers' };

/** okresy z modułu polskiego → angielskie etykiety */
const PERIOD_LABEL: Record<Period, string> = { '2024': '2024', '2025': '2025', '2026': 'Jan–Aug 2026' };

/** Wiersze wykresu: pozycje od największej; trzy drobne pozycje apteczne razem (jak w module polskim). */
export const refundRows = (p: Period = '2025'): BarRow[] => {
  const small = ['4.2', '4.3', '7'];
  const rows = REFUND.filter((r) => !small.includes(r.pos)).map((r) => ({
    label: item(r.pos),
    note: CHANNEL[r.channel],
    value: r.values[p] / 1e6,
    highlight: r.channel === 'apteka',
  }));
  rows.push({
    label: 'Other pharmacy items',
    note: 'Article 15(2)(17) and (18), Article 43b',
    value: small.reduce((a, pos) => a + refundItem(p, pos), 0),
    highlight: true,
  });
  return rows
    .sort((a, b) => b.value - a.value)
    .map((r) => ({ ...r, display: `PLN ${fmt(r.value, r.value < 1 ? 2 : 1)} bn` }));
};

/** Tabela wszystkich pozycji DEF w trzech okresach, z sumami liczonymi z danych (jak w module polskim). */
export const REFUND_TABLE: CompareTable = {
  columns: ['', ...PERIODS.map((p) => `${PERIOD_LABEL[p.key]}, ${UNIT}`), 'Channel'],
  rows: [
    ...REFUND.map((r) => ({
      cells: [`${r.pos}. ${item(r.pos)}`, ...PERIODS.map((p) => fmt(r.values[p.key] / 1e6, 2)), CHANNEL[r.channel]],
    })),
    { cells: ['Total — overall reimbursement budget', ...PERIODS.map((p) => fmt(refundTotal(p.key), 2)), '—'], marked: true },
    { cells: ['of which through pharmacies (items 4, 6, 7)', ...PERIODS.map((p) => fmt(refundChannel(p.key, 'apteka'), 2)), CHANNEL.apteka], marked: true },
    { cells: ['of which drug programmes, chemotherapy, RDTL (items 1–3)', ...PERIODS.map((p) => fmt(refundChannel(p.key, 'podmioty'), 2)), CHANNEL.podmioty], marked: true },
  ],
};
