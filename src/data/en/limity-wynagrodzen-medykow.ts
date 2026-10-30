/**
 * Wersja angielska danych artykułu /analizy/limity-wynagrodzen-medykow/. Polski oryginał trzyma stałe
 * (płaca minimalna, przeciętne wynagrodzenie, mnożniki, adresy) w samym MDX, więc liczby są tu
 * przepisane dokładnie z content/articles/limity-wynagrodzen-medykow.mdx — przy zmianie oryginału
 * sprawdź je razem z tekstem. Wyniki głosowania i logo klubów — z src/data/glosowania.ts (importowane).
 * Treść artykułu: src/content/en/articles/medical-pay-limits-act.mdx.
 */
import type { BarRow } from '@/types';
import { SEJM_CLUBS, type ClubInfo } from '@/data/glosowania';
import { formatEN } from '@/lib/format';

export { limityVoting, CLUBS_LAST } from '@/data/glosowania';

export const LINKS = {
  proces: 'https://www.sejm.gov.pl/Sejm10.nsf/PrzebiegProc.xsp?nr=3157',
  druk: 'https://api.sejm.gov.pl/sejm/term10/prints/3157/3157.pdf',
  sprawozdanie: 'https://api.sejm.gov.pl/sejm/term10/prints/3193/3193.pdf',
  dodatkowe: 'https://api.sejm.gov.pl/sejm/term10/prints/3193-A/3193-A.pdf',
  senat: 'https://www.senat.gov.pl/download/gfx/senat/pl/senatdruki/14799/druk/893.pdf',
  min2026: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1242/text.pdf',
  min2027: 'https://api.sejm.gov.pl/eli/acts/DU/2026/1213/text.pdf',
  przecietne: 'https://api.sejm.gov.pl/eli/acts/MP/2026/192/text.pdf',
};

/** strona głosowania nr `nr` na 67. posiedzeniu Sejmu X kadencji */
export const vote = (nr: number) => `https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji=10&NrPosiedzenia=67&NrGlosowania=${nr}`;

/* Płaca minimalna 2026: Dz.U. 2025 poz. 1242; 2027: Dz.U. 2026 poz. 1213; przeciętne wynagrodzenie 2025: M.P. 2026 poz. 192.
   Mnożniki z art. 132ab w brzmieniu z druku nr 3193 — jak w oryginale. */
export const MIN = 4806;
export const MIN_2027 = 4950;
export const AVG = 8903.56;

const pln = (v: number) => `PLN ${formatEN(v, Number.isInteger(v) ? 0 : 2)}`;

/* ── Monthly caps compared with the minimum and average wage (BarChart) ───────── */

const CAPS = [
  { label: 'Minimum wage in 2026', note: '1× the minimum wage', value: MIN, secondary: true },
  { label: 'Average wage in 2025', note: `${formatEN(AVG / MIN, 2)}× the minimum wage`, value: AVG, secondary: true },
  { label: 'Half-time post with one provider', note: '4× the minimum wage', value: MIN * 4 },
  { label: 'Full-time post with one provider', note: '8× the minimum wage', value: MIN * 8 },
  { label: 'Full-time post with allowances, e.g. for a managerial role', note: '12× the minimum wage', value: MIN * 12 },
  { label: 'Total with all providers', note: '16× the minimum wage', value: MIN * 16, highlight: true },
];

export const capsRows: BarRow[] = CAPS.map((r) => ({ ...r, display: pln(r.value) }));

export const capsCaption = `Bar chart, monthly amounts: ${CAPS.map((r) => `${r.label} (${r.note}) ${pln(r.value)}`).join('; ')}.`;

/* ── Calculator ───────────────────────────────────────────────────────────────── */

export const CALC_BASES = [
  { id: 'min2026', label: 'Minimum wage 2026', amount: MIN, source: { label: 'Dz.U. 2025 item 1242', href: LINKS.min2026 } },
  { id: 'min2027', label: 'Minimum wage 2027', amount: MIN_2027, source: { label: 'Dz.U. 2026 item 1213', href: LINKS.min2027 } },
  { id: 'avg2025', label: 'Average wage 2025', amount: AVG, source: { label: 'M.P. 2026 item 192', href: LINKS.przecietne } },
];

export const CALC_ROWS = [
  { label: 'Hourly rate', factor: 1 / 20, ratio: '1/20', unit: 'PLN' },
  { label: 'Half-time post with one provider', factor: 4, ratio: '4×', unit: 'PLN' },
  { label: 'Full-time post with one provider', factor: 8, ratio: '8×', unit: 'PLN' },
  { label: 'Full-time post with allowances', factor: 12, ratio: '12×', unit: 'PLN' },
  { label: 'Total with all providers', factor: 16, ratio: '16×', unit: 'PLN', marked: true },
];

/* ── Sejm clubs: Polish names with an English gloss (logos from the Polish module) ── */

const CLUB_EN: Record<string, { name: string; short?: string }> = {
  KO: { name: 'Koalicja Obywatelska (Civic Coalition)' },
  PiS: { name: 'Prawo i Sprawiedliwość (Law and Justice)' },
  RozwojPlus: { name: 'Rozwój Plus (Development Plus)' },
  'PSL-TD': { name: 'PSL – Trzecia Droga (Polish People’s Party – Third Way)' },
  Lewica: { name: 'Lewica (The Left)' },
  Konfederacja: { name: 'Konfederacja (Confederation)' },
  Centrum: { name: 'Centrum (Centre)' },
  Polska2050: { name: 'Polska 2050 (Poland 2050)' },
  Demokracja: { name: 'Demokracja Bezpośrednia parliamentary group (Direct Democracy)' },
  Razem: { name: 'Razem parliamentary group (Together)' },
  Konfederacja_KP: { name: 'Konfederacja Korony Polskiej parliamentary group (Confederation of the Polish Crown)' },
  'niez.': { name: 'Unaffiliated MPs', short: 'Unaffiliated' },
};

export const SEJM_CLUBS_EN: Record<string, ClubInfo> = Object.fromEntries(
  Object.entries(SEJM_CLUBS).map(([id, club]) => {
    const en = CLUB_EN[id];
    if (!en) throw new Error(`[en] brak angielskiej nazwy klubu „${id}”`);
    return [id, { ...club, name: en.name, short: en.short ?? club.short }];
  }),
);
