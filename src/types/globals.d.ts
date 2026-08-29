// Globale wstrzykiwane przez skrypty firm trzecich oraz nasze własne uchwyty
// debugowe. TypeScript nie ma skąd o nich wiedzieć — bez tych deklaracji każde
// `window.turnstile` to błąd ts(2339), a `strict` nie może w ogóle przejść.
//
// Plik jest DEKLARACJĄ, nie kodem: nic nie emituje, nie trafia do bundla i nie
// zmienia zachowania strony. Opisuje wyłącznie kształt tego, co i tak już jest
// w `window` na produkcji.

/** Cloudflare Turnstile — ładowany z https://challenges.cloudflare.com (patrz CSP w `public/_headers`). */
interface TurnstileRenderOptions {
  sitekey: string;
  /** `'execute'` = wyzwanie rozwiązywane na żądanie (przy kliknięciu), nie na starcie. */
  execution?: 'render' | 'execute';
  /** `'interaction-only'` = widżet niewidoczny, dopóki nie wymaga interakcji. */
  appearance?: 'always' | 'execute' | 'interaction-only';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  'timeout-callback'?: () => void;
}

interface Turnstile {
  render(el: HTMLElement, opts: TurnstileRenderOptions): string | undefined;
  execute(el: HTMLElement, opts: { sitekey: string }): void;
  reset(widgetId?: string): void;
}

/**
 * Pagefind UI — ładowany z `/pagefind/pagefind-ui.js`, generowanego dopiero
 * w buildzie przez integrację `integrations/pagefind.mjs`. Na `npm run dev`
 * indeksu NIE MA, dlatego `/szukaj` sprawdza `typeof … === 'undefined'`
 * i pokazuje wskazówkę zamiast pustego miejsca — stąd `?` przy właściwości.
 */
interface PagefindUIOptions {
  element: string;
  bundlePath?: string;
  showImages?: boolean;
  showSubResults?: boolean;
  resetStyles?: boolean;
  autofocus?: boolean;
  translations?: Record<string, string>;
  processTerm?: (term: string) => string;
  [option: string]: unknown;
}

interface Window {
  turnstile?: Turnstile;
  PagefindUI?: new (opts: PagefindUIOptions) => unknown;
  /** Uchwyty debugowe gry `/gra` — wystawiane celowo, do ręcznego grzebania w konsoli. */
  __gra?: Record<string, unknown>;
  __nowaGra?: () => void;
}
