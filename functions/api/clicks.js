// Liczniki przejść do źródeł (kliknięcia w karty artykułów) w Cloudflare D1
// (binding CLICKS_DB). Anonimowo i zbiorczo: trzymamy tylko `slug -> liczba`.
// Bez IP, bez ciasteczek, bez danych osobowych — spójne z polityką prywatności.
//
//   GET  /api/clicks          -> { counts: { <slug>: <liczba>, ... } }  (cache 60 s)
//   POST /api/clicks  {slug}  -> 204; inkrementuje licznik danego sluga
//
// Bez bindingu D1 (lokalnie / przed provisioningiem) degraduje się łagodnie:
// GET zwraca puste liczniki, POST jest no-opem — strona działa jak dotąd.
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

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

export const onRequest = async (context) => {
  const { request, env } = context;
  const db = env && env.CLICKS_DB;

  if (request.method === 'GET') {
    // Brak D1 → puste liczniki (front nic nie pokaże). Krótki cache, by przy
    // braku bindingu nie odpytywać w kółko.
    if (!db) return json({ counts: {} }, 200, 'public, max-age=60');
    try {
      await ensureSchema(db);
      const { results } = await db.prepare('SELECT slug, count FROM clicks').all();
      const counts = {};
      for (const r of results || []) counts[r.slug] = r.count;
      // Cache na brzegu CF: powtórne wejścia idą z cache (bez wywołania Funkcji
      // i bez zapytania do D1) — trzyma koszt w granicach darmowego planu.
      return json({ counts }, 200, 'public, max-age=60');
    } catch (e) {
      return json({ counts: {} }, 200, 'public, max-age=30');
    }
  }

  if (request.method === 'POST') {
    let slug;
    try {
      const b = await request.json();
      slug = b && b.slug;
    } catch (e) {}
    // Cicho ignorujemy śmieci/boty bez sluga — to tylko licznik, nie API.
    if (!SLUG_RE.test(slug || '')) return new Response(null, { status: 204 });
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
