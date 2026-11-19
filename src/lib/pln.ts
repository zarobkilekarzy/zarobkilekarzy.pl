/**
 * Kwoty w obcych walutach na stronach polskich: przybliżenie w złotych po kursie średnim NBP z buildu
 * (src/i18n/rates.ts — ta sama tabela co euro na stronach angielskich). Kwot nie wykrywamy w tekście:
 * autor stawia je jawnie — w MDX komponentem ui/Pln, w danych i propsach funkcją `plnApprox()`.
 *
 *   plnApprox(275, 'SEK', rates)      → „ok. 109 zł”
 *   plnApprox(98000, 'SEK', rates)    → „ok. 38,7 tys. zł”
 *   plnApprox(9.277e9, 'SEK', rates)  → „ok. 3,67 mld zł”
 */
import { formatDate, formatPL } from '@/lib/format';
import type { Rates } from '@/i18n/rates';

const NBSP = ' ';

/**
 * Rejestr wygenerowanych przeliczeń („573 zł”, „38,5–58,1 tys. zł”, zdanie o kursie). Kontrola tłumaczeń po buildzie
 * (integrations/i18n/qa.ts) pomija je w polskim tekście: strona angielska podaje euro, nie złote, a kwota zależy od
 * kursu z dnia buildu. Rejestr jest w `globalThis`, bo strony renderuje kod zbudowany osobno od integracji.
 */
const made: Set<string> = ((globalThis as { __plnMade?: Set<string> }).__plnMade ??= new Set());
const note = (text: string) => (made.add(text), text);

function rateOf(currency: string, rates: Rates): number {
  const rate = rates.mid[currency];
  if (!rate) throw new Error(`[kursy] brak waluty ${currency} w tabeli ${rates.table}`);
  return rate;
}

/** Przybliżenie do 3 cyfr znaczących: 573,3 → 573; 38 749 → 38 700. */
function round3(value: number): number {
  if (value === 0) return 0;
  const factor = 10 ** (Math.floor(Math.log10(Math.abs(value))) - 2);
  return Math.round(value / factor) * factor;
}

/** Kwota w złotych (liczba) po kursie z tabeli. */
export const toPln = (amount: number, currency: string, rates: Rates) => amount * rateOf(currency, rates);

/** Liczba i jednostka osobno: [„38,7”, „tys. zł”] — 3 cyfry znaczące, bez zer na końcu. */
function plnParts(pln: number): [string, string] {
  const value = round3(pln);
  const size = Math.abs(value);
  const [div, unit] = size >= 1e12 ? [1e12, `bln${NBSP}`] : size >= 1e9 ? [1e9, `mld${NBSP}`] : size >= 1e6 ? [1e6, `mln${NBSP}`] : size >= 1e4 ? [1e3, `tys.${NBSP}`] : [1, ''];
  const scaled = value / div;
  const digits = div === 1 ? (Math.abs(scaled) < 10 ? 2 : 0) : Math.max(0, 2 - Math.floor(Math.log10(Math.abs(scaled))));
  const text = formatPL(scaled, digits).replace(/,(\d*?)0+$/, (_, d: string) => (d ? `,${d}` : ''));
  return [text, `${unit}zł`];
}

/** „573 zł”, „38,7 tys. zł”, „293 mln zł”, „3,67 mld zł”, „1,06 bln zł”. */
export const plnShort = (pln: number) => note(plnParts(pln).join(NBSP));

/** Zakres: „ok. 38,5–58,1 tys. zł” (wspólna jednostka raz), a przy różnych jednostkach „ok. 9 400 zł – 12,1 tys. zł”. */
export function plnRange(from: number, to: number, currency: string, rates: Rates): string {
  const [a, ua] = plnParts(toPln(from, currency, rates));
  const [b, ub] = plnParts(toPln(to, currency, rates));
  if (ua === ub) return `ok.${NBSP}${note(`${a}–${b}${NBSP}${ub}`)}`;
  return `ok.${NBSP}${note(`${a}${NBSP}${ua}`)}${NBSP}– ${note(`${b}${NBSP}${ub}`)}`;
}

/** „ok. 38,7 tys. zł” — do nawiasu po kwocie w walucie źródła. */
export const plnApprox = (amount: number, currency: string, rates: Rates) => `ok.${NBSP}${plnShort(toPln(amount, currency, rates))}`;

/** Zdanie o kursie do sekcji „Metoda”: tabela, data i kursy użytych walut. */
export function rateLine(currencies: string[], rates: Rates): string {
  const list = currencies.map((c) => `1${NBSP}${c}${NBSP}=${NBSP}${formatPL(rateOf(c, rates), rateOf(c, rates) < 0.1 ? 6 : 4)}${NBSP}zł`).join(', ');
  return note(`Kwoty w obcych walutach przeliczamy na złote po kursie średnim NBP z ${formatDate(new Date(rates.date))} (tabela ${rates.table}): ${list}. Przeliczenia są przybliżone i zmieniają się razem z kursem.`);
}
