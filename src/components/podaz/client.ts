/**
 * <zl-supply> — zachowanie symulatora podaży (components/podaz/SupplySimulator.astro).
 * Stan to nabór rok po roku + ustawienia modelu; każda zmiana przelicza model
 * i przerysowuje oba wykresy w rozmiarze kontenera (lib/podaz/charts).
 */
import {
  BASE_INTAKE, DEFAULTS, EXACT_FROM, FIRST_EDITABLE, GUS_WITH_PATIENTS, INTAKE_MAX, INTAKE_STEP, LIMIT_TODAY,
  MEASURED, PRESETS, YEAR0, YEAR_MAX, YEAR_MIN, seats, simulate, type Rates, type Settings,
} from '@/lib/podaz/model';
import { intakeChart, intakeGeometry, resultChart, resultGeometry, resultMax } from '@/lib/podaz/charts';
import { commentary, firstVisible } from '@/lib/podaz/summary';
import { formatPL, plural } from '@/lib/format';

/** Różnica mniejsza niż tyle lekarzy to „tak samo jak bez zmian”. */
const SAME = 500;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const academic = (year: number) => `${year}/${String(year + 1).slice(2)}`;
const signed = (d: number) => `${d > 0 ? '+' : '−'}${formatPL(Math.abs(d))}`;
const fill = (input: HTMLInputElement) =>
  input.style.setProperty('--p', `${((+input.value - +input.min) / (+input.max - +input.min)) * 100}%`);
const sameArray = (a: readonly number[], b: readonly number[]) => a.every((v, i) => v === b[i]);

class ZlSupply extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready !== undefined) return;
    this.dataset.ready = '';

    const $ = <T extends Element = HTMLElement>(name: string) => this.querySelector<T>(`[data-el="${name}"]`)!;
    const $$ = <T extends Element = HTMLElement>(selector: string) => [...this.querySelectorAll<T>(selector)];

    const intakeSvg = $<SVGSVGElement>('intake');
    const intakeWrap = $('intake-wrap');
    const resultSvg = $<SVGSVGElement>('result');
    const tip = $('tip');
    const pop = $('pop');
    const popInput = $<HTMLInputElement>('pop-input');
    const popReset = $('pop-reset');
    const limit = $<HTMLInputElement>('limit');
    const limitOut = $('limit-out');
    const spec = $<HTMLInputElement>('spec');
    const rateInputs = $$<HTMLInputElement>('input[data-rate]');
    const ratesReset = $('rates-reset');
    const chips = $$<HTMLButtonElement>('[data-preset]');
    const status = $('status');

    // ---------- Stan ----------
    const intake = [...BASE_INTAKE];
    const settings: Settings = { ...DEFAULTS };
    const presets = PRESETS.map((p) => ({ ...p, values: p.intake() }));
    // Odniesienie „bez zmian”: założenia (wiek, specjalizacja) przesuwają obie krzywe,
    // losy rocznika to dźwignie — odniesienie trzyma je na wartościach zmierzonych.
    const referenceFor = () => simulate(BASE_INTAKE, { ...settings, ...MEASURED });
    let reference = referenceFor();
    let scenario = simulate(intake, settings);
    let selected = YEAR0;
    let popOpen = false;
    let hover: number | undefined;
    let size = { iw: 420, ih: 168, rw: 680, rh: 300 };

    const ratesChanged = () => rateInputs.some((r) => r.value !== r.defaultValue);
    const rateOut = (key: keyof Rates) => this.querySelector<HTMLOutputElement>(`[data-out="${key}"]`)!;
    const idx = (year: number) => year - YEAR_MIN;

    // ---------- Rysowanie ----------
    function measure() {
      const i = intakeSvg.getBoundingClientRect();
      const r = resultSvg.getBoundingClientRect();
      size = {
        iw: Math.max(240, Math.round(i.width)), ih: Math.max(100, Math.round(i.height)),
        rw: Math.max(240, Math.round(r.width)), rh: Math.max(100, Math.round(r.height)),
      };
      intakeSvg.setAttribute('viewBox', `0 0 ${size.iw} ${size.ih}`);
      resultSvg.setAttribute('viewBox', `0 0 ${size.rw} ${size.rh}`);
    }
    const showSelected = () => popOpen || document.activeElement === intakeSvg;
    const drawIntake = () => {
      intakeSvg.innerHTML = intakeChart(size.iw, size.ih, intake, showSelected() ? selected : undefined);
    };
    const drawResult = () => {
      resultSvg.innerHTML = resultChart({ width: size.rw, height: size.rh, scenario, reference, gus: GUS_WITH_PATIENTS, hover });
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
      scenario = simulate(intake, settings);
      drawIntake();
      drawResult();

      const s = (year: number) => scenario[year - YEAR0];
      const r = (year: number) => reference[year - YEAR0];
      $('y2050').textContent = formatPL(s(2050).doctors);
      setDelta('y2050-d', s(2050).doctors - r(2050).doctors, true);
      $('y2040').textContent = formatPL(s(2040).doctors);
      setDelta('y2040-d', s(2040).doctors - r(2040).doctors);
      $('spec2050').textContent = formatPL(s(2050).specialists);
      setDelta('spec2050-d', s(2050).specialists - r(2050).specialists);
      const first = firstVisible(scenario, reference);
      $('visible').textContent = first ? `${first} r.` : '—';
      $('comment').textContent = commentary({ intake, settings, scenario, reference, ratesChanged: ratesChanged() });

      syncControls();
      if (hover !== undefined) showTip(hover);
      announce();
    }

    /** Kontrolki odzwierciedlają stan — także ten ustawiony wykresem albo scenariuszem. */
    function syncControls() {
      const match = presets.find((p) => sameArray(p.values, intake));
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.preset === match?.id)));
      $('preset-desc').textContent = match?.desc ?? 'Własny scenariusz — nabór ustawiony ręcznie.';

      const future = intake.slice(idx(FIRST_EDITABLE));
      const uniform = future.every((v) => v === future[0]);
      const v = future[0];
      if (document.activeElement !== limit) limit.value = String(v);
      fill(limit);
      limit.toggleAttribute('data-changed', !uniform || v !== LIMIT_TODAY);
      limitOut.toggleAttribute('data-mixed', !uniform);
      limitOut.textContent = uniform ? formatPL(v) : 'różny w latach';
      $('limit-note').textContent = !uniform
        ? 'Nabór zmienia się z roku na rok. Przesuń suwak, żeby ustawić jedną liczbę.'
        : v === LIMIT_TODAY
          ? `Dzisiejszy limit, co roku aż do ${YEAR_MAX} r.`
          : `${signed(v - LIMIT_TODAY)} ${plural(Math.abs(v - LIMIT_TODAY), ['miejsce', 'miejsca', 'miejsc'])} wobec dzisiejszych ${formatPL(LIMIT_TODAY)}, co roku do ${YEAR_MAX} r.`;

      if (popOpen) fillPop();
    }

    // Czytnik ekranu: jedno zdanie po chwili ciszy, a nie przy każdym kroku suwaka
    let announceTimer = 0;
    function announce(text?: string) {
      clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => {
        const i = 2050 - YEAR0;
        const d = scenario[i].doctors - reference[i].doctors;
        status.textContent = text ?? `W 2050 r. ${formatPL(scenario[i].doctors)} lekarzy${Math.abs(d) < SAME ? ', tak samo jak bez zmian' : `, ${signed(d)} wobec scenariusza bez zmian`}.`;
      }, 700);
    }

    // ---------- 01 Scenariusz ----------
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const p = presets.find((x) => x.id === chip.dataset.preset)!;
      intake.splice(0, intake.length, ...p.values);
      if (p.id === 'baza') resetRates();
      update();
    }));

    // ---------- 02 Limit od 2027/28 ----------
    limit.addEventListener('input', () => {
      // dzisiejszy limit (np. 8 892) nie leży na kroku suwaka (50) — w jego pobliżu suwak „klika” na nim
      const raw = +limit.value;
      const v = Math.abs(raw - LIMIT_TODAY) < INTAKE_STEP / 2 ? LIMIT_TODAY : raw;
      for (let y = FIRST_EDITABLE; y <= YEAR_MAX; y++) intake[idx(y)] = v;
      update();
    });

    // ---------- 03 Rok po roku: rysowanie myszą, stuknięcie = dymek ----------
    const local = (ev: PointerEvent) => {
      const b = intakeSvg.getBoundingClientRect();
      return { x: ev.clientX - b.left, y: ev.clientY - b.top };
    };
    /** Od (y0, v0) do (y1, v1) liniowo — szybkie przeciągnięcie nie zostawia dziur. */
    function paint(y0: number, v0: number, y1: number, v1: number) {
      const [a, b] = y0 <= y1 ? [y0, y1] : [y1, y0];
      for (let y = a; y <= b; y++) {
        const t = y1 === y0 ? 1 : (y - y0) / (y1 - y0);
        intake[idx(y)] = Math.round((v0 + t * (v1 - v0)) / INTAKE_STEP) * INTAKE_STEP;
      }
    }
    let drawing = false;
    let moved = false;
    let start = { x: 0, y: 0 };
    let last = { year: YEAR0, v: 0 };
    let frame = 0;

    // Dotyk: stuknięcie (click — nie przychodzi po przewinięciu) otwiera dymek;
    // przeciąganie palcem zostaje dla przewijania strony
    let pointerType = '';
    intakeSvg.addEventListener('click', (ev) => {
      if (pointerType === 'touch') openPop(intakeGeometry(size.iw, size.ih).yearAt(ev.clientX - intakeSvg.getBoundingClientRect().left));
    });
    intakeSvg.addEventListener('pointerdown', (ev) => {
      pointerType = ev.pointerType;
      if (ev.pointerType === 'touch' || ev.button !== 0) return;
      drawing = true;
      moved = false;
      start = local(ev);
      intakeSvg.setPointerCapture(ev.pointerId);
      // fokus dla strzałek po kliknięciu; obwódkę pokazujemy dopiero przy klawiaturze (data-pointer)
      intakeSvg.dataset.pointer = '';
      intakeSvg.focus({ preventScroll: true });
      ev.preventDefault();
    });
    intakeSvg.addEventListener('pointermove', (ev) => {
      if (!drawing) return;
      // Przycisk puszczony poza oknem — kolejny ruch przychodzi już bez wciśniętego przycisku
      if (ev.buttons === 0) { drawing = false; return; }
      const p = local(ev);
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) < 4) return;
      const g = intakeGeometry(size.iw, size.ih);
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
      if (intakeSvg.hasPointerCapture(ev.pointerId)) intakeSvg.releasePointerCapture(ev.pointerId);
      // Kliknięcie bez przeciągania = prośba o dokładną liczbę
      if (!moved) openPop(intakeGeometry(size.iw, size.ih).yearAt(start.x));
    };
    intakeSvg.addEventListener('pointerup', endDrawing);
    intakeSvg.addEventListener('pointercancel', endDrawing);
    intakeSvg.addEventListener('lostpointercapture', endDrawing);

    // Klawiatura: jeden przystanek tabulatora zamiast 64 słupków
    intakeSvg.addEventListener('focus', drawIntake);
    intakeSvg.addEventListener('blur', drawIntake);
    intakeSvg.addEventListener('keydown', (ev) => {
      delete intakeSvg.dataset.pointer;
      const step = ev.shiftKey ? 500 : INTAKE_STEP;
      switch (ev.key) {
        case 'ArrowLeft': openPop(selected - 1); break;
        case 'ArrowRight': openPop(selected + 1); break;
        case 'ArrowUp': setYear(selected, intake[idx(selected)] + step); openPop(selected); break;
        case 'ArrowDown': setYear(selected, intake[idx(selected)] - step); openPop(selected); break;
        case 'Home': openPop(YEAR_MIN); break;
        case 'End': openPop(YEAR_MAX); break;
        case 'Enter': openPop(selected); popInput.focus(); popInput.select(); break;
        case 'Escape': closePop(); break;
        default: return;
      }
      ev.preventDefault();
    });

    // ---------- Dymek: dokładna liczba w wybranym roczniku ----------
    function setYear(year: number, v: number) {
      intake[idx(year)] = clamp(Math.round(v), 0, INTAKE_MAX);
      update();
      announce(`${academic(year)}: ${seats(intake[idx(year)])}.`);
    }
    function fillPop() {
      const i = idx(selected);
      const changed = intake[i] !== BASE_INTAKE[i];
      $('pop-year').textContent = academic(selected);
      $('pop-era').textContent = selected < YEAR0 ? 'historia' : 'przyszłość';
      if (document.activeElement !== popInput) popInput.value = String(intake[i]);
      $('pop-base').textContent = changed
        ? `${selected < YEAR0 ? 'Naprawdę' : 'Dziś'}: ${formatPL(BASE_INTAKE[i])}`
        : selected >= YEAR0 ? 'Dzisiejszy limit'
          : selected >= EXACT_FROM ? 'Limit z rozporządzenia MZ' : 'Szacunek z punktów kontrolnych';
      popReset.hidden = !changed;
    }
    function placePop() {
      if (pop.hidden) return;
      const g = intakeGeometry(size.iw, size.ih);
      const x = g.x(selected) + g.bar / 2;
      const top = g.y(intake[idx(selected)]);
      pop.style.left = `${clamp(x - pop.offsetWidth / 2, 0, intakeWrap.clientWidth - pop.offsetWidth)}px`;
      pop.style.top = `${top - pop.offsetHeight - 12}px`;
    }
    function openPop(year: number) {
      selected = clamp(year, YEAR_MIN, YEAR_MAX);
      popOpen = true;
      pop.hidden = false;
      fillPop();
      drawIntake();
      placePop();
      announce(`${academic(selected)}: ${seats(intake[idx(selected)])}.`);
    }
    function closePop() {
      if (!popOpen) return;
      popOpen = false;
      pop.hidden = true;
      drawIntake();
    }

    popInput.addEventListener('input', () => {
      if (popInput.value === '' || !Number.isFinite(+popInput.value)) return;
      setYear(selected, +popInput.value);
      placePop();
    });
    $$<HTMLButtonElement>('[data-step]').forEach((b) => b.addEventListener('click', () => {
      setYear(selected, intake[idx(selected)] + Number(b.dataset.step));
      placePop();
    }));
    popReset.addEventListener('click', () => { setYear(selected, BASE_INTAKE[idx(selected)]); placePop(); });
    $('pop-prev').addEventListener('click', () => openPop(selected - 1));
    $('pop-next').addEventListener('click', () => openPop(selected + 1));
    $('pop-close').addEventListener('click', () => { closePop(); intakeSvg.focus({ preventScroll: true }); });
    pop.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { closePop(); intakeSvg.focus({ preventScroll: true }); }
    });
    document.addEventListener('pointerdown', (ev) => {
      const t = ev.target as Node;
      if (popOpen && !pop.contains(t) && !intakeSvg.contains(t)) closePop();
    });

    // ---------- 04 Losy rocznika ----------
    function applyRate(input: HTMLInputElement) {
      const key = input.dataset.rate as keyof Rates;
      settings[key] = +input.value / Number(input.dataset.scale);
      rateOut(key).textContent = formatPL(+input.value);
      input.toggleAttribute('data-changed', input.value !== input.defaultValue);
      fill(input);
      ratesReset.hidden = !ratesChanged();
    }
    function resetRates() {
      rateInputs.forEach((r) => { r.value = r.defaultValue; applyRate(r); });
    }
    rateInputs.forEach((r) => r.addEventListener('input', () => { applyRate(r); update(); }));
    ratesReset.addEventListener('click', () => { resetRates(); update(); });

    // ---------- 05 Założenia: przesuwają obie krzywe ----------
    spec.addEventListener('input', () => {
      settings.specShare = +spec.value / 100;
      $('spec-out').textContent = spec.value;
      spec.toggleAttribute('data-changed', spec.value !== spec.defaultValue);
      fill(spec);
      reference = referenceFor();
      update();
    });
    $$<HTMLInputElement>('input[name="sim-age"]').forEach((r) => r.addEventListener('change', () => {
      settings.retireAge = +r.value;
      reference = referenceFor();
      update();
    }));

    // ---------- Wynik: odczyt roku pod kursorem ----------
    function showTip(year: number) {
      const i = year - YEAR0;
      const p = scenario[i];
      const b = reference[i];
      const d = p.doctors - b.doctors;
      tip.innerHTML =
        `<strong>${year}</strong>` +
        `<p>Twój scenariusz <b>${formatPL(p.doctors)}</b></p>` +
        `<p>Bez zmian <b>${formatPL(b.doctors)}</b></p>` +
        `<p>Ze specjalizacją <b>${formatPL(p.specialists)}</b></p>` +
        (Math.abs(d) >= SAME ? `<p class="tip__d">Różnica <b>${signed(d)}</b></p>` : '');
      tip.hidden = false;
      const g = resultGeometry(size.rw, size.rh, resultMax(scenario, reference));
      const x = g.x(year);
      const right = x + 14 + tip.offsetWidth <= size.rw;
      tip.style.left = `${right ? x + 14 : x - 14 - tip.offsetWidth}px`;
      tip.style.top = `${clamp(g.y(p.doctors) - tip.offsetHeight / 2, 0, size.rh - tip.offsetHeight)}px`;
    }
    function setHover(year: number | undefined) {
      if (year === hover) return;
      hover = year;
      drawResult();
      if (year === undefined) tip.hidden = true;
      else showTip(year);
    }
    const yearAt = (ev: PointerEvent) =>
      resultGeometry(size.rw, size.rh, 1).yearAt(ev.clientX - resultSvg.getBoundingClientRect().left);
    resultSvg.addEventListener('pointermove', (ev) => setHover(yearAt(ev)));
    resultSvg.addEventListener('pointerdown', (ev) => setHover(yearAt(ev)));
    resultSvg.addEventListener('pointerleave', () => setHover(undefined));

    // ---------- Start i zmiana rozmiaru ----------
    const resize = new ResizeObserver(() => {
      measure();
      drawIntake();
      drawResult();
      placePop();
      if (hover !== undefined) showTip(hover);
    });
    resize.observe(intakeSvg);
    resize.observe(resultSvg);
    measure();
    update();
    clearTimeout(announceTimer); // stan startowy nie jest zmianą — nie ogłaszamy go
  }
}

if (!customElements.get('zl-supply')) customElements.define('zl-supply', ZlSupply);
