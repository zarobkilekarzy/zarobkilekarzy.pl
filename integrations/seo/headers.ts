/**
 * dist/_headers dla Cloudflare (statyczna warstwa, bez Workera): cache plików z hashem,
 * nagłówki bezpieczeństwa z CSP i X-Robots-Tag: noindex dla plików danych (JSON) —
 * wyszukiwarka ma pokazywać strony, nie surowe dane.
 * Generowany z listy plików buildu, bo endpointy JSON (np. sesje egzaminu) powstają z danych.
 * Limit Cloudflare: 100 reguł.
 */
import { newsletter, newsletterOn } from '../../src/data/newsletter';
import { SOR_DATA_ORIGIN } from '../../src/lib/sor/source';

/**
 * CSP statyczny (bez hashy per build), więc `'unsafe-inline'` dla skryptów i stylów: Astro wstawia
 * małe skrypty i atrybuty `style` w HTML. Z zewnątrz tylko Cloudflare Web Analytics (beacon
 * wpięty ręcznie w Analytics.astro): skrypt z static.cloudflareinsights.com, raport do
 * cloudflareinsights.com. Endpoint newslettera dochodzi do connect-src sam, gdy blok jest włączony.
 * Mapa i kafelek kolejek na SOR czytają migawkę z dane.zarobkilekarzy.pl (Worker SOR, lib/sor/source).
 * Cloudflare Turnstile (challenges.cloudflare.com: skrypt, ramka, zapytania) — niewidoczny widżet
 * przy zapisie wyniku egzaminu do statystyk (src/lib/egzamin/stats.ts).
 * YouTube (youtube-nocookie.com: tylko ramka) — film w artykule, osadzany dopiero po kliknięciu (blocks/YouTube).
 * HSTS celowo nie tutaj — ustawione strefowo w panelu Cloudflare (jedno źródło nagłówka).
 * Pułapka: `astro preview` nie nakłada `_headers` — CSP sprawdza `npm run preview:cf`.
 */
/** `frames` = strona może być osadzana w ramce z tej domeny i sama osadza ramki z tej domeny (podprojekt /mobywatel/). */
export function contentSecurityPolicy(frames = false): string {
  const TURNSTILE = 'https://challenges.cloudflare.com';
  // Filmy z YouTube (blocks/YouTube): ramka ładuje się dopiero po kliknięciu, z domeny bez ciasteczek
  const YOUTUBE = 'https://www.youtube-nocookie.com';
  const connect = ["'self'", TURNSTILE, 'https://cloudflareinsights.com', SOR_DATA_ORIGIN];
  if (newsletterOn) connect.push(new URL(newsletter.endpoint).origin);
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `frame-ancestors ${frames ? "'self'" : "'none'"}`,
    "form-action 'self'",
    "img-src 'self' data:",
    `script-src 'self' 'unsafe-inline' ${TURNSTILE} https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    `frame-src ${frames ? "'self' " : ''}${TURNSTILE} ${YOUTUBE}`,
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function headersFile(files: Iterable<string>): string {
  const json = [...files].filter((f) => f.endsWith('.json') && !f.startsWith('/egzamin/dane/')).sort();
  const rules: string[][] = [
    ['/_astro/*', 'Cache-Control: public, max-age=31536000, immutable'],
    // Pliki sesji egzaminu: moduł pobiera je z ?v=<hash treści>, więc zmiana danych = nowy adres.
    // Jedna reguła na katalog zamiast reguły na plik — każda nowa sesja CEM nie zużywa limitu.
    ['/egzamin/dane/*', 'Cache-Control: public, max-age=31536000, immutable', 'X-Robots-Tag: noindex'],
    // Prototypy (np. gry przed wydaniem pod docelowym adresem) — poza indeksem także nagłówkiem, nie tylko meta.
    ['/prototypy/*', 'X-Robots-Tag: noindex'],
    // Markdown dla agentów (integrations/markdown): typ z kodowaniem dla polskich znaków, poza indeksem — to kopia strony
    ['/*.md', 'Content-Type: text/markdown; charset=utf-8', 'X-Robots-Tag: noindex'],
    [
      '/*',
      `Content-Security-Policy: ${contentSecurityPolicy()}`,
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'X-Frame-Options: DENY',
    ],
    // Podprojekt „Prototypy mObywatela” (src/mobywatel/, src/pages/mobywatel/): strona konkursu osadza prototypy
    // (/mobywatel/<wariant>/) w ramce telefonu — ramka tylko z tej domeny. Przy usuwaniu podprojektu usuń tę regułę.
    // Musi stać po regule /*: odpina jej nagłówki i podaje swoje.
    [
      '/mobywatel/*',
      '! Content-Security-Policy',
      '! X-Frame-Options',
      `Content-Security-Policy: ${contentSecurityPolicy(true)}`,
      'X-Frame-Options: SAMEORIGIN',
    ],
    ...json.map((file) => [file, 'X-Robots-Tag: noindex']),
  ];
  if (rules.length > 100) throw new Error(`_headers: ${rules.length} reguł, limit Cloudflare to 100`);
  return [
    '# Wygenerowane przez integrations/seo (headers.ts) — nie edytować ręcznie.',
    ...rules.map(([path, ...headers]) => [path, ...headers.map((h) => `  ${h}`)].join('\n')),
    '',
  ].join('\n');
}
