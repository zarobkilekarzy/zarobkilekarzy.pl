/**
 * Analiza grafu „Konstelacji”: ścieżki, otoczenie, porównanie osób, indeks źródeł, mosty, wyszukiwanie w treści.
 * Same algorytmy na danych (bez DOM). Port `research/powiazania/analiza.js` (tam: globalThis.Analiza) —
 * przy zmianie zmieniać oba pliki; wyniki mają być te same. Funkcje dostają węzły i krawędzie w schemacie graf.json;
 * widok podaje krawędzie po filtrach legendy razem z wyliczonymi wspólnymi okresami (okresy.ts).
 * Wynik to powiązania w danych, nie dowód współpracy ani zarzut.
 */
import { przedzial } from './okresy';
import type { Charge, GraphEdge, GraphNode, Party, Role, Source, Status } from './types';

export const RANK: Record<Status, number> = { record: 4, confirmed: 3, media: 2, disputed: 1 };
/** Instytucje, przez które łączy się prawie wszystko — domyślnie nie są ogniwem ścieżki ani węzłem w rankingu mostów. */
export const OGOLNE = ['sejm', 'senat', 'mz', 'nfz', 'nil'];
const statusOf = (e: GraphEdge): Status => e.status || 'record';
const rankOf = (e: GraphEdge) => RANK[statusOf(e)] ?? 0;
const pewna = (e: GraphEdge) => rankOf(e) >= RANK.confirmed;
// Sama struktura (organ należy do instytucji) nie ma źródła. Członkostwo podmiotu w związku ma — to fakt, nie struktura.
const strukturalna = (e: GraphEdge) => e.kind === 'part' && !e.sources?.length;
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const byRank = (a: GraphEdge, b: GraphEdge) => rankOf(b) - rankOf(a);

export interface Opts {
  /** tylko `record` i `confirmed` */
  pewne?: boolean;
  /** z instytucjami ogólnymi i krawędziami struktury */
  przezInstytucje?: boolean;
  ogolne?: string[];
}
export interface Graf {
  byId: Map<string, GraphNode>;
  adj: Map<string, Map<string, GraphEdge[]>>;
  ogolne: Set<string>;
}

/** Graf nieskierowany: dla każdego węzła mapa sąsiad → krawędzie tej pary. */
export function graf(nodes: GraphNode[], edges: GraphEdge[], opts: Opts = {}): Graf {
  const przez = !!opts.przezInstytucje;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map(nodes.map((n) => [n.id, new Map<string, GraphEdge[]>()]));
  for (const e of edges) {
    if (e.from === e.to || !adj.has(e.from) || !adj.has(e.to)) continue;
    if (opts.pewne && !pewna(e)) continue;
    if (!przez && strukturalna(e)) continue;
    for (const [u, v] of [[e.from, e.to], [e.to, e.from]]) {
      const m = adj.get(u)!;
      if (!m.has(v)) m.set(v, []);
      m.get(v)!.push(e);
    }
  }
  const ogolne = new Set(przez ? [] : (opts.ogolne ?? OGOLNE).filter((id) => byId.has(id)));
  return { byId, adj, ogolne };
}

/** Instytucja, do której należy organ (po łańcuchu `parent`); dla instytucji — ona sama. */
export function instytucja(byId: Map<string, GraphNode>, id: string): string | null {
  let n = byId.get(id);
  const seen = new Set<string>();
  while (n && n.type === 'body' && !seen.has(n.id)) { seen.add(n.id); n = n.parent ? byId.get(n.parent) : undefined; }
  return n?.type === 'institution' ? n.id : null;
}
// Skupisko węzła: instytucja (także przez organ) albo podmiot sam dla siebie. Akty i osoby nie są skupiskiem.
const skupiskoWezla = (byId: Map<string, GraphNode>, id: string) => {
  const t = byId.get(id)?.type;
  if (t === 'entity') return id;
  if (t === 'institution' || t === 'body') return instytucja(byId, id);
  return null;
};

/* ---------- Najkrótsza ścieżka ----------
   Najmniej ogniw; przy równej liczbie wygrywa mocniejsza pewność (waga 1 + 0,01 za każdy stopień słabiej niż dokument).
   Przez instytucję ogólną ścieżka nie przechodzi (może się na niej zaczynać albo kończyć). */
export interface Step { from: string; to: string; edges: GraphEdge[] }
export interface Path { nodes: string[]; steps: Step[] }

function najkrotsza(g: Graf, a: string, b: string, bez: { wezly?: Set<string>; pary?: Set<string> } = {}): Path | null {
  if (!g.adj.has(a) || !g.adj.has(b) || a === b) return null;
  const bezWezlow = bez.wezly ?? new Set<string>(), bezPar = bez.pary ?? new Set<string>();
  const dist = new Map([[a, 0]]), prev = new Map<string, string>(), done = new Set<string>(), open = new Set([a]);
  while (open.size) {
    let u: string | null = null;
    for (const x of open) if (u === null || dist.get(x)! < dist.get(u)! - 1e-9) u = x;
    open.delete(u!);
    done.add(u!);
    if (u === b) break;
    if (u !== a && g.ogolne.has(u!)) continue;
    for (const [v, es] of g.adj.get(u!)!) {
      if (done.has(v) || bezWezlow.has(v) || bezPar.has(pairKey(u!, v))) continue;
      const best = Math.max(...es.map(rankOf));
      const d = dist.get(u!)! + 1 + (RANK.record - best) * 0.01;
      if (!dist.has(v) || d < dist.get(v)! - 1e-9) { dist.set(v, d); prev.set(v, u!); open.add(v); }
    }
  }
  if (!done.has(b)) return null;
  const ids = [b];
  while (ids[0] !== a) ids.unshift(prev.get(ids[0])!);
  return {
    nodes: ids,
    steps: ids.slice(1).map((v, i) => ({ from: ids[i], to: v, edges: [...g.adj.get(ids[i])!.get(v)!].sort(byRank) })),
  };
}

/** Najkrótsza ścieżka i druga, która omija węzły pośrednie pierwszej (przy ścieżce bezpośredniej — omija tę parę). */
export function sciezki(nodes: GraphNode[], edges: GraphEdge[], a: string, b: string, opts: Opts = {}): { paths: Path[] } {
  const g = graf(nodes, edges, opts);
  const first = najkrotsza(g, a, b);
  if (!first) return { paths: [] };
  const mid = first.nodes.slice(1, -1);
  const second = najkrotsza(g, a, b, mid.length ? { wezly: new Set(mid) } : { pary: new Set([pairKey(a, b)]) });
  return { paths: second ? [first, second] : [first] };
}

/** Otoczenie do `stopien` kroków: mapa id → odległość. Instytucję ogólną widać, ale dalej przez nią się nie idzie. */
export function otoczenie(nodes: GraphNode[], edges: GraphEdge[], id: string, stopien = 1, opts: Opts = {}): Map<string, number> {
  const g = graf(nodes, edges, opts);
  const dist = new Map<string, number>();
  if (!g.adj.has(id)) return dist;
  dist.set(id, 0);
  let front = [id];
  for (let d = 1; d <= stopien && front.length; d++) {
    const next: string[] = [];
    for (const u of front) {
      if (u !== id && g.ogolne.has(u)) continue;
      for (const v of g.adj.get(u)!.keys()) if (!dist.has(v)) { dist.set(v, d); next.push(v); }
    }
    front = next;
  }
  return dist;
}

/* ---------- Porównanie dwóch osób ----------
   Bezpośrednie krawędzie (bez wyliczonych okresów — te są w `okresy`), wspólni sąsiedzi według typu,
   ta sama instytucja przez różne organy, nakładające się okresy funkcji (daty jak w okresy.ts). */
export interface Wspolny { id: string; a: GraphEdge[]; b: GraphEdge[] }
export interface Via { via: string; edges: GraphEdge[] }
export interface WspolnaInstytucja { id: string; a: Via[]; b: Via[] }
export interface Okres {
  gdzie: string;
  wspolnyWezel: boolean;
  a: GraphEdge;
  b: GraphEdge;
  zespol: string | null;
  status: Status;
  poczatekTekst: string;
  koniecTekst: string;
}
export interface Porownanie {
  bezposrednie: GraphEdge[];
  wezly: Wspolny[];
  ustawy: Wspolny[];
  osoby: Wspolny[];
  instytucje: WspolnaInstytucja[];
  okresy: Okres[];
}

export function porownanie(nodes: GraphNode[], edges: GraphEdge[], a: string, b: string, asOf: string): Porownanie {
  const g = graf(nodes, edges, { przezInstytucje: true });
  const A = g.adj.get(a) ?? new Map<string, GraphEdge[]>(), B = g.adj.get(b) ?? new Map<string, GraphEdge[]>();
  const type = (id: string) => g.byId.get(id)?.type;
  const sorted = (es: GraphEdge[]) => [...es].sort(byRank);
  const bezposrednie = sorted((A.get(b) ?? []).filter((e) => !e.derived));
  const wspolne = [...A.keys()].filter((id) => id !== b && id !== a && B.has(id))
    .map((id) => ({ id, a: sorted(A.get(id)!), b: sorted(B.get(id)!) }));
  const wezly = wspolne.filter((x) => ['institution', 'body', 'entity'].includes(type(x.id) ?? ''));
  const ustawy = wspolne.filter((x) => type(x.id) === 'act');
  const osoby = wspolne.filter((x) => type(x.id) === 'person');

  // Funkcje (role) osoby pogrupowane po instytucji: { inst → [{ via, edges }] }.
  const funkcje = (id: string) => {
    const m = new Map<string, Via[]>();
    for (const [v, es] of g.adj.get(id) ?? []) {
      const role = es.filter((e) => e.kind === 'role');
      const inst = type(v) === 'entity' ? null : instytucja(g.byId, v);
      if (!role.length || !inst) continue;
      if (!m.has(inst)) m.set(inst, []);
      m.get(inst)!.push({ via: v, edges: sorted(role) });
    }
    return m;
  };
  const fa = funkcje(a), fb = funkcje(b);
  const instytucje = [...fa.keys()].filter((i) => fb.has(i)).map((i) => ({ id: i, a: fa.get(i)!, b: fb.get(i)! }))
    .filter((x) => x.a.some((p) => !x.b.some((q) => q.via === p.via)) || x.b.some((q) => !x.a.some((p) => p.via === q.via)));

  // Nakładające się okresy: funkcje z datą początku w tym samym węźle albo w tej samej instytucji.
  const roleOf = (adj: Map<string, GraphEdge[]>) =>
    [...adj].flatMap(([v, es]) => es.filter((e) => e.kind === 'role' && e.since).map((e) => ({ v, e })));
  const okresy: Okres[] = [];
  for (const x of roleOf(A)) {
    for (const y of roleOf(B)) {
      const same = x.v === y.v;
      const sx = skupiskoWezla(g.byId, x.v), sy = skupiskoWezla(g.byId, y.v);
      if (!same && !(sx && sx === sy)) continue;
      const px = przedzial(x.e, asOf), py = przedzial(y.e, asOf);
      if (!px || !py) continue;
      const later = px.poczatek >= py.poczatek ? px : py;
      const first = px.koniec <= py.koniec ? px : py;
      if (later.poczatek >= first.koniec) continue;
      okresy.push({
        gdzie: same ? x.v : sx!, wspolnyWezel: same, a: x.e, b: y.e,
        zespol: x.e.team && x.e.team === y.e.team ? x.e.team : null,
        status: rankOf(x.e) <= rankOf(y.e) ? statusOf(x.e) : statusOf(y.e),
        poczatekTekst: later.poczatekTekst, koniecTekst: first.koniecTekst,
      });
    }
  }
  return { bezposrednie, wezly, ustawy, osoby, instytucje, okresy };
}

/* ---------- Fakty i indeks źródeł ----------
   Fakt = krawędź z grafu (bez wyliczonych okresów), funkcja z `roles[]`, przynależność partyjna albo zarzut. */
export type Fakt =
  | { typ: 'edge'; edge: GraphEdge; node: string; sources: string[] }
  | { typ: 'role'; node: string; item: Role; sources: string[] }
  | { typ: 'party'; node: string; item: Party; sources: string[] }
  | { typ: 'charge'; node: string; item: Charge; sources: string[] };

export function fakty(nodes: GraphNode[], edges: GraphEdge[]): Fakt[] {
  const out: Fakt[] = [];
  for (const e of edges) if (!e.derived) out.push({ typ: 'edge', edge: e, node: e.from, sources: e.sources ?? [] });
  for (const n of nodes) {
    for (const r of n.roles ?? []) out.push({ typ: 'role', node: n.id, item: r, sources: r.sources ?? [] });
    if (n.party) out.push({ typ: 'party', node: n.id, item: n.party, sources: n.party.sources ?? [] });
    for (const c of n.charges ?? []) out.push({ typ: 'charge', node: n.id, item: c, sources: c.sources ?? [] });
  }
  return out;
}

export interface ZrodloWpis { id: string; fakty: Fakt[]; tylko: number }
export interface Wydawca { nazwa: string; zrodla: string[]; fakty: Fakt[]; tylko: Fakt[] }
export interface IndeksZrodel {
  fakty: Fakt[];
  zrodla: ZrodloWpis[];
  zrodlo: (id: string) => ZrodloWpis | null;
  wydawcy: Wydawca[];
  wydawca: (nazwa: string) => Wydawca | null;
}

/** Dla źródła i wydawcy: fakty, które się na nich opierają, i ile z nich nie ma innego źródła („tylko”). */
export function indeksZrodel(nodes: GraphNode[], edges: GraphEdge[], sources: Record<string, Source>): IndeksZrodel {
  const lista = fakty(nodes, edges).filter((f) => f.sources.length);
  const po = new Map<string, ZrodloWpis>(Object.keys(sources).map((id) => [id, { id, fakty: [], tylko: 0 }]));
  for (const f of lista) {
    const ids = [...new Set(f.sources)];
    for (const id of ids) {
      if (!po.has(id)) po.set(id, { id, fakty: [], tylko: 0 });
      const x = po.get(id)!;
      x.fakty.push(f);
      if (ids.length === 1) x.tylko++;
    }
  }
  const wydawcaZrodla = (id: string) => sources[id]?.publisher ?? '—';
  const wyd = new Map<string, { nazwa: string; zrodla: string[]; fakty: Set<Fakt>; tylko: Fakt[] }>();
  for (const [id, x] of po) {
    const p = wydawcaZrodla(id);
    if (!wyd.has(p)) wyd.set(p, { nazwa: p, zrodla: [], fakty: new Set(), tylko: [] });
    const w = wyd.get(p)!;
    w.zrodla.push(id);
    x.fakty.forEach((f) => w.fakty.add(f));
  }
  for (const f of lista) {
    const ps = new Set(f.sources.map(wydawcaZrodla));
    if (ps.size === 1) wyd.get([...ps][0])!.tylko.push(f);
  }
  const ile = (id: string) => po.get(id)?.fakty.length ?? 0;
  const wydawcy = [...wyd.values()]
    .map((w) => ({ nazwa: w.nazwa, zrodla: w.zrodla.sort((a, b) => ile(b) - ile(a)), fakty: [...w.fakty], tylko: w.tylko }))
    .sort((a, b) => b.fakty.length - a.fakty.length || a.nazwa.localeCompare(b.nazwa, 'pl'));
  const poNazwie = new Map(wydawcy.map((w) => [w.nazwa, w]));
  return {
    fakty: lista,
    zrodla: [...po.values()].sort((a, b) => b.fakty.length - a.fakty.length),
    zrodlo: (id) => po.get(id) ?? null,
    wydawcy,
    wydawca: (nazwa) => poNazwie.get(nazwa) ?? null,
  };
}

/* ---------- Wyszukiwanie w treści ----------
   Bez wielkości liter i polskich znaków, z prostą odmianą: słowo dopasowuje początek wyrazu
   z obciętą końcówką („rada społeczna” znajdzie „radzie społecznej”). Wszystkie słowa muszą wystąpić. */
const FOLD: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
/** Znak za znak (ta sama długość), żeby zakresy z tekstu złożonego pasowały do oryginału. */
export const fold = (s: unknown) => String(s ?? '').replace(/[\s\S]/g, (c) => {
  const l = c.toLowerCase();
  const x = l.length === 1 ? l : c;
  return FOLD[x] ?? (x > '\x7f' ? x.normalize('NFD')[0] : x);
});
const rdzen = (w: string) => (/^\p{N}+$/u.test(w) || w.length < 4 ? w : w.length >= 6 ? w.slice(0, -2) : w.slice(0, -1));
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface Wzorzec {
  slowa: string[];
  pasuje: (text: string) => boolean;
  zakresy: (text: string) => [number, number][];
  waga: (text: string) => number;
}

export function wzorzec(q: string): Wzorzec | null {
  const slowa = fold(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (!slowa.length) return null;
  const czesci = slowa.map((w) => `${escRe(rdzen(w))}[\\p{L}\\p{N}]*`);
  const res = czesci.map((c) => new RegExp(`(?<![\\p{L}\\p{N}])${c}`, 'gu'));
  // Fraza: te same słowa obok siebie, w tej kolejności („rady społecznej”, ale nie „radny … społeczny”).
  const fraza = slowa.length > 1 ? new RegExp(`(?<![\\p{L}\\p{N}])${czesci.join('[^\\p{L}\\p{N}]+')}`, 'gu') : null;
  const trafienia = (r: RegExp, f: string) => {
    const out: [number, number][] = [];
    r.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.exec(f))) { out.push([m.index, m.index + m[0].length]); if (!m[0].length) r.lastIndex++; }
    return out;
  };
  return {
    slowa,
    pasuje(text) {
      const f = fold(text);
      return res.every((r) => { r.lastIndex = 0; return r.test(f); });
    },
    // Zakresy [od, do) do podświetlenia w oryginalnym tekście, scalone. Gdy jest cała fraza — tylko ona.
    zakresy(text) {
      const f = fold(text);
      const zFrazy = fraza ? trafienia(fraza, f) : [];
      const out = zFrazy.length ? zFrazy : res.flatMap((r) => trafienia(r, f));
      out.sort((x, y) => x[0] - y[0]);
      const merged: [number, number][] = [];
      for (const z of out) {
        const last = merged[merged.length - 1];
        if (last && z[0] <= last[1]) last[1] = Math.max(last[1], z[1]);
        else merged.push([z[0], z[1]]);
      }
      return merged;
    },
    // Cała fraza w tej samej kolejności liczy się wyżej niż rozrzucone słowa.
    waga: (text) => (fraza && trafienia(fraza, fold(text)).length ? 2 : 1),
  };
}

const tekstFaktu = (f: Fakt) => {
  if (f.typ === 'edge') return f.edge.label ?? '';
  if (f.typ === 'party') return [f.item.name, f.item.note].filter(Boolean).join(' — ');
  if (f.typ === 'charge') return [f.item.label, f.item.by].filter(Boolean).join(' — ');
  return f.item.label ?? '';
};

export type Trafienie = Fakt & { tekst: string; wTresci: boolean; wZrodle: string[]; waga: number };
export interface WynikSzukania {
  wzorzec: Wzorzec | null;
  wezly: { id: string; waga: number }[];
  fakty: Trafienie[];
  zrodla: string[];
}

export function szukaj(nodes: GraphNode[], edges: GraphEdge[], sources: Record<string, Source>, q: string): WynikSzukania {
  const w = wzorzec(q);
  if (!w) return { wzorzec: null, wezly: [], fakty: [], zrodla: [] };
  const wezly = nodes
    .map((n) => ({ n, tekst: [n.name, n.short, n.note].filter(Boolean).join(' · ') }))
    .filter((x) => w.pasuje(x.tekst))
    .map((x) => ({ id: x.n.id, waga: (w.pasuje(`${x.n.name} ${x.n.short ?? ''}`) ? 2 : 0) + w.waga(x.tekst) }))
    .sort((a, b) => b.waga - a.waga);
  const zrodlaHit = Object.entries(sources).filter(([, s]) => w.pasuje(`${s.title} · ${s.publisher}`)).map(([id]) => id);
  const hitSet = new Set(zrodlaHit);
  const out: Trafienie[] = [];
  for (const f of fakty(nodes, edges)) {
    const tekst = tekstFaktu(f);
    const wTresci = w.pasuje(tekst);
    const wZrodle = [...new Set(f.sources)].filter((id) => hitSet.has(id));
    if (!wTresci && !wZrodle.length) continue;
    out.push({ ...f, tekst, wTresci, wZrodle, waga: wTresci ? 2 * w.waga(tekst) : 1 });
  }
  out.sort((a, b) => b.waga - a.waga);
  return { wzorzec: w, wezly, fakty: out, zrodla: zrodlaHit };
}

/* ---------- Mosty ----------
   Pośrednictwo (betweenness, algorytm Brandesa) na grafie bez instytucji ogólnych: jaka część najkrótszych dróg
   między innymi węzłami przechodzi przez osobę albo przez parę. Powiązania osób z rozłącznych skupisk
   (różne instytucje i podmioty funkcji) z „objazdem” — odległością tych osób po pominięciu tej pary. */
export interface MostOsoba { id: string; posrednictwo: number; skupiska: string[]; sasiedzi: number }
export interface MostPowiazanie {
  a: string;
  b: string;
  edges: GraphEdge[];
  skupiskaA: string[];
  skupiskaB: string[];
  posrednictwo: number;
  objazd: number | null;
}

export function mosty(nodes: GraphNode[], edges: GraphEdge[], opts: Opts = {}): { osoby: MostOsoba[]; powiazania: MostPowiazanie[]; wezly: number } {
  const g = graf(nodes, edges, opts);
  const V = nodes.map((n) => n.id).filter((id) => !g.ogolne.has(id));
  const inV = new Set(V);
  const nb = new Map(V.map((id) => [id, [...g.adj.get(id)!.keys()].filter((v) => inV.has(v))]));
  const CB = new Map(V.map((v) => [v, 0])), EB = new Map<string, number>();
  for (const s of V) {
    const S: string[] = [], P = new Map<string, string[]>(), sigma = new Map([[s, 1]]), d = new Map([[s, 0]]), Q = [s];
    for (let qi = 0; qi < Q.length; qi++) {
      const v = Q[qi];
      S.push(v);
      for (const w of nb.get(v)!) {
        if (!d.has(w)) { d.set(w, d.get(v)! + 1); Q.push(w); sigma.set(w, 0); P.set(w, []); }
        if (d.get(w) === d.get(v)! + 1) { sigma.set(w, sigma.get(w)! + sigma.get(v)!); P.get(w)!.push(v); }
      }
    }
    const delta = new Map(S.map((v) => [v, 0]));
    while (S.length) {
      const w = S.pop()!;
      for (const v of P.get(w) ?? []) {
        const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        const k = pairKey(v, w);
        EB.set(k, (EB.get(k) ?? 0) + c);
        delta.set(v, delta.get(v)! + c);
      }
      if (w !== s) CB.set(w, CB.get(w)! + delta.get(w)!);
    }
  }
  // Każda para (s, t) policzona dwa razy (z obu końców) — dzielimy przez liczbę par uporządkowanych.
  const n = V.length;
  const normV = n > 2 ? (n - 1) * (n - 2) : 1;
  const normE = n > 1 ? n * (n - 1) : 1;

  const skupiska = (id: string) => {
    const role = new Set<string>(), inne = new Set<string>();
    for (const [v, es] of g.adj.get(id)!) {
      const c = skupiskoWezla(g.byId, v);
      if (!c) continue;
      (es.some((e) => e.kind === 'role') ? role : inne).add(c);
    }
    return [...(role.size ? role : inne)];
  };
  const objazd = (a: string, b: string) => {
    const d = new Map([[a, 0]]), Q = [a];
    for (let qi = 0; qi < Q.length; qi++) {
      const v = Q[qi];
      for (const w of nb.get(v)!) {
        if (d.has(w) || (v === a && w === b)) continue;
        d.set(w, d.get(v)! + 1);
        if (w === b) return d.get(w)!;
        Q.push(w);
      }
    }
    return null;
  };
  const isPerson = (id: string) => g.byId.get(id)?.type === 'person';
  const osoby = V.filter(isPerson).map((id) => ({
    id, posrednictwo: CB.get(id)! / normV, skupiska: skupiska(id), sasiedzi: nb.get(id)!.length,
  }));
  const powiazania: MostPowiazanie[] = [];
  for (const a of V) {
    if (!isPerson(a)) continue;
    for (const [b, es] of g.adj.get(a)!) {
      if (a >= b || !inV.has(b) || !isPerson(b)) continue;
      const sa = skupiska(a), sb = skupiska(b);
      if (!sa.length || !sb.length || sa.some((x) => sb.includes(x))) continue;
      powiazania.push({
        a, b, edges: [...es].sort(byRank), skupiskaA: sa, skupiskaB: sb,
        posrednictwo: (EB.get(pairKey(a, b)) ?? 0) / normE, objazd: objazd(a, b),
      });
    }
  }
  return { osoby, powiazania, wezly: n };
}
