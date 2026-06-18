// Sonda — anonimowe, zbiorcze liczniki głosów w Cloudflare KV (binding SONDA_KV).
// Brak danych osobowych, brak IP. Bez bindingu zwraca 503 (sonda działa bez wyników).
const CHOICES = ['tak', 'nie', 'nie-wiem'];

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
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

export const onRequest = async (context) => {
  const { request, env } = context;
  const kv = env && env.SONDA_KV;
  if (!kv) return json({ error: 'kv-unavailable' }, 503);

  if (request.method === 'GET') return json(await read(kv));

  if (request.method === 'POST') {
    let choice;
    try { const b = await request.json(); choice = b && b.choice; } catch (e) {}
    if (!CHOICES.includes(choice)) return json({ error: 'bad-choice' }, 400);
    const counts = await read(kv);
    counts[choice] = (counts[choice] || 0) + 1;
    await kv.put('counts', JSON.stringify(counts));
    return json(counts);
  }

  return json({ error: 'method-not-allowed' }, 405);
};
