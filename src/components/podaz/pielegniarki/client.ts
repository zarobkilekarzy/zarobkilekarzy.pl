/**
 * <zl-nurse-supply> — zachowanie symulatora pielęgniarek (NurseSupplySimulator.astro).
 * Ten sam układ i te same gesty co w symulatorze lekarzy (components/podaz/client.ts):
 * stan to dopływ rok po roku + losy pielęgniarki, każda zmiana przelicza model
 * i przerysowuje wykresy w rozmiarze kontenera. Edytować można tylko przyszłość —
 * historia to dane NIPiP.
 */
import {
  BASE_RIGHTS, DEFAULTS, FIRST_POLICY, PRESETS, RIGHTS_MAX, RIGHTS_STEP, RIGHTS_TODAY, YEAR0, YEAR_MAX, YEAR_MIN,
  people, perThousand, simulate, type Settings,
} from '@/lib/podaz/pielegniarki/model';
import {
  LADDER_HEIGHT, ladderChart, ladderMax, resultChart, resultGeometry, resultMax, rightsChart, rightsGeometry,
} from '@/lib/podaz/pielegniarki/charts';
import { HEADLINE_YEAR, commentary, firstVisible } from '@/lib/podaz/pielegniarki/summary';
import { formatPL } from '@/lib/format';

/** Różnica mniejsza niż tyle osób to „tak samo jak bez zmian”. */
const SAME = 500;
/** Pierwszy rok, który da się zmienić. */
const EDIT_MIN = YEAR0 + 1;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const signed = (d: number) => `${d > 0 ? '+' : '−'}${formatPL(Math.abs(d))}`;
const fill = (input: HTMLInputElement) =>
  input.style.setProperty('--p', `${((+input.value - +input.min) / (+input.max - +input.min)) * 100}%`);
const sameArray = (a: readonly number[], b: readonly number[]) => a.every((v, i) => v === b[i]);
type RateKey = 'entry' | 'inflow';

class ZlNurseSupply extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready !== undefined) return;
    this.dataset.ready = '';

    const $ = <T extends Element = HTMLElement>(name: string) => this.querySelector<T>(`[data-el="${name}"]`)!;
    const $$ = <T extends Element = HTMLElement>(selector: string) => [...this.querySelectorAll<T>(selector)];

    const rightsSvg = $<SVGSVGElement>('intake');
    const rightsWrap = $('intake-wrap');
    const resultSvg = $<SVGSVGElement>('result');
    const ladderSvg = $<SVGSVGElement>('ladder');
    const tip = $('tip');
    const pop = $('pop');
    const popInput = $<HTMLInputElement>('pop-input');
    const popReset = $('pop-reset');
    const limit = $<HTMLInputElement>('limit');
    const limitOut = $('limit-out');
    const rateInputs = $$<HTMLInputElement>('input[data-rate]');
    const ageInputs = $$<HTMLInputElement>('input[name="sim-age"]');
    const ratesReset = $('rates-reset');
    const chips = $$<HTMLButtonElement>('[data-preset]');
    const ladderButtons = $$<HTMLButtonElement>('[data-year]');
    const status = $('status');

    // ---------- Stan ----------
    const rights = [...BASE_RIGHTS];
    const settings: Settings = { ...DEFAULTS };
    const presets = PRESETS.map((p) => ({ ...p, values: p.rights(), all: { ...DEFAULTS, ...p.settings } }));
    // Odniesienie „bez zmian” nie zależy od niczego, co ustawia użytkownik — wszystko tu jest dźwignią
    const reference = simulate(BASE_RIGHTS, DEFAULTS);
    let scenario = simulate(rights, settings);
    let selected = EDIT_MIN;
    let popOpen = false;
    let hover: number | undefined;
    let ladderYear = HEADLINE_YEAR;
    let size = { iw: 420, ih: 168, rw: 680, rh: 260, lw: 680 };

    const ratesChanged = () =>
      rateInputs.some((r) => r.value !== r.defaultValue) || settings.retireAge !== DEFAULTS.retireAge;
    const idx = (year: number) => year - YEAR_MIN;

    // ---------- Rysowanie ----------
    function measure() {
      const i = rightsSvg.getBoundingClientRect();
      const r = resultSvg.getBoundingClientRect();
      const l = ladderSvg.getBoundingClientRect();
      size = {
        iw: Math.max(240, Math.round(i.width)), ih: Math.max(100, Math.round(i.height)),
        rw: Math.max(240, Math.round(r.width)), rh: Math.max(100, Math.round(r.height)),
        lw: Math.max(240, Math.round(l.width)),
      };
      rightsSvg.setAttribute('viewBox', `0 0 ${size.iw} ${size.ih}`);
      resultSvg.setAttribute('viewBox', `0 0 ${size.rw} ${size.rh}`);
      ladderSvg.setAttribute('viewBox', `0 0 ${size.lw} ${LADDER_HEIGHT}`);
    }
    const showSelected = () => popOpen || document.activeElement === rightsSvg;
    const drawRights = () => {
      rightsSvg.innerHTML = rightsChart(size.iw, size.ih, rights, showSelected() ? selected : undefined);
    };
    const drawResult = () => {
      resultSvg.innerHTML = resultChart({ width: size.rw, height: size.rh, scenario, reference, hover });
    };
    const drawLadder = () => {
      const year = hover ?? ladderYear;
      $('ladder-year').textContent = String(year);
      ladderSvg.innerHTML = ladderChart({
        width: size.lw, ladder: scenario[year - YEAR0].ladder, today: scenario[0].ladder, vMax: ladderMax(scenario),
      });
    };

    function setDelta(name: string, d: number, long = false) {
      const el = $(name);
      if (Math.abs(d) < SAME) {
        el.textContent = long ? 'tak samo jak bez zmian' : 'bez zmian';
        el.removeAttribute('data-sign');
      } else {
        el.textContent = long ? `${signed(d)} wobec „bez zmian”` : signed(d);
        el.dataset.sign = d > 0 ? 'plus' : 'minus';
      }
    }

    function update() {
      scenario = simulate(rights, settings);
      drawRights();
      drawResult();
      drawLadder();

      const s = (year: number) => scenario[year - YEAR0];
      const r = (year: number) => reference[year - YEAR0];
      $('headline').textContent = formatPL(s(HEADLINE_YEAR).nurses);
      setDelta('headline-d', s(HEADLINE_YEAR).nurses - r(HEADLINE_YEAR).nurses, true);
      $('y2040').textContent = formatPL(s(2040).nurses);
      setDelta('y2040-d', s(2040).nurses - r(2040).nurses);
      $('density').textContent = formatPL(perThousand(s(HEADLINE_YEAR).nurses, HEADLINE_YEAR), 1);
      const first = firstVisible(scenario, reference);
      $('visible').textContent = first ? `${first} r.` : '—';
      $('comment').textContent = commentary({ rights, settings, scenario, reference, ratesChanged: ratesChanged() });

      syncControls();
      if (hover !== undefined) showTip(hover);
      announce();
    }

    /** Kontrolki odzwierciedlają stan — także ten ustawiony wykresem albo scenariuszem. */
    function syncControls() {
      const match = presets.find((p) =>
        sameArray(p.values, rights) && p.all.retireAge === settings.retireAge
        && p.all.entry === settings.entry && p.all.inflow === settings.inflow);
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.preset === match?.id)));
      $('preset-desc').textContent = match?.desc ?? 'Własny scenariusz — dopływ albo losy pielęgniarki ustawione ręcznie.';

      const future = rights.slice(idx(FIRST_POLICY));
      const uniform = future.every((v) => v === future[0]);
      const v = future[0];
      if (document.activeElement !== limit) limit.value = String(v);
      fill(limit);
      limit.toggleAttribute('data-changed', !uniform || v !== RIGHTS_TODAY);
      limitOut.toggleAttribute('data-mixed', !uniform);
      limitOut.textContent = uniform ? formatPL(v) : 'różny w latach';
      $('limit-note').textContent = !uniform
        ? 'Dopływ zmienia się z roku na rok. Przesuń suwak, żeby ustawić jedną liczbę.'
        : v === RIGHTS_TODAY
          ? `Dzisiejszy dopływ, co roku aż do ${YEAR_MAX} r.`
          : `${signed(v - RIGHTS_TODAY)} wobec dzisiejszych ${formatPL(RIGHTS_TODAY)}, co roku do ${YEAR_MAX} r.`;

      ratesReset.hidden = !ratesChanged();
      if (popOpen) fillPop();
    }

    // Czytnik ekranu: jedno zdanie po chwili ciszy, a nie przy każdym kroku suwaka
    let announceTimer = 0;
    function announce(text?: string) {
      clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => {
        const i = HEADLINE_YEAR - YEAR0;
        const d = scenario[i].nurses - reference[i].nurses;
        status.textContent = text ?? `W ${HEADLINE_YEAR} r. ${formatPL(scenario[i].nurses)} pielęgniarek${Math.abs(d) < SAME ? ', tak samo jak bez zmian' : `, ${signed(d)} wobec scenariusza bez zmian`}.`;
      }, 700);
    }

    // ---------- 01 Scenariusz ----------
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const p = presets.find((x) => x.id === chip.dataset.preset)!;
      rights.splice(0, rights.length, ...p.values);
      setRates(p.all);
      update();
    }));

    // ---------- 02 Dopływ od FIRST_POLICY ----------
    limit.addEventListener('input', () => {
      // dzisiejszy dopływ (9 153) nie leży na kroku suwaka (100) — w jego pobliżu suwak „klika” na nim
      const raw = +limit.value;
      const v = Math.abs(raw - RIGHTS_TODAY) < RIGHTS_STEP / 2 ? RIGHTS_TODAY : raw;
      for (let y = FIRST_POLICY; y <= YEAR_MAX; y++) rights[idx(y)] = v;
      update();
    });

    // ---------- 03 Rok po roku: rysowanie myszą, stuknięcie = dymek ----------
    const local = (ev: PointerEvent) => {
      const b = rightsSvg.getBoundingClientRect();
      return { x: ev.clientX - b.left, y: ev.clientY - b.top };
    };
    /** Od (y0, v0) do (y1, v1) liniowo — szybkie przeciągnięcie nie zostawia dziur. */
    function paint(y0: number, v0: number, y1: number, v1: number) {
      const [a, b] = y0 <= y1 ? [y0, y1] : [y1, y0];
      for (let y = a; y <= b; y++) {
        const t = y1 === y0 ? 1 : (y - y0) / (y1 - y0);
        rights[idx(y)] = Math.round((v0 + t * (v1 - v0)) / RIGHTS_STEP) * RIGHTS_STEP;
      }
    }
    let drawing = false;
    let moved = false;
    let start = { x: 0, y: 0 };
    let last = { year: EDIT_MIN, v: 0 };
    let frame = 0;

    // Dotyk: stuknięcie (click — nie przychodzi po przewinięciu) otwiera dymek;
    // przeciąganie palcem zostaje dla przewijania strony
    let pointerType = '';
    rightsSvg.addEventListener('click', (ev) => {
      if (pointerType === 'touch') openPop(rightsGeometry(size.iw, size.ih).yearAt(ev.clientX - rightsSvg.getBoundingClientRect().left));
    });
    rightsSvg.addEventListener('pointerdown', (ev) => {
      pointerType = ev.pointerType;
      if (ev.pointerType === 'touch' || ev.button !== 0) return;
      drawing = true;
      moved = false;
      start = local(ev);
      rightsSvg.setPointerCapture(ev.pointerId);
      rightsSvg.dataset.pointer = '';
      rightsSvg.focus({ preventScroll: true });
      ev.preventDefault();
    });
    rightsSvg.addEventListener('pointermove', (ev) => {
      if (!drawing) return;
      if (ev.buttons === 0) { drawing = false; return; }
      const p = local(ev);
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) < 4) return;
      const g = rightsGeometry(size.iw, size.ih);
      if (!moved) {
        moved = true;
        closePop();
        last = { year: g.yearAt(start.x), v: g.valueAt(start.y) };
      }
      const next = { year: g.yearAt(p.x), v: g.valueAt(p.y) };
      paint(last.year, last.v, next.year, next.v);
      last = next;
      selected = next.year;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    });
    const endDrawing = (ev: PointerEvent) => {
      if (!drawing) return;
      drawing = false;
      if (rightsSvg.hasPointerCapture(ev.pointerId)) rightsSvg.releasePointerCapture(ev.pointerId);
      if (!moved) openPop(rightsGeometry(size.iw, size.ih).yearAt(start.x));
    };
    rightsSvg.addEventListener('pointerup', endDrawing);
    rightsSvg.addEventListener('pointercancel', endDrawing);
    rightsSvg.addEventListener('lostpointercapture', endDrawing);

    // Klawiatura: jeden przystanek tabulatora zamiast 35 słupków
    rightsSvg.addEventListener('focus', drawRights);
    rightsSvg.addEventListener('blur', drawRights);
    rightsSvg.addEventListener('keydown', (ev) => {
      delete rightsSvg.dataset.pointer;
      const step = ev.shiftKey ? 1000 : RIGHTS_STEP;
      switch (ev.key) {
        case 'ArrowLeft': openPop(selected - 1); break;
        case 'ArrowRight': openPop(selected + 1); break;
        case 'ArrowUp': setYear(selected, rights[idx(selected)] + step); openPop(selected); break;
        case 'ArrowDown': setYear(selected, rights[idx(selected)] - step); openPop(selected); break;
        case 'Home': openPop(EDIT_MIN); break;
        case 'End': openPop(YEAR_MAX); break;
        case 'Enter': openPop(selected); popInput.focus(); popInput.select(); break;
        case 'Escape': closePop(); break;
        default: return;
      }
      ev.preventDefault();
    });

    // ---------- Dymek: dokładna liczba w wybranym roku ----------
    function setYear(year: number, v: number) {
      rights[idx(year)] = clamp(Math.round(v), 0, RIGHTS_MAX);
      update();
      announce(`${year}: ${people(rights[idx(year)])}.`);
    }
    function fillPop() {
      const i = idx(selected);
      const changed = rights[i] !== BASE_RIGHTS[i];
      $('pop-year').textContent = String(selected);
      $('pop-era').textContent = selected < FIRST_POLICY ? 'już studiują' : 'przyszłość';
      if (document.activeElement !== popInput) popInput.value = String(rights[i]);
      $('pop-base').textContent = changed ? `Dziś: ${formatPL(BASE_RIGHTS[i])}` : 'Dzisiejszy dopływ';
      popReset.hidden = !changed;
    }
    function placePop() {
      if (pop.hidden) return;
      const g = rightsGeometry(size.iw, size.ih);
      const x = g.x(selected) + g.bar / 2;
      const top = g.y(rights[idx(selected)]);
      pop.style.left = `${clamp(x - pop.offsetWidth / 2, 0, rightsWrap.clientWidth - pop.offsetWidth)}px`;
      pop.style.top = `${top - pop.offsetHeight - 12}px`;
    }
    function openPop(year: number) {
      selected = clamp(year, EDIT_MIN, YEAR_MAX);
      popOpen = true;
      pop.hidden = false;
      fillPop();
      drawRights();
      placePop();
      announce(`${selected}: ${people(rights[idx(selected)])}.`);
    }
    function closePop() {
      if (!popOpen) return;
      popOpen = false;
      pop.hidden = true;
      drawRights();
    }

    popInput.addEventListener('input', () => {
      if (popInput.value === '' || !Number.isFinite(+popInput.value)) return;
      setYear(selected, +popInput.value);
      placePop();
    });
    $$<HTMLButtonElement>('[data-step]').forEach((b) => b.addEventListener('click', () => {
      setYear(selected, rights[idx(selected)] + Number(b.dataset.step));
      placePop();
    }));
    popReset.addEventListener('click', () => { setYear(selected, BASE_RIGHTS[idx(selected)]); placePop(); });
    $('pop-prev').addEventListener('click', () => openPop(selected - 1));
    $('pop-next').addEventListener('click', () => openPop(selected + 1));
    $('pop-close').addEventListener('click', () => { closePop(); rightsSvg.focus({ preventScroll: true }); });
    pop.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { closePop(); rightsSvg.focus({ preventScroll: true }); }
    });
    document.addEventListener('pointerdown', (ev) => {
      const t = ev.target as Node;
      if (popOpen && !pop.contains(t) && !rightsSvg.contains(t)) closePop();
    });

    // ---------- 04 Losy pielęgniarki ----------
    const applyRate = (input: HTMLInputElement) => {
      const key = input.dataset.rate as RateKey;
      settings[key] = +input.value / Number(input.dataset.scale);
      this.querySelector<HTMLOutputElement>(`[data-out="${key}"]`)!.textContent = formatPL(+input.value);
      input.toggleAttribute('data-changed', input.value !== input.defaultValue);
      fill(input);
    };
    /** Ustawia suwaki i wiek odejścia na wartości scenariusza (albo z danych). */
    const setRates = (s: Settings) => {
      rateInputs.forEach((r) => {
        r.value = String(Math.round(s[r.dataset.rate as RateKey] * Number(r.dataset.scale)));
        applyRate(r);
      });
      settings.retireAge = s.retireAge;
      ageInputs.forEach((a) => { a.checked = +a.value === s.retireAge; });
    };
    rateInputs.forEach((r) => r.addEventListener('input', () => { applyRate(r); update(); }));
    ageInputs.forEach((a) => a.addEventListener('change', () => { settings.retireAge = +a.value; update(); }));
    ratesReset.addEventListener('click', () => { setRates(DEFAULTS); update(); });

    // ---------- Wynik: odczyt roku pod kursorem, drabina idzie za nim ----------
    function showTip(year: number) {
      const i = year - YEAR0;
      const p = scenario[i];
      const b = reference[i];
      const d = p.nurses - b.nurses;
      tip.innerHTML =
        `<strong>${year}</strong>` +
        `<p>Twój scenariusz <b>${formatPL(p.nurses)}</b></p>` +
        `<p>Bez zmian <b>${formatPL(b.nurses)}</b></p>` +
        `<p>Na 1000 mieszkańców <b>${formatPL(perThousand(p.nurses, year), 1)}</b></p>` +
        (Math.abs(d) >= SAME ? `<p class="tip__d">Różnica <b>${signed(d)}</b></p>` : '');
      tip.hidden = false;
      const g = resultGeometry(size.rw, size.rh, resultMax(scenario, reference));
      const x = g.x(year);
      const right = x + 14 + tip.offsetWidth <= size.rw;
      tip.style.left = `${right ? x + 14 : x - 14 - tip.offsetWidth}px`;
      tip.style.top = `${clamp(g.y(p.nurses) - tip.offsetHeight / 2, 0, size.rh - tip.offsetHeight)}px`;
    }
    function setHover(year: number | undefined) {
      if (year === hover) return;
      hover = year;
      drawResult();
      drawLadder();
      if (year === undefined) tip.hidden = true;
      else showTip(year);
    }
    const yearAt = (ev: PointerEvent) =>
      resultGeometry(size.rw, size.rh, 1).yearAt(ev.clientX - resultSvg.getBoundingClientRect().left);
    resultSvg.addEventListener('pointermove', (ev) => setHover(yearAt(ev)));
    resultSvg.addEventListener('pointerdown', (ev) => setHover(yearAt(ev)));
    resultSvg.addEventListener('pointerleave', () => setHover(undefined));

    ladderButtons.forEach((b) => b.addEventListener('click', () => {
      ladderYear = Number(b.dataset.year);
      ladderButtons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      drawLadder();
    }));

    // ---------- Start i zmiana rozmiaru ----------
    const resize = new ResizeObserver(() => {
      measure();
      drawRights();
      drawResult();
      drawLadder();
      placePop();
      if (hover !== undefined) showTip(hover);
    });
    resize.observe(rightsSvg);
    resize.observe(resultSvg);
    resize.observe(ladderSvg);
    measure();
    update();
    clearTimeout(announceTimer); // stan startowy nie jest zmianą — nie ogłaszamy go
  }
}

if (!customElements.get('zl-nurse-supply')) customElements.define('zl-nurse-supply', ZlNurseSupply);
