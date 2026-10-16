/**
 * Zachowanie mapy PolandMap (element <zl-map>): przełączanie warstw, dymki, podświetlenia.
 * Barwy województw każdej warstwy są w <script type="application/json"> wewnątrz elementu (mapa bez
 * nich, interactive={false}, zostaje statyczna), a treść dymków w pliku z `data-tips`, pobieranym
 * przy pierwszym ruchu nad mapą.
 */
import type { Tip } from '@/lib/mapa/types';

interface LayerData {
  id: string;
  kind: 'regions' | 'points';
  alt: string;
  /** kod TERYT województwa → [klasa, podpis] */
  regions?: Record<string, [number, string]>;
}

/** warstwa → dymki punktów (po indeksie punktu) albo województw (po kodzie TERYT) */
type Tips = Record<string, Tip[] | Record<string, Tip>>;
type Target = { point: number } | { region: string };

/** zasięg trafienia poza krawędzią koła, w px ekranu */
const REACH = { mouse: 7, touch: 14 };

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
  /** koła warstw punktowych: [indeks punktu, x, y, r] — czytane z DOM przy pierwszym użyciu */
  private hits = new Map<string, [number, number, number, number][]>();

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
      if (!t) return this.close(true);
      this.open(t);
      this.pinned = true;
      this.tip.classList.add('is-pinned');
    });
    document.addEventListener('click', (e) => { if (this.pinned && !this.fig.contains(e.target as Node)) this.close(true); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(true); });

    this.querySelectorAll<HTMLElement>('.pm-rank li').forEach((li) => {
      li.addEventListener('pointerenter', () => { if (!this.pinned) this.open({ region: li.dataset.r! }); });
      li.addEventListener('pointerleave', () => this.close());
    });
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

  /** Co jest pod wskaźnikiem: najbliższe koło aktywnej warstwy albo województwo. */
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
      this.hits.set(id, [...(g?.querySelectorAll('circle') ?? [])].map((c) => [Number(c.dataset.i), c.cx.baseVal.value, c.cy.baseVal.value, c.r.baseVal.value]));
    }
    return this.hits.get(id)!;
  }

  private open(t: Target) {
    const layer = this.active;
    this.want = t;
    if (!this.tips) return void this.load();
    let tip: Tip | undefined, anchor: [number, number], els: Element[];
    if ('point' in t) {
      const c = this.svg.querySelector<SVGCircleElement>(`.pm-pts[data-layer="${layer.id}"] circle[data-i="${t.point}"]`)!;
      tip = (this.tips[layer.id] as Tip[] | undefined)?.[t.point];
      anchor = [c.cx.baseVal.value, c.cy.baseVal.value - c.r.baseVal.value];
      els = [c];
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
    this.fill(tip);
    this.place(anchor);
  }

  close(force = false) {
    if (this.pinned && !force) return;
    this.want = null;
    this.pinned = false;
    this.tip.hidden = true;
    this.tip.classList.remove('is-pinned');
    this.light([]);
  }

  private light(els: Element[]) {
    this.lit.forEach((el) => el.classList.remove('is-on'));
    els.forEach((el) => el.classList.add('is-on'));
    this.lit = els;
  }

  /** Treść dymku przez textContent — dane nie trafiają do innerHTML. */
  private fill(tip: Tip) {
    const el = (tag: string, text: string, cls?: string) => {
      const node = document.createElement(tag);
      node.textContent = text;
      if (cls) node.className = cls;
      return node;
    };
    const parts: Node[] = [el('strong', tip.title)];
    if (tip.meta) parts.push(el('span', tip.meta, 'pm-tip__meta'));
    if (tip.rows?.length) {
      const dl = document.createElement('dl');
      for (const [k, v] of tip.rows) dl.append(el('dt', k), el('dd', v));
      parts.push(dl);
    }
    if (tip.href) {
      const a = el('a', `${tip.hrefLabel ?? 'źródło'} ↗`) as HTMLAnchorElement;
      a.href = tip.href;
      a.target = '_blank';
      a.rel = 'noopener';
      parts.push(a);
    }
    this.tip.replaceChildren(...parts);
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
