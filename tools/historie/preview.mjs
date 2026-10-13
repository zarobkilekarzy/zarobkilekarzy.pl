/** Lokalny podgląd z rzeczywistym API/D1 i importem URL; bez dostępu do baz zdalnych. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { migrate } from './database.mjs';
import { receive, QUEUES } from '../../lib/historie/store.mjs';
import { submission, CONSENT_VERSION, LIMITS } from '../../lib/historie/contract.mjs';

const persistence = resolve('.wrangler/historie-preview');
const root = resolve(persistence, 'dist');
const port = Number(process.env.HISTORIE_PREVIEW_PORT ?? 8791);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Nieprawidłowy port podglądu.');
// Podgląd wymaga jawnego builda z fiksturami. Nie uruchamia builda ani deployu.
await stat(resolve(root, 'historie/h-00000000000000000000000000000001/index.html')).catch(() => {
  throw new Error('Najpierw: ASTRO_TELEMETRY_DISABLED=1 HISTORIE_AKTYWNE=true HISTORIE_FIKSTURY=true npm run build -- --mode test --outDir .wrangler/historie-preview/dist');
});
const bundle = await build({ entryPoints: ['tools/historie/preview-worker.mjs'], bundle: true,
  format: 'esm', platform: 'browser', write: false });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-07-30',
  d1Persist: resolve(persistence, 'v3/d1'),
  d1Databases: Object.fromEntries(Object.values(QUEUES).map((name) => [name, name])),
  bindings: { HISTORIE_API_AKTYWNE: 'true', HISTORIE_IMPORT_AKTYWNY: 'true',
    TURNSTILE_HISTORIE_SITE_KEY: '1x00000000000000000000AA',
    TURNSTILE_HISTORIE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    TURNSTILE_HISTORIE_HOSTNAMES: 'localhost' } });

const sample = {
  title: 'Testowa historia kontaktu z przychodnią',
  body: 'To fikcyjna relacja do sprawdzenia formularza. Podczas testowej wizyty zapytałem o termin konsultacji i sposób uzyskania dokumentacji. Ten tekst nie opisuje rzeczywistej osoby ani placówki.',
  city: 'Miejscowość testowa', facility: 'Przychodnia testowa', contactEmail: 'pacjent@example.test',
};
const exampleUrl = 'https://www.medonet.pl/biznes-system-i-zdrowie/trendy-w-ochronie-zdrowia/100-tys-zl-to-nie-wszystko-ujawniono-najwyzsze-zarobki-lekarzy-na-slasku/zbdlmlz';
const previewScript = `<script>document.addEventListener('DOMContentLoaded',()=>{
  const fields=${JSON.stringify({ title: sample.title, body: sample.body, city: sample.city,
    facility: sample.facility, email: sample.contactEmail, 'import-url': exampleUrl })};
  for(const [name,value] of Object.entries(fields)){
    const field=document.getElementById('history-'+name);field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));
  }
  const banner=document.createElement('p');banner.setAttribute('role','note');
  banner.textContent='Podgląd lokalny. Dane przykładowe są fikcyjne. Zapisy trafiają wyłącznie do lokalnych baz. Turnstile działa w trybie testowym.';
  banner.style.cssText='padding:1rem;border:2px solid var(--brand);border-radius:8px';
  document.querySelector('.history-form-wrap').prepend(banner);
});</script>`;

let server;
try {
  for (const [queue, binding] of Object.entries(QUEUES)) {
    const db = await mf.getD1Database(binding);
    await migrate(db, queue === 'moderacja');
    const { data } = submission({ ...sample, version: 1, doctors: [],
      idempotencyKey: queue === 'moderacja' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002',
      turnstileToken: 'seed-only', consentVersion: CONSENT_VERSION, healthDataConsent: true,
      publicationRequested: queue === 'moderacja' });
    await receive(db, data);
  }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp',
    '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.wasm': 'application/wasm' };
  server = createServer(async (req, res) => {
    try {
      const origin = `http://127.0.0.1:${port}`;
      const url = new URL(req.url, origin);
      if (url.pathname.startsWith('/api/')) {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > LIMITS.requestBytes) { res.writeHead(413); res.end(); return; }
          chunks.push(chunk);
        }
        const response = await mf.dispatchFetch(url.href, { method: req.method, headers: req.headers,
          ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: Buffer.concat(chunks) }) });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } else {
        let path = resolve(root, '.' + decodeURIComponent(url.pathname));
        if (!(path === root || path.startsWith(root + '/'))) { res.writeHead(403); res.end(); return; }
        if ((await stat(path)).isDirectory()) {
          if (!url.pathname.endsWith('/')) { res.writeHead(302, { Location: url.pathname + '/' }); res.end(); return; }
          path = resolve(path, 'index.html');
        }
        let contents = await readFile(path);
        if (path === resolve(root, 'dzialaj/opowiedz/index.html')) {
          contents = Buffer.from(contents.toString('utf8').replace('</body>', previewScript + '</body>'));
        }
        res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(contents);
      }
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  console.log(`Formularz: http://127.0.0.1:${port}/dzialaj/opowiedz/\nLokalne bazy: ${persistence}\nImport URL: rzeczywista sieć; Turnstile: testowy. Bez deployu.`);
} catch (error) {
  await mf.dispose(); throw error;
}
async function stop() {
  await new Promise((done) => server.close(done)); await mf.dispose(); process.exit(0);
}
process.once('SIGINT', stop); process.once('SIGTERM', stop);
