/**
 * Wejście na stronę z kotwicą (#sekcja). Przeglądarka przewija do celu, zanim strona skończy się układać:
 * potem skrypty komponentów, obrazki i fonty zmieniają wysokość treści nad celem. Chrome i Firefox trzymają
 * wtedy pozycję same (scroll anchoring), Safari nie — cel ucieka w dół. Tu: do `load` i jeszcze chwilę po nim
 * każde przesunięcie celu w dokumencie jest wyrównywane przed narysowaniem klatki, dopóki czytelnik sam nie
 * ruszy strony.
 *
 * Płynne przewijanie (`html[data-smooth]` w base.css) włącza się dopiero potem — inaczej Chrome przy wejściu
 * z kotwicą przewijałby płynnie przez cały artykuł. Bez kotwicy w adresie — od razu.
 *
 * Link do fragmentu tekstu (#…:~:text=): Chrome podaje dyrektywę w adresie nawigacji i wtedy pozycję wybiera
 * sama przeglądarka. Gdzie dyrektywy nie widać, cel nad ekranem znaczy, że przeglądarka przewinęła niżej,
 * do tekstu — ta pozycja zostaje i jest tylko pilnowana. Odświeżenie i powrót w historii: przeglądarka
 * przywraca zapamiętaną pozycję.
 */
import { hashId } from '@/scripts/anchors';

const AFTER_LOAD_MS = 2500;
const USER_INPUT = ['wheel', 'keydown', 'pointerdown'] as const;

const smooth = () => { document.documentElement.dataset.smooth = ''; };
const afterLoad = (fn: () => void) => {
  if (document.readyState === 'complete') fn();
  else addEventListener('load', fn, { once: true });
};

export function settleOnAnchor() {
  const id = hashId();
  const target = id ? document.getElementById(id) : null;
  if (!target) return smooth();
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav && (nav.type !== 'navigate' || nav.name.includes(':~:'))) return afterLoad(smooth);

  /** górna krawędź celu w oknie, którą trzymamy, i jego położenie w dokumencie przy ostatnim sprawdzeniu */
  let want = 0;
  let at = 0;
  let timer: number | undefined;
  const top = () => target.getBoundingClientRect().top;
  const record = () => {
    want = top();
    at = want + scrollY;
  };

  // Przeglądarka jeszcze nie przewinęła (Chrome przewija dopiero przy `load`) albo cel jest na ekranie —
  // ustaw go dokładnie. Cel nad ekranem: przeglądarka przewinęła niżej (fragment tekstu) — zostaw.
  const t = top();
  if (scrollY === 0 || (t >= 0 && t < innerHeight)) target.scrollIntoView({ block: 'start' });
  record();

  // Treść zmieniła wysokość: cel przesunął się w dokumencie. Chrome przesunął już stronę razem z nim
  // (cel stoi w oknie), w Safari trzeba to zrobić tutaj.
  const observer = new ResizeObserver(() => {
    const now = top();
    if (Math.abs(now + scrollY - at) <= 1) return;
    if (Math.abs(now - want) > 1) scrollBy(0, now - want);
    record();
  });
  // Cel stoi w dokumencie, a strona się przewinęła — czytelnik przewija sam (np. paskiem przewijania)
  const onScroll = () => {
    const now = top();
    if (Math.abs(now + scrollY - at) <= 1 && Math.abs(now - want) > 1) stop();
  };
  // Karta otwarta w tle nie układa strony, dopóki jej nie widać — odliczanie rusza dopiero wtedy
  const later = () => {
    if (document.visibilityState === 'visible') timer = window.setTimeout(stop, AFTER_LOAD_MS);
    else document.addEventListener('visibilitychange', later, { once: true });
  };

  function stop() {
    observer.disconnect();
    clearTimeout(timer);
    removeEventListener('scroll', onScroll);
    removeEventListener('load', later);
    document.removeEventListener('visibilitychange', later);
    removeEventListener('hashchange', stop);
    USER_INPUT.forEach((type) => removeEventListener(type, stop, true));
    smooth();
  }

  observer.observe(document.body);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('hashchange', stop);
  USER_INPUT.forEach((type) => addEventListener(type, stop, { capture: true, passive: true }));
  afterLoad(later);
}
