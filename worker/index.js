// Worker serwisu. Strona jest statyczna (dist/, Workers Static Assets: _headers i _redirects
// działają jak dotąd), a kod uruchamia się tylko dla /api/* — `run_worker_first` w
// wrangler.jsonc. Wywołania Workera liczą się do limitu planu, pliki strony nie.
import { handleEgzamin } from './egzamin.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/egzamin') return handleEgzamin(request, env, ctx);
    return new Response(JSON.stringify({ error: 'not-found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  },
};
