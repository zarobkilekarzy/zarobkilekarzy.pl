/**
 * dist/_headers dla Cloudflare (statyczna warstwa, bez Workera): cache plików z hashem,
 * podstawowe nagłówki bezpieczeństwa (jak na dotychczasowej stronie) i X-Robots-Tag: noindex
 * dla plików danych (JSON) — wyszukiwarka ma pokazywać strony, nie surowe dane.
 * Generowany z listy plików buildu, bo endpointy JSON (np. sesje egzaminu) powstają z danych.
 * CSP — osobny krok (docs/seo-system.md § 8). Limit Cloudflare: 100 reguł.
 */
export function headersFile(files: Iterable<string>): string {
  const json = [...files].filter((f) => f.endsWith('.json')).sort();
  const rules: string[][] = [
    ['/_astro/*', 'Cache-Control: public, max-age=31536000, immutable'],
    ['/*', 'X-Content-Type-Options: nosniff', 'Referrer-Policy: strict-origin-when-cross-origin', 'X-Frame-Options: DENY'],
    ...json.map((file) => [file, 'X-Robots-Tag: noindex']),
  ];
  if (rules.length > 100) throw new Error(`_headers: ${rules.length} reguł, limit Cloudflare to 100`);
  return [
    '# Wygenerowane przez integrations/seo (headers.ts) — nie edytować ręcznie.',
    ...rules.map(([path, ...headers]) => [path, ...headers.map((h) => `  ${h}`)].join('\n')),
    '',
  ].join('\n');
}
