/**
 * Animacje wejścia sterowane atrybutami — skrypt nie zna żadnego komponentu:
 *   data-reveal         → pojawienie się (opacity + przesunięcie, styl w base.css)
 *   data-reveal="grow"  → komponent sam animuje stan .is-armed → .is-in (np. wykres)
 *   data-count="1234"   → licznik od zera (ui/Counter.astro)
 *
 * Strona jest w pełni statyczna, dopóki użytkownik sam nie zacznie przewijać
 * (wheel / touch / klawiatura). Dopiero wtedy elementy POD widocznym obszarem
 * dostają stan początkowy i animują się po wejściu w kadr. Zrzuty ekranu,
 * crawlery i czytniki nigdy nie widzą pustej strony ani liczb „w połowie”.
 */
import { formatPL } from '@/lib/format';

const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight;
const decimalsOf = (el: HTMLElement) => parseInt(el.dataset.decimals ?? '0', 10);

function countUp(el: HTMLElement) {
  const target = parseFloat(el.dataset.count ?? '');
  if (Number.isNaN(target)) return;
  const decimals = decimalsOf(el);
  const duration = target > 10000 ? 1600 : 1200;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = formatPL(target * (1 - Math.pow(1 - p, 4)), decimals);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Zamiast IntersectionObservera: sprawdzanie przy przewijaniu. Element, który przy
// szybkim scrollu lub skoku kotwicą „przeskoczył” viewport, też zostanie odsłonięty.
const pending = new Set<HTMLElement>();

function show(el: HTMLElement) {
  pending.delete(el);
  if (el.hasAttribute('data-count')) countUp(el);
  el.classList.add('is-in');
}

let ticking = false;
function check() {
  ticking = false;
  const limit = window.innerHeight * 0.9;
  pending.forEach((el) => {
    if (el.getBoundingClientRect().top < limit) show(el);
  });
  if (!pending.size) {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  }
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  // rAF bywa wstrzymany w ukrytej karcie — wtedy sprawdzamy od razu
  if (document.hidden) check();
  else requestAnimationFrame(check);
}

const INTENT = ['wheel', 'touchmove', 'keydown'] as const;
const SCROLL_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End', 'Space']);

function arm() {
  INTENT.forEach((t) => window.removeEventListener(t, onIntent));

  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    if (!below(el)) return;
    el.textContent = formatPL(0, decimalsOf(el));
    pending.add(el);
  });

  // Opóźnienie kaskadowe dla rodzeństwa (karty w siatce pojawiają się po kolei)
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (!below(el)) return;
    const index = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--d', `${(index % 4) * 70}ms`);
    el.classList.add('is-armed');
    pending.add(el);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

function onIntent(e: Event) {
  if (e instanceof KeyboardEvent && !SCROLL_KEYS.has(e.key)) return;
  arm();
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  INTENT.forEach((t) => window.addEventListener(t, onIntent, { passive: true }));
}
