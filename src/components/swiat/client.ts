/**
 * <zl-globe>: przełączanie widoków (miara × forma pracy × waluta), wybór kraju, obrót i przybliżenie globu.
 * Serwer renderuje widok domyślny, wszystkie listy tabeli i szczegóły krajów; tu pokazujemy właściwe (data-k),
 * przenosimy szczegóły wybranego kraju do jego wiersza w widocznej liście i przemalowujemy kraje według klas
 * z buildu (`tones`). Kontury do obrotu i treść dymków (`src`) pobieramy przy pierwszym ruchu nad globem albo
 * pierwszym kliknięciu czy najechaniu na wiersz, które wymaga obrotu.
 */
import type { GeoProjection } from 'd3-geo';
import type { Topology } from 'topojson-specification';
import { center, countries, facing, graticule, pathOf, projection, SCALES, visible, type Country } from '@/lib/swiat/globe';

interface Config {
  keys: string[];
  /** opis globu dla czytników ekranu w każdym widoku */
  labels: Record<string, string>;
  tones: Record<string, string>;
  /** kraje z wartością z danych krajowych (kropki na mapie) */
  national: string[];
  initial: string;
  /** waluta na starcie i napisy w języku strony */
  currency: string;
  announce: string;
  noData: string;
}
interface Payload {
  topology: Topology;
  /** id → nazwa i dwie linie dymka w każdym widoku (bez `k` = brak danych) */
  tips: Record<string, { n: string; k?: Record<string, [string, string]> }>;
}

const SVG = 'http://www.w3.org/2000/svg';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

class ZlGlobe extends HTMLElement {
  private config!: Config;
  private state = { form: 'e', measure: 'r', currency: 'PLN', sel: '616' };
  /** czy wiersz wybranego kraju jest rozwinięty */
  private open = true;
  /** kraj pod kursorem w tabeli: glob obraca się do niego, po wyjściu z tabeli wraca do wybranego */
  private peekId?: string;
  private peekTimer = 0;
  private svg!: SVGSVGElement;
  private land!: SVGGElement;
  private nat!: SVGGElement;
  private centers = new Map<string, [number, number]>();
  private tip!: HTMLElement;
  private announce!: HTMLElement;
  private store!: HTMLElement;
  private data?: Payload;
  private loading?: Promise<Payload>;
  private features: Country[] = [];
  private byId = new Map<string, Country>();
  private proj?: GeoProjection;
  private zoom = 0;
  private anim = 0;

  connectedCallback() {
    this.config = JSON.parse(this.querySelector('.wg-data')!.textContent!);
    this.state.sel = this.config.initial;
    this.state.currency = this.config.currency;
    this.svg = this.querySelector('.wg-svg')!;
    this.land = this.querySelector('.wg-land')!;
    this.nat = this.querySelector('.wg-nat')!;
    this.tip = this.querySelector('.wg-tip')!;
    this.announce = this.querySelector('[data-announce]')!;
    this.store = this.querySelector('.wg-store')!;

    this.querySelectorAll<HTMLElement>('[data-ctl]').forEach((group) =>
      group.addEventListener('click', (e) => {
        const button = (e.target as HTMLElement).closest('button');
        if (!button) return;
        (this.state as Record<string, string>)[group.dataset.ctl!] = button.dataset.v!;
        this.render();
      }),
    );
    this.querySelectorAll<HTMLButtonElement>('[data-zoom]').forEach((b) => b.addEventListener('click', () => this.setZoom(this.zoom + Number(b.dataset.zoom))));
    const rank = this.querySelector<HTMLElement>('.wg-rank')!;
    rank.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>('button[data-id]');
      if (!button) return;
      const li = button.parentElement!;
      const top = li.getBoundingClientRect().top;
      if (button.dataset.id === this.state.sel && this.open) {
        this.open = false;
        this.place();
      } else this.select(button.dataset.id!);
      // zwinięcie szczegółów wyżej w tabeli przesunęłoby kliknięty wiersz spod kursora
      const shift = li.getBoundingClientRect().top - top;
      if (shift) window.scrollBy({ top: shift, behavior: 'instant' });
    });
    rank.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const id = (e.target as HTMLElement).closest<HTMLElement>('button[data-id]')?.dataset.id;
      if (id) this.peekLater(id);
    });
    rank.addEventListener('pointerleave', () => this.peekLater(undefined));

    this.svg.addEventListener('pointerenter', () => void this.ready(), { once: true });
    this.svg.addEventListener('pointermove', (e) => this.hover(e));
    this.svg.addEventListener('pointerleave', () => (this.tip.hidden = true));
    this.drag();
  }

  private get key() {
    const { form, measure, currency } = this.state;
    if (measure === 'j') return 'j';
    return measure === 'r' || measure === 'n' ? `${form}-${measure}` : `${form}-${measure}-${currency}`;
  }

  private toneOf(id: string) {
    return this.config.tones[id]?.[this.config.keys.indexOf(this.key)] ?? 's';
  }

  /** przełączniki, widoczne elementy i kolory krajów dla bieżącego widoku */
  private render() {
    const key = this.key;
    this.dataset.view = key;
    this.svg.setAttribute('aria-label', this.config.labels[key] ?? '');
    for (const group of this.querySelectorAll<HTMLElement>('[data-ctl]')) {
      const value = (this.state as Record<string, string>)[group.dataset.ctl!];
      group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === value)));
    }
    this.querySelectorAll<HTMLElement>('[data-pay]').forEach((el) => (el.inert = key === 'j'));
    this.querySelectorAll<HTMLElement>('[data-k]').forEach((el) => (el.hidden = !el.dataset.k!.split(' ').includes(key)));
    this.querySelectorAll<HTMLElement>('[data-c]').forEach((el) => (el.hidden = el.dataset.c !== this.state.currency));
    this.place();
    this.paint();
  }

  /** szczegóły wybranego kraju do jego wiersza w widocznej liście (albo z powrotem do schowka, gdy zwinięty) */
  private place() {
    const id = this.state.sel;
    const det = this.querySelector<HTMLElement>(`#wg-det-${id}`);
    const list = [...this.querySelectorAll<HTMLElement>('.wg-rank__list')].find((l) => !l.hidden);
    const li = this.open ? list?.querySelector<HTMLElement>(`li[data-id="${id}"]`) : undefined;
    this.querySelectorAll<HTMLElement>('.wg-rank .wg-det').forEach((d) => d !== det && this.store.append(d));
    this.querySelectorAll<HTMLElement>('.wg-rank li.is-sel').forEach((el) => el.classList.remove('is-sel'));
    this.querySelectorAll<HTMLElement>('.wg-rank button[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (!det) return;
    if (!li) return void this.store.append(det);
    li.classList.add('is-sel');
    li.querySelector('button')!.setAttribute('aria-expanded', 'true');
    // kraj z listy nazw (bez wartości w widoku): szczegóły pod całą listą
    if (li.closest('.wg-rank__rest')) list!.querySelector('.wg-rank__restdet')!.append(det);
    else li.append(det);
  }

  private paint() {
    for (const path of this.land.querySelectorAll<SVGPathElement>('path[data-id]')) {
      const tone = this.toneOf(path.dataset.id!);
      const keep = [...path.classList].filter((c) => !/^t[0-4cs]$/.test(c) && c !== 'is-info');
      path.setAttribute('class', [...keep, `t${tone}`, ...(tone === 's' ? [] : ['is-info'])].join(' '));
    }
    // po pobraniu konturów kółka ustawia draw(); wcześniej są te z serwera, tylko je chowamy albo pokazujemy
    if (this.proj) return this.draw();
    for (const ring of this.nat.querySelectorAll<SVGCircleElement>('circle[data-id]')) ring.style.display = this.natOn(ring.dataset.id!) ? '' : 'none';
  }

  /** kółko „dane krajowe” tylko w widoku na etacie i tylko przy kraju z wartością w tej mierze */
  private natOn(id: string) {
    return this.key !== 'j' && this.state.form === 'e' && /\d/.test(this.toneOf(id));
  }

  private select(id: string) {
    this.state.sel = id;
    this.dataset.sel = id;
    this.open = true;
    this.place();
    const li = this.querySelector<HTMLElement>(`.wg-rank li.is-sel`);
    // przy kliknięciu w glob szczegóły otwierają się w tabeli, poza miejscem kliknięcia — krótki komunikat dla czytnika
    const name = li?.querySelector('.wg-rank__name')?.textContent ?? '';
    this.announce.textContent = name ? `${this.config.announce}${name}` : '';
    void this.ready().then((ok) => {
      if (!ok) return;
      const f = this.byId.get(id);
      if (f) this.rotateTo(f);
      else this.draw();
    });
  }

  /** kontury i dymki; po błędzie sieci kolejne wywołanie spróbuje jeszcze raz (glob zostaje statyczny) */
  private ready(): Promise<boolean> {
    return this.load().then(
      () => true,
      () => {
        this.loading = undefined;
        return false;
      },
    );
  }

  private load(): Promise<Payload> {
    this.loading ??= fetch(this.dataset.src!)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Payload>;
      })
      .then((data) => {
        this.data = data;
        this.features = countries(data.topology);
        this.byId = new Map(this.features.map((f) => [f.id, f]));
        this.proj = projection(facing(center(this.byId.get(this.state.sel) ?? this.features[0]!)), SCALES[this.zoom]);
        this.build();
        this.draw();
        return data;
      });
    return this.loading;
  }

  /** zamiana statycznych ścieżek z serwera na komplet konturów (także z niewidocznej półkuli) */
  private build() {
    const make = (f: Country, parent: SVGGElement, cls = '') => {
      const path = document.createElementNS(SVG, 'path');
      path.dataset.id = f.id;
      if (cls) path.setAttribute('class', cls);
      parent.append(path);
    };
    this.land.replaceChildren();
    this.nat.replaceChildren();
    for (const f of this.features) {
      make(f, this.land, f.properties.point ? 'is-pt' : '');
      if (this.config.national.includes(f.id)) {
        const ring = document.createElementNS(SVG, 'circle');
        ring.dataset.id = f.id;
        ring.setAttribute('r', '5');
        this.centers.set(f.id, center(f));
        this.nat.append(ring);
      }
    }
    this.paint();
  }

  private draw() {
    if (!this.proj) return;
    const path = pathOf(this.proj);
    this.svg.querySelector('.wg-ocean')!.setAttribute('d', path({ type: 'Sphere' }) ?? '');
    this.svg.querySelector('.wg-grat')!.setAttribute('d', path(graticule) ?? '');
    for (const el of this.land.querySelectorAll<SVGPathElement>('path[data-id]')) el.setAttribute('d', path(this.byId.get(el.dataset.id!)!) ?? '');
    for (const ring of this.nat.querySelectorAll<SVGCircleElement>('circle[data-id]')) {
      const at = this.centers.get(ring.dataset.id!)!;
      const show = this.natOn(ring.dataset.id!) && visible(at, this.proj);
      ring.style.display = show ? '' : 'none';
      if (!show) continue;
      const [x, y] = this.proj(at)!;
      ring.setAttribute('cx', String(Math.round(x)));
      ring.setAttribute('cy', String(Math.round(y)));
    }
    // obrys i podpis: kraj spod kursora w tabeli, inaczej wybrany
    const f = this.byId.get(this.peekId ?? this.state.sel);
    this.svg.querySelector('.wg-sel')!.setAttribute('d', (f && path(f)) ?? '');
    let label = this.svg.querySelector<SVGTextElement>('.wg-lbl');
    if (!label) {
      label = document.createElementNS(SVG, 'text');
      label.setAttribute('class', 'wg-lbl');
      label.setAttribute('text-anchor', 'middle');
      this.svg.append(label);
    }
    const c = f && center(f);
    if (c && visible(c, this.proj)) {
      const [x, y] = this.proj(c)!;
      label.setAttribute('x', String(x));
      label.setAttribute('y', String(y - 14));
      label.textContent = this.data?.tips[f.id]?.n ?? '';
      label.style.display = '';
    } else label.style.display = 'none';
  }

  /** obrót do kraju spod kursora w tabeli z opóźnieniem, żeby przesuwanie myszy po wierszach nie kręciło globem */
  private peekLater(id: string | undefined) {
    clearTimeout(this.peekTimer);
    if (id === this.peekId) return;
    this.peekTimer = window.setTimeout(() => {
      this.peekId = id;
      void this.ready().then((ok) => {
        if (!ok) return;
        const f = this.byId.get(id ?? this.state.sel);
        if (f) this.rotateTo(f);
        else this.draw();
      });
    }, 250);
  }

  private tween(from: number[], to: number[], ms: number, apply: (v: number[]) => void) {
    cancelAnimationFrame(this.anim);
    if (reduceMotion() || ms === 0) return apply(to), this.draw();
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      apply(from.map((a, i) => a + (to[i]! - a) * ease(t)));
      this.draw();
      if (t < 1) this.anim = requestAnimationFrame(step);
    };
    this.anim = requestAnimationFrame(step);
  }

  private rotateTo(f: Country) {
    const proj = this.proj!;
    const [r0, r1] = proj.rotate();
    const [t0, t1] = facing(center(f));
    // najkrótsza droga także po wielu obrotach przeciąganiem (λ rośnie bez ograniczeń, a % w JS zachowuje znak)
    const dl = ((((t0 - r0 + 180) % 360) + 360) % 360) - 180;
    this.tween([r0, r1], [r0 + dl, t1], 900, ([a, b]) => proj.rotate([a!, b!]));
  }

  private async setZoom(level: number) {
    this.zoom = Math.max(0, Math.min(SCALES.length - 1, level));
    this.querySelector<HTMLButtonElement>('[data-zoom="1"]')!.disabled = this.zoom === SCALES.length - 1;
    this.querySelector<HTMLButtonElement>('[data-zoom="-1"]')!.disabled = this.zoom === 0;
    if (!(await this.ready())) return;
    const proj = this.proj!;
    this.tween([proj.scale()], [SCALES[this.zoom]!], 400, ([s]) => proj.scale(s!));
  }

  private drag() {
    let start: { x: number; y: number; moved: boolean; id?: string } | undefined;
    // przeciąganie globu nie może zaczynać zaznaczania tekstu wokół ani przeciągania obrazka
    this.svg.addEventListener('selectstart', (e) => e.preventDefault());
    this.svg.addEventListener('dragstart', (e) => e.preventDefault());
    this.svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      start = { x: e.clientX, y: e.clientY, moved: false, id: (e.target as Element).closest<SVGPathElement>('path[data-id]')?.dataset.id };
      this.svg.setPointerCapture(e.pointerId);
      void this.ready();
    });
    this.svg.addEventListener('pointermove', (e) => {
      if (!start || !this.proj) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 4) return;
      start.moved = true;
      this.svg.classList.add('is-dragging');
      this.tip.hidden = true;
      cancelAnimationFrame(this.anim);
      // przesunięcie w pikselach ekranu → stopnie, wolniej przy przybliżeniu
      const k = (0.32 * SCALES[0]! * (600 / this.svg.getBoundingClientRect().width)) / this.proj.scale();
      const [a, b, c] = this.proj.rotate();
      this.proj.rotate([a + dx * k, Math.max(-75, Math.min(75, b - dy * k)), c]);
      start.x = e.clientX;
      start.y = e.clientY;
      this.draw();
    });
    const end = () => {
      // klikalne są kraje, które mają wiersz w widocznej tabeli (szare „brak danych” nie mają)
      if (start && !start.moved && start.id && this.toneOf(start.id) !== 's') {
        this.select(start.id);
        const sel = this.querySelector('.wg-rank li.is-sel');
        (sel?.closest('.wg-rank__rest') ? sel.closest('.wg-rank__list')!.querySelector('.wg-rank__restdet') : sel)?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
      start = undefined;
      this.svg.classList.remove('is-dragging');
    };
    this.svg.addEventListener('pointerup', end);
    this.svg.addEventListener('pointercancel', () => ((start = undefined), this.svg.classList.remove('is-dragging')));
  }

  private hover(e: PointerEvent) {
    if (e.buttons || e.pointerType === 'touch') return;
    const id = (e.target as Element).closest<SVGPathElement>('path[data-id]')?.dataset.id;
    const tip = id ? this.data?.tips[id] : undefined;
    if (!tip) return void (this.tip.hidden = true);
    this.tip.replaceChildren();
    const b = document.createElement('b');
    b.textContent = tip.n;
    this.tip.append(b);
    for (const line of tip.k?.[this.key] ?? [this.config.noData]) {
      if (!line) continue;
      const span = document.createElement('span');
      span.textContent = line;
      this.tip.append(span);
    }
    const box = this.tip.parentElement!.getBoundingClientRect();
    this.tip.style.left = `${Math.max(110, Math.min(box.width - 110, e.clientX - box.left))}px`;
    this.tip.style.top = `${e.clientY - box.top}px`;
    this.tip.hidden = false;
  }
}

export function defineGlobe() {
  if (!customElements.get('zl-globe')) customElements.define('zl-globe', ZlGlobe);
}
