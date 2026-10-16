/**
 * dist/_headers dla Cloudflare (statyczna warstwa, bez Workera): cache plików z hashem,
 * nagłówki bezpieczeństwa z CSP i X-Robots-Tag: noindex dla plików danych (JSON) —
 * wyszukiwarka ma pokazywać strony, nie surowe dane.
 * Generowany z listy plików buildu, bo endpointy JSON (np. sesje egzaminu) powstają z danych.
 * Limit Cloudflare: 100 reguł.
 */
import { newsletter, newsletterOn } from '../../src/data/newsletter';

/**
 * CSP statyczny (bez hashy per build), więc `'unsafe-inline'` dla skryptów i stylów: Astro wstawia
 * małe skrypty i atrybuty `style` w HTML. Z zewnątrz tylko Cloudflare Web Analytics (beacon
 * wpięty ręcznie w Analytics.astro): skrypt z static.cloudflareinsights.com, raport do
 * cloudflareinsights.com. Endpoint newslettera dochodzi do connect-src sam, gdy blok jest włączony.
 * HSTS celowo nie tutaj — ustawione strefowo w panelu Cloudflare (jedno źródło nagłówka).
 * Pułapka: `astro preview` nie nakłada `_headers` — CSP sprawdza `npm run preview:cf`.
 */
export function contentSecurityPolicy(): string {
  const connect = ["'self'", 'https://cloudflareinsights.com'];
  if (newsletterOn) connect.push(new URL(newsletter.endpoint).origin);
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data:",
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function headersFile(files: Iterable<string>): string {
  const json = [...files].filter((f) => f.endsWith('.json')).sort();
  const rules: string[][] = [
    ['/_astro/*', 'Cache-Control: public, max-age=31536000, immutable'],
    [
      '/*',
      `Content-Security-Policy: ${contentSecurityPolicy()}`,
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'X-Frame-Options: DENY',
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
