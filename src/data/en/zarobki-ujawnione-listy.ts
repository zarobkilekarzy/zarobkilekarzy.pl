/**
 * Wersja angielska modułu src/data/zarobki-ujawnione-listy.ts: te same liczby (importowane z modułu polskiego,
 * który liczy je z pliku monitoringu), tylko teksty po angielsku — podpisy wyników wniosków, przedziałów
 * rozkładu i progów oraz krótkie pomocnicze formaty liczb. Kwoty w tekście: złote z euro w nawiasie
 * po kursie z buildu (src/i18n/rates.ts).
 * Treść artykułu: src/content/en/articles/disclosed-hospital-pay-lists.mdx; czyta go też
 * src/content/en/articles/doctor-pay-distribution.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatDateIn, formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { eurApprox, withEur, type MoneyOptions } from '@/i18n/money';
import { monitoring } from '@/lib/monitoring';
import { DATA, DISTRIBUTION, HIGH, OUTCOMES, POSITIONS, THRESHOLDS } from '@/data/zarobki-ujawnione-listy';

export {
  DATA,
  LIST_CRITERION,
  LISTS,
  POSITIONS,
  PAYROLL_TOTAL,
  OUTCOMES,
  REFUSED_OR_SILENT,
  outcome,
  DISTRIBUTION,
  OVER_500K,
  OVER_1M,
  OVER_1M_FACILITIES,
  MAX_OVER_2M_FACILITIES,
  MEDIAN,
  FACILITY_MEDIAN,
  LARGEST,
  EXAMPLE,
  below,
} from '@/data/zarobki-ujawnione-listy';

const rates = await getRates();
const { buckets } = monitoring;

/* ── Formats ──────────────────────────────────────────────────────────────────── */

/** „PLN 180,000 (≈ €42,000)” */
export const pln = (amount: number, options?: MoneyOptions) => withEur(amount, 'PLN', rates, options);
/** „≈ €42,000” — samo euro, gdy złote stoją już w liczbie bloku */
export const eur = (amount: number) => eurApprox(amount, 'PLN', rates);
/** udział → procent w zapisie angielskim: 0.1312 → „13.1” */
export const pct = (x: number, d = 1) => formatEN(x * 100, d);
/** kwota zaokrąglona do tysiąca złotych, jak „tys. zł” w wersji polskiej: 183_412 → 183 000 */
export const toThousand = (zl: number) => Math.round(zl / 1000) * 1000;
/** „1 payroll entry”, „11,113 payroll entries” */
export const entries = (n: number, word = 'payroll entr') => `${formatEN(n)} ${word}${n === 1 ? 'y' : 'ies'}`;
/** „1 facility”, „97 facilities” */
export const facilities = (n: number) => `${formatEN(n)} ${n === 1 ? 'facility' : 'facilities'}`;

/** Nazwa monitoringu w oryginale i w tłumaczeniu — tekst stoi w artykule, więc zmiana nazwy zatrzyma build. */
export const MONITORING_EN = 'How much do doctors earn?';
if (DATA.source.monitoring !== 'Ile zarabiają lekarze?') {
  throw new Error(`[en] zarobki-ujawnione-listy: zmieniła się nazwa monitoringu („${DATA.source.monitoring}”) — popraw MONITORING_EN`);
}

export const asOf = formatDateIn(DATA.asOf, 'en');
export const statSource = `Watchdog Polska, as of ${asOf}`;
export const figSource = {
  label: `Watchdog Polska, monitoring “${DATA.source.monitoring}” (“${MONITORING_EN}”), as of ${asOf}; our calculations`,
  href: DATA.source.url,
};

/* ── Results of the requests ──────────────────────────────────────────────────── */

const OUTCOME_EN: Record<(typeof OUTCOMES)[number]['key'], string> = {
  list: 'Full annual payroll list',
  aggregate: 'Aggregate data',
  disclosed: 'Unprocessed data',
  refused: 'Refusal',
  silence: 'Silence',
  receipt: 'Acknowledgement of receipt only',
  other: 'Other reply, without data',
  forwarded: 'Forwarded to another institution',
  unknown: 'Reply not determined',
};

export const outcomeRows: BarRow[] = OUTCOMES.map((o) => ({
  label: OUTCOME_EN[o.key],
  note: `· ${pct(o.n / DATA.requests)}%`,
  value: o.n,
  display: formatEN(o.n),
  highlight: o.key === 'list',
}));

export const outcomeCaption = `Results of ${formatEN(DATA.requests)} requests: ${OUTCOMES.map(
  (o) => `${OUTCOME_EN[o.key].toLowerCase()} — ${formatEN(o.n)}`,
).join(', ')}.`;

/* ── Distribution of amounts ──────────────────────────────────────────────────── */

/** Kwota w zapisie skróconym: 100 000 → „100,000”, 1 000 000 → „1 million”. */
function short(n: number): string {
  if (n < 1e6) return formatEN(n);
  const v = n / 1e6;
  return `${formatEN(v, Number.isInteger(v) ? 0 : 1)} million`;
}

/** Podpis przedziału i z `buckets`: „up to PLN 100,000”, „PLN 100,000–200,000”, „over PLN 1 million”. */
function bucketLabel(i: number): string {
  const from: number | undefined = buckets[i - 1];
  const to: number | undefined = buckets[i];
  if (to === undefined) return `over PLN ${short(from ?? 0)}`;
  if (from === undefined) return `up to PLN ${short(to)}`;
  return `PLN ${short(from)}–${short(to)}`;
}

if (DISTRIBUTION.length !== buckets.length + 1) {
  throw new Error('[en] zarobki-ujawnione-listy: DISTRIBUTION nie pasuje do przedziałów monitoringu');
}

export const distRows: BarRow[] = DISTRIBUTION.map((b, i) => ({
  label: bucketLabel(i),
  note: `· ${formatEN(b.n)}`,
  value: b.share * 100,
  display: `${pct(b.share)}%`,
  highlight: b.from >= HIGH,
}));

export const distCaption = `Distribution of ${formatEN(POSITIONS)} payroll entries by annual gross amount: ${DISTRIBUTION.map(
  (b, i) => `${bucketLabel(i)} — ${pct(b.share)}%`,
).join(', ')}.`;

/** Przedział, w którym mediana leży na pewno — po angielsku. */
export const medianBucketLabel = (from: number) => {
  const i = DISTRIBUTION.findIndex((b) => b.from === from);
  if (i === -1) throw new Error('[en] zarobki-ujawnione-listy: brak przedziału mediany');
  return bucketLabel(i);
};

/* ── Thresholds ───────────────────────────────────────────────────────────────── */

/** Progi w tej samej kolejności co THRESHOLDS w module polskim (granice przedziałów od 200 tys. zł). */
const thresholdValues = buckets.filter((b) => b >= 200_000);
if (thresholdValues.length !== THRESHOLDS.length) {
  throw new Error('[en] zarobki-ujawnione-listy: THRESHOLDS nie pasuje do przedziałów monitoringu');
}

export const thresholdTable: CompareTable = {
  columns: ['Annual amount from one facility', 'Entries', 'Share', 'Roughly'],
  rows: THRESHOLDS.map((t, i) => ({
    cells: [`over PLN ${short(thresholdValues[i])}`, formatEN(t.n), `${pct(t.share)}%`, t.oneIn ? `1 in ${formatEN(t.oneIn)}` : '—'],
  })),
};
