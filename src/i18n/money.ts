/**
 * Kwoty na stronach angielskich: zapis w walucie źródła i przybliżenie w euro po kursie z buildu
 * (./rates.ts). Kwot nie wykrywamy w tekście — autor stawia je jawnie: w MDX komponentem ui/Money,
 * w danych funkcją `withEur()`.
 *
 *   money(12910.16, 'PLN')                     → „PLN 12,910.16”
 *   money(1_600_000, 'PLN', { scale: 'million' }) → „PLN 1.6 million”
 *   money(7552.19, 'EUR')                      → „€7,552.19”
 *   withEur(12910.16, 'PLN', rates)            → „PLN 12,910.16 (≈ €2,930)”
 */
import { formatEN } from '@/lib/format';
import { toEur, type Rates } from './rates';

const NBSP = ' ';

export type Scale = 'thousand' | 'million' | 'billion';
const SCALE: Record<Scale, number> = { thousand: 1e3, million: 1e6, billion: 1e9 };

/** waluty pisane symbolem przed kwotą; pozostałe — kodem ISO („PLN 100”, „CZK 52,000”) */
const SYMBOL: Record<string, string> = { EUR: '€', GBP: '£', USD: 'US$' };

export interface MoneyOptions {
  /** miejsca po przecinku; domyślnie 2 dla kwot z groszami, 0 dla całkowitych, 1 przy `scale` */
  decimals?: number;
  scale?: Scale;
}

export function money(amount: number, currency: string, { decimals, scale }: MoneyOptions = {}): string {
  const value = scale ? amount / SCALE[scale] : amount;
  const places = decimals ?? (scale ? 1 : Number.isInteger(amount) ? 0 : 2);
  const number = `${formatEN(value, places)}${scale ? `${NBSP}${scale}` : ''}`;
  return SYMBOL[currency] ? `${SYMBOL[currency]}${number}` : `${currency}${NBSP}${number}`;
}

/** Przybliżenie do 3 cyfr znaczących: 2932,4 → 2930; 199 881 → 200 000. */
function round3(value: number): number {
  if (value === 0) return 0;
  const factor = 10 ** (Math.floor(Math.log10(Math.abs(value))) - 2);
  return Math.round(value / factor) * factor;
}

/** „≈ €2,930”, „≈ €1.21 million”, „≈ €16.4 billion” — kwota w euro po kursie z tabeli NBP z buildu (3 cyfry znaczące). */
export function eurApprox(amount: number, currency: string, rates: Rates): string {
  const eur = round3(toEur(amount, currency, rates));
  const scale: Scale | undefined = eur >= 1e9 ? 'billion' : eur >= 1e6 ? 'million' : undefined;
  if (!scale) return `≈${NBSP}${money(eur, 'EUR', { decimals: 0 })}`;
  const value = eur / SCALE[scale];
  // tyle miejsc po przecinku, ile trzeba do 3 cyfr znaczących (1.21, 16.4, 364), bez zer na końcu (1.00 → 1, 20.0 → 20)
  const digits = Math.max(0, 2 - Math.floor(Math.log10(value)));
  const decimals = value.toFixed(digits).replace(/\.?0+$/, '').split('.')[1]?.length ?? 0;
  return `≈${NBSP}${money(eur, 'EUR', { scale, decimals })}`;
}

/** Kwota w walucie źródła z euro w nawiasie; kwoty w euro bez nawiasu. */
export const withEur = (amount: number, currency: string, rates: Rates, options?: MoneyOptions) =>
  currency === 'EUR' ? money(amount, currency, options) : `${money(amount, currency, options)} (${eurApprox(amount, currency, rates)})`;

/** Linijka o kursie pod treścią: z jakiej tabeli liczymy euro. */
export const ratesNote = (rates: Rates, date: string) =>
  `Euro amounts are approximate, converted at the National Bank of Poland mid rate of ${date} (table ${rates.table}): 1${NBSP}EUR${NBSP}=${NBSP}${formatEN(rates.mid.EUR!, 4)}${NBSP}PLN.`;
