/**
 * <zl-konstelacja>: graf powiązań „Konstelacji ochrony zdrowia” — układ siłowy (d3-force), przybliżanie (d3-zoom),
 * przeciąganie węzłów, panel z faktami i źródłami, filtry, widoki z tezą, historia w adresie (#…) i narzędzia analizy.
 * Port widoku z research/powiazania/index.html (tam szkic roboczy; algorytmy: src/lib/konstelacja/analiza.ts).
 *
 * Stan w adresie: `#v=widok&n=węzeł` (albo `p=a|b` para, `k=partia`), `tryb=wszyscy`, `inst=mz,nfz`, `obecne=1`,
 * `rozwin=…`, `dodane=…`, `ukryj=media,law`; analiza: `sciezka=a,b`, `otoczenie=id,2`, `porownaj=a,b`, `zrodlo=id`,
 * `wydawca=…`, `zrodla=1`, `mosty=osoby`, `szukaj=fraza`, `analiza=1`, ustawienia `pewne=1`, `przez=instytucje`.
 * Kamera nie jest historią. Tryb nocny bierze z tokenów serwisu (kolory przez var(--…)).
 */
import { drag, type D3DragEvent } from 'd3-drag';
import {
  forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY,
  type ForceLink, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum,
} from 'd3-force';
import { pointer, select, type Selection } from 'd3-selection';
import 'd3-transition';
import { zoom as d3zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { plural, typo as typoText } from '@/lib/format';
import * as Analiza from '@/lib/konstelacja/analiza';
import { fmtDate, TEAM_NAME, wspolneOkresy } from '@/lib/konstelacja/okresy';
import type { EdgeKind, GraphData, GraphEdge, GraphNode, Party, Role, Status, View } from '@/lib/konstelacja/types';

type CatKey = 'family' | 'ties' | 'money' | 'law' | 'structure';
type E = GraphEdge & { i: number; status: Status; cat: CatKey };
interface N extends GraphNode, SimulationNodeDatum { degree: number; r: number; hub?: boolean }
interface L extends SimulationLinkDatum<N> { key: string; source: N | string; target: N | string; edges: E[]; visible: E[] }
type Sel = { node: string } | { pair: string } | { party: string } | null;
type An =
  | { t: 'menu' } | { t: 'srcs' }
  | { t: 'path'; a: string; b: string; alt: number }
  | { t: 'cmp'; a: string; b: string }
  | { t: 'hood'; id: string; d: number; hide: boolean }
  | { t: 'src'; id: string }
  | { t: 'pub'; name: string }
  | { t: 'bridges'; tab: string; sort: string }
  | { t: 'search'; q: string; tab: string };
type AnT = An['t'];
interface Focus {
  nodes: Set<string>; links: Set<string>; ends: Set<string>; hits: Set<string>; forced: Set<GraphEdge>; labels: Set<string>;
  hideRest: boolean;
  result: unknown;
}
interface Config { logos: Record<string, string> }

const STATUS: Record<Status, { label: string; desc: string; rank: number; width: number; dash: string | null }> = {
  record: { label: 'Dokument', desc: 'oficjalny dokument, rejestr, publikacja', rank: 4, width: 2.5, dash: null },
  confirmed: { label: 'Potwierdzone', desc: 'potwierdzili zainteresowani albo urząd', rank: 3, width: 1.4, dash: null },
  media: { label: 'Media', desc: 'podają media, nikt nie zaprzecza, brak dokumentu', rank: 2, width: 2, dash: '0.1 5' },
  disputed: { label: 'Sporne', desc: 'zaprzeczone albo z anonimowego źródła', rank: 1, width: 1.4, dash: '7 5' },
};
const KIND: Record<string, string> = {
  part: 'struktura', role: 'funkcja', vote: 'głosowanie', bill: 'udział w ustawie',
  family: 'rodzina', work: 'współpraca', contact: 'kontakt', context: 'kontekst sprawy', overlap: 'wspólny okres (wyliczony)',
  contract: 'umowa z NFZ', party: 'partia lub klub',
};
// Kolor linii = kategoria najmocniejszego powiązania w parze (kolejność ważności od góry).
const CAT: Record<CatKey, { label: string; kinds: EdgeKind[]; color: string }> = {
  family: { label: 'Rodzina', kinds: ['family'], color: 'var(--ink)' },
  ties: { label: 'Współpraca i kontakty', kinds: ['work', 'contact', 'context', 'overlap'], color: 'var(--blue)' },
  money: { label: 'Umowy z NFZ', kinds: ['contract'], color: 'var(--blue-700)' },
  law: { label: 'Ustawa i głosowania', kinds: ['vote', 'bill'], color: 'var(--text)' },
  structure: { label: 'Struktura i funkcje', kinds: ['part', 'role'], color: 'var(--chart)' },
};
const CAT_KEYS = Object.keys(CAT) as CatKey[];
const STATUS_KEYS = Object.keys(STATUS) as Status[];
const KIND_CAT = Object.fromEntries(CAT_KEYS.flatMap((c) => CAT[c].kinds.map((k) => [k, c]))) as Record<string, CatKey>;
const VOTE: Record<string, string> = { NO: 'przeciw', ABSTAIN: 'wstrzymał(a) się', YES: 'za', ABSENT: 'nieobecny(-a)' };
const TYPE_LABEL: Record<string, string> = { institution: 'Instytucja', body: 'Organ', act: 'Akt prawny', entity: 'Podmiot (spółka, fundacja, szpital)', person: 'Osoba' };
const TYPE_SHORT: Record<string, string> = { institution: 'instytucja', body: 'organ', act: 'akt prawny', entity: 'podmiot', person: 'osoba' };
// Przycisk powrotu w panelu: wyraźna strzałka (ikona) zamiast znaku „←”.
const BACK_ICON = '<svg class="back-ico" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>';
const HUBS = 6; // ile węzłów o największej liczbie sąsiadów oznaczamy jako huby
const HUB_MIN = 4; // …ale tylko gdy mają co najmniej tylu sąsiadów
const HIST_KEY = 'konstelacja-historia-top';
const AN_GRAPH = new Set<AnT>(['path', 'hood', 'cmp', 'src', 'pub']); // narzędzia, które zmieniają graf
const AN_PARENT: Record<AnT, AnT | null> = { menu: null, search: null, path: 'menu', hood: 'menu', cmp: 'menu', srcs: 'menu', bridges: 'menu', src: 'srcs', pub: 'srcs' };
const AN_NAME: Record<AnT, string> = { menu: 'Analiza', path: 'Ścieżka', hood: 'Otoczenie', cmp: 'Porównanie', srcs: 'Indeks źródeł', src: 'Źródło', pub: 'Wydawca', bridges: 'Mosty', search: 'Wyszukiwanie' };
const FACT: [string, string, string] = ['fakt', 'fakty', 'faktów'];
const SRC: [string, string, string] = ['źródło', 'źródła', 'źródeł'];

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const typo = (s: unknown) => typoText(esc(s));
const pairKey = Analiza.pairKey;
const idOf = (x: N | string) => (typeof x === 'object' ? x.id : x);
const nodeOf = (x: N | string) => x as N; // po forceLink.id() końce linii są już węzłami
const initials = (name: string) => name.replace(/\./g, '').split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
const partyText = (p?: Party) => (p ? (p.former ? `${p.name} · dawniej` : p.name) : '');
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initKonstelacja(host: HTMLElement, data: GraphData, config: Config) {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => host.querySelector<T>(`#kst-${id}`)!;
  const svgEl = host.querySelector<SVGSVGElement>('.kst-graph')!;
  const svg = select(svgEl);
  const detail = $('detail');
  const legendBody = $('legend-body');
  const logoSrc = (p?: Party | { name: string }) => (p && config.logos[p.name]) || null;

  const activeStatus = new Set<Status>(STATUS_KEYS);
  const activeCat = new Set<CatKey>(CAT_KEYS);
  // an — otwarte narzędzie analizy, aopt — jego ustawienia: tylko pewne ogniwa, przez instytucje ogólne.
  const state = {
    mode: 'core' as 'core' | 'all', view: null as View | null, expanded: new Set<string>(), pinned: new Set<string>(),
    inst: new Set<string>(), currentOnly: false, an: null as An | null, aopt: { pewne: false, przez: false },
  };
  let selected: Sel = null;
  // Kamera: „fit” — dopasowana do grafu, „center” — wyśrodkowana na węźle (target), „free” — ustawiona ręcznie.
  let camera: { mode: 'fit' | 'free' } | { mode: 'center'; target: { x?: number; y?: number } } = { mode: 'fit' };
  let lastSize: { width: number; height: number } | null = null;
  let shownSet = new Set<string>();
  let focus: Focus | null = null;
  let bridgesCache: { key: string; r: ReturnType<typeof Analiza.mosty> | null } = { key: '', r: null };
  let searchCache: { q: string | null; r: Analiza.WynikSzukania | null } = { q: null, r: null };
  const draft = { pathA: '', pathB: '', cmpA: '', cmpB: '' }; // pola formularzy, zanim narzędzie ruszy

  /* ---------- Dane ---------- */
  // Wspólne okresy w małych organach dolicza okresy.ts z dat funkcji — nie ma ich w graf.json.
  const edges: E[] = [...data.edges, ...wspolneOkresy(data.edges, data.asOf)]
    .map((e, i) => ({ ...e, i, status: e.status || 'record', cat: KIND_CAT[e.kind] }));
  // Węzeł istnieje w grafie tylko przez krawędź — instytucja bez powiązań się nie pokazuje.
  const used = new Set(edges.flatMap((e) => [e.from, e.to]));
  const nodes: N[] = data.nodes.filter((n) => used.has(n.id)).map((n) => ({ ...n, degree: 0, r: 0 }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const pairs = new Map<string, L>();
  for (const e of edges) {
    const k = pairKey(e.from, e.to);
    if (!pairs.has(k)) pairs.set(k, { key: k, source: e.from, target: e.to, edges: [], visible: [] });
    pairs.get(k)!.edges.push(e);
  }
  const links = [...pairs.values()];
  const linkByKey = (k: string) => links.find((l) => l.key === k);

  // Huby wynikają z danych: liczba różnych sąsiadów.
  for (const l of links) { byId.get(idOf(l.source))!.degree++; byId.get(idOf(l.target))!.degree++; }
  [...nodes].sort((a, b) => b.degree - a.degree).slice(0, HUBS).filter((n) => n.degree >= HUB_MIN).forEach((n) => { n.hub = true; });
  for (const n of nodes) n.r = radius(n);
  const bridges = computeBridges();
  const srcIndex = Analiza.indeksZrodel(nodes, edges, data.sources);
  const nameOf = (id: string) => byId.get(id)?.name ?? id;
  const shortOf = (id: string) => byId.get(id)?.short || nameOf(id);

  /* ---------- Rdzeń: osoby, które łączą co najmniej dwie instytucje albo mają powiązanie z inną osobą ---------- */
  function instOf(id: string | undefined): string | null {
    let n = id ? byId.get(id) : undefined;
    while (n && n.type === 'body') n = n.parent ? byId.get(n.parent) : undefined;
    return n?.type === 'institution' ? n.id : null;
  }
  function clustersOf(n: N) {
    if (n.type === 'institution') return new Set([n.id]);
    if (n.type === 'body') return new Set([instOf(n.id)]);
    const set = new Set<string | null>();
    for (const e of edges) {
      if (e.kind !== 'role') continue;
      if (e.from === n.id) set.add(instOf(e.to));
      if (e.to === n.id) set.add(instOf(e.from));
    }
    set.delete(null);
    return set;
  }
  function computeBridges() {
    const out = new Set<string>();
    for (const p of nodes.filter((n) => n.type === 'person')) {
      const insts = new Set<string | null>();
      let personTie = false;
      for (const e of edges) {
        if (e.from !== p.id && e.to !== p.id) continue;
        const o = byId.get(e.from === p.id ? e.to : e.from)!;
        if (o.type === 'person') personTie = true;
        else if (o.type === 'entity') insts.add(o.id); // spółka albo szpital to osobne miejsce
        else if (o.type !== 'act') insts.add(instOf(o.id));
      }
      insts.delete(null);
      if (personTie || insts.size >= 2) out.add(p.id);
    }
    return out;
  }

  function radius(n: N) {
    const s = Math.sqrt(n.degree);
    if (n.type === 'person') return 14 + s * 2;
    if (n.type === 'body' || n.type === 'entity') return 7 + s * 2;
    return 17 + s * 2.6; // instytucja, akt — połowa boku kwadratu
  }
  // Promień kolizji obejmuje podpis pod węzłem (≈ 3,6 px na znak w połowie szerokości).
  const labelHalf = (n: N) => (n.type === 'person' ? n.name.length * 3.7 : n.name.length * 3.3);
  const collideR = (n: N) => Math.max(n.r + 10, labelHalf(n)) + 8;

  /* ---------- Układ siłowy. Pełny raz na starcie, potem przeliczany dla tego, co widać ---------- */
  let sim: Simulation<N, L>;
  function forces(simulation: Simulation<N, L>, ticks: number) {
    const lk = simulation.force<ForceLink<N, L>>('link')!;
    simulation
      .force('charge', forceManyBody<N>().strength((d) => -500 - 160 * Math.sqrt(d.degree)).distanceMax(900))
      .force('collide', forceCollide<N>(collideR).strength(0.9).iterations(2))
      .force('x', forceX<N>(0).strength(0.03))
      .force('y', forceY<N>(0).strength(0.05))
      .stop();
    lk.distance((l) => 70 + nodeOf(l.source).r + nodeOf(l.target).r + (pairCat(l.edges) === 'law' ? 90 : 30))
      .strength((l) => 0.5 / Math.min(nodeOf(l.source).degree, nodeOf(l.target).degree));
    for (let i = 0; i < ticks; i++) simulation.tick();
    return simulation;
  }
  function layoutAll() {
    sim = forces(forceSimulation<N, L>(nodes).force('link', forceLink<N, L>(links).id((d) => d.id)), 900);
    sim.on('tick', ticked);
  }
  function relayout() {
    sim.stop();
    const vn = nodes.filter((n) => shownSet.has(n.id));
    const vl = links.filter((l) => l.visible.length);
    sim = forces(forceSimulation<N, L>(vn).force('link', forceLink<N, L>(vl).id((d) => d.id)), 320);
    sim.on('tick', ticked);
    ticked();
    fit(true);
  }
  function pairCat(es: E[]): CatKey {
    const cats = new Set(es.map((e) => e.cat));
    return CAT_KEYS.find((c) => cats.has(c)) ?? 'structure';
  }

  /* ---------- Rysowanie ---------- */
  const root = svg.append('g');
  let linkSel: Selection<SVGGElement, L, SVGGElement, unknown>;
  let nodeSel: Selection<SVGGElement, N, SVGGElement, unknown>;
  // Gesty jak w mapach: poza pełnym ekranem jeden palec i samo kółko przewijają stronę; graf przesuwają i przybliżają
  // dwa palce, Ctrl/⌘ + kółko (też gest szczypania na gładziku), przeciąganie myszą, dwuklik, suwak i przyciski.
  const isFull = () => host.classList.contains('is-full');
  function zoomFilter(e: Event) {
    const m = e as MouseEvent;
    if (isFull()) return (!m.ctrlKey || e.type === 'wheel') && !m.button;
    if (e.type === 'wheel') {
      if (m.ctrlKey || m.metaKey) return true;
      gestureToast(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ + kółko przybliża graf' : 'Ctrl + kółko przybliża graf');
      return false;
    }
    if (e.type.startsWith('touch')) return (e as TouchEvent).touches.length >= 2;
    return !m.button && !m.ctrlKey;
  }
  const zoom: ZoomBehavior<SVGSVGElement, unknown> = d3zoom<SVGSVGElement, unknown>().scaleExtent([0.25, 3]).filter(zoomFilter).on('zoom', (e) => {
    root.attr('transform', e.transform.toString());
    root.classed('zoomed-out', e.transform.k < 0.55);
    root.classed('zoomed-in', e.transform.k >= 0.9);
    if (e.sourceEvent) camera = { mode: 'free' };
    syncZoomControls(e.transform.k);
  });

  function draw() {
    // Dwuklik w puste miejsce (albo na linii): ×2 w punkcie kliknięcia, z Shiftem ×½. Dwuklik na węźle — niżej.
    svg.call(zoom).on('dblclick.zoom', function (this: SVGSVGElement, e: MouseEvent | TouchEvent) {
      e.preventDefault();
      const src = 'changedTouches' in e ? e.changedTouches[0] : e;
      const p = pointer(src, this);
      camera = { mode: 'free' };
      zoomBy(e.shiftKey ? 0.5 : 2, p);
    });
    // Klik w tło odznacza dopiero po chwili: druga połowa dwukliku (detail 2) przybliża i nie gubi zaznaczenia.
    let deselect = 0;
    svg.on('click', (e: MouseEvent) => {
      if (e.target !== svgEl) return;
      clearTimeout(deselect);
      if (e.detail < 2) deselect = window.setTimeout(() => select_(null), 260);
    });

    linkSel = root.append('g').selectAll<SVGGElement, L>('g').data(links).join('g')
      .attr('class', 'link')
      .on('click', (e: MouseEvent, l) => { e.stopPropagation(); select_({ pair: l.key }); })
      .on('mouseenter', (_e, l) => highlight({ pair: l.key }, true))
      .on('mouseleave', () => highlight(selected));
    linkSel.append('path').attr('class', 'hit');
    linkSel.append('path').attr('class', 'vis');
    // Głos jak w półkolu na stronie: za = pełne kółko, przeciw = pierścień, wstrzymał się = mała kropka.
    linkSel.filter((l) => l.edges.some((e) => e.kind === 'vote')).append('circle')
      .each(function (l) {
        const v = l.edges.find((e) => e.kind === 'vote')!.vote;
        select(this).attr('class', `vote vote-${(v || '').toLowerCase()}`).attr('r', v === 'ABSTAIN' ? 2.2 : 4.5);
      });
    const badge = linkSel.append('g').attr('class', 'badge');
    badge.append('rect').attr('x', -9).attr('y', -9).attr('width', 18).attr('height', 18);
    badge.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em');

    nodeSel = root.append('g').selectAll<SVGGElement, N>('g').data(nodes).join('g')
      .attr('class', (d) => `node node--${d.type}${d.hub ? ' is-hub' : ''}${bridges.has(d.id) ? ' is-bridge' : ''}`)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${TYPE_LABEL[d.type]}: ${d.name}${d.party ? ', ' + partyText(d.party) : ''}`)
      .on('click', (e: MouseEvent, d) => {
        e.stopPropagation();
        // Shift+klik drugiej osoby: porównanie z zaznaczoną (albo z pierwszą osobą otwartego porównania).
        if (e.shiftKey && d.type === 'person') {
          const first = state.an?.t === 'cmp' ? state.an.a
            : (selected && 'node' in selected ? selected.node : '') || (state.an?.t === 'menu' ? draft.cmpA : '');
          if (first && first !== d.id && byId.get(first)?.type === 'person') return setAnalysis({ t: 'cmp', a: first, b: d.id });
        }
        select_({ node: d.id });
      })
      // Dwuklik na węźle: ten sam wybór co klik, do tego przybliżenie i wyśrodkowanie.
      .on('dblclick', (e: MouseEvent, d) => {
        e.stopPropagation();
        e.preventDefault();
        const [, k1] = zoom.scaleExtent();
        centerOn(d, true, Math.min(k1, Math.max(1.1, zoomTransform(svgEl).k * 2)));
      })
      .on('keydown', (e: KeyboardEvent, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select_({ node: d.id }); } })
      .on('mouseenter focus', (_e, d) => highlight({ node: d.id }, true))
      .on('mouseleave blur', () => highlight(selected))
      .call(drag<SVGGElement, N>()
        // Przestawianie węzłów palcem tylko na pełnym ekranie (poza nim palec przewija stronę); myszą zawsze.
        .filter((e: MouseEvent | TouchEvent) => ('touches' in e ? isFull() : !e.button && !e.ctrlKey))
        .on('start', (e: D3DragEvent<SVGGElement, N, N>, d) => { if (!e.active) sim.alphaTarget(0.12).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e: D3DragEvent<SVGGElement, N, N>, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e: D3DragEvent<SVGGElement, N, N>, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    const square = (sel: Selection<SVGGElement, N, SVGGElement, unknown>, pad: number, cls: string) => sel.append('rect').attr('class', cls)
      .attr('x', (d) => -d.r - pad).attr('y', (d) => -d.r - pad).attr('width', (d) => 2 * (d.r + pad)).attr('height', (d) => 2 * (d.r + pad));

    // Huby: delikatna poświata i migocąca czteroramienna gwiazda pod węzłem, ramka w odstępie i podpis z liczbą sąsiadów.
    const hubs = nodeSel.filter((d) => !!d.hub);
    const spark = (r: number) => { const w = r * 0.16; return `M0,${-r}L${w},${-w}L${r},0L${w},${w}L0,${r}L${-w},${w}L${-r},0L${-w},${-w}Z`; };
    hubs.insert('circle', ':first-child').attr('class', 'star-glow').attr('r', (d) => d.r + 22);
    hubs.insert('path', ':first-child').attr('class', 'star-spark').attr('d', (d) => spark(d.r + 40))
      .style('animation-delay', (_d, i) => `${-i * 1.7}s`);
    square(hubs.filter((d) => d.type !== 'person'), 5, 'hub-mark');
    hubs.filter((d) => d.type === 'person').append('circle').attr('class', 'hub-mark').attr('r', (d) => d.r + 5);
    hubs.append('text').attr('class', 't-hub halo').attr('text-anchor', 'middle')
      .attr('y', (d) => -d.r - 12).text((d) => `HUB · ${d.degree}`);

    const inst = nodeSel.filter((d) => d.type === 'institution');
    square(inst, 6, 'ring');
    square(inst, 0, 'shape shape--inst');
    inst.append('text').attr('class', 't-short').attr('text-anchor', 'middle').attr('dy', '0.35em').text((d) => d.short ?? '');
    inst.append('text').attr('class', 't-label halo lbl').attr('text-anchor', 'middle').attr('y', (d) => d.r + 18).text((d) => d.name);

    const acts = nodeSel.filter((d) => d.type === 'act');
    square(acts, 6, 'ring');
    square(acts, 0, 'shape shape--act');
    acts.append('text').attr('class', 't-act').attr('text-anchor', 'middle').attr('dy', '0.35em').text((d) => d.short ?? '');
    acts.append('text').attr('class', 't-label halo lbl').attr('text-anchor', 'middle').attr('y', (d) => d.r + 18).text((d) => d.name);

    const bodies = nodeSel.filter((d) => d.type === 'body');
    square(bodies, 6, 'ring');
    square(bodies, 0, 'shape shape--body');
    bodies.append('text').attr('class', 't-label halo lbl').attr('text-anchor', 'middle').attr('y', (d) => d.r + 16).text((d) => d.name);

    // Podmiot (spółka, szpital, fundacja): kwadrat jak organ, ale szary i obrócony — inny kształt, nie tylko kolor.
    const ents = nodeSel.filter((d) => d.type === 'entity');
    square(ents, 6, 'ring');
    square(ents, 0, 'shape shape--entity').attr('transform', 'rotate(45)');
    ents.append('text').attr('class', 't-label halo lbl').attr('text-anchor', 'middle').attr('y', (d) => d.r + 18).text((d) => d.name);

    const people = nodeSel.filter((d) => d.type === 'person');
    people.append('circle').attr('class', 'ring').attr('r', (d) => d.r + 7);
    people.filter((d) => !!d.charges?.length).append('circle').attr('class', 'charge-ring').attr('r', (d) => d.r + 7);
    people.append('circle').attr('class', 'shape--person').attr('r', (d) => d.r);
    people.append('text').attr('class', 't-init').attr('text-anchor', 'middle').attr('dy', '0.35em').text((d) => initials(d.name));
    const lbl = people.append('g').attr('class', 'lbl');
    lbl.append('text').attr('class', 't-name halo').attr('text-anchor', 'middle').attr('y', (d) => d.r + 17).text((d) => d.name);
    // Partia: logo na białej plakietce (logotypy są robione pod białe tło); bez logo — skrót tekstem.
    const withLogo = lbl.filter((d) => !!logoSrc(d.party));
    const plaque = withLogo.append('g').attr('class', (d) => `party-logo${d.party!.former ? ' is-former' : ''}`)
      .attr('transform', (d) => `translate(0,${d.r + 23})`);
    plaque.append('rect').attr('x', -22).attr('width', 44).attr('height', 18);
    plaque.append('image').attr('x', -20).attr('y', 1).attr('width', 40).attr('height', 16)
      .attr('preserveAspectRatio', 'xMidYMid meet').attr('href', (d) => logoSrc(d.party)!);
    plaque.filter((d) => !!d.party!.former).append('text').attr('class', 't-party halo').attr('x', 26).attr('y', 13).text('dawniej');
    plaque.append('title').text((d) => partyText(d.party));
    lbl.filter((d) => !!d.party && !logoSrc(d.party)).append('text').attr('class', 't-party halo')
      .attr('text-anchor', 'middle').attr('y', (d) => d.r + 31).text((d) => partyText(d.party));

    // Licznik ukrytych osób: „+N” w rogu instytucji, organu albo ustawy. Klik rozwija.
    const more = nodeSel.filter((d) => d.type !== 'person').append('g').attr('class', 'more')
      .attr('transform', (d) => `translate(${d.r + 2},${-d.r - 2})`)
      .on('click', (e: MouseEvent, d) => { e.stopPropagation(); if (e.detail < 2) toggleExpand(d.id); });
    more.append('rect').attr('x', -2).attr('y', -9).attr('height', 17);
    more.append('text').attr('x', 4).attr('dy', '0.32em');

    ticked();
  }

  function ticked() {
    linkSel.each(function (l) {
      if (!l.visible.length) return;
      const s = l.source, t = l.target;
      if (typeof s !== 'object' || typeof t !== 'object' || s.x == null || t.x == null || s.y == null || t.y == null) return;
      const curved = s.type === 'person' && t.type === 'person';
      const dx = t.x - s.x, dy = t.y - s.y;
      const cx = (s.x + t.x) / 2 - dy * 0.15, cy = (s.y + t.y) / 2 + dx * 0.15;
      const d = curved ? `M${s.x},${s.y}Q${cx},${cy} ${t.x},${t.y}` : `M${s.x},${s.y}L${t.x},${t.y}`;
      const mx = curved ? 0.25 * s.x + 0.5 * cx + 0.25 * t.x : (s.x + t.x) / 2;
      const my = curved ? 0.25 * s.y + 0.5 * cy + 0.25 * t.y : (s.y + t.y) / 2;
      this.querySelector('.hit')!.setAttribute('d', d);
      this.querySelector('.vis')!.setAttribute('d', d);
      this.querySelector('.badge')!.setAttribute('transform', `translate(${mx},${my})`);
      const v = this.querySelector('.vote');
      if (v) {
        // Znak głosu przy osobie, tuż za jej kółkiem.
        const [p, a] = s.type === 'person' ? [s, t] : [t, s];
        const len = Math.hypot(a.x! - p.x!, a.y! - p.y!) || 1;
        const off = p.r + 11;
        v.setAttribute('cx', String(p.x! + (a.x! - p.x!) * off / len));
        v.setAttribute('cy', String(p.y! + (a.y! - p.y!) * off / len));
      }
    });
    nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
  }

  /* ---------- Co widać: widok, rdzeń, rozwinięte węzły, instytucje, filtry linii ---------- */
  function baseSet() {
    let set: Set<string>;
    if (state.view) set = new Set(state.view.nodes);
    else if (state.mode === 'all') set = new Set(nodes.map((n) => n.id));
    else {
      set = new Set(nodes.filter((n) => n.type !== 'person' || bridges.has(n.id)).map((n) => n.id));
      for (const e of edges) {
        if (state.expanded.has(e.to) && byId.get(e.from)?.type === 'person') set.add(e.from);
        if (state.expanded.has(e.from) && byId.get(e.to)?.type === 'person') set.add(e.to);
      }
    }
    if (state.inst.size && !state.view) {
      for (const id of [...set]) {
        const n = byId.get(id);
        if (!n || n.type === 'act') continue;
        if (![...clustersOf(n)].some((x) => x && state.inst.has(x))) set.delete(id);
      }
    }
    state.pinned.forEach((id) => set.add(id));
    return set;
  }

  const edgeOk = (e: E) => activeCat.has(e.cat)
    && (e.kind === 'part' || activeStatus.has(e.status))
    && !(state.currentOnly && e.until && e.until < data.asOf);

  function hiddenPeople(id: string) {
    const out = new Set<string>();
    for (const e of edges) {
      const other = e.from === id ? e.to : e.to === id ? e.from : null;
      if (other && byId.get(other)?.type === 'person' && !shownSet.has(other)) out.add(other);
    }
    return out;
  }

  function applyFilter(layoutAgain = true) {
    // Wynik analizy (ścieżka, otoczenie, porównanie, źródło) dokłada swoje węzły — także spoza rdzenia i widoku.
    focus = computeFocus();
    let set = baseSet();
    if (focus?.hideRest) set = new Set([...focus.nodes, ...state.pinned]);
    else focus?.nodes.forEach((id) => set.add(id));
    for (const l of links) {
      l.visible = set.has(idOf(l.source)) && set.has(idOf(l.target)) ? l.edges.filter((e) => edgeOk(e) || focus?.forced.has(e)) : [];
    }
    shownSet = new Set(links.filter((l) => l.visible.length).flatMap((l) => [idOf(l.source), idOf(l.target)]));
    state.pinned.forEach((id) => shownSet.add(id));
    focus?.nodes.forEach((id) => shownSet.add(id));
    nodeSel.style('display', (d) => (shownSet.has(d.id) ? '' : 'none'));
    nodeSel.classed('is-end', (d) => !!focus?.ends.has(d.id));
    nodeSel.classed('is-label', (d) => !!focus?.labels.has(d.id));
    linkSel.classed('is-hit', (l) => !!focus?.hits.has(l.key));
    root.classed('mode-all', state.mode === 'all' && !state.view);

    linkSel.each(function (l) {
      const vis = l.visible;
      const g = select(this);
      g.style('display', vis.length ? '' : 'none');
      if (!vis.length) return;
      const best = vis.reduce((a, e) => (STATUS[e.status].rank > STATUS[a.status].rank ? e : a));
      const st = STATUS[best.status];
      g.select('.vis')
        .style('stroke', CAT[pairCat(vis)].color)
        .style('stroke-width', best.kind === 'part' ? 1 : st.width)
        .style('stroke-dasharray', best.kind === 'part' || !st.dash ? '' : st.dash)
        .style('stroke-linecap', best.status === 'media' ? 'round' : '');
      const n = vis.filter((e) => e.kind !== 'part').length;
      g.select('.badge').style('display', n > 1 ? '' : 'none').select('text').text(n);
    });

    // Liczniki „+N” tylko w rdzeniu (w widoku i w trybie „wszyscy” nie ma czego rozwijać).
    nodeSel.select<SVGGElement>('.more').each(function (d) {
      const hidden = !state.view && state.mode === 'core' ? hiddenPeople(d.id).size : 0;
      const open = state.expanded.has(d.id);
      const g = select(this).style('display', hidden || open ? '' : 'none');
      const label = open ? '−' : `+${hidden}`;
      g.select('text').text(label);
      g.select('rect').attr('width', label.length * 6.6 + 10);
      g.attr('aria-label', open ? 'Zwiń osoby' : `Pokaż ${hidden} ukrytych osób`);
    });

    syncToolbar();
    if (selected && 'node' in selected && !shownSet.has(selected.node)) selected = null;
    if (layoutAgain) relayout();
    highlight(selected);
    render();
    scheduleCommit();
  }

  function toggleExpand(id: string) {
    state.expanded.has(id) ? state.expanded.delete(id) : state.expanded.add(id);
    applyFilter();
  }

  function openView(id: string) {
    state.view = data.views.find((v) => v.id === id) || null;
    state.pinned.clear();
    $<HTMLInputElement>('search').value = '';
    selected = null;
    applyFilter();
  }

  /* ---------- Pasek narzędzi ---------- */
  function setupToolbar() {
    const insts = $('insts');
    for (const n of nodes.filter((x) => x.type === 'institution')) {
      insts.insertAdjacentHTML('beforeend', `<button class="chip" type="button" data-inst="${esc(n.id)}" title="${esc(n.name)}" aria-pressed="false">${esc(n.short)}</button>`);
    }
    insts.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-inst]');
      if (!b) return;
      const id = b.dataset.inst!;
      state.inst.has(id) ? state.inst.delete(id) : state.inst.add(id);
      state.view = null;
      applyFilter();
    });
    host.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      state.mode = b.dataset.mode as 'core' | 'all';
      state.view = null;
      applyFilter();
    }));
    $<HTMLInputElement>('current').addEventListener('change', (e) => { state.currentOnly = (e.target as HTMLInputElement).checked; applyFilter(); });
    $('viewbar-close').addEventListener('click', () => {
      if (state.an && AN_GRAPH.has(state.an.t)) return setAnalysis(null);
      state.view = null; selected = null; applyFilter();
    });
    $('an-toggle').addEventListener('click', () => setAnalysis(state.an ? null : { t: 'menu' }));

    const search = $<HTMLInputElement>('search');
    // Nazwa węzła (z podpowiedzi albo wpisana — bez względu na wielkość liter i polskie znaki) otwiera węzeł;
    // inny tekst po Enterze — wyniki w panelu: osoby, treść faktów, źródła.
    const go = (enter: boolean) => {
      const q = search.value.trim();
      if (!q) return;
      const ql = Analiza.fold(q);
      const n = nodes.find((x) => Analiza.fold(x.name) === ql || (!!x.short && Analiza.fold(x.short) === ql));
      if (n) return goNode(n);
      if (enter) setAnalysis({ t: 'search', q, tab: '' });
    };
    search.addEventListener('change', () => go(false));
    search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(true); } });
    setupSuggest();
  }

  /* ---------- Podpowiedzi w polach wyszukiwania (własna lista zamiast <datalist>) ----------
     Działa dla pola „Szukaj” i pól formularzy analizy (`data-suggest="node|person"`). Dopasowanie bez wielkości liter
     i polskich znaków, każde słowo osobno; najpierw nazwy zaczynające się od wpisanego tekstu, potem huby. */
  function setupSuggest() {
    const box = document.createElement('ul');
    box.className = 'kst-suggest';
    box.id = 'kst-suggest';
    box.setAttribute('role', 'listbox');
    box.hidden = true;
    host.append(box);
    const index = nodes.map((n) => {
      const f = Analiza.fold(`${n.name} ${n.short ?? ''}`);
      return { n, f, words: f.split(/[^\p{L}\p{N}]+/u).filter(Boolean) };
    });
    let input: HTMLInputElement | null = null;
    let items: N[] = [];
    let active = -1;
    const isField = (t: EventTarget | null): t is HTMLInputElement =>
      t instanceof HTMLInputElement && (t.id === 'kst-search' || !!t.dataset.suggest);
    const mark = (name: string, q: string) => {
      // Podświetlenie od początku słowa (tam, gdzie zaczyna się dopasowanie).
      const f = Analiza.fold(name);
      const i = !q ? -1 : f.startsWith(q) ? 0 : f.search(new RegExp(`[^\\p{L}\\p{N}]${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u')) + 1 || -1;
      return i < 0 ? esc(name) : `${esc(name.slice(0, i))}<mark>${esc(name.slice(i, i + q.length))}</mark>${esc(name.slice(i + q.length))}`;
    };
    const meta = (n: N) => (n.type === 'person' ? n.party?.name ?? 'osoba' : TYPE_SHORT[n.type] ?? '');
    const close = () => {
      box.hidden = true;
      active = -1;
      input?.setAttribute('aria-expanded', 'false');
      input?.removeAttribute('aria-activedescendant');
    };
    const place = () => {
      if (!input) return;
      const r = input.getBoundingClientRect();
      box.style.left = `${Math.max(8, Math.min(r.left, innerWidth - 288))}px`;
      box.style.top = `${r.bottom + 2}px`;
      box.style.width = `${Math.max(r.width, 280)}px`;
    };
    const render = () => {
      if (!input) return;
      const q = Analiza.fold(input.value.trim());
      if (!q) return close();
      const words = q.split(/\s+/).filter(Boolean);
      const onlyPeople = input.dataset.suggest === 'person';
      items = index
        // Każde wpisane słowo musi być początkiem któregoś słowa nazwy („kow” → Kowalczuk, nie „medyków”).
        .filter(({ n, words: ws }) => (!onlyPeople || n.type === 'person') && words.every((w) => ws.some((x) => x.startsWith(w))))
        .sort((a, b) => Number(!a.f.startsWith(q)) - Number(!b.f.startsWith(q)) || b.n.degree - a.n.degree
          || a.n.name.localeCompare(b.n.name, 'pl'))
        .slice(0, 8)
        .map((x) => x.n);
      if (!items.length) return close();
      active = Math.min(active, items.length - 1);
      box.innerHTML = items.map((n, i) => `<li id="kst-sg-${i}" role="option" aria-selected="${i === active}" data-i="${i}">
        <span class="nm">${mark(n.name, words[0])}</span><span class="tp">${esc(meta(n))}</span></li>`).join('');
      place();
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (active >= 0) input.setAttribute('aria-activedescendant', `kst-sg-${active}`);
      else input.removeAttribute('aria-activedescendant');
    };
    const pick = (n: N) => {
      if (!input) return;
      input.value = n.name;
      close();
      if (input.id === 'kst-search') { input.blur(); goNode(n); }
    };
    host.addEventListener('focusin', (e) => { if (isField(e.target)) { input = e.target; render(); } });
    host.addEventListener('input', (e) => { if (isField(e.target)) { input = e.target; active = -1; render(); } });
    host.addEventListener('focusout', (e) => { if (e.target === input) setTimeout(() => { if (document.activeElement !== input) close(); }, 120); });
    // Faza przechwytywania: strzałki i Enter w liście obsługujemy, zanim zadziała Enter pola (wyszukiwanie, wysłanie formularza).
    host.addEventListener('keydown', (e) => {
      if (!isField(e.target) || e.target !== input) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (box.hidden) render();
        if (!items.length || box.hidden) return;
        active = e.key === 'ArrowDown' ? (active + 1) % items.length : (active <= 0 ? items.length : active) - 1;
        render();
        box.querySelector(`#kst-sg-${active}`)?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && !box.hidden && active >= 0) {
        e.preventDefault();
        e.stopPropagation();
        pick(items[active]);
      } else if (e.key === 'Escape' && !box.hidden) {
        e.stopPropagation();
        close();
      }
    }, true);
    box.addEventListener('mousedown', (e) => {
      e.preventDefault(); // pole nie traci fokusu przed wyborem
      const li = (e.target as Element).closest<HTMLElement>('li[data-i]');
      if (li) pick(items[+li.dataset.i!]);
    });
    addEventListener('resize', () => { if (!box.hidden) place(); });
    addEventListener('scroll', () => { if (!box.hidden) place(); }, { passive: true });
  }

  function goNode(n: N) {
    if (state.view && !state.view.nodes.includes(n.id)) state.view = null;
    if (!baseSet().has(n.id) && !focus?.nodes.has(n.id)) state.pinned.add(n.id);
    selected = { node: n.id };
    applyFilter();
    nodeSel.classed('is-selected', (d) => d.id === n.id);
    centerOn(n);
  }

  function syncToolbar() {
    host.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => {
      const on = !state.view && b.dataset.mode === state.mode;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    host.querySelectorAll<HTMLElement>('[data-inst]').forEach((b) => {
      const on = state.inst.has(b.dataset.inst!);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    // Pasek nad grafem: wynik analizy ma pierwszeństwo przed widokiem (po zamknięciu wraca widok).
    const vb = $('viewbar');
    const anBar = state.an && AN_GRAPH.has(state.an.t) ? anTitle(state.an) : '';
    vb.classList.toggle('is-on', !!(anBar || state.view));
    vb.querySelector('.mono-label')!.textContent = anBar && state.an ? AN_NAME[state.an.t] : 'Widok';
    $('viewbar-title').textContent = anBar || (state.view?.title ?? '');
    const at = $('an-toggle');
    at.classList.toggle('is-on', !!state.an);
    at.setAttribute('aria-pressed', String(!!state.an));
    if (state.an?.t === 'search') $<HTMLInputElement>('search').value = state.an.q;
    // Po powrocie w historii pola muszą pokazać odtworzony stan.
    $<HTMLInputElement>('current').checked = state.currentOnly;
    legendBody.querySelectorAll<HTMLInputElement>('[data-cat]').forEach((i) => { i.checked = activeCat.has(i.dataset.cat as CatKey); });
    legendBody.querySelectorAll<HTMLInputElement>('[data-status]').forEach((i) => { i.checked = activeStatus.has(i.dataset.status as Status); });
  }

  /* ---------- Zaznaczenie i podświetlenie ---------- */
  function neighbours(id: string) {
    const set = new Set([id]);
    for (const l of links) {
      if (!l.visible.length) continue;
      if (idOf(l.source) === id) set.add(idOf(l.target));
      if (idOf(l.target) === id) set.add(idOf(l.source));
    }
    return set;
  }

  // Przy otwartym wyniku analizy graf pokazuje ten wynik, a zaznaczenie dokłada tylko pierścień.
  // Najechanie (hover) chwilowo pokazuje sąsiadów węzła albo parę, jak bez analizy.
  function highlight(sel: Sel, hover = false) {
    if (focus && !hover && !(sel && 'party' in sel)) {
      const f = focus;
      nodeSel.classed('dim', (d) => !f.nodes.has(d.id));
      linkSel.classed('dim', (l) => !f.links.has(l.key));
    } else if (!sel) {
      nodeSel.classed('dim', false);
      linkSel.classed('dim', false);
    } else if ('node' in sel) {
      const nb = neighbours(sel.node);
      nodeSel.classed('dim', (d) => !nb.has(d.id));
      linkSel.classed('dim', (l) => idOf(l.source) !== sel.node && idOf(l.target) !== sel.node);
    } else if ('pair' in sel) {
      const l0 = linkByKey(sel.pair)!;
      nodeSel.classed('dim', (d) => d.id !== idOf(l0.source) && d.id !== idOf(l0.target));
      linkSel.classed('dim', (l) => l.key !== sel.pair);
    } else {
      const inParty = (d: N) => d.party?.name === sel.party;
      nodeSel.classed('dim', (d) => !inParty(d));
      linkSel.classed('dim', (l) => !inParty(nodeOf(l.source)) && !inParty(nodeOf(l.target)));
    }
    const party = sel && 'party' in sel ? sel.party : null;
    legendBody.querySelectorAll<HTMLElement>('.party').forEach((b) => b.classList.toggle('is-on', b.dataset.party === party));
  }

  // select_ (z podkreśleniem) — `select` to funkcja d3-selection.
  function select_(sel: Sel) {
    selected = sel;
    nodeSel.classed('is-selected', (d) => !!sel && 'node' in sel && sel.node === d.id);
    linkSel.classed('is-selected', (l) => !!sel && 'pair' in sel && sel.pair === l.key);
    highlight(sel);
    render();
    scheduleCommit();
  }

  /* ---------- Historia: stan w adresie (#v=…&n=…), wstecz i dalej ----------
     Każda zmiana tego, na co się patrzy (zaznaczenie, widok, tryb, filtry, „+N”), to jeden wpis
     history.pushState. Kilka wywołań select/applyFilter w jednym kliknięciu daje jeden wpis (mikrozadanie),
     ten sam stan nie daje nowego. Ruch kamery i przeciąganie węzłów nie są historią. */
  interface Snap {
    view: string | null; sel: Sel; mode: 'core' | 'all'; inst: string[]; cur: boolean; exp: string[]; pin: string[]; off: string[];
    an: An | null; aopt: { pewne: boolean; przez: boolean };
  }
  let histIdx = 0, histTop = 0, histHash = '', histReady = false, restoring = false, commitQueued = false;

  function snapshot(): Snap {
    const sorted = (s: Set<string>) => [...s].sort();
    return {
      view: state.view?.id ?? null,
      sel: selected,
      mode: state.mode,
      inst: sorted(state.inst),
      cur: state.currentOnly,
      exp: sorted(state.expanded),
      pin: sorted(state.pinned),
      off: [...CAT_KEYS.filter((k) => !activeCat.has(k)), ...STATUS_KEYS.filter((k) => !activeStatus.has(k))],
      an: state.an ? { ...state.an } : null,
      aopt: { ...state.aopt },
    };
  }
  // To, co decyduje o zbiorze węzłów na grafie (bez zaznaczenia) — zmiana wymaga nowego układu.
  const filterKey = (s: Snap) => JSON.stringify([s.view, s.mode, s.inst, s.cur, s.exp, s.pin, s.off, anGraphKey(s.an, s.aopt)]);

  function encodeHash(s: Snap) {
    const enc = encodeURIComponent, list = (a: string[]) => a.map(enc).join(',');
    // Zaznaczony węzeł przypina się sam przy odtwarzaniu, więc nie powtarzamy go w „dodane”.
    const selNode = s.sel && 'node' in s.sel ? s.sel.node : null;
    const pin = s.pin.filter((id) => id !== selNode);
    const parts: string[] = [];
    if (s.view) parts.push(`v=${enc(s.view)}`);
    if (s.sel && 'node' in s.sel) parts.push(`n=${enc(s.sel.node)}`);
    else if (s.sel && 'pair' in s.sel) parts.push(`p=${s.sel.pair.split('|').map(enc).join('|')}`);
    else if (s.sel && 'party' in s.sel) parts.push(`k=${enc(s.sel.party)}`);
    if (s.mode === 'all') parts.push('tryb=wszyscy');
    if (s.inst.length) parts.push(`inst=${list(s.inst)}`);
    if (s.cur) parts.push('obecne=1');
    if (s.exp.length) parts.push(`rozwin=${list(s.exp)}`);
    if (pin.length) parts.push(`dodane=${list(pin)}`);
    if (s.off.length) parts.push(`ukryj=${list(s.off)}`);
    const an = s.an;
    if (an?.t === 'menu') parts.push('analiza=1');
    else if (an?.t === 'path') parts.push(`sciezka=${list([an.a, an.b])}`, ...(an.alt ? ['wariant=2'] : []));
    else if (an?.t === 'hood') parts.push(`otoczenie=${enc(an.id)},${an.d}`, ...(an.hide ? ['reszta=ukryj'] : []));
    else if (an?.t === 'cmp') parts.push(`porownaj=${list([an.a, an.b])}`);
    else if (an?.t === 'src') parts.push(`zrodlo=${enc(an.id)}`);
    else if (an?.t === 'pub') parts.push(`wydawca=${enc(an.name)}`);
    else if (an?.t === 'srcs') parts.push('zrodla=1');
    else if (an?.t === 'bridges') parts.push(`mosty=${an.tab || 'osoby'}`, ...(an.sort ? [`sort=${enc(an.sort)}`] : []));
    else if (an?.t === 'search') parts.push(`szukaj=${enc(an.q)}`, ...(an.tab ? [`w=${enc(an.tab)}`] : []));
    if (an && s.aopt.pewne) parts.push('pewne=1');
    if (an && s.aopt.przez) parts.push('przez=instytucje');
    return parts.length ? `#${parts.join('&')}` : '';
  }

  function decodeHash(hash: string): Snap {
    const q = new Map<string, string>();
    for (const part of hash.replace(/^#/, '').split('&')) {
      const i = part.indexOf('=');
      if (i < 1) continue;
      try { q.set(part.slice(0, i), decodeURIComponent(part.slice(i + 1))); } catch { /* zepsuty zapis — pomijamy */ }
    }
    const list = (k: string) => (q.get(k) || '').split(',').filter(Boolean);
    const pair = (k: string) => { const v = list(k); return v.length === 2 ? v : null; };
    let an: An | null = null;
    const pth = pair('sciezka'), cmp = pair('porownaj');
    if (pth) an = { t: 'path', a: pth[0], b: pth[1], alt: q.get('wariant') === '2' ? 1 : 0 };
    else if (q.get('otoczenie')) { const [id, d] = list('otoczenie'); an = { t: 'hood', id, d: +d, hide: q.get('reszta') === 'ukryj' }; }
    else if (cmp) an = { t: 'cmp', a: cmp[0], b: cmp[1] };
    else if (q.get('zrodlo')) an = { t: 'src', id: q.get('zrodlo')! };
    else if (q.get('wydawca')) an = { t: 'pub', name: q.get('wydawca')! };
    else if (q.get('zrodla')) an = { t: 'srcs' };
    else if (q.get('mosty')) an = { t: 'bridges', tab: q.get('mosty')!, sort: q.get('sort') || '' };
    else if (q.get('szukaj')) an = { t: 'search', q: q.get('szukaj')!, tab: q.get('w') || '' };
    else if (q.get('analiza')) an = { t: 'menu' };
    return {
      view: q.get('v') || null,
      sel: q.get('n') ? { node: q.get('n')! } : q.get('p') ? { pair: q.get('p')! } : q.get('k') ? { party: q.get('k')! } : null,
      mode: q.get('tryb') === 'wszyscy' ? 'all' : 'core',
      inst: list('inst'),
      cur: q.get('obecne') === '1',
      exp: list('rozwin'),
      pin: list('dodane'),
      off: list('ukryj'),
      an,
      aopt: { pewne: q.get('pewne') === '1', przez: q.get('przez') === 'instytucje' },
    };
  }

  const urlFor = (hash: string) => hash || location.pathname + location.search;
  function saveTop() {
    try { sessionStorage.setItem(HIST_KEY, String(histTop)); } catch { /* bez pamięci karty przycisk „dalej” po odświeżeniu bywa wyłączony */ }
  }
  function syncHistButtons() {
    $<HTMLButtonElement>('hist-back').disabled = histIdx <= 0;
    $<HTMLButtonElement>('hist-fwd').disabled = histIdx >= histTop;
  }
  function scheduleCommit() {
    if (!histReady || restoring || commitQueued) return;
    commitQueued = true;
    queueMicrotask(() => { commitQueued = false; commit(); });
  }
  function commit() {
    const hash = encodeHash(snapshot());
    if (hash === histHash) return;
    histHash = hash;
    histTop = ++histIdx;
    saveTop();
    history.pushState({ kst: histIdx }, '', urlFor(hash));
    syncHistButtons();
  }

  // Odtwarza stan z wpisu historii albo z adresu — bez nowego wpisu; nieznane identyfikatory pomija.
  function restore(s: Snap, { animate = true, layout = false } = {}) {
    restoring = true;
    let changed = false;
    try {
      const before = filterKey(snapshot());
      state.view = data.views.find((v) => v.id === s.view) || null;
      state.mode = s.mode;
      state.inst = new Set(s.inst.filter((id) => byId.get(id)?.type === 'institution'));
      state.currentOnly = s.cur;
      state.expanded = new Set(s.exp.filter((id) => byId.has(id)));
      state.pinned = new Set(s.pin.filter((id) => byId.has(id)));
      activeCat.clear();
      CAT_KEYS.filter((k) => !s.off.includes(k)).forEach((k) => activeCat.add(k));
      activeStatus.clear();
      STATUS_KEYS.filter((k) => !s.off.includes(k)).forEach((k) => activeStatus.add(k));
      state.aopt = { pewne: !!s.aopt?.pewne, przez: !!s.aopt?.przez };
      state.an = validAn(s.an);
      syncDraft(state.an);

      let want = s.sel;
      if (want && 'node' in want && !byId.has(want.node)) want = null;
      if (want && 'pair' in want) {
        const [a, b] = want.pair.split('|');
        want = a && b && linkByKey(pairKey(a, b)) ? { pair: pairKey(a, b) } : null;
      }
      if (want && 'party' in want) { const p = want.party; if (!nodes.some((n) => n.party?.name === p)) want = null; }
      selected = want;
      applyFilter(false);
      // Węzeł spoza tego, co widać (np. z wklejonego linku), dokładamy jak przy wyszukiwaniu.
      if (want && 'node' in want && !shownSet.has(want.node)) {
        state.pinned.add(want.node);
        selected = want;
        applyFilter(false);
      }
      if (want && 'pair' in want && !linkByKey(want.pair)!.visible.length) selected = null;

      changed = layout || filterKey(snapshot()) !== before;
      if (changed) relayout();
      select_(selected);
    } finally {
      restoring = false;
    }

    // Kamera: na zaznaczenie albo cały widok.
    const sel = selected as Sel;
    const l = sel && 'pair' in sel ? linkByKey(sel.pair) : null;
    const target = sel && 'node' in sel ? byId.get(sel.node)
      : l ? { x: (nodeOf(l.source).x! + nodeOf(l.target).x!) / 2, y: (nodeOf(l.source).y! + nodeOf(l.target).y!) / 2 } : null;
    if (target) centerOn(target, animate);
    else if (!changed) fit(animate);

    histHash = encodeHash(snapshot());
    history.replaceState({ kst: histIdx }, '', urlFor(histHash));
  }

  const histBack = () => { if (histIdx > 0) { history.back(); return true; } return false; };
  const histForward = () => { if (histIdx < histTop) { history.forward(); return true; } return false; };

  function setupHistory() {
    const st = history.state as { kst?: number } | null;
    const own = Number.isInteger(st?.kst);
    histIdx = own ? st!.kst! : 0;
    histTop = histIdx;
    if (own) {
      // Odświeżenie: wpisy „dalej” nadal są w przeglądarce, ich liczbę pamięta karta.
      try { histTop = Math.max(histIdx, Number(sessionStorage.getItem(HIST_KEY)) || 0); } catch { /* jw. */ }
    }
    saveTop();
    if (location.hash.length > 1) restore(decodeHash(location.hash), { animate: false, layout: true });
    else {
      applyFilter();
      histHash = '';
      history.replaceState({ kst: histIdx }, '', urlFor(''));
    }

    addEventListener('popstate', (e) => {
      const s = e.state as { kst?: number } | null;
      if (Number.isInteger(s?.kst)) histIdx = s!.kst!;
      else { histTop = ++histIdx; saveTop(); } // adres zmieniony ręcznie — przeglądarka dodała nowy wpis
      restore(decodeHash(location.hash));
      syncHistButtons();
    });
    $('hist-back').addEventListener('click', histBack);
    $('hist-fwd').addEventListener('click', histForward);
    // Skróty historii działają tylko w narzędziu (fokus w nim albo na samej stronie), nigdy w polu tekstowym.
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (t !== document.body && !host.contains(t)) return;
      const typing = t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName)
        || (t instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color'].includes(t.type));
      if (typing) return; // w polu tekstowym Alt+strzałka i Backspace edytują tekst
      let done = false;
      if (e.altKey && !e.shiftKey && e.key === 'ArrowLeft') done = histBack();
      else if (e.altKey && !e.shiftKey && e.key === 'ArrowRight') done = histForward();
      else if (e.key === 'Backspace' && !e.altKey && !e.shiftKey && host.contains(t)) done = histBack();
      if (done) e.preventDefault();
    });
    histReady = true;
    syncHistButtons();
  }

  /* ---------- Panel ---------- */
  function render() {
    const sel = selected;
    if (sel && 'node' in sel) return renderNode(byId.get(sel.node)!);
    if (sel && 'party' in sel) return renderParty(sel.party);
    if (sel && 'pair' in sel) return renderPair(linkByKey(sel.pair)!);
    if (state.an) return renderAnalysis();
    if (state.view) return renderView(state.view);
    return renderHome();
  }
  // Napis przycisku „wstecz” w panelu osoby i pary: wraca do analizy, widoku albo całego grafu.
  const backLabel = () => (state.an ? AN_NAME[state.an.t] : state.view ? 'Widok' : 'Cały graf');

  function flag(status?: Status) {
    if (!status || !STATUS[status]) return '';
    return `<span class="flag flag--${status}" title="${esc(STATUS[status].desc)}">${STATUS[status].label}</span>`;
  }

  function partyChip(p?: Party) {
    if (!p) return '';
    const title = p.former ? `dawniej ${p.name}${p.until ? ' (do ' + fmtDate(p.until) + ')' : ''}` : p.name;
    const src = logoSrc(p);
    const logo = src ? `<img src="${esc(src)}" alt="">` : '';
    return `<button class="party${p.former ? ' party--former' : ''}" type="button" data-party="${esc(p.name)}" title="${esc(title)}">${logo}${esc(partyText(p))}</button>`;
  }

  // Przy każdym źródle licznik faktów, które na nim stoją; klik otwiera indeks tego źródła.
  function sourcesHtml(ids?: string[]) {
    if (!ids?.length) return '';
    const items = ids.map((id) => {
      const s = data.sources[id];
      if (!s) return `<span>[brak źródła: ${esc(id)}]</span>`;
      const n = srcIndex.zrodlo(id)?.fakty.length ?? 0;
      const on = state.an?.t === 'src' && state.an.id === id;
      const count = n ? `<button class="src-n${on ? ' is-on' : ''}" type="button" data-src="${esc(id)}" title="Wszystkie fakty z tego źródła: ${n}" aria-label="Fakty z tego źródła: ${n}">${n}</button>` : '';
      return `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(s.publisher)}${s.date ? ', ' + fmtDate(s.date) : ''}</a>${count}`;
    });
    return `<p class="src">Źródło: ${items.join('; ')}</p>`;
  }

  // Podświetla w tekście trafienia wyszukiwania (zakresy z Analiza.wzorzec).
  function markText(text: string, w: Analiza.Wzorzec | null) {
    if (!w) return typo(text);
    let out = '', at = 0;
    for (const [a, b] of w.zakresy(text)) {
      out += typo(text.slice(at, a)) + `<mark>${esc(text.slice(a, b))}</mark>`;
      at = b;
    }
    return out + typo(text.slice(at));
  }

  type RelLike = { label: string; kind?: string; status?: Status; sources?: string[]; date?: string; since?: string; until?: string; from?: string; to?: string };
  // opts.clickable — nazwy pary prowadzą do pary (albo osoby), opts.mark — trafienia wyszukiwania,
  // opts.extra — dopisek w nagłówku, opts.after — dopisek pod źródłami.
  function relItem(e: RelLike, withPair = false, { clickable = false, mark = null as Analiza.Wzorzec | null, extra = '', after = '' } = {}) {
    const when = e.date ? fmtDate(e.date) : e.since ? `od ${fmtDate(e.since)}${e.until ? ' do ' + fmtDate(e.until) : ''}` : e.until ? `do ${fmtDate(e.until)}` : '';
    let pair = '';
    if (withPair && e.from) {
      const names = `${esc(byId.get(e.from)?.name)}${e.to ? ` <span class="dot">—</span> ${esc(byId.get(e.to)?.name)}` : ''}`;
      const target = e.to ? `data-pair="${esc(pairKey(e.from, e.to))}"` : `data-node="${esc(e.from)}"`;
      pair = `<p class="pair">${clickable ? `<button class="pairbtn" type="button" ${target}>${names}</button>` : names}</p>`;
    }
    return `<li class="rel">${pair}
      <div class="rel-head">${flag(e.status)}<span class="kind">${KIND[e.kind ?? ''] ?? ''}</span>${when ? `<span class="kind">· ${when}</span>` : ''}${extra}</div>
      <p>${markText(e.label, mark)}</p>${sourcesHtml(e.sources)}${after}</li>`;
  }

  function hiddenNote(all: number, shown: number) {
    const n = all - shown;
    return n > 0 ? `<p class="src">Ukryte filtrem: ${n}.</p>` : '';
  }

  const whoBtn = (n: N) => `<button class="who" type="button" data-node="${esc(n.id)}">${esc(n.name)}</button>`;
  const roleRel = (r: Role, from?: string): RelLike => ({ ...r, kind: r.kind || 'role', from });
  const chargeHtml = (c: NonNullable<N['charges']>[number], mark: Analiza.Wzorzec | null = null) =>
    `<div class="charge"><p class="mono-label">Zarzut — nie udowodniony fakt · ${fmtDate(c.date)}</p>
      <p>${markText(c.label, mark)}</p><p class="src">${esc(c.by)}</p>${sourcesHtml(c.sources)}</div>`;

  function legendDefs() {
    return `<details class="defs-wrap"><summary class="mono-label">Jak czytać graf</summary>
      <h3 class="mono-label">Pewność linii</h3>
      <dl class="defs">${STATUS_KEYS.map((k) => {
        const s = STATUS[k];
        return `<dt>${sample('var(--ink)', s.width, s.dash, k === 'media')}</dt><dd><b>${s.label}</b> — ${typo(s.desc)}</dd>`;
      }).join('')}</dl>
      <h3 class="mono-label">Głos przy osobie</h3>
      <dl class="defs">
        <dt>${voteGlyph('NO')}</dt><dd><b>Przeciw</b></dd>
        <dt>${voteGlyph('ABSTAIN')}</dt><dd><b>Wstrzymał(a) się</b></dd>
        <dt>${voteGlyph('YES')}</dt><dd><b>Za</b></dd>
      </dl>
      <h3 class="mono-label">Zasady</h3>
      <ul class="rules">
        <li>${typo('Bez źródła nie ma linii. Rejestry i dokumenty przed mediami.')}</li>
        <li>${typo('Doniesienie nie jest faktem, a zarzut nie jest winą — pewność widać po kształcie linii.')}</li>
        <li>${typo('Powiązanie nie jest zarzutem. Partia to cecha osoby, nie węzeł. Metoda i granice danych — pod grafem.')}</li>
      </ul></details>`;
  }

  function renderHome() {
    const people = nodes.filter((n) => n.type === 'person');
    const core = people.filter((n) => bridges.has(n.id)).length;
    const hubs = nodes.filter((n) => n.hub).sort((a, b) => b.degree - a.degree);
    const filters = state.inst.size ? `<p class="src">Filtr instytucji: ${[...state.inst].map((i) => esc(byId.get(i)!.short)).join(', ')}. <button class="linkish" type="button" data-clear>Wyczyść</button></p>` : '';
    const nE = edges.filter((e) => e.kind !== 'part').length, nS = Object.keys(data.sources).length;
    detail.innerHTML = `
      <p class="mono-label">${people.length} ${plural(people.length, ['osoba', 'osoby', 'osób'])} · ${nE} ${plural(nE, ['powiązanie', 'powiązania', 'powiązań'])} · ${nS} ${plural(nS, SRC)}</p>
      <h2>Od czego zacząć<span class="dot">?</span></h2>
      <p>${typo('Każdy widok to jedna teza, kilkanaście węzłów i fakty ze źródłami.')}</p>
      <div class="views">${data.views.map((v) => {
        const ppl = v.nodes.filter((id) => byId.get(id)?.type === 'person').length;
        return `<button class="view-card" type="button" data-view="${esc(v.id)}"><span class="mono-label">${ppl} ${plural(ppl, ['osoba', 'osoby', 'osób'])}</span><b>${typo(v.title)}</b></button>`;
      }).join('')}</div>
      <p class="src mt"><button class="linkish" type="button" data-an="menu">Analiza</button>${typo(' — ścieżka między osobami, porównanie dwóch osób, otoczenie, indeks źródeł, mosty.')}</p>
      <h3 class="mono-label">Na grafie: rdzeń</h3>
      <p>${typo(state.mode === 'core'
        ? `Widać ${core} z ${people.length} osób — te, które łączą co najmniej dwie instytucje albo mają powiązanie z inną osobą. Pozostałe mają tylko funkcję i głos; kryją się pod licznikami „+N” przy instytucjach. Przełącznik „Wszyscy” pokaże wszystkich.`
        : `Widać wszystkie ${people.length} osób. Nazwiska mają tylko osoby z rdzenia; reszta po najechaniu albo przybliżeniu.`)}</p>
      ${filters}
      <h3 class="mono-label">Huby — najwięcej sąsiadów</h3>
      <div class="names">${hubs.map((n) => `<button class="who" type="button" data-node="${esc(n.id)}">${esc(n.short || n.name)}<span class="count">${n.degree}</span></button>`).join('')}</div>
      ${legendDefs()}`;
  }

  function factEdges(f: { from?: string; to?: string; kind?: string }) {
    return edges.filter((e) => pairKey(e.from, e.to) === pairKey(f.from!, f.to!) && (!f.kind || e.kind === f.kind));
  }

  function renderView(v: View) {
    let facts = '';
    for (const f of v.facts) {
      if (f.charge) {
        const n = byId.get(f.charge);
        for (const c of n?.charges ?? []) facts += `<li class="rel"><p class="pair">${esc(n!.name)}</p>${chargeHtml(c)}</li>`;
        continue;
      }
      if (f.roleOf) {
        // Fakt z opisu osoby (np. własna praktyka), nie z krawędzi.
        for (const r of byId.get(f.roleOf)?.roles ?? []) {
          if (f.contains && r.label.includes(f.contains)) facts += relItem(roleRel(r, f.roleOf), true);
        }
        continue;
      }
      for (const e of factEdges(f)) if (edgeOk(e)) facts += relItem(e, true);
    }
    const people = v.nodes.map((id) => byId.get(id)).filter((n): n is N => n?.type === 'person');
    detail.innerHTML = `<button class="back" type="button" data-home>${BACK_ICON}<span>Wszystkie widoki</span></button>
      <p class="mono-label">Widok · ${people.length} ${plural(people.length, ['osoba', 'osoby', 'osób'])}</p>
      <h2>${typo(v.title)}</h2>
      <p>${typo(v.lead)}</p>
      <h3 class="mono-label">Fakty</h3>
      <ul class="rels">${facts}</ul>
      <h3 class="mono-label">Osoby w widoku</h3>
      <div class="names">${people.map((p) => `${whoBtn(p)}${p.party ? ' ' + partyChip(p.party) : ''}`).join('')}</div>`;
  }

  function renderNode(n: N) {
    const mine = links.filter((l) => (idOf(l.source) === n.id || idOf(l.target) === n.id) && l.visible.length);
    const other = (l: L) => byId.get(idOf(l.source) === n.id ? idOf(l.target) : idOf(l.source))!;
    const hidden = n.type !== 'person' && state.mode === 'core' && !state.view ? hiddenPeople(n.id).size : 0;
    let html = `<button class="back" type="button" data-home>${BACK_ICON}<span>${backLabel()}</span></button>
      <p class="mono-label">${TYPE_LABEL[n.type]}${n.hub ? ` · hub, ${n.degree} sąsiadów` : ''}${bridges.has(n.id) ? ' · rdzeń' : ''}</p>
      <h2>${esc(n.name)}${n.name.endsWith('.') ? '' : '<span class="dot">.</span>'}</h2>
      ${n.party ? `<p>${partyChip(n.party)}${n.party.note ? ` <span class="src">${typo(n.party.note)}</span>` : ''}</p>${sourcesHtml(n.party.sources)}` : ''}
      ${n.note ? `<p>${typo(n.note)}</p>` : ''}
      ${hidden || state.expanded.has(n.id) ? `<p><button class="linkish" type="button" data-expand="${esc(n.id)}">${state.expanded.has(n.id) ? 'Zwiń osoby spoza rdzenia' : `Pokaż ${hidden} ${plural(hidden, ['ukrytą osobę', 'ukryte osoby', 'ukrytych osób'])}`}</button></p>` : ''}
      ${anRow(n)}`;

    for (const c of n.charges ?? []) html += chargeHtml(c);

    if (n.type === 'person') {
      const roleEdges = mine.filter((l) => other(l).type !== 'person').flatMap((l) => l.visible);
      const extra = (n.roles ?? []).filter((r) => activeStatus.has(r.status ?? 'record'));
      if (roleEdges.length || extra.length) {
        html += `<h3 class="mono-label">Funkcje, ustawy, głosy</h3><ul class="rels">`;
        for (const e of roleEdges) html += relItem(e);
        for (const r of extra) html += relItem(roleRel(r));
        html += `</ul>`;
      }
      const personLinks = mine.filter((l) => other(l).type === 'person');
      if (personLinks.length) {
        html += `<h3 class="mono-label">Powiązania z osobami</h3>`;
        for (const l of personLinks) {
          html += `<button class="who" type="button" data-node="${esc(other(l).id)}">${esc(other(l).name)}<span class="count">${l.visible.length}</span></button>
            <ul class="rels">${l.visible.map((e) => relItem(e)).join('')}</ul>${hiddenNote(l.edges.length, l.visible.length)}`;
        }
      }
    } else {
      const votes = mine.filter((l) => l.visible.some((e) => e.kind === 'vote'));
      if (votes.length) {
        for (const v of ['NO', 'ABSTAIN', 'YES', 'ABSENT']) {
          const who = votes.filter((l) => l.visible.find((e) => e.kind === 'vote')!.vote === v).map(other)
            .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
          if (who.length) html += `<h3 class="mono-label">${VOTE[v]} · ${who.length}</h3><div class="names">${who.map(whoBtn).join('')}</div>`;
        }
        html += sourcesHtml(votes[0].visible.find((e) => e.kind === 'vote')!.sources);
      }
      const rest = mine.filter((l) => !votes.includes(l) || l.visible.some((e) => e.kind !== 'vote'));
      for (const [title, test] of [['Instytucje i organy', (o: N) => o.type !== 'person'], ['Osoby', (o: N) => o.type === 'person']] as const) {
        const ls = rest.filter((l) => test(other(l)));
        if (!ls.length) continue;
        html += `<h3 class="mono-label">${title}</h3>`;
        for (const l of ls.sort((a, b) => other(a).name.localeCompare(other(b).name, 'pl'))) {
          const es = l.visible.filter((e) => e.kind !== 'vote');
          if (es.length) html += `${whoBtn(other(l))}<ul class="rels">${es.map((e) => relItem(e)).join('')}</ul>`;
        }
      }
      if (!mine.length) html += `<p class="empty">${typo('Wszystkie powiązania ukryte filtrem.')}</p>`;
    }
    detail.innerHTML = html;
  }

  function renderParty(name: string) {
    const people = nodes.filter((n) => n.party?.name === name).sort((a, b) => b.degree - a.degree);
    detail.innerHTML = `<button class="back" type="button" data-home>${BACK_ICON}<span>Cały graf</span></button>
      <p class="mono-label">Klub / partia · ${people.length} ${plural(people.length, ['osoba', 'osoby', 'osób'])}</p>
      <h2>${esc(name)}<span class="dot">.</span></h2>
      <p class="src">${typo('Lista obejmuje tylko osoby, które weszły do grafu według kryteriów opisanych pod grafem — nie jest reprezentatywna dla partii.')}</p>
      ${people.map((p) => `${whoBtn(p)}<p class="src">${p.party!.former ? 'dawniej · ' : ''}${typo(p.note || '')}</p>`).join('')}`;
  }

  function renderPair(l: L) {
    const vis = l.visible ?? [];
    const s = byId.get(idOf(l.source))!, t = byId.get(idOf(l.target))!;
    detail.innerHTML = `<button class="back" type="button" data-home>${BACK_ICON}<span>${backLabel()}</span></button>
      <p class="mono-label">${CAT[vis.length ? pairCat(vis) : pairCat(l.edges)].label} · ${vis.length}</p>
      <h2><button class="who who--title" type="button" data-node="${esc(s.id)}">${esc(s.name)}</button>
        <span class="dot">—</span>
        <button class="who who--title" type="button" data-node="${esc(t.id)}">${esc(t.name)}</button></h2>
      <ul class="rels">${vis.map((e) => relItem(e)).join('')}</ul>${hiddenNote(l.edges.length, vis.length)}
      ${s.type === 'person' && t.type === 'person' ? `<p class="src"><button class="linkish" type="button" data-cmp-pair="${esc(s.id)}|${esc(t.id)}">Porównaj te osoby</button></p>` : ''}`;
  }

  const PANEL_ACTIONS = '[data-node],[data-home],[data-party],[data-view],[data-expand],[data-clear],[data-pair],[data-src],[data-pub],'
    + '[data-an],[data-alt],[data-tab],[data-sort],[data-path-from],[data-path-to],[data-cmp],[data-cmp-pair],[data-hood],[data-setopt]';
  $('panel').addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>(PANEL_ACTIONS);
    if (!t) return;
    const d = t.dataset;
    if (t.hasAttribute('data-home')) {
      // Z osoby wracamy do analizy albo widoku; z wyniku analizy — do jej spisu; z widoku — do listy widoków.
      if (selected) select_(null);
      else if (state.an) { const p = AN_PARENT[state.an.t]; setAnalysis(p ? ({ t: p } as An) : null); }
      else { state.view = null; applyFilter(); }
    } else if (d.view) openView(d.view);
    else if (d.expand) toggleExpand(d.expand);
    else if (t.hasAttribute('data-clear')) { state.inst.clear(); applyFilter(); }
    else if (d.party) select_(selected && 'party' in selected && selected.party === d.party ? null : { party: d.party });
    else if (d.src) setAnalysis({ t: 'src', id: d.src });
    else if (d.pub) setAnalysis({ t: 'pub', name: d.pub });
    else if (d.an) setAnalysis(d.an === 'bridges' ? { t: 'bridges', tab: 'osoby', sort: '' } : ({ t: d.an } as An));
    else if (d.alt && state.an?.t === 'path') setAnalysis({ ...state.an, alt: +d.alt });
    else if (d.tab && (state.an?.t === 'bridges' || state.an?.t === 'search')) setAnalysis(state.an.t === 'bridges' ? { ...state.an, tab: d.tab, sort: '' } : { ...state.an, tab: d.tab });
    else if (d.sort && state.an?.t === 'bridges') setAnalysis({ ...state.an, sort: d.sort });
    else if (d.pathFrom) setPathEnd('a', d.pathFrom);
    else if (d.pathTo) setPathEnd('b', d.pathTo);
    else if (d.cmp) startCompare(d.cmp);
    else if (d.cmpPair) { const [a, b] = d.cmpPair.split('|'); setAnalysis({ t: 'cmp', a, b }); }
    else if (d.hood) setAnalysis({ t: 'hood', id: d.hood, d: +(d.d ?? 1), hide: state.an?.t === 'hood' ? state.an.hide : false });
    else if (d.setopt) { const [k, v] = d.setopt.split(':'); setOpt(k as 'pewne' | 'przez', v === '1'); }
    else if (d.pair) {
      const [a, b] = d.pair.split('|');
      const key = pairKey(a, b);
      const missing = [a, b].filter((id) => !shownSet.has(id));
      if (missing.length) { missing.forEach((id) => state.pinned.add(id)); applyFilter(); }
      const l = linkByKey(key);
      if (!l) return;
      select_({ pair: key });
      ensureVisible({ x: (nodeOf(l.source).x! + nodeOf(l.target).x!) / 2, y: (nodeOf(l.source).y! + nodeOf(l.target).y!) / 2 });
    } else if (d.node) {
      if (!shownSet.has(d.node)) { state.pinned.add(d.node); applyFilter(); }
      select_({ node: d.node });
      if (state.an) ensureVisible(byId.get(d.node));
    }
  });
  // Ustawienia analizy (pola wyboru) i formularze ścieżki, porównania, otoczenia.
  detail.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.opt) setOpt(t.dataset.opt as 'pewne' | 'przez', t.checked);
    else if (t.hasAttribute('data-hide') && state.an?.t === 'hood') setAnalysis({ ...state.an, hide: t.checked });
  });
  detail.addEventListener('submit', (e) => {
    const f = (e.target as Element).closest<HTMLFormElement>('form[data-form]');
    if (!f) return;
    e.preventDefault();
    const kind = f.dataset.form;
    const err = f.querySelector<HTMLElement>('.err')!;
    const fail = (msg: string) => { err.textContent = msg; err.hidden = false; };
    const field = (name: string) => (f.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value;
    const ra = resolveNode(field('a'), kind === 'cmp');
    if ('err' in ra) return fail(ra.err);
    if (kind === 'hood') return setAnalysis({ t: 'hood', id: ra.id, d: +(field('d') ?? 1) || 1, hide: false });
    const rb = resolveNode(field('b'), kind === 'cmp');
    if ('err' in rb) return fail(rb.err);
    if (ra.id === rb.id) return fail('Wybierz dwa różne węzły.');
    setAnalysis(kind === 'cmp' ? { t: 'cmp', a: ra.id, b: rb.id } : { t: 'path', a: ra.id, b: rb.id, alt: 0 });
  });

  /* ---------- Analiza: ścieżka, otoczenie, porównanie, źródła, mosty, wyszukiwanie ----------
     Algorytmy są w lib/konstelacja/analiza.ts (bez DOM). Tu: stan (`state.an`, `state.aopt`), wynik na grafie
     (`focus`) i panel. Ścieżka, otoczenie, porównanie i mosty liczą się na krawędziach po filtrach legendy;
     indeks źródeł i wyszukiwanie — na wszystkich danych. Każdy stan wchodzi do historii i adresu (encodeHash). */
  // Klucz tego, co wynik analizy robi z grafem — zmiana oznacza nowy układ (filterKey, setAnalysis).
  function anGraphKey(an: An | null, o?: { pewne: boolean; przez: boolean }) {
    if (!an || !AN_GRAPH.has(an.t)) return '';
    const opt = an.t === 'path' || an.t === 'hood' ? [o?.pewne, o?.przez] : [];
    const x = an as Partial<{ a: string; b: string; alt: number; id: string; d: number; hide: boolean; name: string }>;
    return [an.t, x.a, x.b, x.alt, x.id, x.d, x.hide, x.name, ...opt].join('|');
  }
  const anOpts = (): Analiza.Opts => ({ pewne: state.aopt.pewne, przezInstytucje: state.aopt.przez });
  const pct = (x: number) => `${(x * 100).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  const whoInline = (id: string) => `<button class="who who--inline" type="button" data-node="${esc(id)}">${esc(nameOf(id))}</button>`;
  const tabChip = (key: string, label: string, cur: string) => `<button class="chip${cur === key ? ' is-on' : ''}" type="button" data-tab="${key}" aria-pressed="${cur === key}">${label}</button>`;
  const anNote = (text: string) => `<p class="note-an">${typo(text)}</p>`;

  function anTitle(an: An) {
    if (an.t === 'path') return `${nameOf(an.a)} → ${nameOf(an.b)}${an.alt ? ' · ścieżka 2' : ''}`;
    if (an.t === 'hood') return `${nameOf(an.id)} · ${an.d}. stopień`;
    if (an.t === 'cmp') return `${nameOf(an.a)} i ${nameOf(an.b)}`;
    if (an.t === 'src') { const s = data.sources[an.id]; return `${s.publisher}${s.date ? ', ' + fmtDate(s.date) : ''}`; }
    if (an.t === 'pub') return an.name;
    return '';
  }

  // Stan z adresu albo z kliknięcia: nieznane węzły, źródła i wydawców pomija (jak restore przy zaznaczeniu).
  function validAn(an: An | null): An | null {
    if (!an) return null;
    const ok = (id: string) => byId.has(id);
    switch (an.t) {
      case 'path': return ok(an.a) && ok(an.b) && an.a !== an.b ? { t: 'path', a: an.a, b: an.b, alt: an.alt ? 1 : 0 } : null;
      case 'cmp': return ok(an.a) && ok(an.b) && an.a !== an.b ? { t: 'cmp', a: an.a, b: an.b } : null;
      case 'hood': return ok(an.id) ? { t: 'hood', id: an.id, d: Math.min(3, Math.max(1, Math.round(an.d) || 1)), hide: !!an.hide } : null;
      case 'src': return data.sources[an.id] ? { t: 'src', id: an.id } : null;
      case 'pub': return srcIndex.wydawca(an.name) ? { t: 'pub', name: an.name } : null;
      case 'search': return an.q?.trim() ? { t: 'search', q: an.q.trim(), tab: ['osoby', 'tresc', 'zrodla'].includes(an.tab) ? an.tab : '' } : null;
      case 'bridges': return { t: 'bridges', tab: an.tab === 'powiazania' ? 'powiazania' : 'osoby', sort: an.sort || '' };
      case 'menu': case 'srcs': return { t: an.t };
      default: return null;
    }
  }
  // Po zamknięciu analizy (także wstecz w historii) formularze zaczynają od zera.
  function syncDraft(an: An | null) {
    if (!an) { draft.pathA = draft.pathB = draft.cmpA = draft.cmpB = ''; }
    if (an?.t === 'path') Object.assign(draft, { pathA: an.a, pathB: an.b });
    if (an?.t === 'cmp') Object.assign(draft, { cmpA: an.a, cmpB: an.b });
  }

  function setAnalysis(raw: An | null, { keepSel = false } = {}) {
    const an = validAn(raw);
    const before = anGraphKey(state.an, state.aopt);
    state.an = an;
    syncDraft(an);
    if (!keepSel) selected = null;
    if (anGraphKey(an, state.aopt) !== before) applyFilter();
    else syncToolbar();
    select_(selected);
  }
  function setOpt(key: 'pewne' | 'przez', on: boolean) {
    state.aopt = { ...state.aopt, [key]: !!on };
    if (state.an?.t === 'path' || state.an?.t === 'hood') applyFilter();
    render();
    scheduleCommit();
  }
  // „Ścieżka od / do” z panelu węzła: gdy drugi koniec jest znany — od razu ścieżka, inaczej formularz.
  function setPathEnd(which: 'a' | 'b', id: string) {
    draft[which === 'a' ? 'pathA' : 'pathB'] = id;
    const { pathA: a, pathB: b } = draft;
    if (a && b && a !== b) return setAnalysis({ t: 'path', a, b, alt: 0 });
    setAnalysis({ t: 'menu' });
    focusField('path', which === 'a' ? 'b' : 'a');
  }
  function startCompare(id: string) {
    Object.assign(draft, { cmpA: id, cmpB: '' });
    setAnalysis({ t: 'menu' });
    focusField('cmp', 'b');
  }
  function focusField(form: string, name: string) {
    detail.querySelector<HTMLInputElement>(`form[data-form="${form}"] [name="${name}"]`)?.focus();
  }
  function resolveNode(text: string | undefined, personOnly = false): { id: string } | { err: string } {
    // Bez względu na wielkość liter i polskie znaki („lukasz jankowski” = „Łukasz Jankowski”); każde słowo osobno.
    const raw = (text || '').trim(), q = Analiza.fold(raw);
    if (!q) return { err: 'Wpisz nazwę albo wybierz ją z listy.' };
    const pool = personOnly ? nodes.filter((n) => n.type === 'person') : nodes;
    const exact = pool.find((n) => Analiza.fold(n.name) === q || (!!n.short && Analiza.fold(n.short) === q));
    if (exact) return { id: exact.id };
    const words = q.split(/\s+/).filter(Boolean);
    const part = pool.filter((n) => words.every((w) => Analiza.fold(`${n.name} ${n.short ?? ''}`).includes(w)));
    if (part.length === 1) return { id: part[0].id };
    if (part.length) return { err: `Pasuje kilka: ${part.slice(0, 4).map((n) => n.name).join(', ')}${part.length > 4 ? '…' : ''}.` };
    return { err: `Nie znaleziono${personOnly ? ' osoby' : ''}: „${raw}”.` };
  }

  // Co wynik analizy robi z grafem: węzły do pokazania, linie wyniku, końce (pierścień), linie wyróżnione na niebiesko,
  // krawędzie pokazane mimo filtrów legendy (fakty ze źródła) i czy reszta grafu znika.
  function computeFocus(): Focus | null {
    const an = state.an;
    if (!an || !AN_GRAPH.has(an.t)) return null;
    const f: Focus = { nodes: new Set(), links: new Set(), ends: new Set(), hits: new Set(), forced: new Set(), labels: new Set(), hideRest: false, result: null };
    const E = edges.filter(edgeOk), o = anOpts();
    if (an.t === 'path') {
      const r = Analiza.sciezki(nodes, E, an.a, an.b, o);
      f.result = r;
      const p = r.paths[an.alt] ?? r.paths[0];
      f.ends = new Set([an.a, an.b]);
      f.nodes = new Set(p ? p.nodes : [an.a, an.b]);
      p?.steps.forEach((s) => { f.links.add(pairKey(s.from, s.to)); f.hits.add(pairKey(s.from, s.to)); });
    } else if (an.t === 'hood') {
      const r = Analiza.otoczenie(nodes, E, an.id, an.d, o);
      f.result = r;
      f.nodes = new Set(r.keys());
      f.ends = new Set([an.id]);
      f.hideRest = an.hide;
      for (const l of links) if (f.nodes.has(idOf(l.source)) && f.nodes.has(idOf(l.target))) f.links.add(l.key);
    } else if (an.t === 'cmp') {
      const r = Analiza.porownanie(nodes, E, an.a, an.b, data.asOf);
      f.result = r;
      f.ends = new Set([an.a, an.b]);
      f.nodes = new Set([an.a, an.b]);
      const direct = pairKey(an.a, an.b);
      f.links.add(direct);
      if (linkByKey(direct)) f.hits.add(direct);
      for (const x of [...r.wezly, ...r.ustawy, ...r.osoby]) {
        f.nodes.add(x.id);
        f.links.add(pairKey(an.a, x.id));
        f.links.add(pairKey(an.b, x.id));
      }
      for (const x of r.instytucje) {
        for (const [who, list] of [[an.a, x.a], [an.b, x.b]] as const) for (const v of list) { f.nodes.add(v.via); f.links.add(pairKey(who, v.via)); }
      }
    } else if (an.t === 'src' || an.t === 'pub') {
      const facts = an.t === 'src' ? srcIndex.zrodlo(an.id)?.fakty ?? [] : srcIndex.wydawca(an.name)?.fakty ?? [];
      f.result = facts;
      for (const x of facts) {
        f.nodes.add(x.node);
        if (x.typ !== 'edge') continue;
        const k = pairKey(x.edge.from, x.edge.to);
        f.nodes.add(x.edge.to);
        f.links.add(k);
        f.hits.add(k);
        f.forced.add(x.edge);
      }
    }
    for (const id of [...f.nodes]) if (!byId.has(id)) f.nodes.delete(id);
    // Podpisy zostają przy oddaleniu: cała ścieżka, porównywane osoby i ich wspólni sąsiedzi, środek otoczenia.
    f.labels = an.t === 'path' || an.t === 'cmp' ? new Set(f.nodes) : new Set(f.ends);
    return f;
  }

  /* Panel analizy */
  function renderAnalysis() {
    const an = state.an!;
    let html = '';
    switch (an.t) {
      case 'menu': html = renderAnMenu(); break;
      case 'path': html = renderAnPath(an); break;
      case 'hood': html = renderAnHood(an); break;
      case 'cmp': html = renderAnCmp(an); break;
      case 'src': html = renderAnSrc(an); break;
      case 'pub': html = renderAnPub(an); break;
      case 'srcs': html = renderAnSrcs(); break;
      case 'bridges': html = renderAnBridges(an); break;
      case 'search': html = renderAnSearch(an); break;
    }
    detail.innerHTML = html;
  }
  function anHead(label: string, title: string, small = false) {
    const p = state.an ? AN_PARENT[state.an.t] : null;
    return `<button class="back" type="button" data-home>${BACK_ICON}<span>${p ? AN_NAME[p] : state.view ? 'Widok' : 'Cały graf'}</span></button>
      <p class="mono-label">${label}</p><h2${small ? ' class="h2-sm"' : ''}>${title}</h2>`;
  }

  // W panelu węzła: ścieżka od/do, porównanie (osoby) i otoczenie 1–3.
  function anRow(n: N) {
    const id = esc(n.id);
    const hoodD = state.an?.t === 'hood' && state.an.id === n.id ? state.an.d : 0;
    return `<div class="an-row" role="group" aria-label="Analiza od tego węzła">
      <span class="mono-label">Ścieżka</span>
      <button class="chip" type="button" data-path-from="${id}" title="Ustaw jako początek ścieżki">od</button>
      <button class="chip" type="button" data-path-to="${id}" title="Ustaw jako koniec ścieżki">do</button>
      ${n.type === 'person' ? `<button class="chip" type="button" data-cmp="${id}" title="Porównaj z inną osobą (albo Shift+klik drugiej osoby na grafie)">Porównaj</button>` : ''}
      <span class="mono-label">Otoczenie</span>
      ${[1, 2, 3].map((d) => `<button class="chip${hoodD === d ? ' is-on' : ''}" type="button" data-hood="${id}" data-d="${d}" aria-pressed="${hoodD === d}" aria-label="Otoczenie ${d}. stopnia" title="Otoczenie ${d}. stopnia">${d}</button>`).join('')}
    </div>`;
  }

  function pairForm(kind: string, a: string, b: string, labels: [string, string], submit: string) {
    return `<form class="anform" data-form="${kind}" novalidate>
      <label><span class="mono-label">${labels[0]}</span><input name="a" data-suggest="${kind === 'cmp' ? 'person' : 'node'}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="kst-suggest" aria-expanded="false" value="${esc(a ? nameOf(a) : '')}"></label>
      <label><span class="mono-label">${labels[1]}</span><input name="b" data-suggest="${kind === 'cmp' ? 'person' : 'node'}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="kst-suggest" aria-expanded="false" value="${esc(b ? nameOf(b) : '')}"></label>
      <button class="btn" type="submit">${submit}</button>
      <p class="err" role="alert" hidden></p></form>`;
  }
  const pathForm = (a: string, b: string) => pairForm('path', a, b, ['Od', 'Do'], 'Szukaj');
  const cmpForm = (a: string, b: string) => pairForm('cmp', a, b, ['Osoba 1', 'Osoba 2'], 'Porównaj');
  function hoodForm() {
    return `<form class="anform" data-form="hood" novalidate>
      <label><span class="mono-label">Węzeł</span><input name="a" data-suggest="node" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="kst-suggest" aria-expanded="false"></label>
      <label><span class="mono-label">Stopień</span><select name="d">${[1, 2, 3].map((x) => `<option value="${x}"${x === 2 ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <button class="btn" type="submit">Pokaż</button>
      <p class="err" role="alert" hidden></p></form>`;
  }
  function optsHtml() {
    const og = Analiza.OGOLNE.filter((id) => byId.has(id)).map(shortOf).join(', ');
    return `<div class="opts">
      <label class="chk"><input type="checkbox" data-opt="pewne"${state.aopt.pewne ? ' checked' : ''}> ${typo('Tylko ogniwa z dokumentu albo potwierdzone')}</label>
      <label class="chk"><input type="checkbox" data-opt="przez"${state.aopt.przez ? ' checked' : ''}> Przez instytucje ogólne (${esc(og)})</label>
      <p class="src">${typo(`Bez tej opcji ścieżka, otoczenie i mosty nie prowadzą przez ${og} ani przez samą strukturę (organ w instytucji) — przez nie łączy się prawie wszystko. Filtry z legendy też obowiązują.`)}</p>
    </div>`;
  }

  function renderAnMenu() {
    const nS = srcIndex.zrodla.length, nW = srcIndex.wydawcy.length;
    return `${anHead('Analiza', 'Narzędzia analizy<span class="dot">.</span>')}
      <p>${typo('Wyniki pokazują, kto z kim i przez co styka się w danych grafu. To powiązania w danych, nie dowód współpracy ani zarzut.')}</p>
      <h3 class="mono-label">Ścieżka między dwoma węzłami</h3>
      ${pathForm(draft.pathA, draft.pathB)}
      <h3 class="mono-label">Porównanie dwóch osób</h3>
      ${cmpForm(draft.cmpA, draft.cmpB)}
      <p class="src">${typo('Albo zaznacz osobę na grafie i kliknij drugą z wciśniętym Shiftem.')}</p>
      <h3 class="mono-label">Otoczenie węzła</h3>
      ${hoodForm()}
      <h3 class="mono-label">Ustawienia ścieżki, otoczenia i mostów</h3>
      ${optsHtml()}
      <h3 class="mono-label">Przeglądy</h3>
      <div class="views">
        <button class="view-card" type="button" data-an="srcs"><span class="mono-label">${nS} ${plural(nS, SRC)} · ${nW} ${plural(nW, ['wydawca', 'wydawców', 'wydawców'])}</span><b>Indeks źródeł</b><span class="src">${typo('Ile faktów stoi na każdym źródle i wydawcy — i ile nie ma drugiego źródła.')}</span></button>
        <button class="view-card" type="button" data-an="bridges"><span class="mono-label">Ranking</span><b>Mosty między skupiskami</b><span class="src">${typo('Osoby i powiązania, które łączą odległe części grafu.')}</span></button>
      </div>
      <p class="src mt">${typo('Wyszukiwanie w treści faktów i w źródłach: wpisz frazę w pole „Szukaj” nad grafem i naciśnij Enter.')}</p>`;
  }

  function chainHtml(p: Analiza.Path) {
    let h = '<ol class="chain">';
    p.nodes.forEach((id, i) => {
      h += `<li class="hop">${whoInline(id)}<span class="kind">${TYPE_SHORT[byId.get(id)?.type ?? ''] ?? ''}</span></li>`;
      const s = p.steps[i];
      if (s) {
        h += `<li class="step"><button class="linkish" type="button" data-pair="${esc(pairKey(s.from, s.to))}" title="Otwórz parę">Ogniwo ${i + 1} · ${s.edges.length} ${plural(s.edges.length, FACT)}</button>
          <ul class="rels">${s.edges.map((e) => relItem(e)).join('')}</ul></li>`;
      }
    });
    return h + '</ol>';
  }
  function renderAnPath(an: Extract<An, { t: 'path' }>) {
    const r = (focus?.result as { paths: Analiza.Path[] } | undefined) ?? { paths: [] };
    const shown = r.paths[an.alt] ? an.alt : 0;
    let html = anHead('Analiza · ścieżka', `${esc(nameOf(an.a))} <span class="dot">→</span> ${esc(nameOf(an.b))}`, true)
      + pathForm(an.a, an.b) + optsHtml();
    if (!r.paths.length) {
      html += `<p class="empty">${typo('Brak ścieżki przy tych ustawieniach.')}</p>`;
      const E = edges.filter(edgeOk), o = anOpts(), has = (es: E[], opt: Analiza.Opts) => Analiza.sciezki(nodes, es, an.a, an.b, opt).paths.length > 0;
      const hints: string[] = [];
      if (!o.przezInstytucje && has(E, { ...o, przezInstytucje: true })) hints.push('<button class="linkish" type="button" data-setopt="przez:1">przez instytucje ogólne</button>');
      if (o.pewne && has(E, { ...o, pewne: false })) hints.push('<button class="linkish" type="button" data-setopt="pewne:0">ze wszystkimi stopniami pewności</button>');
      if (E.length < edges.length && has(edges, o)) hints.push('po wyłączeniu filtrów z legendy');
      if (hints.length) html += `<p class="src">Ścieżka istnieje ${hints.join(' · ')}.</p>`;
    }
    r.paths.forEach((p, i) => {
      const n = p.steps.length;
      const head = i === 0 ? 'Najkrótsza ścieżka'
        : r.paths[0].steps.length === 1 ? 'Druga ścieżka — bez bezpośredniego powiązania' : 'Druga ścieżka — omija węzły pośrednie pierwszej';
      html += `<h3 class="mono-label">${head} · ${n} ${plural(n, ['ogniwo', 'ogniwa', 'ogniw'])} · ${i === shown ? 'na grafie'
        : `<button class="linkish" type="button" data-alt="${i}">pokaż na grafie</button>`}</h3>${chainHtml(p)}`;
    });
    return html + anNote('Ścieżka w grafie to powiązanie w danych, nie dowód współpracy ani zarzut.');
  }

  function renderAnHood(an: Extract<An, { t: 'hood' }>) {
    const dist = (focus?.result as Map<string, number> | undefined) ?? new Map<string, number>();
    const byD: string[][] = [];
    for (const [id, d] of dist) if (d > 0) (byD[d] ||= []).push(id);
    const byName = (a: string, b: string) => nameOf(a).localeCompare(nameOf(b), 'pl');
    const n = dist.size ? dist.size - 1 : 0;
    let html = anHead(`Analiza · otoczenie · ${n} ${plural(n, ['węzeł', 'węzły', 'węzłów'])}`, esc(nameOf(an.id)), true);
    html += `<div class="an-row" role="group" aria-label="Stopień otoczenia"><span class="mono-label">Stopień</span>
      ${[1, 2, 3].map((d) => `<button class="chip${an.d === d ? ' is-on' : ''}" type="button" data-hood="${esc(an.id)}" data-d="${d}" aria-pressed="${an.d === d}">${d}</button>`).join('')}</div>
      <div class="opts"><label class="chk"><input type="checkbox" data-hide${an.hide ? ' checked' : ''}> ${typo('Ukryj resztę grafu (zamiast przygaszać)')}</label></div>
      ${optsHtml()}`;
    for (let d = 1; d <= an.d; d++) {
      const ids = byD[d] ?? [];
      const ppl = ids.filter((id) => byId.get(id)!.type === 'person').sort(byName);
      const rest = ids.filter((id) => byId.get(id)!.type !== 'person').sort(byName);
      html += `<h3 class="mono-label">${d}. stopień · ${ids.length}</h3>`;
      if (!ids.length) html += '<p class="empty">Brak.</p>';
      if (ppl.length) html += `<p class="src">Osoby · ${ppl.length}</p><div class="names">${ppl.map(whoInline).join('')}</div>`;
      if (rest.length) html += `<p class="src">Instytucje, organy, podmioty, akty · ${rest.length}</p><div class="names">${rest.map(whoInline).join('')}</div>`;
    }
    return html + anNote('Otoczenie w grafie to powiązania w danych, nie dowód współpracy ani zarzut.');
  }

  function okresItem(o: Analiza.Okres, a: string, b: string) {
    const span = (e: GraphEdge) => `od ${fmtDate(e.since)}${e.until ? ` do ${fmtDate(e.until)}` : ' — obecnie'}${e.seen ? `, potwierdzona co najmniej do ${fmtDate(e.seen)}` : ''}`;
    const where = o.zespol ? `w ${TEAM_NAME[o.zespol] ?? o.zespol}` : o.wspolnyWezel ? '' : 'ta sama instytucja, różne organy';
    return `<li class="rel"><p class="pair">${whoInline(o.gdzie)}${where ? ` <span class="kind">· ${esc(where)}</span>` : ''}</p>
      <div class="rel-head">${flag(o.status)}<span class="kind">wspólny okres, wyliczony z dat obu funkcji</span></div>
      <p>W tym samym czasie: <b>${esc(o.poczatekTekst)} – ${esc(o.koniecTekst)}</b></p>
      <p class="src"><b>${esc(nameOf(a))}:</b> ${typo(o.a.label)} (${span(o.a)})</p>
      <p class="src"><b>${esc(nameOf(b))}:</b> ${typo(o.b.label)} (${span(o.b)})</p>
      ${sourcesHtml([...new Set([...(o.a.sources ?? []), ...(o.b.sources ?? [])])])}</li>`;
  }
  function renderAnCmp(an: Extract<An, { t: 'cmp' }>) {
    const r = focus?.result as Analiza.Porownanie;
    const side = (id: string, es: GraphEdge[]) => `<p class="mono-label side">${esc(nameOf(id))}</p><ul class="rels">${es.map((e) => relItem(e)).join('')}</ul>`;
    const via = (id: string, list: Analiza.Via[]) => `<p class="mono-label side">${esc(nameOf(id))}</p><ul class="rels">${list.flatMap((x) => x.edges.map((e) => relItem(e, true))).join('')}</ul>`;
    const sec = (title: string, items: unknown[], body: string) => `<h3 class="mono-label">${title} · ${items.length}</h3>${items.length ? body : '<p class="empty">Brak.</p>'}`;
    const blocks = (list: Analiza.Wspolny[]) => list.map((x) => `${whoBtn(byId.get(x.id)!)}${side(an.a, x.a)}${side(an.b, x.b)}`).join('');
    let html = anHead('Analiza · porównanie dwóch osób', `${esc(nameOf(an.a))} <span class="dot">i</span> ${esc(nameOf(an.b))}`, true)
      + cmpForm(an.a, an.b);
    html += sec('Bezpośrednie powiązania', r.bezposrednie, `<ul class="rels">${r.bezposrednie.map((e) => relItem(e)).join('')}</ul>`);
    html += sec('Nakładające się okresy funkcji', r.okresy, `<ul class="rels">${r.okresy.map((o) => okresItem(o, an.a, an.b)).join('')}</ul>`);
    html += sec('Wspólne instytucje, organy i podmioty', r.wezly, blocks(r.wezly));
    if (r.instytucje.length) html += sec('Ta sama instytucja, różne organy', r.instytucje, r.instytucje.map((x) => `${whoBtn(byId.get(x.id)!)}${via(an.a, x.a)}${via(an.b, x.b)}`).join(''));
    html += sec('Wspólne ustawy', r.ustawy, blocks(r.ustawy));
    html += sec('Wspólni sąsiedzi — osoby', r.osoby, blocks(r.osoby));
    return html + anNote('Porównanie pokazuje powiązania w danych, nie dowód współpracy ani zarzut.');
  }

  // Fakt z indeksu albo z wyszukiwania: krawędź, funkcja z roles[], przynależność albo zarzut (zawsze z dopiskiem).
  function factItem(f: Analiza.Fakt, { only = false, mark = null as Analiza.Wzorzec | null, extra = '', after = '' } = {}) {
    const tag = (only ? '<span class="flag flag--only" title="Ten fakt nie ma innego źródła">jedyne źródło</span>' : '') + extra;
    const opts = { clickable: true, mark, extra: tag, after };
    if (f.typ === 'edge') return relItem(f.edge, true, opts);
    if (f.typ === 'party') {
      const p = f.item;
      return relItem({ kind: 'party', from: f.node, label: `${partyText(p)}${p.note ? ` — ${p.note}` : ''}`, sources: p.sources, until: p.until }, true, opts);
    }
    if (f.typ === 'charge') {
      return `<li class="rel"><p class="pair"><button class="pairbtn" type="button" data-node="${esc(f.node)}">${esc(nameOf(f.node))}</button></p>
        ${tag ? `<div class="rel-head">${tag}</div>` : ''}${chargeHtml(f.item, mark)}${after}</li>`;
    }
    return relItem(roleRel(f.item, f.node), true, opts);
  }
  function factCounts(facts: Analiza.Fakt[]) {
    const c = { edge: 0, role: 0, party: 0, charge: 0 };
    facts.forEach((f) => { c[f.typ]++; });
    return ([
      [c.edge, ['powiązanie', 'powiązania', 'powiązań']],
      [c.role, ['opis funkcji', 'opisy funkcji', 'opisów funkcji']],
      [c.party, ['przynależność partyjna', 'przynależności partyjne', 'przynależności partyjnych']],
      [c.charge, ['zarzut', 'zarzuty', 'zarzutów']],
    ] as [number, [string, string, string]][]).filter(([n]) => n).map(([n, forms]) => `${n} ${plural(n, forms)}`).join(', ');
  }
  function srcRow(id: string, mark: Analiza.Wzorzec | null = null) {
    const s = data.sources[id];
    const n = srcIndex.zrodlo(id)?.fakty.length ?? 0;
    return `<li><button class="pairbtn" type="button" data-src="${esc(id)}">${markText(s.title, mark)}</button>
      <p class="src">${markText(s.publisher, mark)}${s.date ? ', ' + fmtDate(s.date) : ''} · ${n} ${plural(n, FACT)} · <a href="${esc(s.url)}" target="_blank" rel="noopener">otwórz ↗</a></p></li>`;
  }
  function renderAnSrc(an: Extract<An, { t: 'src' }>) {
    const s = data.sources[an.id];
    const x = srcIndex.zrodlo(an.id) ?? { fakty: [], tylko: 0 };
    const n = x.fakty.length;
    const w = srcIndex.wydawca(s.publisher);
    let html = anHead(`Analiza · źródło · ${n} ${plural(n, FACT)}`, typo(s.title), true);
    html += `<p class="src">${esc(s.publisher)}${s.date ? ', ' + fmtDate(s.date) : ''} · <a href="${esc(s.url)}" target="_blank" rel="noopener">otwórz źródło ↗</a></p>`;
    html += `<p>Fakty oparte na tym źródle: <b>${n}</b>${n ? ` (${factCounts(x.fakty)})` : ''}. Bez innego źródła: <b>${x.tylko}</b>.</p>`;
    html += n ? `<ul class="rels">${x.fakty.map((f) => factItem(f, { only: new Set(f.sources).size === 1 })).join('')}</ul>` : `<p class="empty">${typo('Żaden fakt w grafie nie powołuje się na to źródło.')}</p>`;
    if (w) html += `<p class="src mt">Wydawca: <button class="linkish" type="button" data-pub="${esc(w.nazwa)}">${esc(w.nazwa)}</button> · ${w.zrodla.length} ${plural(w.zrodla.length, SRC)}, ${w.fakty.length} ${plural(w.fakty.length, FACT)}.</p>`;
    return html;
  }
  function renderAnPub(an: Extract<An, { t: 'pub' }>) {
    const w = srcIndex.wydawca(an.name)!;
    let html = anHead(`Analiza · wydawca · ${w.zrodla.length} ${plural(w.zrodla.length, SRC)}`, esc(w.nazwa), true);
    html += `<p>Fakty oparte na źródłach tego wydawcy: <b>${w.fakty.length}</b>. Tylko na nich, bez źródła innego wydawcy: <b>${w.tylko.length}</b>.</p>`;
    html += `<h3 class="mono-label">Źródła · ${w.zrodla.length}</h3><ul class="hits">${w.zrodla.map((id) => srcRow(id)).join('')}</ul>`;
    html += `<h3 class="mono-label">Fakty tylko z tego wydawcy · ${w.tylko.length}</h3>`
      + (w.tylko.length ? `<ul class="rels">${w.tylko.map((f) => factItem(f)).join('')}</ul>` : `<p class="empty">${typo('Brak — każdy fakt ma też źródło innego wydawcy.')}</p>`);
    return html;
  }
  function renderAnSrcs() {
    const W = srcIndex.wydawcy, nS = srcIndex.zrodla.length;
    let html = anHead('Analiza · źródła', 'Indeks źródeł<span class="dot">.</span>');
    html += `<p>${typo(`${nS} ${plural(nS, SRC)} od ${W.length} ${plural(W.length, ['wydawcy', 'wydawców', 'wydawców'])}. Fakt to powiązanie, opis funkcji, przynależność partyjna albo zarzut. „Tylko” — fakty bez źródła innego wydawcy, czyli to, co stoi wyłącznie na jego publikacjach.`)}</p>`;
    html += `<div class="rank-wrap"><table class="rank"><thead><tr><th><span class="mono-label">Wydawca</span></th><th class="num"><span class="mono-label">Źródła</span></th><th class="num"><span class="mono-label">Fakty</span></th><th class="num"><span class="mono-label">Tylko</span></th></tr></thead><tbody>
      ${W.map((w) => `<tr><td><button class="pairbtn" type="button" data-pub="${esc(w.nazwa)}">${esc(w.nazwa)}</button></td><td class="num">${w.zrodla.length}</td><td class="num">${w.fakty.length}</td><td class="num">${w.tylko.length}</td></tr>`).join('')}</tbody></table></div>`;
    html += `<h3 class="mono-label">Źródła z największą liczbą faktów</h3><ul class="hits">${srcIndex.zrodla.slice(0, 12).map((x) => srcRow(x.id)).join('')}</ul>`;
    html += `<p class="src mt">${typo('Szukanie po tytule i wydawcy: pole „Szukaj” nad grafem, Enter, zakładka „Źródła”. Licznik przy każdym źródle w panelu otwiera jego fakty.')}</p>`;
    return html;
  }

  function bridgesResult() {
    const key = JSON.stringify([[...activeCat].sort(), [...activeStatus].sort(), state.currentOnly, state.aopt]);
    if (bridgesCache.key !== key || !bridgesCache.r) bridgesCache = { key, r: Analiza.mosty(nodes, edges.filter(edgeOk), anOpts()) };
    return bridgesCache.r!;
  }
  function renderAnBridges(an: Extract<An, { t: 'bridges' }>) {
    const r = bridgesResult();
    const tab = an.tab === 'powiazania' ? 'powiazania' : 'osoby';
    const byName = (a: string, b: string) => nameOf(a).localeCompare(nameOf(b), 'pl');
    const th = (key: string, label: string, sort: string, num = false) => `<th${num ? ' class="num"' : ''}><button type="button" data-sort="${key}" class="${sort === key ? 'is-on' : ''}" aria-pressed="${sort === key}">${label}</button></th>`;
    let html = anHead('Analiza · mosty', 'Mosty między skupiskami<span class="dot">.</span>');
    html += `<div class="tabs" role="group" aria-label="Lista">${tabChip('osoby', `Osoby · ${r.osoby.length}`, tab)}${tabChip('powiazania', `Powiązania osób · ${r.powiazania.length}`, tab)}</div>`;
    if (tab === 'osoby') {
      const sort = ['posrednictwo', 'skupiska', 'nazwisko'].includes(an.sort) ? an.sort : 'posrednictwo';
      const cmp: Record<string, (a: Analiza.MostOsoba, b: Analiza.MostOsoba) => number> = {
        posrednictwo: (a, b) => b.posrednictwo - a.posrednictwo,
        skupiska: (a, b) => b.skupiska.length - a.skupiska.length || b.posrednictwo - a.posrednictwo,
        nazwisko: () => 0,
      };
      const rows = [...r.osoby].sort((a, b) => cmp[sort](a, b) || byName(a.id, b.id));
      html += `<p class="src">${typo('Pośrednictwo: jaka część najkrótszych dróg między innymi węzłami grafu przechodzi przez osobę. Skupiska: instytucje i podmioty, w których pełni funkcję.')}</p>
        <div class="rank-wrap"><table class="rank"><thead><tr>${th('nazwisko', 'Osoba', sort)}${th('posrednictwo', 'Pośrednictwo', sort, true)}${th('skupiska', 'Skupiska', sort, true)}</tr></thead><tbody>
        ${rows.map((x) => `<tr><td>${whoInline(x.id)}<span class="sub">${esc(x.skupiska.map(shortOf).join(' · ') || '—')}</span></td><td class="num">${pct(x.posrednictwo)}</td><td class="num">${x.skupiska.length}</td></tr>`).join('')}</tbody></table></div>`;
    } else {
      const sort = ['objazd', 'posrednictwo', 'nazwisko'].includes(an.sort) ? an.sort : 'objazd';
      const far = (x: Analiza.MostPowiazanie) => x.objazd ?? 1e6;
      const cmp: Record<string, (a: Analiza.MostPowiazanie, b: Analiza.MostPowiazanie) => number> = {
        objazd: (a, b) => far(b) - far(a) || b.posrednictwo - a.posrednictwo,
        posrednictwo: (a, b) => b.posrednictwo - a.posrednictwo,
        nazwisko: () => 0,
      };
      const rows = [...r.powiazania].sort((a, b) => cmp[sort](a, b) || byName(a.a, b.a) || byName(a.b, b.b));
      html += `<p class="src">${typo('Powiązania osób, które pełnią funkcje w różnych instytucjach i podmiotach. Objazd: ile kroków dzieli te osoby, gdy pominąć to powiązanie („brak” — nie ma innej drogi). Pośrednictwo: jaka część najkrótszych dróg przechodzi przez tę parę.')}</p>
        <div class="rank-wrap"><table class="rank"><thead><tr>${th('nazwisko', 'Powiązanie', sort)}${th('objazd', 'Objazd', sort, true)}${th('posrednictwo', 'Pośrednictwo', sort, true)}</tr></thead><tbody>
        ${rows.map((x) => `<tr><td><button class="pairbtn" type="button" data-pair="${esc(pairKey(x.a, x.b))}">${esc(nameOf(x.a))} <span class="dot">—</span> ${esc(nameOf(x.b))}</button>
          <span class="sub">${esc(x.skupiskaA.map(shortOf).join(' · '))} ↔ ${esc(x.skupiskaB.map(shortOf).join(' · '))}</span></td>
          <td class="num">${x.objazd == null ? 'brak' : `${x.objazd} ${plural(x.objazd, ['krok', 'kroki', 'kroków'])}`}</td><td class="num">${pct(x.posrednictwo)}</td></tr>`).join('')}</tbody></table></div>`;
      if (!rows.length) html += '<p class="empty">Brak powiązań osób z rozłącznych skupisk przy tych ustawieniach.</p>';
    }
    html += optsHtml();
    return html + anNote('Ranking opisuje położenie w danych grafu, nie znaczenie ani ocenę osoby.');
  }

  function renderAnSearch(an: Extract<An, { t: 'search' }>) {
    if (searchCache.q !== an.q || !searchCache.r) searchCache = { q: an.q, r: Analiza.szukaj(nodes, edges, data.sources, an.q) };
    const r = searchCache.r!, w = r.wzorzec;
    const counts: Record<string, number> = { osoby: r.wezly.length, tresc: r.fakty.length, zrodla: r.zrodla.length };
    const tab = an.tab || (counts.osoby ? 'osoby' : counts.tresc ? 'tresc' : counts.zrodla ? 'zrodla' : 'tresc');
    const LIMIT = 150;
    let html = anHead('Wyszukiwanie', `„${esc(an.q)}”`, true);
    html += `<div class="tabs" role="group" aria-label="Wyniki">${tabChip('osoby', `Osoby i instytucje · ${counts.osoby}`, tab)}${tabChip('tresc', `Treść · ${counts.tresc}`, tab)}${tabChip('zrodla', `Źródła · ${counts.zrodla}`, tab)}</div>`;
    if (!counts[tab]) html += `<p class="empty">Brak wyników w tej zakładce.</p>`;
    else if (tab === 'osoby') {
      html += `<ul class="hits">${r.wezly.slice(0, LIMIT).map((x) => {
        const n = byId.get(x.id)!;
        return `<li><button class="who" type="button" data-node="${esc(n.id)}">${markText(n.name, w)}</button><span class="kind">${TYPE_SHORT[n.type]}</span>${n.note ? `<p class="src">${markText(n.note, w)}</p>` : ''}</li>`;
      }).join('')}</ul>`;
    } else if (tab === 'tresc') {
      html += `<ul class="rels">${r.fakty.slice(0, LIMIT).map((f) => factItem(f, {
        mark: f.wTresci ? w : null,
        after: !f.wTresci ? f.wZrodle.map((id) => `<p class="src">Trafienie w źródle: ${markText(`${data.sources[id].title} · ${data.sources[id].publisher}`, w)}</p>`).join('') : '',
      })).join('')}</ul>`;
    } else html += `<ul class="hits">${r.zrodla.slice(0, LIMIT).map((id) => srcRow(id, w)).join('')}</ul>`;
    if (counts[tab] > LIMIT) html += `<p class="src">Pokazano ${LIMIT} z ${counts[tab]} — zawęź frazę.</p>`;
    html += `<p class="src mt">${typo('Bez wielkości liter i polskich znaków, z prostą odmianą: „rada społeczna” znajdzie też „radzie społecznej”. Wszystkie słowa muszą wystąpić.')}</p>`;
    return html;
  }

  /* ---------- Legenda i filtry rodzaju, pewności, partii ---------- */
  function sample(color: string, width: number, dash: string | null, round = false) {
    return `<svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" style="stroke:${color};stroke-width:${width};${dash ? `stroke-dasharray:${dash};` : ''}${round ? 'stroke-linecap:round;' : ''}"/></svg>`;
  }
  function voteGlyph(v: string) {
    return `<svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" style="stroke:var(--text);stroke-width:1.4"/><circle class="vote-${v.toLowerCase()}" cx="10" cy="6" r="${v === 'ABSTAIN' ? 2.2 : 4.5}"/></svg>`;
  }

  function renderLegend() {
    const cats = CAT_KEYS.map((k) =>
      `<label class="filter"><input type="checkbox" data-cat="${k}" checked>${sample(CAT[k].color, 2, null)}<span>${CAT[k].label}</span></label>`).join('');
    const filters = STATUS_KEYS.map((k) => {
      const s = STATUS[k];
      return `<label class="filter" title="${esc(s.desc)}"><input type="checkbox" data-status="${k}" checked>
        ${sample('var(--ink)', s.width, s.dash, k === 'media')}<span>${s.label}</span></label>`;
    }).join('');
    const counts = new Map<string, number>();
    for (const n of nodes) if (n.party) counts.set(n.party.name, (counts.get(n.party.name) ?? 0) + 1);
    const parties = [...counts].sort((a, b) => b[1] - a[1]).map(([name, c]) => {
      const src = logoSrc({ name });
      const logo = src ? `<img src="${esc(src)}" alt="">` : '';
      return `<button class="party" type="button" data-party="${esc(name)}">${logo}${esc(name)} · ${c}</button>`;
    }).join('');
    legendBody.innerHTML = `
      <div class="legend-grid"><p class="mono-label">Rodzaj (kolor)</p>${cats}</div>
      <div class="legend-grid"><p class="mono-label">Pewność (kształt)</p>${filters}</div>
      <div><p class="mono-label legend-sub">Kluby i partie — kliknij, by podświetlić</p><div class="parties">${parties}</div></div>`;
    legendBody.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      const st = t.dataset.status as Status | undefined, cat = t.dataset.cat as CatKey | undefined;
      if (st) t.checked ? activeStatus.add(st) : activeStatus.delete(st);
      if (cat) t.checked ? activeCat.add(cat) : activeCat.delete(cat);
      applyFilter();
    });
  }

  /* ---------- Kamera ---------- */
  // Obrys węzłów wyniku analizy (z miejscem na podpisy) — kamera dopasowuje się do niego, nie do całego grafu.
  function nodesBox(ids: string[]) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of ids) {
      const n = byId.get(id);
      if (!n || n.x == null || n.y == null) continue;
      const hw = Math.max(n.r + 10, labelHalf(n));
      x0 = Math.min(x0, n.x - hw); x1 = Math.max(x1, n.x + hw);
      y0 = Math.min(y0, n.y - n.r - 26); y1 = Math.max(y1, n.y + n.r + 50);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }
  function camTo(t: ZoomTransform, animate: boolean, ms = 400) {
    if (animate && !reducedMotion()) svg.transition().duration(ms).call(zoom.transform, t);
    else svg.call(zoom.transform, t);
  }
  function fit(animate: boolean) {
    camera = { mode: 'fit' };
    const ids = focus?.nodes.size ? [...focus.nodes].filter((id) => shownSet.has(id)) : null;
    const box = (ids?.length && nodesBox(ids)) || root.node()!.getBBox();
    const { width, height } = svgEl.getBoundingClientRect();
    if (!width || !height || !box.width) return;
    // Pasek widoku/analizy stoi u góry płótna, a na wąskim ekranie — na dole.
    const vb = $('viewbar');
    const barOn = vb.classList.contains('is-on');
    const barLow = barOn && vb.offsetTop > height / 2;
    const pad = 30;
    const top = barOn && !barLow ? vb.offsetHeight + 28 : pad;
    const bottom = barLow ? vb.offsetHeight + 24 : pad;
    const [k0, k1] = zoom.scaleExtent();
    const k = Math.max(k0, Math.min(0.85, k1, (width - pad * 2) / box.width, (height - top - bottom) / box.height));
    camTo(zoomIdentity
      .translate(width / 2 - k * (box.x + box.width / 2), top + (height - top - bottom) / 2 - k * (box.y + box.height / 2))
      .scale(k), animate);
  }
  function centerOn(n: { x?: number; y?: number }, animate = true, k = 0.85) {
    const { width, height } = svgEl.getBoundingClientRect();
    camTo(zoomIdentity.translate(width / 2 - k * (n.x ?? 0), height / 2 - k * (n.y ?? 0)).scale(k), animate);
    camera = { mode: 'center', target: n };
  }
  // Węzeł albo para z panelu poza kadrem — wyśrodkuj, bez zmiany przybliżenia w dół.
  function ensureVisible(p?: { x?: number; y?: number }) {
    if (!p || p.x == null || p.y == null) return;
    const t = zoomTransform(svgEl);
    const { width, height } = svgEl.getBoundingClientRect();
    const [x, y] = t.apply([p.x, p.y]);
    if (x < 40 || x > width - 60 || y < 20 || y > height - 40) centerOn(p, true, Math.max(t.k, 0.9));
  }

  // Przybliżenie o czynnik wokół punktu (domyślnie środek płótna); wspólne dla dwukliku, przycisków i suwaka.
  function zoomBy(factor: number, p?: [number, number]) {
    const k = zoomTransform(svgEl).k * factor;
    if (reducedMotion()) svg.call(zoom.scaleTo, k, p);
    else svg.transition().duration(250).call(zoom.scaleTo, k, p);
  }
  function setupZoomControls() {
    const range = $<HTMLInputElement>('zoom-range');
    const [k0, k1] = zoom.scaleExtent();
    // Suwak w skali logarytmicznej: ten sam krok to to samo „razy”, przy każdym przybliżeniu.
    range.min = Math.log2(k0).toFixed(3);
    range.max = Math.log2(k1).toFixed(3);
    range.step = '0.01';
    // Zmiana wokół środka płótna — wyśrodkowany węzeł zostaje wyśrodkowany.
    const keep = () => { if (camera.mode !== 'center') camera = { mode: 'free' }; };
    range.addEventListener('input', () => { keep(); svg.call(zoom.scaleTo, 2 ** Number(range.value)); });
    $('zoom-in').addEventListener('click', () => { keep(); zoomBy(1.5); });
    $('zoom-out').addEventListener('click', () => { keep(); zoomBy(1 / 1.5); });
    $('zoom-fit').addEventListener('click', () => fit(true));
    syncZoomControls(zoomTransform(svgEl).k);
  }
  function syncZoomControls(k: number) {
    const range = host.querySelector<HTMLInputElement>('#kst-zoom-range');
    if (!range?.max) return;
    const [k0, k1] = zoom.scaleExtent();
    if (document.activeElement !== range || Math.abs(2 ** Number(range.value) - k) > 0.01) range.value = String(Math.log2(k));
    range.setAttribute('aria-valuetext', `${Math.round(k * 100)}%`);
    $<HTMLButtonElement>('zoom-in').disabled = k >= k1 - 1e-6;
    $<HTMLButtonElement>('zoom-out').disabled = k <= k0 + 1e-6;
  }

  // Zmiana rozmiaru płótna: dopasowany widok dopasowuje się od nowa, wyśrodkowany węzeł zostaje na środku,
  // a ręcznie ustawiona kamera trzyma ten sam punkt grafu na środku płótna.
  function onResize() {
    const { width, height } = svgEl.getBoundingClientRect();
    if (!width || !height) return;
    const prev = lastSize;
    lastSize = { width, height };
    if (prev && prev.width === width && prev.height === height) return;
    if (camera.mode === 'fit') fit(false);
    else if (camera.mode === 'center') centerOn(camera.target, false, zoomTransform(svgEl).k);
    else if (prev) {
      const k = zoomTransform(svgEl).k;
      svg.call(zoom.translateBy, (width - prev.width) / 2 / k, (height - prev.height) / 2 / k);
    }
  }

  /* ---------- Gesty: komunikat, pełny ekran, okienko z instrukcją ---------- */
  let toastTimer = 0;
  function gestureToast(text: string) {
    const el = $('toast');
    if (!el.hidden && el.textContent === text) return;
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { el.hidden = true; }, 1600);
  }
  const INTRO_KEY = 'konstelacja-gesty-v1';
  const coarse = () => matchMedia('(pointer: coarse)').matches;
  function showIntro() {
    $('intro-list').innerHTML = (coarse()
      ? ['<b>Jednym palcem</b> przewijasz stronę.', '<b>Dwoma palcami</b> przesuwasz i przybliżasz graf.',
        '<b>Stuknij punkt</b>, żeby zobaczyć szczegóły i źródła.', '<b>Ukośne strzałki</b> w rogu grafu otwierają go na pełnym ekranie — tam działa każdy gest.']
      : ['<b>Kółko</b> przewija stronę, <b>Ctrl (⌘) + kółko</b> przybliża graf; przybliża też dwuklik i suwak.',
        '<b>Przeciągnij tło</b>, żeby przesunąć graf, a <b>punkt</b> — żeby go przestawić.',
        '<b>Kliknij punkt</b>, żeby zobaczyć szczegóły i źródła; Shift+klik drugiej osoby porównuje.', '<b>Ukośne strzałki</b> w rogu grafu — pełny ekran (Esc zamyka).'])
      .map((x) => `<li>${x}</li>`).join('');
    $('intro').hidden = false;
  }
  function hideIntro() {
    $('intro').hidden = true;
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* bez pamięci — pokaże się przy następnej wizycie */ }
  }
  function setFull(on: boolean) {
    host.classList.toggle('is-full', on);
    document.documentElement.classList.toggle('kst-lock', on);
    const b = $<HTMLButtonElement>('full');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Zamknij pełny ekran' : 'Pełny ekran');
    b.title = on ? 'Zamknij pełny ekran (Esc)' : 'Pełny ekran';
  }
  function setupGestures() {
    $('full').addEventListener('click', () => setFull(!isFull()));
    $('help').addEventListener('click', showIntro);
    $('intro-ok').addEventListener('click', hideIntro);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('intro').hidden) hideIntro();
      else if (isFull()) setFull(false);
    });
    // Pierwsze dotknięcie płótna poza okienkiem zamyka instrukcję (i działa dalej jak zwykły gest).
    svgEl.addEventListener('pointerdown', () => { if (!$('intro').hidden) hideIntro(); });
    // Jeden palec poziomo po grafie (próba przesunięcia) — podpowiedź o dwóch palcach; pionowo to zwykłe przewijanie strony.
    let start: { x: number; y: number } | null = null;
    svgEl.addEventListener('touchstart', (e) => { start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
    svgEl.addEventListener('touchmove', (e) => {
      if (!start || isFull() || e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - start.x), dy = Math.abs(e.touches[0].clientY - start.y);
      if (dx > 24 && dx > dy * 1.5) { gestureToast('Użyj dwóch palców, aby przesuwać graf'); start = null; }
    }, { passive: true });
    let seen = false;
    try { seen = localStorage.getItem(INTRO_KEY) === '1'; } catch { /* brak dostępu — pokaż */ }
    if (!seen) showIntro();
  }

  /* ---------- Start ---------- */
  layoutAll();
  draw();
  setupZoomControls();
  setupGestures();
  setupToolbar();
  renderLegend();
  setupHistory(); // pierwszy applyFilter — ze stanem z adresu, jeśli jest
  new ResizeObserver(onResize).observe(svgEl);
  host.classList.add('is-ready');
}

/** Rejestruje <zl-konstelacja>; dane grafu i adresy logotypów partii przychodzą z modułu i z atrybutu. */
export function defineKonstelacja(data: GraphData) {
  if (customElements.get('zl-konstelacja')) return;
  customElements.define('zl-konstelacja', class extends HTMLElement {
    connectedCallback() {
      if (this.classList.contains('is-ready')) return;
      const raw = this.querySelector('script.kst-config')?.textContent;
      const config: Config = raw ? JSON.parse(raw) : { logos: {} };
      initKonstelacja(this, data, config);
    }
  });
}
