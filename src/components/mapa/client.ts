/**
 * Zachowanie mapy PolandMap (element <zl-map>): przełączanie warstw, dymki, podświetlenia, warstwy na żywo.
 * Barwy województw każdej warstwy są w <script type="application/json"> wewnątrz elementu (mapa bez
 * nich, interactive={false}, zostaje statyczna), a treść dymków w pliku z `data-tips`, pobieranym
 * przy pierwszym ruchu nad mapą. Warstwa na żywo (PointLayer.live) od razu wczytuje swój plik,
 * przepuszcza go przez adapter (lib/mapa/live), barwi koła, układa je od nowa i wypełnia panel.
 * Wyszukiwarka (PointLayer.search) szuka po tytule i podpisie dymków i przypina dymek wybranego punktu.
 */
import { fold, formatEN, formatPL, plural } from '@/lib/format';
import { liveAdapters, type LiveResult } from '@/lib/mapa/live';
import { drawOrder, R_MISSING, radius, relax, type RelaxNode } from '@/lib/mapa/relax';
import { toneOf } from '@/lib/mapa/scale';
import type { LiveAdapterId, Radius, Tip, TipRow } from '@/lib/mapa/types';

interface LayerData {
  id: string;
  kind: 'regions' | 'points';
  alt: string;
  /** kod TERYT województwa → [klasa, podpis] */
  regions?: Record<string, [number, string]>;
  /** tylko warstwy na żywo */
  live?: { url: string; adapter: LiveAdapterId; text?: object };
  scale?: { edges: number[]; tones?: number[] };
  radius?: Radius;
  /** identyfikatory punktów (po indeksie) */
  keys?: (string | null)[];
  /** miejsca punktów przed rozsunięciem (po indeksie); null = punkt bez położenia */
  anchors?: ([number, number] | null)[];
}

/** warstwa → dymki punktów (po indeksie punktu) albo województw (po kodzie TERYT) */
type Tips = Record<string, Tip[] | Record<string, Tip>>;
type Target = { point: number } | { region: string };

/** zasięg trafienia poza krawędzią koła, w px ekranu */
const REACH = { mouse: 7, touch: 14 };
/** najwięcej podpowiedzi wyszukiwarki */
const SEARCH_MAX = 8;
/** powiększenie najechanego koła — to samo co w stylach (.pm-pt.is-on) */
const GROW = 1.4;
const SVG_NS = 'http://www.w3.org/2000/svg';
const f1 = (v: number) => String(Math.round(v * 10) / 10);

/** Element z tekstem — dane trafiają do DOM przez textContent, nigdy przez innerHTML. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

class PolandMap extends HTMLElement {
  private layers = new Map<string, LayerData>();
  private svg!: SVGSVGElement;
  private tip!: HTMLElement;
  private fig!: HTMLElement;
  private pinned = false;
  private tips: Tips | null = null;
  private loading: Promise<void> | null = null;
  /** cel, na który czeka dymek, dopóki treść się nie wczyta */
  private want: Target | null = null;
  private lit: Element[] = [];
  /** pulsujące kółko pod najechanym punktem */
  private ring: SVGCircleElement | null = null;
  /** koła warstw punktowych: [indeks punktu, x, y, r] — czytane z DOM przy pierwszym użyciu */
  private hits = new Map<string, [number, number, number, number][]>();
  /** wyszukiwarka: podpowiedzi na ekranie i zaznaczona (strzałkami) */
  private found: { i: number; title: string; meta: string }[] = [];
  private cursor = -1;

  connectedCallback() {
    const raw = this.querySelector('.pm-data');
    if (!raw || this.layers.size) return;
    for (const l of (JSON.parse(raw.textContent!) as { layers: LayerData[] }).layers) this.layers.set(l.id, l);
    this.svg = this.querySelector('.pm-svg')!;
    this.tip = this.querySelector('.pm-tip')!;
    this.fig = this.querySelector('.pm-map')!;

    this.querySelectorAll<HTMLButtonElement>('.pm-seg button').forEach((b) => b.addEventListener('click', () => this.show(b.dataset.layer!)));
    this.addEventListener('pointerenter', () => this.load(), { once: true });

    this.svg.addEventListener('pointermove', (e) => {
      if (this.pinned || e.pointerType === 'touch') return;
      const t = this.target(e);
      t ? this.open(t) : this.close();
    });
    this.svg.addEventListener('pointerleave', () => this.close());
    this.svg.addEventListener('click', (e) => {
      const t = this.target(e);
      t ? this.pin(t) : this.close(true);
    });
    document.addEventListener('click', (e) => {
      const t = e.target as Element;
      if (this.pinned && !this.fig.contains(t) && !t.closest?.('.pm-top, .pm-search')) this.close(true);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(true); });

    this.querySelectorAll<HTMLElement>('.pm-rank li').forEach((li) => {
      li.addEventListener('pointerenter', () => { if (!this.pinned) this.open({ region: li.dataset.r! }); });
      li.addEventListener('pointerleave', () => this.close());
    });

    this.setupSearch();
    for (const l of this.layers.values()) if (l.live) void this.live(l);
  }

  private get active() {
    return this.layers.get(this.dataset.active!)!;
  }

  /** Przełącza warstwę: przycisk, panel, podpis, koła, barwy i podpisy województw, opis dla czytników. */
  show(id: string) {
    const layer = this.layers.get(id);
    if (!layer) return;
    this.close(true);
    this.dataset.active = id;
    this.dataset.kind = layer.kind;
    this.querySelectorAll<HTMLButtonElement>('.pm-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layer === id)));
    this.querySelectorAll<HTMLElement>('.pm-panel, .pm-foot').forEach((el) => { el.hidden = el.dataset.layer !== id; });
    this.querySelectorAll('.pm-pts').forEach((g) => g.classList.toggle('is-off', g.getAttribute('data-layer') !== id));
    this.querySelectorAll('.pm-reg').forEach((p) => p.setAttribute('data-tone', String(layer.regions?.[p.getAttribute('data-r')!]?.[0] ?? '')));
    this.querySelectorAll('.pm-val').forEach((t) => {
      const v = layer.regions?.[t.getAttribute('data-r')!];
      t.setAttribute('data-tone', String(v?.[0] ?? ''));
      t.textContent = v?.[1] ?? '';
    });
    const desc = this.svg.querySelector('desc');
    if (desc) desc.textContent = layer.alt;
  }

  private load() {
    this.loading ??= fetch(this.dataset.tips!)
      .then((r) => (r.ok ? (r.json() as Promise<Tips>) : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((tips) => {
        this.tips = tips;
        if (this.want) this.open(this.want);
      })
      .catch((error) => console.error('[mapa] dymki:', error));
    return this.loading;
  }

  /* ---------- warstwy na żywo ---------- */

  private async live(layer: LayerData) {
    const panel = this.querySelector<HTMLElement>(`.pm-panel[data-layer="${layer.id}"]`);
    try {
      const [data, adapt] = await Promise.all([
        fetch(layer.live!.url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
        liveAdapters[layer.live!.adapter](),
        this.load(),
      ]);
      const tips = this.tips?.[layer.id];
      if (!Array.isArray(tips)) throw new Error('brak dymków warstwy');
      this.applyLive(layer, adapt(data, { keys: layer.keys ?? [], tips, text: layer.live!.text }));
    } catch (error) {
      console.error('[mapa] dane na żywo:', error);
      const stamp = panel?.querySelector('.pm-stamp');
      if (stamp) stamp.textContent = this.dataset.error ?? 'Nie udało się wczytać danych. Spróbuj odświeżyć stronę za kilka minut.';
      this.dataset.live = 'error';
    }
  }

  /** Barwy i wielkości kół z adaptera, nowy układ (większe koła trzeba rozsunąć), panel i dymki. */
  private applyLive(layer: LayerData, out: LiveResult) {
    const g = this.svg.querySelector(`.pm-pts[data-layer="${layer.id}"]`);
    if (!g) return;
    const { width, height } = this.svg.viewBox.baseVal;
    const nodes: (RelaxNode & { i: number })[] = [];
    out.points.forEach((p, i) => {
      const a = layer.anchors?.[i];
      if (!a) return;
      const tone = p.value == null || !layer.scale ? null : toneOf(p.value, layer.scale);
      nodes.push({ i, ax: a[0], ay: a[1], x: a[0], y: a[1], r: tone == null ? R_MISSING : radius(p.size, layer.radius), tone });
    });
    relax(nodes);
    const circles = new Map([...g.querySelectorAll<SVGCircleElement>('circle.pm-pt')].map((c) => [Number(c.dataset.i), c]));
    for (const n of nodes.sort(drawOrder)) {
      const c = circles.get(n.i);
      if (!c) continue;
      c.setAttribute('cx', f1(Math.min(width, Math.max(0, n.x))));
      c.setAttribute('cy', f1(Math.min(height, Math.max(0, n.y))));
      c.setAttribute('r', f1(n.r));
      c.setAttribute('class', n.tone == null ? 'pm-pt pm-pt--none' : 'pm-pt');
      if (n.tone == null) c.removeAttribute('data-tone');
      else c.setAttribute('data-tone', String(n.tone));
      g.appendChild(c);
    }
    this.hits.delete(layer.id);
    (this.tips ??= {})[layer.id] = out.points.map((p) => p.tip);

    const panel = this.querySelector<HTMLElement>(`.pm-panel[data-layer="${layer.id}"]`);
    // zapis liczb: data-locale stawia PolandMap tylko poza polską wersją
    const num = this.dataset.locale === 'en' ? formatEN : formatPL;
    if (panel) {
      if (out.summary) {
        panel.querySelector('.pm-big b')!.textContent = out.summary.value;
        panel.querySelector('.pm-big span')!.textContent = out.summary.text;
      }
      panel.querySelectorAll<HTMLElement>('[data-c]').forEach((n) => { n.textContent = num(out.counts[Number(n.dataset.c)] ?? 0); });
      const missing = panel.querySelector('[data-missing]');
      if (missing) missing.textContent = num(out.missing);
      const stamp = panel.querySelector('.pm-stamp');
      if (stamp) stamp.textContent = out.stamp;
      this.fillTop(panel, out.top ?? []);
    }
    this.dataset.live = 'ok';
    if (this.want && this.active.id === layer.id) this.open(this.want);
  }

  /** Lista wyróżnionych punktów: najechanie pokazuje dymek, kliknięcie (albo Enter) go przypina. */
  private fillTop(panel: HTMLElement, top: NonNullable<LiveResult['top']>) {
    const box = panel.querySelector<HTMLElement>('.pm-topbox');
    if (!box) return;
    box.querySelector('ol')!.replaceChildren(
      ...top.map((t) => {
        const li = el('li');
        li.dataset.i = String(t.i);
        li.tabIndex = 0;
        const name = el('span', t.title, 'pm-top__name');
        if (t.meta) name.append(el('span', t.meta, 'pm-top__meta'));
        const value = el('span', '', 'pm-top__val');
        value.append(el('b', t.value), t.detail);
        li.append(name, value);
        li.addEventListener('pointerenter', () => { if (!this.pinned) this.open({ point: t.i }); });
        li.addEventListener('pointerleave', () => this.close());
        li.addEventListener('click', () => this.pin({ point: t.i }));
        li.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          this.pin({ point: t.i });
        });
        return li;
      }),
    );
    box.hidden = !top.length;
  }

  /* ---------- wyszukiwarka ---------- */

  private setupSearch() {
    const box = this.querySelector<HTMLElement>('.pm-search');
    if (!box) return;
    const input = box.querySelector<HTMLInputElement>('input')!;
    const list = box.querySelector<HTMLUListElement>('[role="listbox"]')!;
    const status = box.querySelector('.pm-search__status');
    const layerId = box.dataset.layer!;
    // formy „wynik / wyniki” z serwera (data-results, poza polską wersją: jedna | wiele)
    const forms = box.dataset.results?.split('|');
    const results = (n: number) => (forms ? (n === 1 ? forms[0] : forms[forms.length - 1]) : plural(n, ['wynik', 'wyniki', 'wyników']));
    let touch = false;

    const close = () => {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      this.cursor = -1;
    };
    const mark = (k: number) => {
      this.cursor = k;
      list.querySelectorAll('[role="option"]').forEach((li, n) => li.setAttribute('aria-selected', String(n === k)));
      const li = list.querySelector<HTMLElement>(`[role="option"]:nth-child(${k + 1})`);
      if (li) {
        input.setAttribute('aria-activedescendant', li.id);
        li.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    };
    const choose = (k: number) => {
      const hit = this.found[k];
      if (!hit) return;
      input.value = hit.title;
      close();
      this.pick(layerId, hit.i);
    };
    const render = async () => {
      const q = fold(input.value.trim());
      if (q.length < 2) return close();
      await this.load();
      const tips = this.tips?.[layerId];
      if (!Array.isArray(tips)) return close();
      const words = q.split(/\s+/);
      // kolejność: miejscowość z podpisu (do „·”) zaczyna się od zapytania, potem zapytanie zaczyna
      // dowolne słowo (nazwa, ulica), potem trafienie w środku słowa; w grupie alfabetycznie
      const starts = (text: string) => text.split(/[\s·,.()„”"-]+/).some((part) => part.startsWith(words[0]));
      this.found = tips
        .map((t, i) => {
          const meta = t.meta ?? '';
          const key = fold(`${t.title} ${meta}`);
          const place = fold(meta.split(' · ')[0]);
          return { i, title: t.title, meta, key, rank: place.startsWith(words[0]) ? 2 : starts(key) ? 1 : 0 };
        })
        .filter((t) => words.every((w) => t.key.includes(w)))
        .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title, 'pl'))
        .slice(0, SEARCH_MAX);
      list.replaceChildren(
        ...(this.found.length
          ? this.found.map((t, n) => {
              const li = el('li');
              li.id = `${list.id}-${n}`;
              li.setAttribute('role', 'option');
              li.setAttribute('aria-selected', 'false');
              li.append(el('span', t.title, 'pm-search__name'), el('span', t.meta, 'pm-search__meta'));
              // pointerdown bez domyślnej akcji: pole nie traci fokusu, więc lista nie znika. Wybór
              // dopiero na click — gdyby lista zniknęła już na pointerdown, click trafiłby w to, co
              // pod nią, a „kliknięcie poza mapą” od razu zamknęłoby przypięty dymek.
              li.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                touch = e.pointerType === 'touch';
              });
              li.addEventListener('click', () => {
                choose(n);
                // na telefonie chowamy klawiaturę, żeby nie zasłaniała dymku
                if (touch) input.blur();
              });
              return li;
            })
          : [el('li', box.dataset.empty ?? '', 'pm-search__empty')]),
      );
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      this.cursor = -1;
      if (status) status.textContent = this.found.length ? `${this.found.length} ${results(this.found.length)}` : box.dataset.empty ?? '';
    };

    input.addEventListener('input', () => void render());
    input.addEventListener('focus', () => void (input.value.trim().length >= 2 ? render() : this.load()));
    input.addEventListener('blur', close);
    input.addEventListener('keydown', (e) => {
      const n = this.found.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (list.hidden) return void render();
        e.preventDefault();
        if (n) mark(e.key === 'ArrowDown' ? (this.cursor + 1) % n : (this.cursor - 1 + n) % n);
      } else if (e.key === 'Enter') {
        if (list.hidden || !n) return;
        e.preventDefault();
        choose(this.cursor < 0 ? 0 : this.cursor);
      } else if (e.key === 'Escape') {
        if (!list.hidden) {
          e.stopPropagation();
          close();
        } else input.value = '';
      }
    });
  }

  /**
   * Wybór z wyszukiwarki: warstwa, przypięty dymek z pulsowaniem, a gdy dymka nie widać — przewinięcie
   * do niego (html ma scroll-padding-top na wysokość nagłówka, więc dymek nie chowa się pod nim).
   */
  private pick(layerId: string, i: number) {
    if (this.active.id !== layerId) this.show(layerId);
    this.pin({ point: i });
    requestAnimationFrame(() => {
      const box = this.tip.getBoundingClientRect();
      const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (box.top < header || box.bottom > window.innerHeight) this.tip.scrollIntoView({ block: 'nearest' });
    });
  }

  /* ---------- trafienie, dymek, podświetlenie ---------- */

  /** Co jest pod wskaźnikiem: najbliższe koło aktywnej warstwy albo województwo. */
  private target(e: PointerEvent | MouseEvent): Target | null {
    if (this.active.kind === 'regions') {
      const p = (e.target as Element).closest('.pm-reg');
      return p ? { region: p.getAttribute('data-r')! } : null;
    }
    const m = this.svg.getScreenCTM();
    if (!m) return null;
    const x = (e.clientX - m.e) / m.a, y = (e.clientY - m.f) / m.d;
    const reach = ('pointerType' in e && e.pointerType === 'touch' ? REACH.touch : REACH.mouse) / m.a;
    let best: number | null = null, bestD = Infinity;
    for (const [i, cx, cy, r] of this.circles()) {
      const d = Math.hypot(cx - x, cy - y) - r;
      if (d < reach && d < bestD) { bestD = d; best = i; }
    }
    return best == null ? null : { point: best };
  }

  private circles() {
    const id = this.active.id;
    if (!this.hits.has(id)) {
      const g = this.svg.querySelector(`.pm-pts[data-layer="${id}"]`);
      this.hits.set(id, [...(g?.querySelectorAll<SVGCircleElement>('circle.pm-pt') ?? [])].map((c) => [Number(c.dataset.i), c.cx.baseVal.value, c.cy.baseVal.value, c.r.baseVal.value]));
    }
    return this.hits.get(id)!;
  }

  private pin(t: Target) {
    this.pinned = true;
    this.open(t);
    this.tip.classList.add('is-pinned');
  }

  private open(t: Target) {
    const layer = this.active;
    this.want = t;
    if (!this.tips) return void this.load();
    let tip: Tip | undefined, anchor: [number, number], els: Element[], dot: SVGCircleElement | null = null;
    if ('point' in t) {
      dot = this.svg.querySelector<SVGCircleElement>(`.pm-pts[data-layer="${layer.id}"] circle.pm-pt[data-i="${t.point}"]`);
      if (!dot) return;
      tip = (this.tips[layer.id] as Tip[] | undefined)?.[t.point];
      anchor = [dot.cx.baseVal.value, dot.cy.baseVal.value - dot.r.baseVal.value * GROW];
      els = [dot, ...this.querySelectorAll(`.pm-top li[data-i="${t.point}"]`)];
    } else {
      const path = this.svg.querySelector(`.pm-reg[data-r="${t.region}"]`)!;
      const label = this.svg.querySelector<SVGTextElement>(`.pm-val[data-r="${t.region}"]`)!;
      tip = (this.tips[layer.id] as Record<string, Tip> | undefined)?.[t.region];
      anchor = [Number(label.getAttribute('x')), Number(label.getAttribute('y')) - 10];
      // na wierzch, żeby obrys podświetlenia nie chował się pod sąsiadami
      path.parentNode!.appendChild(path);
      els = [path, ...this.querySelectorAll(`.pm-rank li[data-r="${t.region}"]`)];
    }
    if (!tip) return;
    this.light(els);
    this.pulse(dot);
    this.fill(tip);
    this.place(anchor);
    // przypięty dymek ogłaszamy stronie (np. wykres doby wybranego SOR pod mapą, components/sor/SorDayChart)
    if (this.pinned) this.dispatchEvent(new CustomEvent('pm-pin', { bubbles: true, detail: { layer: layer.id, tip } }));
  }

  close(force = false) {
    if (this.pinned && !force) return;
    this.want = null;
    this.pinned = false;
    this.tip.hidden = true;
    this.tip.classList.remove('is-pinned');
    this.light([]);
    this.pulse(null);
  }

  private light(els: Element[]) {
    this.lit.forEach((el) => el.classList.remove('is-on'));
    els.forEach((el) => el.classList.add('is-on'));
    this.lit = els;
  }

  /**
   * Najechane koło wychodzi na wierzch (rośnie w stylach), a spod niego rozchodzi się pulsujące
   * kółko w jego kolorze. Wstawienie kółka do DOM uruchamia animację od początku — dlatego tylko
   * przy zmianie punktu, nie przy każdym ruchu wskaźnika.
   */
  private pulse(dot: SVGCircleElement | null) {
    if (!dot) {
      this.ring?.remove();
      return;
    }
    const g = dot.parentNode!;
    if (g.lastElementChild !== dot) g.appendChild(dot);
    const ring = (this.ring ??= document.createElementNS(SVG_NS, 'circle'));
    if (ring.parentNode === g && ring.dataset.for === dot.dataset.i) return;
    ring.setAttribute('class', dot.classList.contains('pm-pt--none') ? 'pm-pulse pm-pulse--none' : 'pm-pulse');
    ring.setAttribute('aria-hidden', 'true');
    for (const a of ['cx', 'cy', 'r']) ring.setAttribute(a, dot.getAttribute(a)!);
    if (dot.dataset.tone) ring.dataset.tone = dot.dataset.tone;
    else delete ring.dataset.tone;
    ring.dataset.for = dot.dataset.i;
    g.insertBefore(ring, dot);
  }

  /** Treść dymku przez textContent — dane nie trafiają do innerHTML. */
  private fill(tip: Tip) {
    const parts: Node[] = [el('strong', tip.title)];
    if (tip.meta) parts.push(el('span', tip.meta, 'pm-tip__meta'));
    if (tip.stats?.length) {
      const stats = el('div', '', 'pm-tip__stats');
      for (const [value, label] of tip.stats) {
        const item = el('div');
        item.append(el('b', value), el('span', label));
        stats.append(item);
      }
      parts.push(stats);
    }
    if (tip.profile?.values.length) parts.push(this.profile(tip.profile));
    const table = !!tip.rows?.length && (!!tip.cols || tip.rows.some((r) => !Array.isArray(r)));
    if (tip.rows?.length && !table) {
      const dl = document.createElement('dl');
      for (const [k, v] of tip.rows as [string, string][]) dl.append(el('dt', k), el('dd', v));
      parts.push(dl);
    }
    if (table) parts.push(this.table(tip));
    if (tip.foot) parts.push(el('p', tip.foot, 'pm-tip__foot'));
    if (tip.href) {
      const a = el('a', `${tip.hrefLabel ?? 'źródło'} ↗`);
      a.href = tip.href;
      a.target = '_blank';
      a.rel = 'noopener';
      parts.push(a);
    }
    if (tip.warn) parts.push(el('p', tip.warn, 'pm-tip__warn'));
    this.tip.classList.toggle('pm-tip--wide', table);
    this.tip.replaceChildren(...parts);
  }

  /** Słupki profilu (Tip.profile): wysokość jako --k (0–1) wspólnej skali z wartością `now`. */
  private profile(p: NonNullable<Tip['profile']>) {
    const box = el('div', '', 'pm-tip__profile');
    box.append(el('p', p.title, 'pm-tip__plabel'));
    const max = Math.max(1, ...p.values.map((v) => v ?? 0), p.now ?? 0);
    const bars = el('div', '', 'pm-tip__bars');
    bars.setAttribute('aria-hidden', 'true');
    bars.style.setProperty('--n', String(p.values.length));
    p.values.forEach((v, i) => {
      const bar = el('i', '', i === p.mark ? 'is-mark' : undefined);
      bar.style.setProperty('--k', String((v ?? 0) / max));
      bars.append(bar);
    });
    if (p.now != null && p.mark != null) {
      const now = el('span', '', 'pm-tip__now');
      now.style.setProperty('--k', String(p.now / max));
      now.style.setProperty('--i', String(p.mark));
      bars.append(now);
    }
    box.append(bars);
    if (p.ticks?.length) {
      const ticks = el('div', '', 'pm-tip__ticks');
      ticks.setAttribute('aria-hidden', 'true');
      ticks.style.setProperty('--n', String(p.ticks.length));
      for (const t of p.ticks) ticks.append(el('span', t));
      box.append(ticks);
    }
    if (p.note) box.append(el('p', p.note, 'pm-tip__pnote'));
    if (p.caption) box.append(el('p', p.caption, 'pm-tip__pcap'));
    return box;
  }

  private table(tip: Tip) {
    const table = el('table', '', 'pm-tip__table');
    if (tip.cols) {
      const tr = el('tr');
      tip.cols.forEach((c) => tr.append(el('th', c)));
      table.append(el('thead'));
      table.tHead!.append(tr);
    }
    const body = el('tbody');
    for (const row of tip.rows!) {
      const r: TipRow = Array.isArray(row) ? { cells: row } : row;
      const tr = el('tr', '', r.gap ? 'is-gap' : undefined);
      r.cells.forEach((text, k) => {
        const td = el('td', text, k ? 'pm-tip__num' : undefined);
        if (k === 0 && r.sub) td.append(el('span', r.sub, 'pm-tip__sub'));
        if (r.alert?.includes(k)) td.classList.add('is-alert');
        tr.append(td);
      });
      body.append(tr);
    }
    table.append(body);
    return table;
  }

  /** Dymek nad punktem (x, y w układzie SVG), dosunięty do krawędzi mapy. */
  private place([x, y]: [number, number]) {
    const m = this.svg.getScreenCTM();
    if (!m) return;
    const box = this.fig.getBoundingClientRect();
    const px = m.a * x + m.e - box.left, py = m.d * y + m.f - box.top;
    this.tip.hidden = false;
    const w = this.tip.offsetWidth, h = this.tip.offsetHeight;
    let left = px + 14, top = py - h - 10;
    if (left + w > box.width) left = px - w - 14;
    if (left < 0) left = Math.max(0, Math.min(box.width - w, px - w / 2));
    if (top < 0) top = py + 18;
    this.tip.style.left = `${left}px`;
    this.tip.style.top = `${top}px`;
  }
}

export function definePolandMap() {
  if (!customElements.get('zl-map')) customElements.define('zl-map', PolandMap);
}
