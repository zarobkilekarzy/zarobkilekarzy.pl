// Opcjonalny test przeglądarkowy po buildzie z fiksturami w trybie testowym.
// PLAYWRIGHT_MODULE i BROWSER_EXECUTABLE pozwalają użyć już zainstalowanych narzędzi.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { migrate } from '../tools/historie/database.mjs';
import { record } from '../lib/historie/store.mjs';
import { xFixtures } from './fixtures/x-oembed.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.env.HISTORIE_TEST_DIST || 'dist');
const bundle = await build({ entryPoints: ['tests/historie-worker.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false });
const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-07-30',
  d1Databases: { HISTORIE_MODERACJA_DB: 'browser-mod', HISTORIE_PRYWATNE_DB: 'browser-private' },
  bindings: { HISTORIE_API_AKTYWNE: 'true', HISTORIE_IMPORT_AKTYWNY: 'true',
    TURNSTILE_HISTORIE_SITE_KEY: 'browser-test', TURNSTILE_HISTORIE_SECRET_KEY: 'browser-secret' } });
let browser, server;
try {
  const mod = await mf.getD1Database('HISTORIE_MODERACJA_DB');
  const privateDb = await mf.getD1Database('HISTORIE_PRYWATNE_DB');
  await migrate(mod, true); await migrate(privateDb, false);
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const chunks = []; for await (const chunk of req) chunks.push(chunk);
        const response = await mf.dispatchFetch('https://zarobkilekarzy.pl' + req.url, { method: req.method,
          headers: req.headers, ...(req.method === 'GET' ? {} : { body: Buffer.concat(chunks) }) });
        res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer()));
      } else {
        const path = resolve(root, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
        if (!path.startsWith(root + '/')) { res.writeHead(403); res.end(); return; }
        const contents = await readFile(path);
        res.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }); res.end(contents);
      }
    } catch { res.writeHead(404); res.end('not found'); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1100, height: 950 } });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('https://challenges.cloudflare.com/turnstile/v0/api.js')) {
      await route.fulfill({ contentType: 'application/javascript', body: `window.turnstile={render(el,opts){this.opts=opts;setTimeout(()=>opts.callback('good'),0);return 'widget-test'},reset(){setTimeout(()=>this.opts.callback('good-again'),0)}}` });
    } else if (!url.startsWith(origin)) await route.abort();
    else await route.continue();
  });
  await page.goto(origin + '/dzialaj/opowiedz/');
  await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  assert.equal(await page.locator('#history-publication-consent').isChecked(), false);
  assert.equal(await page.locator('#history-health-consent').isChecked(), false);
  await page.locator('#history-title').fill('Historia testu przeglądarki');
  const ownBody = 'Moja własna relacja pozostaje tutaj.\nDrugi akapit — również mój.';
  await page.locator('#history-body').fill(ownBody);
  await page.locator('#history-email').fill('browser@example.test');
  await page.locator('#history-add-doctor').click();
  await page.locator('[data-doctor-name]').fill('Lekarz Syntetyczny');
  await page.locator('[data-doctor-pwz]').fill('2123456');
  assert.match(await page.locator('.doctor-warning').innerText(), /kontrolna/);
  await page.locator('#history-import-url').fill('https://www.medonet.pl/historie-fixture');
  await page.locator('#history-import-button').click();
  await page.locator('#history-insert-source').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  await page.locator('#history-insert-source').click();
  assert.equal(await page.locator('#history-body').inputValue(), ownBody);
  assert.equal(await page.locator('#history-excerpt').inputValue(), 'Syntetyczny materiał źródłowy.');
  // X przechodzi przez rzeczywisty endpoint importu i native HTMLRewriter, z lokalnym oEmbed.
  const formValues = () => page.evaluate(() => Object.fromEntries(
    ['title', 'body', 'city', 'facility', 'email', 'health-consent', 'publication-consent'].map((name) => {
      const field = document.getElementById('history-' + name);
      return [name, field.type === 'checkbox' ? field.checked : field.value];
    })));
  const beforeX = await formValues();
  await page.locator('#history-import-url').fill(xFixtures.single.url);
  const xImport = page.waitForResponse((response) => response.url().endsWith('/api/historie/import'));
  await page.locator('#history-import-button').click();
  assert.equal((await xImport).status(), 200);
  await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  assert.equal(await page.locator('#history-preview-text').inputValue(), xFixtures.single.excerpt);
  assert.deepEqual(await formValues(), beforeX);
  await page.locator('#history-insert-source').click();
  assert.equal(await page.locator('#history-excerpt').inputValue(), xFixtures.single.excerpt);
  assert.equal(await page.locator('#history-source-url').inputValue(), xFixtures.single.url);
  assert.deepEqual(await formValues(), beforeX);
  // Błąd niejednoznacznego źródła zachowuje zarówno własną relację, jak i poprzedni materiał.
  await page.locator('#history-import-url').fill(xFixtures.multiple.url);
  const rejectedX = page.waitForResponse((response) => response.url().endsWith('/api/historie/import'));
  await page.locator('#history-import-button').click();
  const rejectedResponse = await rejectedX;
  assert.equal(rejectedResponse.status(), 400);
  assert.equal((await rejectedResponse.json()).error, 'post-content-not-found');
  await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  assert.deepEqual(await formValues(), beforeX);
  assert.equal(await page.locator('#history-excerpt').inputValue(), xFixtures.single.excerpt);
  assert.equal(await page.locator('#history-source-url').inputValue(), xFixtures.single.url);
  await page.locator('#history-health-consent').check();
  // Niepewny zapis: formularz zachowuje dane i klucz, powtórka idzie do prawdziwego lokalnego D1.
  let firstKey;
  const failOnce = async (route) => { firstKey = route.request().postDataJSON().idempotencyKey;
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'write-unconfirmed', retryable: true }) }); };
  await page.route('**/api/historie', failOnce);
  await page.locator('#history-submit').click();
  await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  assert.equal(await page.locator('#history-body').inputValue(), ownBody);
  await page.unroute('**/api/historie', failOnce);
  const savedResponse = page.waitForResponse((response) => response.url().endsWith('/api/historie') && response.status() === 201);
  await page.locator('#history-submit').click();
  const response = await savedResponse;
  assert.equal(response.request().postDataJSON().idempotencyKey, firstKey);
  const { id } = await response.json();
  const saved = await record(privateDb, id, true);
  assert.equal(saved.payload.body, ownBody);
  assert.equal(saved.payload.source.excerpt, xFixtures.single.excerpt);
  assert.equal(saved.payload.source.url, xFixtures.single.url);
  assert.equal(saved.contact.email, 'browser@example.test');
  assert.equal(saved.payload.publicationRequested, false);
  assert.equal(await mod.prepare('SELECT id FROM zgloszenia WHERE id=?').bind(id).first(), null);
  assert.match(await page.locator('#history-result').innerText(), /prywatnej kolejce/);
  // Drugi wybór zgody trafia do bazy moderacji i nie jest publikowany.
  await page.reload(); await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  await page.locator('#history-title').fill('Historia do moderacji'); await page.locator('#history-body').fill('Druga relacja testowa.');
  await page.locator('#history-health-consent').check(); await page.locator('#history-publication-consent').check();
  const moderationResponse = page.waitForResponse((res) => res.url().endsWith('/api/historie') && res.status() === 201);
  await page.locator('#history-submit').click(); const moderationId = (await (await moderationResponse).json()).id;
  assert.equal((await record(mod, moderationId)).publication_requested, 1);
  assert.equal((await mod.prepare('SELECT COUNT(*) AS count FROM publikacje').first()).count, 0);
  await page.reload(); await page.waitForFunction(() => !document.querySelector('#history-fields').disabled);
  await page.setViewportSize({ width: 375, height: 900 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '/private/tmp/historie-mobile.png', fullPage: true });
  await page.locator('#history-health-consent').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/private/tmp/historie-consent.png' });
  assert.deepEqual(errors, []);
  process.stdout.write('Browser: X pomija komentarze, odrzuca kilka wpisów i zachowuje body; zgody kierują do dwóch baz, ponowienie zachowuje klucz, PWZ ostrzega, mobile bez overflow.\n');
} finally {
  await browser?.close();
  if (server) await new Promise((done) => server.close(done));
  await mf.dispose();
}
