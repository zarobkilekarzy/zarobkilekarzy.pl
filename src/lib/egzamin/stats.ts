/**
 * Porównanie z innymi użytkownikami strony: anonimowe, zbiorcze wyniki w D1 przez
 * functions/api/egzamin.js. Protokół ten sam co w pierwszej wersji modułu — wyniki zebrane
 * wcześniej liczą się dalej.
 *
 * Zapis: jeden POST na ukończony test (sesja, tryb, punkty, czas + token niewidocznego
 * Turnstile), który od razu zwraca agregaty swojej grupy — jedno wywołanie Funkcji na test.
 * GET (cache'owany na brzegu) tylko wtedy, gdy nic nie zapisujemy (np. ponowne otwarcie wyniku).
 * Do statystyk idą wyłącznie porównywalne testy: pełny egzamin albo szybki test z całej sesji
 * (lub wszystkich sesji), bez zawężenia do dziedziny, bez powtórki i bez udziału agenta.
 */
import { sessionCode } from './ids';
import type { TestConfig, TestResult, TestState } from './types';

const API = '/api/egzamin';
/** Poniżej tej liczby wyników grupy nie pokazujemy rozkładu (za mało, żeby coś znaczył). */
export const MIN_RESULTS = 10;
/** Najwyżej jeden zapis na 5 minut z jednej przeglądarki. */
const LAST_SENT = 'egzamin-lek:ostatni-zapis';
const SEND_GAP = 5 * 60_000;
// Publiczny klucz niewidocznego widżetu (repo infrastructure, output turnstile_egzamin_sitekey).
// Jawny z założenia; działa tylko na zarobkilekarzy.pl — lokalnie tokenu nie będzie, a serwer
// bez sekretu przyjmie zapis bez weryfikacji.
const TURNSTILE_SITE_KEY = '0x4AAAAAAFRvAWnOihYqV1jZ';

interface GroupRow { kubel: number; n: number; zdane: number; sumaProc: number }
interface AllRow extends GroupRow { tryb: string; sesja: string }

export interface GroupStats {
  /** liczba wyników w przedziałach po 10 pp. (0–9%, …, 90–100%) */
  bins: number[];
  total: number;
  /** odsetek wyników ≥ progu */
  passed: number;
  /** średni wynik jako ułamek */
  mean: number;
  /** czy właśnie dodaliśmy ten wynik */
  added: boolean;
}

/** Czy wynik tego testu jest porównywalny z innymi (i może trafić do statystyk). */
export const comparable = (s: TestState) =>
  (s.config.mode === 'egzamin' || s.config.mode === 'szybki') && !s.agent && !s.incomparable && !s.config.ids && s.config.field === 'all';

/** Te same granice co walidacja w functions/api/egzamin.js — wynik spoza nich serwer odrzuci. */
const acceptable = (mode: TestConfig['mode'], r: TestResult) => {
  const sec = Math.round(r.elapsed / 1000);
  const sizeOk = mode === 'egzamin' ? r.max >= 150 && r.max <= 200 : r.max === 20;
  return sizeOk && sec >= r.max * 2 && sec <= r.max * 72 + 120;
};

/** Klucz grupy po stronie serwera: „20262”, „ldek-20262”, „wszystkie”, „ldek-wszystkie”. */
const groupKey = (c: TestConfig) =>
  c.session === 'all' ? `${c.exam === 'ldek' ? 'ldek-' : ''}wszystkie` : sessionCode(c.exam, c.session);

declare global {
  interface Window {
    turnstile?: { render(el: HTMLElement, opts: Record<string, unknown>): string; remove(id: string): void };
  }
}

function loadTurnstile() {
  return new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.append(s);
  });
}

/** Token niewidocznego Turnstile albo null (brak sieci, blokada, poza domeną — zapis i tak próbujemy). */
function turnstileToken(box: HTMLElement) {
  return new Promise<string | null>((resolve) => {
    loadTurnstile().then(() => {
      box.replaceChildren();
      const el = document.createElement('div');
      box.append(el);
      let id = '';
      const done = (t: string | null) => {
        clearTimeout(stop);
        // Token jest jednorazowy — widżet po nim niepotrzebny (kolejny test wyrenderuje nowy)
        try { if (id) window.turnstile!.remove(id); } catch { /* już usunięty */ }
        resolve(t);
      };
      const stop = setTimeout(() => done(null), 15_000);
      id = window.turnstile!.render(el, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => done(t),
        'error-callback': () => done(null),
        'timeout-callback': () => done(null),
      });
    }, () => resolve(null));
  });
}

/** Odczyt wszystkich grup — pamiętany przez minutę (brzeg i tak cache'uje go 5 min), porażka nie jest pamiętana. */
const ALL_TTL = 60_000;
let all: { at: number; rows: Promise<AllRow[]> } | null = null;
function fetchAll() {
  if (!all || Date.now() - all.at > ALL_TTL) {
    const rows = fetch(API)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<{ grupy?: AllRow[] }>; })
      .then((d) => d.grupy ?? []);
    const entry = { at: Date.now(), rows };
    rows.catch(() => { if (all === entry) all = null; });
    all = entry;
  }
  return all.rows;
}

function summarize(rows: GroupRow[], added: boolean): GroupStats {
  const bins = Array.from({ length: 10 }, () => 0);
  let total = 0, passed = 0, sum = 0;
  for (const g of rows) {
    if (g.kubel >= 0 && g.kubel < 10) bins[g.kubel] += g.n;
    total += g.n; passed += g.zdane; sum += g.sumaProc;
  }
  return { bins, total, passed: total ? passed / total : 0, mean: total ? sum / total : 0, added };
}

/**
 * Statystyki grupy tego testu. Przy pierwszym wywołaniu dla testu zapisuje wynik
 * (`state.sent` ustawiamy przed wysyłką — odświeżenie strony nie wyśle drugi raz).
 * `persist` zapisuje stan testu w pamięci przeglądarki.
 */
export async function groupStats(state: TestState, result: TestResult, turnstileBox: HTMLElement, persist: () => void): Promise<GroupStats> {
  const key = groupKey(state.config);
  if (!state.sent) {
    state.sent = true;
    persist();
    let last = 0;
    try { last = Number(localStorage.getItem(LAST_SENT)) || 0; } catch { /* brak pamięci */ }
    if (Date.now() - last >= SEND_GAP && acceptable(state.config.mode, result)) {
      const token = await turnstileToken(turnstileBox);
      try {
        const r = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            sesja: key, tryb: state.config.mode, pkt: result.points, max: result.max,
            czas: Math.round(result.elapsed / 1000), turnstileToken: token,
          }),
        });
        if (r.ok) {
          try { localStorage.setItem(LAST_SENT, String(Date.now())); } catch { /* brak pamięci */ }
          all = null; // następny odczyt grup ma już zawierać ten wynik
          const { grupa } = (await r.json()) as { grupa?: GroupRow[] };
          return summarize(grupa ?? [], true);
        }
      } catch { /* sieć — pokażemy to, co jest */ }
    }
  }
  const rows = (await fetchAll()).filter((g) => g.tryb === state.config.mode && g.sesja === key);
  return summarize(rows, false);
}
