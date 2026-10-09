// Anonimowe, zbiorcze wyniki modułu /egzamin w Cloudflare D1 (binding EGZAMIN_DB).
// Jeden wiersz na ukończony test: dzień (bez godziny), tryb, sesja, punkty, maksimum,
// czas w minutach. Bez IP, bez ciasteczek, bez identyfikatorów i bez odpowiedzi na
// poszczególne pytania — wiersza nie da się powiązać z osobą.
//
//   POST /api/egzamin {sesja, tryb, pkt, max, czas, turnstileToken}
//        -> 200 { grupa: [{kubel, n, zdane, sumaProc}] }  — statystyki WŁASNEJ grupy, już z tym wynikiem
//        -> 400 | 403
//   GET  /api/egzamin -> { grupy: [{tryb, sesja, kubel, n, zdane, sumaProc}] }  — tylko gdy front nic nie zapisuje
//
// Koszt (darmowy plan): zapis to JEDNO wywołanie Funkcji — POST od razu zwraca
// statystyki grupy, więc front nie robi osobnego GET. Odczyt nie liczy nic od zera:
// tabela `agregaty` (tryb × sesja × dziesiątka procent) jest aktualizowana w tej samej
// transakcji co zapis, a zapytanie czyta ≤10 wierszy niezależnie od liczby testów.
// GET cache'uje na brzegu reguła cache strefy z repo infrastructure (cloudflare_cache.tf:
// GET /api/clicks, /api/sonda, /api/egzamin; Edge TTL 300 s) — trafienie nie wywołuje
// Funkcji ani D1. Sam nagłówek Cache-Control w odpowiedzi Funkcji brzegu NIE włącza.
// Po zapisie kasujemy wpis z caches.default (przestrzeń wspólna z cache strefy) —
// best-effort odświeżenie w tej kolokacji; pozostałe dogonią po Edge TTL.
//
// Antybot: niewidoczny widżet Turnstile (osobny od sondy — tryb „invisible" jest cechą
// widżetu). Token jest jednorazowy, więc jeden test = jeden zapis, bez trzymania IP czy
// stanu po naszej stronie. Ochrona aktywna, gdy ustawione są OBA sekrety
// TURNSTILE_EGZAMIN_SITE_KEY + TURNSTILE_EGZAMIN_SECRET_KEY; bez nich (lokalnie, w forku)
// zapis działa bez weryfikacji. Bez bindingu D1 wszystko degraduje się łagodnie.
const TRYBY = new Set(['egzamin', 'szybki']);
// LEK: „20262” / „wszystkie”; LDEK z prefiksem: „ldek-20262” / „ldek-wszystkie” — osobne grupy statystyk.
const SESJA_RE = /^(ldek-)?(\d{4}[12]|wszystkie)$/;
const PROG = 0.56; // art. 14f ustawy o zawodach lekarza — 56% maksymalnej liczby punktów
const SEK_NA_PYTANIE = 72; // 4 h na 200 pytań (Dz.U. 2021 poz. 828, § 10 ust. 5)
const BROWSER_TTL = 600; // cache przeglądarki; brzeg nadpisuje to Edge TTL reguły

const json = (obj, status, cache) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });

let schemaReady = false;
const ensureSchema = async (db) => {
  if (schemaReady) return;
  await db.batch([
    db.prepare(
      'CREATE TABLE IF NOT EXISTS wyniki (' +
        'dzien TEXT NOT NULL, tryb TEXT NOT NULL, sesja TEXT NOT NULL, ' +
        'pkt INTEGER NOT NULL, max INTEGER NOT NULL, czas_min INTEGER NOT NULL, ' +
        'zdany INTEGER NOT NULL, kubel INTEGER NOT NULL)'
    ),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS agregaty (' +
        'tryb TEXT NOT NULL, sesja TEXT NOT NULL, kubel INTEGER NOT NULL, ' +
        'n INTEGER NOT NULL, zdane INTEGER NOT NULL, suma_proc REAL NOT NULL, ' +
        'PRIMARY KEY (tryb, sesja, kubel))'
    ),
  ]);
  // Jednorazowe odtworzenie agregatów z surowych wierszy (np. po dodaniu tabeli do
  // istniejącej bazy). Przy pustych agregatach i pustych wynikach nic nie robi.
  const pusto = await db.prepare('SELECT 1 FROM agregaty LIMIT 1').first();
  if (!pusto) {
    await db
      .prepare(
        'INSERT INTO agregaty (tryb, sesja, kubel, n, zdane, suma_proc) ' +
          'SELECT tryb, sesja, kubel, COUNT(*), SUM(zdany), SUM(pkt * 1.0 / max) FROM wyniki GROUP BY tryb, sesja, kubel'
      )
      .run();
  }
  schemaReady = true;
};

// Jak w /api/clicks: celowo BEZ remoteip (zasada „bez IP" z polityki prywatności).
const verifyTurnstile = async (token, secret) => {
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await r.json();
    return !!(data && data.success === true);
  } catch (e) {
    return false;
  }
};

// Walidacja wiarygodności: tylko testy, które dało się realnie ukończyć w module.
const sprawdz = (b) => {
  if (!b || !TRYBY.has(b.tryb) || !SESJA_RE.test(String(b.sesja))) return null;
  const pkt = Number(b.pkt), max = Number(b.max), czas = Number(b.czas);
  if (![pkt, max, czas].every(Number.isInteger)) return null;
  // Egzamin = cała sesja (200 minus pytania unieważnione); szybki test = 20 pytań.
  if (b.tryb === 'egzamin' ? max < 150 || max > 200 : max !== 20) return null;
  if (pkt < 0 || pkt > max) return null;
  // Czas w sekundach: nie szybciej niż 2 s na pytanie, nie dłużej niż limit + 2 min zapasu.
  if (czas < max * 2 || czas > max * SEK_NA_PYTANIE + 120) return null;
  return { tryb: b.tryb, sesja: String(b.sesja), pkt, max, czas };
};

export const onRequest = async (context) => {
  const { request, env } = context;
  const db = env && env.EGZAMIN_DB;
  const secret = env && env.TURNSTILE_EGZAMIN_SECRET_KEY;
  const turnstileOn = !!(secret && env.TURNSTILE_EGZAMIN_SITE_KEY);
  const cacheKey = new Request(new URL('/api/egzamin', request.url).toString(), { method: 'GET' });
  const cache = typeof caches !== 'undefined' ? caches.default : null;

  if (request.method === 'GET') {
    if (!db) return json({ grupy: [] }, 200, 'public, max-age=60');
    try {
      await ensureSchema(db);
      const { results } = await db
        .prepare('SELECT tryb, sesja, kubel, n, zdane, suma_proc AS sumaProc FROM agregaty')
        .all();
      return json({ grupy: results || [] }, 200, `public, max-age=${BROWSER_TTL}`);
    } catch (e) {
      return json({ grupy: [] }, 200, 'public, max-age=30');
    }
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {}
    const w = sprawdz(body);
    if (!w) return json({ error: 'invalid' }, 400, 'no-store');
    if (turnstileOn && !(await verifyTurnstile(body.turnstileToken, secret))) {
      return json({ error: 'turnstile-failed' }, 403, 'no-store');
    }
    if (!db) return json({ grupa: [] }, 200, 'no-store');
    try {
      await ensureSchema(db);
      const proc = w.pkt / w.max;
      const zdany = w.pkt >= Math.ceil(w.max * PROG) ? 1 : 0;
      const kubel = Math.min(9, Math.floor(proc * 10));
      // Zapis surowego wiersza + aktualizacja agregatu + odczyt grupy — jedna transakcja.
      const [, , grupa] = await db.batch([
        db
          .prepare('INSERT INTO wyniki (dzien, tryb, sesja, pkt, max, czas_min, zdany, kubel) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)')
          .bind(new Date().toISOString().slice(0, 10), w.tryb, w.sesja, w.pkt, w.max, Math.round(w.czas / 60), zdany, kubel),
        db
          .prepare(
            'INSERT INTO agregaty (tryb, sesja, kubel, n, zdane, suma_proc) VALUES (?1, ?2, ?3, 1, ?4, ?5) ' +
              'ON CONFLICT (tryb, sesja, kubel) DO UPDATE SET n = n + 1, zdane = zdane + ?4, suma_proc = suma_proc + ?5'
          )
          .bind(w.tryb, w.sesja, kubel, zdany, proc),
        db
          .prepare('SELECT kubel, n, zdane, suma_proc AS sumaProc FROM agregaty WHERE tryb = ?1 AND sesja = ?2')
          .bind(w.tryb, w.sesja),
      ]);
      // Świeży zapis: best-effort skasowanie wpisu GET z cache tej kolokacji.
      if (cache) context.waitUntil(cache.delete(cacheKey));
      return json({ grupa: (grupa && grupa.results) || [] }, 200, 'no-store');
    } catch (e) {
      return json({ grupa: [] }, 200, 'no-store');
    }
  }

  return json({ error: 'method-not-allowed' }, 405, 'no-store');
};
