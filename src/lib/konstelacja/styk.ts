/**
 * „Na styku polityki i ochrony zdrowia”: model osób (funkcje, głosy, powiązania) i wynik z jawnymi wagami.
 * Czysta logika — liczy ją serwer (stan bez JS) i skrypt strony przy każdej zmianie filtra.
 * Dane i wagi: src/data/konstelacja/styk.ts. Zasady dat: research/powiazania/ZASADY.md p. 4 (daty roczne ostrożnie).
 */
import { CASES, INLINE, ORG_SECTOR, SECTORS, WEIGHTS, type ComponentKey, type Group, type Sector } from '@/data/konstelacja/styk';
import type { GraphData, GraphNode, Status } from './types';

export interface Fn {
  sector: Sector;
  group: Group;
  org: string;
  /** organ nadrzędny albo instytucja — jedna instytucja liczy się raz */
  orgId: string;
  label: string;
  /** odcinek do rysowania: początek i koniec (koniec = `until`, `seen` albo dziś) */
  a: Date | null;
  b: Date | null;
  /** odcinek ostrożny do liczenia nakładania: rok/miesiąc początku → koniec okresu, końca → początek */
  ca: Date | null;
  cb: Date | null;
  open: boolean;
  /** znany tylko „stan na” (oświadczenie, BIP) */
  observed: boolean;
  uncertain: boolean;
  media: boolean;
  sources: string[];
}
export interface Ev { d: Date; act: string; kind: 'vote' | 'bill'; label: string; media: boolean; sources: string[] }
export interface Tie { other: string; kind: 'family' | 'work' | 'contact'; d: Date | null; media: boolean; label: string; sources: string[] }
export interface Person { node: GraphNode; fns: Fn[]; events: Ev[]; ties: Tie[]; cases: string[] }
export interface Model { people: Person[]; asOf: Date; names: Record<string, string>; years: Record<number, number> }

export interface Item { text: string; when: string; media?: boolean; sources?: string[]; pts: number }
export interface Pair { x: Fn; y: Fn; a: Date; b: Date; open: boolean; type: string; short: boolean }
export interface Score { person: Person; items: Record<ComponentKey, Item[]>; parts: Record<ComponentKey, number>; total: number; pairs: Pair[] }

export interface Filter {
  /** okres [od, do) w latach; pełny = brak zawężenia */
  y0: number;
  y1: number;
  full: boolean;
  cases: string[];
  media: boolean;
  comps: ComponentKey[];
}

const DAY = 86_400_000;
export function parseD(s: string | undefined, end = false): Date | null {
  if (!s) return null;
  const [y, m, d] = String(s).split('-').map(Number);
  if (!y) return null;
  if (!m) return end ? new Date(Date.UTC(y, 11, 31)) : new Date(Date.UTC(y, 0, 1));
  if (!d) return end ? new Date(Date.UTC(y, m, 0)) : new Date(Date.UTC(y, m - 1, 1));
  return new Date(Date.UTC(y, m - 1, d));
}
const cautious = (s: string | undefined, isEnd: boolean) => (!s ? null : s.length >= 10 ? parseD(s) : parseD(s, !isEnd));

export function buildModel(g: GraphData): Model {
  const N = Object.fromEntries(g.nodes.map((n) => [n.id, n]));
  const asOf = parseD(g.asOf)!;
  const sectorOf = (id: string, label: string): Sector | null => {
    if (id === 'zespol-trojstronny' && /rządow/.test(label)) return 'rzad';
    if (ORG_SECTOR[id]) return ORG_SECTOR[id];
    if (N[id]?.type === 'entity') return 'podmioty';
    return null;
  };
  const shortOf = (id: string) => N[id]?.short || N[id]?.name || id;
  const caseNodes = CASES.map((c) => ({ id: c.id, set: new Set(c.views.flatMap((v) => g.views.find((x) => x.id === v)?.nodes ?? [])) }));
  const people: Person[] = [];
  const years: Record<number, number> = {};
  for (const e of g.edges) {
    const d = parseD(e.since || e.date);
    if (d) years[d.getUTCFullYear()] = (years[d.getUTCFullYear()] ?? 0) + 1;
  }
  for (const n of g.nodes) {
    if (n.type !== 'person') continue;
    const fns: Fn[] = [];
    for (const e of g.edges) {
      if (e.kind !== 'role' || e.from !== n.id) continue;
      const s = sectorOf(e.to, e.label);
      if (!s) continue;
      const a = parseD(e.since || e.date);
      const b = e.until ? parseD(e.until, true) : e.seen ? parseD(e.seen, true) : e.since ? asOf : parseD(e.date, true);
      fns.push({
        sector: s, group: SECTORS[s].group, org: shortOf(e.to), orgId: N[e.to]?.parent || e.to, label: e.label, a, b,
        ca: e.since ? cautious(e.since, false) : a, cb: e.until ? cautious(e.until, true) : e.seen ? cautious(e.seen, true) : b,
        open: !!e.since && !e.until && !e.seen, observed: !e.since, uncertain: false, media: e.status === 'media', sources: e.sources ?? [],
      });
    }
    (n.roles ?? []).forEach((r, i) => {
      const m = INLINE[`${n.id}#${i}`];
      if (!m) return;
      const since = m.since ?? r.since, until = m.until ?? r.until;
      const a = parseD(since);
      const b = until ? parseD(until, true) : a ? asOf : null;
      fns.push({
        sector: m.s, group: SECTORS[m.s].group, org: m.org, orgId: `${n.id}:${m.org}`, label: r.label, a, b,
        ca: m.oswiad ? a : cautious(since, false), cb: m.oswiad ? b : until ? cautious(until, true) : b,
        open: !!a && !until, observed: !!m.oswiad, uncertain: !!m.uncertain, media: r.status === 'media', sources: r.sources ?? [],
      });
    });
    const events: Ev[] = g.edges
      .filter((e) => (e.kind === 'vote' || e.kind === 'bill') && e.from === n.id && e.date)
      .map((e) => ({ d: parseD(e.date)!, act: e.to, kind: e.kind as 'vote' | 'bill', label: e.label, media: e.status === 'media', sources: e.sources ?? [] }));
    const ties: Tie[] = g.edges
      .filter((e) => (e.kind === 'work' || e.kind === 'contact' || e.kind === 'family') && N[e.from]?.type === 'person' && N[e.to]?.type === 'person' && (e.from === n.id || e.to === n.id))
      .map((e) => ({ other: e.from === n.id ? e.to : e.from, kind: e.kind as Tie['kind'], d: parseD(e.date || e.since), media: e.status === 'media', label: e.label, sources: e.sources ?? [] }));
    people.push({ node: n, fns, events, ties, cases: caseNodes.filter((c) => c.set.has(n.id)).map((c) => c.id) });
  }
  return { people, asOf, names: Object.fromEntries(g.nodes.map((x) => [x.id, x.short || x.name])), years };
}

const MANAGE = /prezes|zarząd|dyrektor|rada nadzorcz|rada społeczn|organ nadzoru|wspólnik|udziałow|kierownik|ordynator/i;
const months = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / (30.44 * DAY));

export function overlaps(fns: Fn[], inWin: (a: Date, b: Date) => boolean): Pair[] {
  const ok = fns.filter((f) => f.a && !f.uncertain);
  const best = new Map<string, Pair>();
  for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
    let x = ok[i], y = ok[j];
    if (x.group === y.group || x.group === 'polityka' || y.group === 'polityka') continue;
    const gs = [x.group, y.group];
    if (!gs.includes('wladza') && !(gs.includes('repr') && gs.includes('pieniadze'))) continue;
    if (y.group === 'wladza' || x.group === 'pieniadze') [x, y] = [y, x];
    const a = new Date(Math.max((x.ca ?? x.a)!.getTime(), (y.ca ?? y.a)!.getTime()));
    const b = new Date(Math.min((x.cb ?? x.b)!.getTime(), (y.cb ?? y.b)!.getTime()));
    if (b.getTime() - a.getTime() < DAY || !inWin(a, b)) continue;
    const type = x.group === 'wladza'
      ? (y.group === 'repr' ? 'urząd + organizacja branżowa' : MANAGE.test(y.label) ? 'urząd + zarząd podmiotu' : 'urząd + praca w podmiocie')
      : 'organizacja branżowa + zarząd podmiotu';
    // okres przekazania: krótko, obie daty z dokumentu (nie „stan na”), i co najmniej jedna funkcja się skończyła
    const exact = (f: Fn) => !f.observed && !!f.ca;
    const pair: Pair = { x, y, a, b, open: x.open && y.open, type, short: months(a, b) <= 3 && exact(x) && exact(y) && !(x.open && y.open) };
    // jedna para na podmiot (organizację) i rodzaj urzędu — Senat i jego komisja to ten sam styk
    const key = `${x.group}:${y.orgId}`;
    const prev = best.get(key);
    if (!prev || b.getTime() - a.getTime() > prev.b.getTime() - prev.a.getTime()) best.set(key, pair);
  }
  return [...best.values()];
}

const yr = (d: Date) => d.getUTCFullYear();
const fmt = (d: Date) => `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
export const dur = (a: Date, b: Date) => {
  const m = months(a, b);
  return m < 1 ? `${Math.max(1, Math.round((b.getTime() - a.getTime()) / DAY))} dni` : m < 24 ? `${m} mies.` : `${(m / 12).toFixed(1).replace('.', ',')} roku`;
};
export const fmtDay = fmt;

export function score(p: Person, m: Model, f: Filter): Score {
  const W0 = new Date(Date.UTC(f.y0, 0, 1)), W1 = new Date(Date.UTC(f.y1, 0, 1));
  const inWin = (a: Date | null, b: Date | null) => (a && b ? a < W1 && b >= W0 : f.full);
  const okM = (x: { media: boolean }) => f.media || !x.media;
  const empty = () => Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, [] as Item[]])) as Record<ComponentKey, Item[]>;
  const items = empty();
  const fns = p.fns.filter(okM).filter((r) => inWin(r.a, r.b));
  const evs = p.events.filter(okM);
  const active = f.full || fns.some((r) => r.a) || evs.some((e) => inWin(e.d, e.d));
  const zero = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, 0])) as Record<ComponentKey, number>;
  if (!active) return { person: p, items, parts: zero, total: 0, pairs: [] };

  const seen = new Set<string>();
  for (const r of fns) {
    const k: ComponentKey = r.group === 'wladza' ? 'wladza' : r.group === 'polityka' ? 'partia' : r.group === 'pieniadze' ? 'pieniadze' : 'repr';
    const key = `${k}:${r.orgId}`, sk = `s:${r.sector}`;
    const pts = seen.has(key) ? 0 : k === 'wladza' && seen.has(sk) ? 1 : WEIGHTS[k];
    const when = !r.a ? 'bez daty' : r.observed ? `stan na ${yr(r.a)}` : `${yr(r.a)}–${r.open ? '' : yr(r.b!)}`;
    items[k].push({ text: `${r.org} — ${r.label}`, when, media: r.media, sources: r.sources, pts });
    seen.add(key); seen.add(sk);
  }
  const party = p.node.party;
  if (party && (!party.former || f.full || (parseD(party.until, true) ?? W0) >= W0)) {
    items.partia.push({ text: `${party.name}${party.former ? ' (dawniej)' : ''}${party.note ? ` — ${party.note}` : ''}`, when: 'partia', sources: party.sources, pts: WEIGHTS.partia });
  }
  // przejścia: kolejne nowe sektory w czasie, tylko z dat początku (stan „na dzień” nie mówi, kiedy funkcja się zaczęła)
  const dated = fns.filter((r) => r.a && !r.uncertain && !r.observed).sort((x, y) => x.a!.getTime() - y.a!.getTime());
  const path: Sector[] = [];
  for (const r of dated) if (!path.includes(r.sector)) path.push(r.sector);
  for (let i = 1; i < path.length; i++) items.przejscia.push({ text: `${SECTORS[path[i - 1]].label} → ${SECTORS[path[i]].label}`, when: '', pts: WEIGHTS.przejscia });
  const pairs = overlaps(fns, (a, b) => inWin(a, b));
  for (const o of pairs) {
    items.naraz.push({
      text: `${o.x.org} + ${o.y.org} — ${o.type}${o.short ? ' (okres przekazania)' : ''}`,
      when: `${fmt(o.a)}–${o.open ? 'nadal' : fmt(o.b)}, ${dur(o.a, o.b)}`,
      media: o.x.media || o.y.media,
      pts: o.short ? 0 : o.x.group === 'wladza' || o.y.group === 'wladza' ? WEIGHTS.naraz : 1,
    });
  }
  const money = fns.filter((r) => r.group === 'pieniadze' && r.a && !r.uncertain);
  const acts = new Set<string>();
  for (const ev of evs) {
    if (!inWin(ev.d, ev.d)) continue;
    const hit = money.find((r) => ev.d >= r.a! && ev.d <= r.b!);
    if (hit && !acts.has(ev.act)) {
      acts.add(ev.act);
      items.glos.push({ text: `${ev.kind === 'vote' ? 'Głos' : 'Udział w pracach'}: ${m.names[ev.act] ?? ev.act}, w czasie funkcji: ${hit.org}`, when: fmt(ev.d), sources: ev.sources, pts: WEIGHTS.glos });
    }
  }
  const others = new Set<string>();
  for (const t of p.ties.filter(okM)) {
    if (others.has(t.other) || !(t.d ? inWin(t.d, t.d) : f.full)) continue;
    others.add(t.other);
    items.osoby.push({ text: `${t.kind === 'family' ? 'Rodzina' : t.kind === 'work' ? 'Współpraca' : 'Kontakt'}: ${m.names[t.other]}`, when: '', media: t.media, sources: t.sources, pts: WEIGHTS.osoby });
  }
  if (f.full) for (const c of CASES) if (p.cases.includes(c.id)) items.osoby.push({ text: `Sprawa: ${c.label}`, when: '', pts: WEIGHTS.osoby });

  const parts = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, f.comps.includes(k as ComponentKey) ? items[k as ComponentKey].reduce((s, x) => s + x.pts, 0) : 0])) as Record<ComponentKey, number>;
  return { person: p, items, parts, total: Object.values(parts).reduce((s, v) => s + v, 0), pairs };
}

export function ranking(m: Model, f: Filter): Score[] {
  return m.people
    .filter((p) => !f.cases.length || f.cases.some((c) => p.cases.includes(c)))
    .map((p) => score(p, m, f))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total || a.person.node.name.localeCompare(b.person.node.name, 'pl'));
}

export const statusOf = (s?: Status) => s ?? 'record';
