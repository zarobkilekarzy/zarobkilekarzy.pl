/**
 * Kursy średnie NBP (tabela A) do przeliczeń na euro na stronach angielskich — pobierane RAZ na build
 * i wspólne dla wszystkich stron, więc każda kwota w euro ma ten sam kurs i tę samą datę.
 *
 * Gdy NBP nie odpowiada (albo w `astro dev`, żeby nie pytać API przy każdym przeładowaniu),
 * build bierze ostatnią tabelę zapisaną w src/data/kurs-nbp.json i pokazuje JEJ datę.
 * Ten plik odświeża się ręcznie przy okazji (np. przy dodawaniu tłumaczenia) — wartość z niego jest uczciwa,
 * bo strona zawsze podaje numer i datę tabeli, z której liczy.
 */
import fallback from '@/data/kurs-nbp.json';

export interface Rates {
  /** numer tabeli, np. „208/A/NBP/2026” */
  table: string;
  /** data obowiązywania, RRRR-MM-DD */
  date: string;
  /** zł za jednostkę waluty (JPY, HUF itp. — też za 1 jednostkę) */
  mid: Record<string, number>;
  /** false = tabela zapasowa z repozytorium */
  live: boolean;
}

const API = 'https://api.nbp.pl/api/exchangerates/tables/A/?format=json';

interface NbpTable {
  no: string;
  effectiveDate: string;
  rates: { code: string; mid: number }[];
}

async function load(): Promise<Rates> {
  const stored = { ...fallback, live: false };
  if (import.meta.env.DEV) return stored;
  try {
    const res = await fetch(API, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const [table] = (await res.json()) as NbpTable[];
    return { table: table.no, date: table.effectiveDate, mid: Object.fromEntries(table.rates.map((r) => [r.code, r.mid])), live: true };
  } catch (error) {
    console.warn(`[kursy] NBP niedostępny (${(error as Error).message}) — tabela zapasowa ${stored.table} z ${stored.date}`);
    return stored;
  }
}

let cached: Promise<Rates> | undefined;

/** Tabela kursów dla całego buildu (jedno zapytanie do NBP). */
export const getRates = () => (cached ??= load());

/** Kwota w danej walucie przeliczona na euro przez złotego (kursy krzyżowe z tej samej tabeli). */
export function toEur(amount: number, currency: string, rates: Rates): number {
  const pln = currency === 'PLN' ? amount : amount * rateOf(currency, rates);
  return pln / rateOf('EUR', rates);
}

function rateOf(currency: string, rates: Rates): number {
  const rate = rates.mid[currency];
  if (!rate) throw new Error(`[kursy] brak waluty ${currency} w tabeli ${rates.table}`);
  return rate;
}
