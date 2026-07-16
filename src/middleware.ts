import { defineMiddleware } from 'astro:middleware';
import { addHeadingAnchors } from './lib/headingAnchors';

// Anchory nagłówków doklejane do gotowego HTML — jedno miejsce zamiast ~230
// ręcznych `id` w szablonach (i bez pilnowania ich przy każdej nowej sekcji).
//
// UWAGA na koszty: to middleware Astro, nie Cloudflare. Przy `output: static`
// (bez adaptera) wykonuje się tylko przy renderze — w dev na żądanie, na
// produkcji raz, w buildzie. Do `dist/` idzie czysty HTML, żadne wywołanie
// Functions z tego nie powstaje (patrz `public/_routes.json`: Functions tylko
// na /api/*). Gdyby kiedyś doszedł adapter SSR, ten koszt trzeba przeliczyć.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  // Tylko strony. Obrazy OG (/og/*.png), /llms.txt i RSS zostawiamy w spokoju.
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;

  const { html } = addHeadingAnchors(await response.text());
  const headers = new Headers(response.headers);
  headers.delete('content-length'); // długość zmieniona przez transformację
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
