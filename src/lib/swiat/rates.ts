/**
 * Kursy do globu płac: tabela A NBP z buildu (src/i18n/rates.ts, wspólna dla strony) uzupełniona tabelą B
 * (waluty spoza tabeli A: naira, szyling ugandyjski, rial omański…). Tabela B wychodzi raz w tygodniu;
 * gdy NBP nie odpowiada albo w `astro dev` — zapis z src/data/swiat/kurs-nbp-b.json (strona podaje jego numer i datę).
 */
import fallbackB from '@/data/swiat/kurs-nbp-b.json';
import { getRates, type Rates } from '@/i18n/rates';

export interface WorldRates {
  a: Rates;
  b: { table: string; date: string; live: boolean };
  /** zł za jednostkę waluty: tabela A, a czego w niej nie ma — tabela B */
  mid: Record<string, number>;
}

const API_B = 'https://api.nbp.pl/api/exchangerates/tables/B/?format=json';

async function loadB() {
  const stored = { ...fallbackB, live: false };
  if (import.meta.env.DEV) return stored;
  try {
    const res = await fetch(API_B, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const [table] = (await res.json()) as { no: string; effectiveDate: string; rates: { code: string; mid: number }[] }[];
    return { table: table!.no, date: table!.effectiveDate, mid: Object.fromEntries(table!.rates.map((r) => [r.code, r.mid])), live: true };
  } catch (error) {
    console.warn(`[kursy] NBP, tabela B niedostępna (${(error as Error).message}) — zapis ${stored.table} z ${stored.date}`);
    return stored;
  }
}

let cached: Promise<WorldRates> | undefined;

export const getWorldRates = () =>
  (cached ??= Promise.all([getRates(), loadB()]).then(([a, b]) => ({
    a,
    b: { table: b.table, date: b.date, live: b.live },
    mid: { ...b.mid, ...a.mid, PLN: 1 },
  })));
