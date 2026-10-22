/**
 * Półkole sejmowe: jedno miejsce = jeden poseł. Rzędy od środka na zewnątrz, liczba miejsc w rzędzie
 * proporcjonalna do promienia; miejsca przypisujemy po kącie od lewej, więc kluby tworzą kliny.
 * Wspólne dla komponentu `sejm/Hemicycle` i obrazka OG (`data/og.ts`).
 */

export type Vote = 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT';

export interface MpVote { mp: number; name: string; club: string; vote: Vote }

export interface Voting {
  term: number;
  sitting: number;
  number: number;
  date: string;
  title: string;
  topic: string;
  href: string;
  totals: { yes: number; no: number; abstain: number; absent: number };
  votes: MpVote[];
}

export interface ClubTally { club: string; members: number; yes: number; no: number; abstain: number; absent: number }

export interface Seat { x: number; y: number; vote: MpVote }

/** kolejność głosów w klinie klubu: od poparcia do sprzeciwu */
const VOTE_ORDER: Vote[] = ['YES', 'ABSTAIN', 'ABSENT', 'NO'];

/** Wyniki klubów, od najwyższego poparcia ((za − przeciw) / głosujący) do najniższego; remis — większy klub pierwszy. */
export function tallyClubs(votes: MpVote[], last: string[] = []): ClubTally[] {
  const by = new Map<string, ClubTally>();
  for (const v of votes) {
    const t = by.get(v.club) ?? { club: v.club, members: 0, yes: 0, no: 0, abstain: 0, absent: 0 };
    t.members++;
    t[({ YES: 'yes', NO: 'no', ABSTAIN: 'abstain', ABSENT: 'absent' } as const)[v.vote]]++;
    by.set(v.club, t);
  }
  const score = (t: ClubTally) => (t.yes + t.no + t.abstain ? (t.yes - t.no) / (t.yes + t.no + t.abstain) : 0);
  return [...by.values()].sort((a, b) => score(b) - score(a) || +last.includes(a.club) - +last.includes(b.club) || b.members - a.members);
}

/**
 * Miejsca w układzie `width`×`height` (środek łuku przy dolnej krawędzi). `inner` = promień wewnętrzny jako
 * ułamek zewnętrznego. Zwraca też promień kropki, który mieści się w odstępie między rzędami.
 */
export function hemicycle(votes: MpVote[], clubs: ClubTally[], { width, height, rows = 12, inner = 0.4 }: { width: number; height: number; rows?: number; inner?: number }) {
  const outer = Math.min(width / 2, height) * 0.96;
  const r0 = outer * inner;
  const step = (outer - r0) / (rows - 1);
  const radii = Array.from({ length: rows }, (_, i) => r0 + step * i);
  const total = votes.length;
  const sum = radii.reduce((s, r) => s + r, 0);
  const exact = radii.map((r) => (r / sum) * total);
  const counts = exact.map(Math.floor);
  [...exact.keys()].sort((a, b) => exact[b] - counts[b] - (exact[a] - counts[a])).slice(0, total - counts.reduce((s, n) => s + n, 0)).forEach((i) => counts[i]++);

  const cx = width / 2;
  const cy = height - (height - outer) / 2 - step / 2;
  const slots = radii.flatMap((r, i) => Array.from({ length: counts[i] }, (_, j) => ({ r, t: Math.PI * (1 - j / (counts[i] - 1)) })))
    .sort((a, b) => b.t - a.t || a.r - b.r);

  const ordered = clubs.flatMap((c) => VOTE_ORDER.flatMap((vote) =>
    votes.filter((v) => v.club === c.club && v.vote === vote).sort((a, b) => a.name.localeCompare(b.name, 'pl'))));
  const seats: Seat[] = ordered.map((vote, i) => ({ x: cx + slots[i].r * Math.cos(slots[i].t), y: cy - slots[i].r * Math.sin(slots[i].t), vote }));
  return { seats, dot: step * 0.36, cx, cy, inner: r0 };
}
