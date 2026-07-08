// Sonda — anonimowe, zbiorcze liczniki głosów w Cloudflare KV (binding SONDA_KV).
// Brak danych osobowych, brak IP. Bez bindingu zwraca 503 (sonda działa bez wyników).
//
// Ochrona przed nadużyciami (opcjonalna, fail-open): gdy ustawione są OBA — sekret
// TURNSTILE_SECRET_KEY i publiczny TURNSTILE_SITE_KEY — każdy głos (POST) wymaga
// ważnego tokenu Cloudflare Turnstile. Turnstile jest przyjazny prywatności (bez
// śledzących ciasteczek) i NIE wymaga zapisywania IP. Gdy nie skonfigurowano —
// weryfikacja jest pomijana i sonda działa jak dotąd (lokalnie, w forku, przed
// konfiguracją). Publiczny klucz zwracamy w GET, by front mógł wyrenderować widżet.
const CHOICES = ['tak', 'nie', 'nie-wiem'];

const json = (obj, status = 200, cache = 'no-store') =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });

const read = async (kv) => {
  try {
    const raw = await kv.get('counts');
    const c = raw ? JSON.parse(raw) : {};
    return { tak: c.tak || 0, nie: c.nie || 0, 'nie-wiem': c['nie-wiem'] || 0 };
  } catch (e) {
    return { tak: 0, nie: 0, 'nie-wiem': 0 };
  }
};

// Weryfikacja tokenu Turnstile. Celowo NIE przekazujemy remoteip — trzymamy się
// zasady „bez IP" z polityki prywatności (Turnstile działa też bez tego pola).
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
  const kv = env && env.SONDA_KV;
  if (!kv) return json({ error: 'kv-unavailable' }, 503);

  const siteKey = (env && env.TURNSTILE_SITE_KEY) || null;
  const secret = env && env.TURNSTILE_SECRET_KEY;
  // Ochrona aktywna tylko gdy skonfigurowano OBA klucze (inaczej połowiczna
  // konfiguracja zablokowałaby głosowanie — front nie miałby jak zdobyć tokenu).
  const turnstileOn = !!(secret && siteKey);

  if (request.method === 'GET') {
    const counts = await read(kv);
    // Cache na brzegu CF (jak w /api/clicks): powtórne odsłony idą z cache — bez
    // wywołania Funkcji i bez odczytu KV — co trzyma zużycie w darmowym planie.
    // Świeżo oddany głos i tak renderuje się z odpowiedzi POST (niecache'owanej),
    // więc ≤5 min „nieświeżości" liczb dotyczy tylko wracających gości. Dłuższy
    // TTL = rzadsze rewalidacje = mniej wywołań Funkcji (sonda jest na stronie
    // głównej, więc to główny konsument limitu).
    return json(
      { ...counts, turnstileSiteKey: turnstileOn ? siteKey : null },
      200,
      'public, max-age=300'
    );
  }

  if (request.method === 'POST') {
    let choice, turnstileToken;
    try {
      const b = await request.json();
      choice = b && b.choice;
      turnstileToken = b && b.turnstileToken;
    } catch (e) {}
    if (!CHOICES.includes(choice)) return json({ error: 'bad-choice' }, 400);

    if (turnstileOn && !(await verifyTurnstile(turnstileToken, secret))) {
      return json({ error: 'turnstile-failed' }, 403);
    }

    const counts = await read(kv);
    counts[choice] = (counts[choice] || 0) + 1;
    await kv.put('counts', JSON.stringify(counts));
    return json(counts);
  }

  return json({ error: 'method-not-allowed' }, 405);
};
