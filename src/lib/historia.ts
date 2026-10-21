/**
 * Historia zmian strony z gita — liczba commitów na dzień, czytana przy każdym buildzie
 * (blocks/ActivityCalendar na /o-projekcie/).
 *
 * Data commitu w strefie autora (`--date=short`), więc wynik nie zależy od strefy serwera CI.
 * CI musi pobrać całą historię (`fetch-depth: 0` w deploy.yml): w płytkim klonie wykres
 * pokazałby jeden commit, więc wtedy — i bez gita — zwracamy null, a sekcja znika.
 */
import { execFileSync } from 'node:child_process';

export interface CommitHistory {
  /** „2026-10-21” → liczba commitów */
  days: Record<string, number>;
  total: number;
  /** pierwszy i ostatni dzień z commitem */
  first: string;
  last: string;
  /** dzień buildu (Europe/Warsaw) — koniec kalendarza */
  today: string;
}

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

let cache: CommitHistory | null | undefined;

export function commitHistory(): CommitHistory | null {
  if (cache !== undefined) return cache;
  cache = null;
  try {
    if (git('rev-parse', '--is-shallow-repository') === 'true') {
      console.warn('[historia] płytki klon gita — kalendarz zmian pominięty (fetch-depth: 0)');
      return cache;
    }
    const dates = git('log', '--format=%ad', '--date=short', 'HEAD').split('\n').filter(Boolean);
    if (!dates.length) return cache;
    const days: Record<string, number> = {};
    for (const d of dates) days[d] = (days[d] ?? 0) + 1;
    const sorted = Object.keys(days).sort();
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
    cache = { days, total: dates.length, first: sorted[0], last: sorted.at(-1)!, today };
  } catch {
    console.warn('[historia] brak gita — kalendarz zmian pominięty');
  }
  return cache;
}
