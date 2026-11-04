/**
 * Wspólne okresy w małych organach (research/powiazania/ZASADY.md, p. 4): wyliczane z dat funkcji, nie wpisywane.
 * Port `research/powiazania/okresy.js` (tam: globalThis.wspolneOkresy) — przy zmianie zmieniać oba pliki.
 */
import type { GraphEdge, Status } from './types';

export const TEAM_NAME: Record<string, string> = {
  'kierownictwo-mz': 'kierownictwie MZ',
  'zarzad-nfz': 'zarządzie NFZ',
  'prezydium-nrl': 'Prezydium NRL',
};
export const TEAMS = Object.keys(TEAM_NAME);
const RANK: Record<Status, number> = { record: 4, confirmed: 3, media: 2, disputed: 1 };

// Data z dokładnością do roku albo miesiąca liczy się ostrożnie: początek — na koniec okresu, koniec — na jego początek.
// Dzięki temu „2022” w jednej kadencji i „2022” w następnej nie dają sztucznej wspólnej obecności.
const startOf = (s: string) => (s.length === 4 ? `${s}-12-31` : s.length === 7 ? `${s}-31` : s);
const untilOf = (s: string) => (s.length === 4 ? `${s}-01-01` : s.length === 7 ? `${s}-01` : s);

interface End { at: string; text: string }
// Koniec funkcji: data odejścia albo `seen` (ostatni dokument, który potwierdza funkcję), jeśli jest późniejszy.
const end = (e: GraphEdge, asOf: string): End => {
  if (!e.until) return { at: asOf, text: 'obecnie' };
  const u = untilOf(e.until);
  return e.seen && e.seen > u ? { at: e.seen, text: `co najmniej ${e.seen}` } : { at: u, text: e.until };
};
/** Data z grafu (RRRR, RRRR-MM, RRRR-MM-DD) po polsku: „3.11.2026”, „11.2026”, „2026” */
export const fmtDate = (s?: string) => {
  if (!s) return '';
  const p = s.split('-');
  return p.length === 3 ? `${+p[2]}.${p[1]}.${p[0]}` : p.length === 2 ? `${p[1]}.${p[0]}` : s;
};
const endText = (k: End) => (k.text === 'obecnie' ? 'obecnie' : k.text.startsWith('co najmniej')
  ? `co najmniej ${fmtDate(k.text.slice(12))}` : fmtDate(k.text));

const statusOf = (e: GraphEdge): Status => e.status ?? 'record';

/** Pary osób, których funkcje w tym samym małym zespole nakładały się w czasie (krawędzie `overlap`, `derived`). */
export function wspolneOkresy(edges: GraphEdge[], asOf: string): GraphEdge[] {
  const byTeam: Record<string, GraphEdge[]> = {};
  for (const e of edges) if (e.team && e.since) (byTeam[e.team] ||= []).push(e);
  const out: GraphEdge[] = [];
  for (const [team, list] of Object.entries(byTeam)) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (a.from === b.from) continue;
        // Obecny skład widać przez węzeł organu; linia ma sens dla okresów, które się skończyły.
        if (!a.until && !b.until) continue;
        const later = startOf(a.since!) >= startOf(b.since!) ? a : b;
        const ea = end(a, asOf), eb = end(b, asOf);
        const first = ea.at <= eb.at ? ea : eb;
        if (startOf(later.since!) >= first.at) continue;
        const weaker = RANK[statusOf(a)] <= RANK[statusOf(b)] ? statusOf(a) : statusOf(b);
        const hi = endText(first);
        out.push({
          from: a.from, to: b.from, kind: 'overlap', derived: true, team,
          label: `W ${TEAM_NAME[team] ?? team} w tym samym czasie: ${fmtDate(later.since)} – ${hi}. Wyliczone z dat obu funkcji (powiązanie średnie).`,
          since: later.since, status: weaker, sources: [...new Set([...(a.sources ?? []), ...(b.sources ?? [])])],
        });
      }
    }
  }
  return out;
}

export interface Przedzial { poczatek: string; koniec: string; poczatekTekst: string; koniecTekst: string }

/** Przedział jednej funkcji według tych samych ostrożnych reguł (porównanie osób). Bez daty początku — null. */
export function przedzial(e: GraphEdge, asOf: string): Przedzial | null {
  if (!e.since) return null;
  const k = end(e, asOf);
  return { poczatek: startOf(e.since), koniec: k.at, poczatekTekst: fmtDate(e.since), koniecTekst: endText(k) };
}
