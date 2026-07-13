// Liczniki przejść do źródeł (kliknięcia w karty artykułów) ORAZ licznik zgłoszeń
// petycji („Wysłałem petycję") w Cloudflare D1 (binding CLICKS_DB). Anonimowo i
// zbiorczo: trzymamy tylko `slug -> liczba`. Bez IP, bez ciasteczek, bez danych osobowych.
//
//   GET  /api/clicks                          -> { counts: {…}, turnstileSiteKey: <klucz|null> }  (cache 600 s)
//   POST /api/clicks  {slug[, turnstileToken]} -> 204; inkrementuje licznik sluga
//
// Antybot (opcjonalny, fail-open): „głosowe" slugi z listy PROTECTED (dziś tylko
// `petycja-wyslana`) wymagają ważnego tokenu Cloudflare Turnstile — ale tylko gdy
// skonfigurowano OBA klucze (TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY). Token Turnstile
// jest jednorazowy (Cloudflare odrzuca ponowne użycie), więc pełni podwójną rolę: bariery
// antybotowej i zabezpieczenia przed podwójnym zliczeniem — bez zapisywania IP ani stanu
// po naszej stronie. Zwykłe liczniki przejść (karty artykułów) zostają tanie i „fire-and-
// forget": nie wymagają tokenu, by nie palić limitu Functions ani nie renderować widżetu
// na każdej odsłonie. Bez konfiguracji Turnstile lub bez bindingu D1 wszystko degraduje
// się łagodnie (lokalnie / w forku / przed provisioningiem).
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

// Slugi „głosowe", dla których liczy się integralność → wymagają tokenu Turnstile
// (gdy skonfigurowany). Reszta slugów to tanie liczniki przejść bez weryfikacji.
const PROTECTED = new Set(['petycja-wyslana']);

const json = (obj, status, cache) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });

// Schemat tworzymy leniwie (raz na isolate) — D1 nie wymaga osobnej migracji,
// a Function sama „leczy" brak tabeli (np. tuż po utworzeniu bazy).
let schemaReady = false;
const ensureSchema = async (db) => {
  if (schemaReady) return;
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS clicks (slug TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, updated_at INTEGER)'
    )
    .run();
  schemaReady = true;
};

// Weryfikacja tokenu Turnstile — jak w /api/sonda. Celowo BEZ remoteip (zasada „bez IP"
// z polityki prywatności). Brak tokenu → false natychmiast, bez sieciowego siteverify,
// więc beztokenowy spam kosztuje tani 403, a nie subrequest.
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

export const onRequest = async (context) => {
  const { request, env } = context;
  const db = env && env.CLICKS_DB;

  const siteKey = (env && env.TURNSTILE_SITE_KEY) || null;
  const secret = env && env.TURNSTILE_SECRET_KEY;
  // Ochrona aktywna tylko gdy skonfigurowano OBA klucze (inaczej połowiczna
  // konfiguracja zablokowałaby zliczanie — front nie miałby jak zdobyć tokenu).
  const turnstileOn = !!(secret && siteKey);
  const publicSiteKey = turnstileOn ? siteKey : null;

  if (request.method === 'GET') {
    // Brak D1 → puste liczniki (front nic nie pokaże). Krótki cache, by przy
    // braku bindingu nie odpytywać w kółko. Klucz publiczny zwracamy zawsze — front
    // wyrenderuje z niego widżet Turnstile (dla slugów chronionych).
    if (!db) return json({ counts: {}, turnstileSiteKey: publicSiteKey }, 200, 'public, max-age=60');
    try {
      await ensureSchema(db);
      const { results } = await db.prepare('SELECT slug, count FROM clicks').all();
      const counts = {};
      for (const r of results || []) counts[r.slug] = r.count;
      // Cache na brzegu CF: powtórne wejścia idą z cache (bez wywołania Funkcji
      // i bez zapytania do D1) — trzyma koszt w granicach darmowego planu.
      // Dłuższy TTL = rzadsze rewalidacje = mniej wywołań Funkcji; liczba przejść
      // do źródeł spokojnie może być „nieświeża" do 10 min. `turnstileSiteKey` to
      // klucz publiczny, więc bezpiecznie leży w odpowiedzi cache'owanej.
      return json({ counts, turnstileSiteKey: publicSiteKey }, 200, 'public, max-age=600');
    } catch (e) {
      return json({ counts: {}, turnstileSiteKey: publicSiteKey }, 200, 'public, max-age=30');
    }
  }

  if (request.method === 'POST') {
    let slug, turnstileToken;
    try {
      const b = await request.json();
      slug = b && b.slug;
      turnstileToken = b && b.turnstileToken;
    } catch (e) {}
    // Cicho ignorujemy śmieci/boty bez sluga — to tylko licznik, nie API.
    if (!SLUG_RE.test(slug || '')) return new Response(null, { status: 204 });

    // Slug „głosowy" + aktywny Turnstile → wymagaj ważnego (jednorazowego) tokenu.
    // 403 pozwala frontowi zresetować widżet i spróbować raz jeszcze. Tokenowa
    // jednorazowość Cloudflare = zarazem ochrona przed podwójnym zliczeniem.
    if (PROTECTED.has(slug) && turnstileOn && !(await verifyTurnstile(turnstileToken, secret))) {
      return json({ error: 'turnstile-failed' }, 403, 'no-store');
    }

    if (!db) return new Response(null, { status: 204 });
    try {
      await ensureSchema(db);
      // Atomowy upsert — bez wyścigu read-modify-write (inaczej niż w KV).
      const now = Date.now();
      await db
        .prepare(
          'INSERT INTO clicks (slug, count, updated_at) VALUES (?1, 1, ?2) ' +
            'ON CONFLICT(slug) DO UPDATE SET count = count + 1, updated_at = ?2'
        )
        .bind(slug, now)
        .run();
    } catch (e) {}
    return new Response(null, { status: 204 });
  }

  return json({ error: 'method-not-allowed' }, 405, 'no-store');
};
