/**
 * Profil „zwykle o tej porze” (24 średnie, godziny czasu polskiego) — rachunki wspólne dla buildu
 * (lib/sor/map, lib/sor/history) i przeglądarki (components/sor/SorDayChart). Bez zależności.
 */

/** Godzina początku trzech kolejnych godzin z najmniejszą wartością (po północy dalej od 0); null bez danych. */
export function usualCalm(usual: (number | null)[]): number | null {
  let best: { h: number; sum: number } | null = null;
  for (let h = 0; h < usual.length; h++) {
    const window = [0, 1, 2].map((i) => usual[(h + i) % usual.length]);
    if (window.some((v) => v == null)) continue;
    const sum = (window as number[]).reduce((a, b) => a + b, 0);
    if (!best || sum < best.sum) best = { h, sum };
  }
  return best?.h ?? null;
}

/** Godzina z największą wartością; null bez danych. */
export function usualPeak(usual: (number | null)[]): number | null {
  let best: number | null = null;
  usual.forEach((v, h) => { if (v != null && (best == null || v > usual[best]!)) best = h; });
  return best;
}

/** „8:00–11:00” — przedział od godziny `h` przez `span` godzin. */
export const hoursText = (h: number, span: number) => `${h}:00–${(h + span) % 24 || 24}:00`;

/** Bieżąca godzina w Polsce (0–23). */
export const warsawHour = (d: Date | string = new Date()) =>
  Number(new Date(d).toLocaleString('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Warsaw' }));
