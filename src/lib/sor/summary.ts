/**
 * Podsumowanie migawki sor/teraz.json — jedno źródło liczb dla mapy (lib/sor/live) i kafelka na
 * stronie głównej (components/sor/SorLive), żeby obie pokazywały to samo.
 *
 * Do sum (osoby przed lekarzem, wszyscy w SOR, liczba SOR z pomiarem) wchodzi każdy świeży pomiar;
 * do klas wobec normy — tylko taki, który da się z normą porównać (zob. measure). Wpis o ponad
 * STALE_MIN minut starszy od najświeższego w migawce pomijamy (SOR długo nie odpowiada).
 */
import { ETAPY, measure, type Entry, type Snapshot } from './measure';
import { SOR_CYCLE_MIN } from './source';

export const STALE_MIN = 30;

/** Przy błędzie Worker zostawia ostatni poprawny pomiar (`poprzedni`). */
export const usable = (raw?: Entry): Entry | undefined => (raw?.blad && raw.poprzedni?.e ? raw.poprzedni : raw);

export const isStale = (t: string, freshest: string) => (Date.parse(freshest) - Date.parse(t)) / 60000 > STALE_MIN;

export interface Summary {
  /** najświeższy pomiar (ISO); pusty = brak pomiarów */
  freshest: string;
  /** SOR ze świeżym pomiarem */
  measured: number;
  /** osoby przed kontaktem z lekarzem */
  before: number;
  /** wszyscy pacjenci w SOR */
  total: number;
  /** liczba SOR w klasach: nikt nie czeka, w normie, ponad normę, ponad dwukrotność */
  counts: [number, number, number, number];
}

/** Czy migawka ma znany format (te same etapy w tej samej kolejności). */
export const isSnapshot = (data: unknown): data is Snapshot =>
  !!data && typeof (data as Snapshot).sor === 'object' && (data as Snapshot).etapy?.join() === ETAPY.join();

export function summarize(snap: Snapshot): Summary {
  const entries = Object.values(snap.sor).map(usable).filter((e): e is Entry & { e: NonNullable<Entry['e']> } => !!e?.e);
  const freshest = entries.reduce((max, e) => (e.t > max ? e.t : max), '');
  const out: Summary = { freshest, measured: 0, before: 0, total: 0, counts: [0, 0, 0, 0] };
  for (const entry of entries) {
    if (isStale(entry.t, freshest)) continue;
    const m = measure(entry.e);
    out.measured++;
    out.before += m.before;
    out.total += entry.w ?? 0;
    if (m.cls != null) out.counts[m.cls]++;
  }
  return out;
}

export const hm = (iso: string) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
const dayOf = (iso: string) => new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });

/** Czy dane stoją: najświeższy pomiar starszy o STALE_MIN od zegara czytelnika. */
export const isOutdated = (freshest: string, now = Date.now()) => !freshest || (now - Date.parse(freshest)) / 60000 > STALE_MIN;

/** Linia stanu: godzina najświeższego pomiaru albo ostrzeżenie, że dane stoją. */
export function stampText(freshest: string, now = Date.now()): string {
  if (!freshest) return 'Brak pomiarów w pliku z danymi.';
  const today = dayOf(new Date(now).toISOString()) === dayOf(freshest);
  const when = `${today ? '' : `${dayOf(freshest)}, `}${hm(freshest)}`;
  return isOutdated(freshest, now)
    ? `Ostatni pomiar: ${when} — dane się teraz nie odświeżają.`
    : `Stan z ${when} · każdy SOR sprawdzany co ${SOR_CYCLE_MIN} minut`;
}
