// Wyłącznie lokalny podgląd. Ten moduł nie jest entrypointem Pages ani Workera produkcyjnego.
import { onRequestPost as submit } from '../../functions/api/historie/index.js';
import { onRequestPost as importing } from '../../functions/api/historie/import.js';
import { onRequestGet as publications } from '../../functions/api/historie/publikacje.js';
import { onRequestGet as configuration } from '../../functions/api/historie/konfiguracja.js';

const networkFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = async (url, options) => {
  if (String(url) === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
    const { secret, response } = JSON.parse(options.body);
    // Publiczny testowy widget wydaje token bez action/hostname w odpowiedzi dostawcy.
    // Symulujemy tylko jego walidację; pobieranie materiałów źródłowych korzysta z sieci.
    return Response.json({
      success: secret === '1x0000000000000000000000000000000AA' && response === 'XXXX.DUMMY.TOKEN.XXXX',
      action: 'historie', hostname: 'localhost',
    });
  }
  return networkFetch(url, options);
};

const routes = {
  'POST /api/historie': submit,
  'POST /api/historie/import': importing,
  'GET /api/historie/publikacje': publications,
  'GET /api/historie/konfiguracja': configuration,
};
export default { fetch(request, env) {
  const url = new URL(request.url);
  const allowed = String(env.HISTORIE_PREVIEW_ORIGINS ?? '').split(',');
  // Chronimy także wewnętrzny listener emulatora, nie tylko serwer statycznych plików.
  if (!allowed.includes(url.origin) || (request.headers.get('origin') && request.headers.get('origin') !== url.origin)) {
    return new Response('Forbidden', { status: 403 });
  }
  const handler = routes[`${request.method} ${url.pathname}`];
  return handler ? handler({ request, env }) : new Response('Not found', { status: 404 });
} };
