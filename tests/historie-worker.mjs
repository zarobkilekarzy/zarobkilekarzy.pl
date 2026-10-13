// Wyłącznie lokalny harness: sieć jest zastąpiona fiksturami, implementacja API pozostaje rzeczywista.
import { onRequestPost as submit } from '../functions/api/historie/index.js';
import { onRequestPost as importing } from '../functions/api/historie/import.js';
import { onRequestGet as publications } from '../functions/api/historie/publikacje.js';
import { onRequestGet as configuration } from '../functions/api/historie/konfiguracja.js';
import { onRequestPost as issuing } from '../functions/api/historie/wydanie.js';
import { importSource } from '../lib/historie/import.mjs';
import { errorResponse, json } from '../lib/historie/http.mjs';
import { xFixtures } from './fixtures/x-oembed.mjs';

globalThis.fetch = async (url, options) => {
  if (String(url) === 'https://www.medonet.pl/historie-fixture') return new Response('<article itemprop="articleBody"><p>Syntetyczny materiał źródłowy.</p><div id="comments">Komentarz innej osoby</div></article>', { headers: { 'Content-Type': 'text/html' } });
  const endpoint = new URL(String(url));
  if (endpoint.origin === 'https://publish.x.com' && endpoint.pathname === '/oembed') {
    const fixture = Object.values(xFixtures).find(({ url }) => url === endpoint.searchParams.get('url'));
    if (!fixture) throw new Error('network-forbidden-in-test');
    return json({ html: fixture.html });
  }
  if (String(url) !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') throw new Error('network-forbidden-in-test');
  const { response } = JSON.parse(options.body);
  if (response === 'unavailable') return new Response('', { status: 503 });
  return json({ success: response !== 'bad', action: response === 'wrong-action' ? 'other' : 'historie',
    hostname: response === 'wrong-host' ? 'evil.example' : 'zarobkilekarzy.pl' });
};

export default { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/test/extract') {
    try {
      const { url: source, responses } = await request.json();
      let index = 0; const visited = [];
      const result = await importSource(source, async (target, options) => {
        visited.push({ target, redirect: options.redirect });
        const fixture = responses[index++];
        if (!fixture) throw new Error('unexpected-fetch');
        return new Response(fixture.body ?? '', { status: fixture.status ?? 200,
          headers: fixture.headers ?? { 'Content-Type': 'text/html' } });
      });
      return json({ ...result, visited });
    } catch (error) { return errorResponse(error); }
  }
  const effective = { ...env };
  if (request.headers.has('x-test-disabled')) effective.HISTORIE_API_AKTYWNE = 'false';
  if (request.headers.has('x-test-no-key')) effective.TURNSTILE_HISTORIE_SECRET_KEY = '';
  const handler = ({
    '/api/historie': submit, '/api/historie/import': importing,
    '/api/historie/publikacje': publications, '/api/historie/konfiguracja': configuration,
    '/api/historie/wydanie': issuing,
  })[url.pathname];
  return handler ? handler({ request, env: effective }) : new Response('not found', { status: 404 });
} };
