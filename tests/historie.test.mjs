import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { submission, publication, validPwz, HistoryError, LIMITS, CONSENT_VERSION } from '../lib/historie/contract.mjs';
import { receive, record, eventBatch, expiry } from '../lib/historie/store.mjs';
import { draft, verifyPwz, approve, reject, classify } from '../lib/historie/moderation.mjs';
import { release, publicPage, withdraw } from '../lib/historie/publication.mjs';
import { purge, remove, analysisPreview, approveAnalysis } from '../lib/historie/retention.mjs';
import { migrate, remoteDatabase } from '../tools/historie/database.mjs';
import { loadPublications } from '../lib/historie/build.mjs';
import { insertSource } from '../lib/historie/client.mjs';
import { importUrl } from '../lib/historie/import.mjs';
import { xFixtures } from './fixtures/x-oembed.mjs';

let mf, mod, privateDb;
const RELEASE_KEY = 'test-only-release-key-0123456789abcdef';
const PWZ = '3123456'; // Wyłącznie test cyfry kontrolnej; nie kontaktujemy się z rejestrem.
const input = (overrides = {}) => ({ version: 1, idempotencyKey: crypto.randomUUID(), turnstileToken: 'good',
  title: 'Historia syntetyczna', body: 'Treść własnej relacji.', healthDataConsent: true,
  publicationRequested: true, consentVersion: CONSENT_VERSION, doctors: [], ...overrides });
const cleanDraft = { title: 'Relacja zredagowana', body: 'Zredagowana treść bez prywatnych danych.' };
const coded = { category: 'komunikacja', region: 'nieustalone', year: null, facilityType: 'sor' };
const code = (expected) => (error) => error instanceof HistoryError && error.code === expected;
const request = async (path, value, headers = {}) => {
  const response = await mf.dispatchFetch(`https://zarobkilekarzy.pl${path}`, {
    method: value === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });
  return { status: response.status, headers: response.headers, body: await response.json() };
};

before(async () => {
  const bundle = await build({ entryPoints: ['tests/historie-worker.mjs'], bundle: true, format: 'esm', platform: 'browser', write: false });
  mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-07-30', d1Databases: { HISTORIE_MODERACJA_DB: 'moderacja-test', HISTORIE_PRYWATNE_DB: 'prywatne-test' },
    bindings: { HISTORIE_API_AKTYWNE: 'true', HISTORIE_IMPORT_AKTYWNY: 'true',
      TURNSTILE_HISTORIE_SITE_KEY: 'site-test', TURNSTILE_HISTORIE_SECRET_KEY: 'secret-test', HISTORIE_RELEASE_KEY: RELEASE_KEY },
  });
  mod = await mf.getD1Database('HISTORIE_MODERACJA_DB'); privateDb = await mf.getD1Database('HISTORIE_PRYWATNE_DB');
  await migrate(mod, true); await migrate(privateDb, false);
});
after(async () => { await mf?.dispose(); });

test('NFC, limity znaków Unicode, osobna zgoda i ostrzeżenie PWZ', () => {
  assert.equal(validPwz(PWZ), true); assert.equal(validPwz('2123456'), false);
  assert.equal(validPwz('5425740'), true); // Przykład z opisu algorytmu NIL.
  const parsed = submission(input({ title: ' e\u0301 ', doctors: [{ name: 'Lekarz Testowy', pwz: '2123456' }] }));
  assert.equal(parsed.data.title, 'é'); assert.equal(parsed.warnings.length, 1);
  assert.equal(Object.hasOwn(parsed.data, 'turnstileToken'), false);
  assert.throws(() => submission(input({ healthDataConsent: false })), code('health-consent-required'));
  assert.throws(() => submission(input({ consentVersion: 'old' })), code('consent-version-changed'));
  assert.throws(() => submission(input({ title: '😀'.repeat(161) })), code('field-too-long'));
  assert.equal(submission(input({ title: '😀'.repeat(160) })).data.title.length, 320);
  assert.equal(expiry('2024-02-29T10:00:00.000Z'), '2025-02-28T10:00:00.000Z');
});

test('realne API: routing dwóch baz, prywatny kontakt i idempotencja z nowym tokenem', async () => {
  const body = input({ publicationRequested: false, contactEmail: 'prywatny@example.test',
    source: { excerpt: 'Prywatny fragment', url: 'https://example.test/story' } });
  const first = await request('/api/historie', body);
  const retry = await request('/api/historie', { ...body, turnstileToken: 'good-again' });
  assert.equal(first.status, 201); assert.equal(retry.body.id, first.body.id);
  assert.equal((await request('/api/historie', { ...body, body: 'Inna treść' })).body.error, 'idempotency-conflict');
  const stored = await record(privateDb, first.body.id);
  assert.equal(stored.payload.contactEmail, undefined); assert.equal(stored.events.length, 1);
  assert.equal((await record(privateDb, first.body.id, true)).contact.email, body.contactEmail);
  assert.equal(await mod.prepare('SELECT id FROM zgloszenia WHERE id=?').bind(first.body.id).first(), null);
  await assert.rejects(draft(privateDb, first.body.id, 'test', cleanDraft), code('private-submission-not-publishable'));
  assert.equal(first.headers.get('cache-control'), 'no-store');
});

test('Turnstile fail-closed; 400/403/413/503; brak zapisu przy błędzie', async () => {
  for (const token of ['bad', 'wrong-action', 'wrong-host']) assert.equal((await request('/api/historie', input({ turnstileToken: token }))).status, 403);
  assert.equal((await request('/api/historie', input({ turnstileToken: 'unavailable' }))).status, 503);
  assert.equal((await request('/api/historie', input(), { 'x-test-no-key': '1' })).status, 503);
  assert.equal((await request('/api/historie', input(), { 'x-test-disabled': '1' })).status, 503);
  assert.equal((await request('/api/historie', input({ body: '' }))).status, 400);
  assert.equal((await request('/api/historie', input({ body: 'x'.repeat(LIMITS.body + 1) }))).status, 413);
  assert.equal((await request('/api/historie', input({ unknown: 'private' }))).status, 400);
  const config = await request('/api/historie/konfiguracja');
  assert.equal(config.body.available, true); assert.equal(JSON.stringify(config.body).includes('secret-test'), false);
});

test('moderacja: prywatne nazwiska i excerpt nie przechodzą, PWZ wymaga własnej decyzji', async () => {
  const { id } = await receive(mod, submission(input({ contactEmail: 'osoba@example.test',
    doctors: [{ name: 'Lekarz Testowy Zero', pwz: PWZ }], source: { excerpt: 'TYLKO PRYWATNY EXCERPT' } })).data);
  await assert.rejects(draft(mod, id, 'mod-A', { ...cleanDraft, body: 'Lekarz Testowy Zero zrobił coś.' }), code('private-data-in-draft'));
  await assert.rejects(draft(mod, id, 'mod-A', { ...cleanDraft, body: `Numer ${PWZ} w tekście.` }), code('private-data-in-draft'));
  await assert.rejects(draft(mod, id, 'mod-A', { ...cleanDraft, source: { excerpt: 'private' } }), code('unknown-field'));
  await draft(mod, id, 'mod-A', cleanDraft);
  await assert.rejects(approve(mod, id, 'mod-A', [PWZ]), code('unverified-pwz-not-publishable'));
  await verifyPwz(mod, id, 'mod-B', PWZ, true);
  await approve(mod, id, 'mod-C');
  const slug = (await record(mod, id)).events.find((event) => event.kind === 'draft').data.slug;
  assert.deepEqual(JSON.parse((await mod.prepare('SELECT verified_pwz FROM kandydaci_publikacji WHERE slug=?').bind(slug).first()).verified_pwz), []);
  assert.equal(await mod.prepare('SELECT slug FROM publikacje WHERE slug=?').bind(slug).first(), null);
  await approve(mod, id, 'mod-C', [PWZ]);
  const issued = await request('/api/historie/wydanie', { releaseId: crypto.randomUUID() }, { Authorization: `Bearer ${RELEASE_KEY}` });
  assert.equal(issued.status, 200);
  const publicResponse = await request('/api/historie/publikacje');
  const item = publicResponse.body.items.find((entry) => entry.slug === slug);
  assert.deepEqual(item.verifiedPwz, [PWZ]);
  assert.deepEqual(Object.keys(item).sort(), ['body', 'date', 'slug', 'title', 'verifiedPwz']);
  assert.equal(JSON.stringify(publicResponse.body).includes('TYLKO PRYWATNY'), false);
  assert.equal(JSON.stringify(publicResponse.body).includes('osoba@example'), false);
  assert.equal((await request('/api/historie/wydanie', { releaseId: crypto.randomUUID() })).status, 403);
  const receipt = await mod.prepare("SELECT data FROM zdarzenia_publikacji WHERE slug=? AND kind='approved' ORDER BY seq DESC LIMIT 1").bind(slug).first();
  assert.deepEqual(JSON.parse(receipt.data).verifiedPwz.map((entry) => entry.actor), ['mod-B']);
});

test('cytat ograniczony, z obowiązkowym źródłem; publiczny schemat odrzuca prywatne pola', () => {
  const base = { ...cleanDraft, slug: 'h-' + 'a'.repeat(32), verifiedPwz: [], date: new Date().toISOString() };
  assert.throws(() => publication({ ...base, cytat: 'cytat' }), code('quote-source-required'));
  assert.throws(() => publication({ ...base, cytat: 'x'.repeat(601), source: { description: 'Źródło' } }), code('field-too-long'));
  assert.throws(() => publication({ ...base, email: 'private' }), code('unknown-field'));
});

test('zapis decyzji odrzuca nieaktualny odczyt, zachowując zdarzenia', async () => {
  const { id } = await receive(mod, submission(input()).data);
  const current = await record(mod, id);
  await eventBatch(mod, current, 'reviewed', 'mod-A', {});
  await assert.rejects(eventBatch(mod, current, 'reviewed', 'mod-B', {}), code('stale-submission'));
  assert.equal((await record(mod, id)).events.length, 2);
});

test('wydanie idempotentne, odrzucenie nowego szkicu zachowuje wcześniejszą publikację', async () => {
  const { id } = await receive(mod, submission(input()).data);
  await draft(mod, id, 'mod-A', cleanDraft); await approve(mod, id, 'mod-A');
  const releaseId = crypto.randomUUID(); await release(mod, releaseId);
  const slug = (await record(mod, id)).events.find((event) => event.kind === 'draft').data.slug;
  await draft(mod, id, 'mod-A', { ...cleanDraft, body: 'Nowa redakcja' });
  await approve(mod, id, 'mod-A'); await release(mod, releaseId);
  assert.equal((await mod.prepare('SELECT body FROM publikacje WHERE slug=?').bind(slug).first()).body, cleanDraft.body);
  await reject(mod, id, 'mod-A'); await release(mod, crypto.randomUUID());
  assert.ok(await mod.prepare('SELECT slug FROM publikacje WHERE slug=?').bind(slug).first());
  await assert.rejects(publicPage(mod, { releaseId }), code('release-changed'));
});

test('retencja usuwa kontakt, excerpt, zdarzenia i kandydatów; wycofanie działa po purge', async () => {
  const { id } = await receive(mod, submission(input({ contactEmail: 'purge@example.test' })).data);
  await draft(mod, id, 'mod-A', cleanDraft); await approve(mod, id, 'mod-A'); await release(mod, crypto.randomUUID());
  const slug = (await record(mod, id)).events.find((event) => event.kind === 'draft').data.slug;
  await mod.prepare('UPDATE zgloszenia SET expires_at=? WHERE id=?').bind('2000-01-01T00:00:00.000Z', id).run();
  assert.equal((await purge(mod, { moderation: true })).deleted, 1);
  for (const table of ['kontakty', 'zdarzenia', 'analiza_robocza']) assert.equal(await mod.prepare(`SELECT submission_id FROM ${table} WHERE submission_id=?`).bind(id).first(), null);
  assert.equal(await mod.prepare('SELECT slug FROM kandydaci_publikacji WHERE slug=?').bind(slug).first(), null);
  assert.ok(await mod.prepare('SELECT slug FROM publikacje WHERE slug=?').bind(slug).first());
  assert.equal((await withdraw(mod, slug, 'mod-D')).deploymentCleanupRequired, true);
  assert.equal(await mod.prepare('SELECT slug FROM publikacje WHERE slug=?').bind(slug).first(), null);
  assert.ok(await mod.prepare("SELECT actor FROM zdarzenia_publikacji WHERE slug=? AND kind='withdrawn'").bind(slug).first());
  const privateId = (await receive(privateDb, submission(input({ publicationRequested: false })).data)).id;
  assert.equal((await remove(privateDb, privateId)).deleted, 1);
  await assert.rejects(record(privateDb, privateId), code('submission-not-found'));
  const oldDeletion = crypto.randomUUID();
  await privateDb.prepare('INSERT INTO usuniecia(id,at,reason) VALUES (?,?,?)').bind(oldDeletion, '2000-01-01T00:00:00.000Z', 'request').run();
  await purge(privateDb);
  assert.equal(await privateDb.prepare('SELECT id FROM usuniecia WHERE id=?').bind(oldDeletion).first(), null);
  assert.ok(await privateDb.prepare('SELECT id FROM usuniecia WHERE id=?').bind(privateId).first());
});

test('analiza łączy obie bazy, bez identyfikatorów; wymaga oceny anonimizacji i przeżywa purge', async () => {
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const db = i < 3 ? mod : privateDb;
    const { id } = await receive(db, submission(input({ publicationRequested: i < 3 })).data);
    await classify(db, id, 'mod-A', coded); ids.push([db, id]);
  }
  const cells = await analysisPreview([mod, privateDb]);
  assert.deepEqual(cells, [{ ...coded, count: 5 }]);
  await assert.rejects(approveAnalysis(mod, crypto.randomUUID(), 'mod-A', cells, false), code('anonymisation-review-required'));
  const snapshot = crypto.randomUUID(); await approveAnalysis(mod, snapshot, 'mod-A', cells, true);
  await assert.rejects(approveAnalysis(mod, snapshot, 'mod-A', cells, true), code('analysis-snapshot-exists'));
  for (const [db, id] of ids) await db.prepare('UPDATE zgloszenia SET expires_at=? WHERE id=?').bind('2000-01-01T00:00:00.000Z', id).run();
  await purge(mod, { moderation: true }); await purge(privateDb);
  assert.equal((await mod.prepare('SELECT count FROM analiza WHERE snapshot_id=?').bind(snapshot).first()).count, 5);
});

test('SSRF: schemat, port, credentials, IP, dokładne hosty i przekierowanie', async () => {
  for (const url of ['http://www.medonet.pl/x', 'https://www.medonet.pl:444/x', 'https://u:p@www.medonet.pl/x',
    'https://127.0.0.1/x', 'https://2130706433/x', 'https://[::1]/x', 'https://www.medonet.pl.evil.test/x']) assert.throws(() => importUrl(url));
  const redirected = await request('/test/extract', { url: 'https://www.medonet.pl/story', responses: [{ status: 302, headers: { location: 'https://127.0.0.1/secret' } }] });
  assert.equal(redirected.status, 403);
});

test('native HTMLRewriter: JSON-LD głównego artykułu i fallback, bez komentarzy/skryptów', async () => {
  const url = 'https://www.medonet.pl/story';
  const ld = { '@type': 'NewsArticle', url, articleBody: '<p>Wpis &amp; tekst.</p><script>sekret</script><div class="comments">Komentarz</div>' };
  const jsonld = await request('/test/extract', { url, responses: [{ body: `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script><div itemprop="articleBody">Inny</div>` }] });
  assert.equal(jsonld.status, 200); assert.equal(jsonld.body.source.extractor, 'jsonld');
  assert.equal(jsonld.body.source.excerpt, 'Wpis & tekst.');
  const fallback = await request('/test/extract', { url, responses: [{ body: '<nav>Nawigacja</nav><article itemprop="articleBody"><p>Własny tekst</p><div id="comments"><p>Cudzy komentarz</p></div><aside>Reklama</aside></article>' }] });
  assert.equal(fallback.body.source.excerpt, 'Własny tekst');
  assert.equal(fallback.body.source.extractor, 'html-rewriter');
});

test('import ogranicza 14000 znaków i odrzuca nieoznaczoną treść', async () => {
  const long = await request('/test/extract', { url: 'https://www.medonet.pl/story', responses: [{ body: '<article itemprop="articleBody">' + 'ą'.repeat(14010) + '</article>' }] });
  assert.equal([...long.body.source.excerpt].length, 14000); assert.equal(long.body.source.truncated, true);
  assert.equal((await request('/test/extract', { url: 'https://www.medonet.pl/story', responses: [{ body: '<article>Nieoznaczona treść</article>' }] })).body.error, 'main-content-not-found');
});

test('X: główny wpis bez komentarzy, stopki autora i daty; rozmowa i skrypty wyłączone', async () => {
  const fixture = xFixtures.single;
  const extracted = await request('/test/extract', { url: fixture.url, responses: [{
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: fixture.html }),
  }] });
  assert.equal(extracted.status, 200);
  assert.equal(extracted.body.source.extractor, 'x-oembed');
  assert.equal(extracted.body.source.excerpt, fixture.excerpt);
  assert.equal(extracted.body.source.url, fixture.url);
  const endpoint = new URL(extracted.body.visited[0].target);
  assert.equal(endpoint.origin, 'https://publish.x.com');
  assert.equal(endpoint.pathname, '/oembed');
  assert.equal(endpoint.searchParams.get('url'), fixture.url);
  assert.equal(endpoint.searchParams.get('hide_thread'), 'true');
  assert.equal(endpoint.searchParams.get('omit_script'), '1');
  assert.equal(extracted.body.visited[0].redirect, 'manual');
});

test('X: API odrzuca kilka wpisów zamiast mieszać cudzą treść', async (t) => {
  for (const [name, fixture] of [['dwa osobne wpisy', xFixtures.multiple], ['zagnieżdżony cytowany wpis', xFixtures.quoted]]) {
    await t.test(name, async () => {
      const result = await request('/api/historie/import', { url: fixture.url, turnstileToken: 'good' });
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, { error: 'post-content-not-found', field: 'url', retryable: false });
      assert.equal(Object.hasOwn(result.body, 'source'), false);
    });
  }
});

test('X: wstawienie i zapis zachowują własną treść oraz pozostałe dane formularza', async () => {
  const imported = await request('/api/historie/import', { url: xFixtures.single.url, turnstileToken: 'good' });
  assert.equal(imported.status, 200);
  const current = input({ body: 'Moja własna relacja.\nDrugi akapit pozostaje mój.', publicationRequested: false,
    city: 'Miejscowość testowa', facility: 'Placówka testowa', contactEmail: 'x-regresja@example.test',
    doctors: [{ name: 'Lekarz Syntetyczny' }], source: { description: 'Poprzednie źródło', excerpt: 'Poprzedni materiał' } });
  const original = structuredClone(current);
  const inserted = insertSource(current, imported.body.source);
  const { source: beforeSource, ...beforeFields } = original;
  const { source: afterSource, ...afterFields } = inserted;
  assert.deepEqual(afterFields, beforeFields);
  assert.deepEqual(current, original);
  assert.equal(afterSource.excerpt, xFixtures.single.excerpt);
  assert.equal(afterSource.url, xFixtures.single.url);
  assert.equal(afterSource.extractor, 'x-oembed');
  assert.equal(beforeSource.excerpt, 'Poprzedni materiał');
  const result = await request('/api/historie', inserted);
  assert.equal(result.status, 201);
  const saved = await record(privateDb, result.body.id, true);
  assert.equal(saved.payload.body, original.body);
  assert.equal(saved.payload.source.excerpt, xFixtures.single.excerpt);
  assert.equal(saved.payload.source.url, xFixtures.single.url);
  assert.equal(saved.contact.email, original.contactEmail);
});

test('build bez sekretów: głośna porażka, brak fikstur produkcyjnych, ścisła projekcja', async () => {
  const env = { HISTORIE_AKTYWNE: 'true', HISTORIE_PUBLIKACJE_URL: 'https://zarobkilekarzy.pl/api/historie/publikacje' };
  assert.deepEqual(await loadPublications({ env: {} }), []);
  await assert.rejects(loadPublications({ env: { HISTORIE_AKTYWNE: 'true' } }));
  await assert.rejects(loadPublications({ env: { ...env, HISTORIE_FIKSTURY: 'true' }, development: false }));
  await assert.rejects(loadPublications({ env, fetcher: async () => new Response('', { status: 503 }) }));
  const page = await publicPage(mod);
  assert.deepEqual(await loadPublications({ env, fetcher: async () => Response.json(page) }), page.items);
  await assert.rejects(loadPublications({ env, fetcher: async () => Response.json({ ...page, items: [{ ...page.items[0], email: 'private' }] }) }));
});

test('zdalny adapter przekazuje parametry w JSON, bez interpolacji i automatycznych powtórek', async () => {
  const calls = [];
  const db = remoteDatabase('moderacja', { CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), HISTORIE_MODERACJA_DATABASE_ID: crypto.randomUUID(), HISTORIE_D1_TOKEN: 'test-only' },
    async (url, opts) => { calls.push(JSON.parse(opts.body)); return Response.json({ success: true, result: [{ success: true, results: [{ id: 1 }], meta: { changes: 0 } }] }); });
  const value = "' ; DROP TABLE zgloszenia; --";
  await db.prepare('SELECT id FROM zgloszenia WHERE id=?').bind(value).first();
  assert.deepEqual(calls, [{ batch: [{ sql: 'SELECT id FROM zgloszenia WHERE id=?', params: [value] }] }]);
});

test('konkurencyjne ponowienia tworzą jeden kontakt i jedno zdarzenie', async () => {
  const value = input({ contactEmail: 'concurrent@example.test', publicationRequested: false });
  const results = await Promise.all([request('/api/historie', value), request('/api/historie', { ...value, turnstileToken: 'fresh-token' })]);
  assert.equal(results[0].body.id, results[1].body.id);
  const saved = await record(privateDb, results[0].body.id, true);
  assert.equal(saved.events.length, 1); assert.equal(saved.contact.email, value.contactEmail);
});

test('wygaśnięcie przed wydaniem blokuje kandydata', async () => {
  const { id } = await receive(mod, submission(input()).data);
  await draft(mod, id, 'mod-A', cleanDraft); await approve(mod, id, 'mod-A');
  const slug = (await record(mod, id)).events.find((event) => event.kind === 'draft').data.slug;
  await mod.prepare('UPDATE zgloszenia SET expires_at=? WHERE id=?').bind('2000-01-01T00:00:00.000Z', id).run();
  await release(mod, crypto.randomUUID());
  assert.equal(await mod.prepare('SELECT slug FROM publikacje WHERE slug=?').bind(slug).first(), null);
});

test('import odrzuca niejednoznaczną treść, nadmiar przekierowań i zbyt duży strumień', async () => {
  const url = 'https://www.medonet.pl/story';
  const extract = (responses) => request('/test/extract', { url, responses });
  const ambiguous = await extract([{ body: '<article itemprop="articleBody">A</article><article itemprop="articleBody">B</article>' }]);
  assert.equal(ambiguous.body.error, 'main-content-not-found');
  const loop = await extract(Array.from({ length: 4 }, () => ({ status: 302, headers: { location: url } })));
  assert.equal(loop.body.error, 'redirect-limit');
  const oversized = await extract([{ body: 'x'.repeat(1024 * 1024 + 1) }]);
  assert.equal(oversized.status, 413); assert.equal(oversized.body.error, 'source-too-large');
  assert.equal((await request('/api/historie/import', { url, turnstileToken: 'bad' })).status, 403);
  const actualApi = await request('/api/historie/import', { url: 'https://www.medonet.pl/historie-fixture', turnstileToken: 'good' });
  assert.equal(actualApi.body.source.excerpt, 'Syntetyczny materiał źródłowy.');
});

test('paginacja publiczna jest spójna i loader odrzuca zmianę wydania między stronami', async () => {
  const edition = crypto.randomUUID();
  const rows = Array.from({ length: 27 }, () => ({ ...cleanDraft, slug: 'h-' + crypto.randomUUID().replaceAll('-', ''), verifiedPwz: [], date: new Date().toISOString() }));
  await mod.batch(rows.map((row) => mod.prepare('INSERT INTO publikacje(slug,title,body,verified_pwz,date,release_id) VALUES (?,?,?,?,?,?)')
    .bind(row.slug, row.title, row.body, '[]', row.date, edition)));
  await mod.prepare('UPDATE publikacje SET release_id=?').bind(edition).run();
  const first = await publicPage(mod);
  assert.equal(first.items.length, 25); assert.ok(first.nextCursor);
  const env = { HISTORIE_AKTYWNE: 'true', HISTORIE_PUBLIKACJE_URL: 'https://zarobkilekarzy.pl/api/historie/publikacje' };
  const loaded = await loadPublications({ env, fetcher: async (url) => {
    const parsed = new URL(url);
    return Response.json(await publicPage(mod, { cursor: parsed.searchParams.get('cursor') ?? '', releaseId: parsed.searchParams.get('wydanie') ?? undefined }));
  } });
  assert.equal(loaded.length, (await mod.prepare('SELECT COUNT(*) AS count FROM publikacje').first()).count);
  let call = 0;
  await assert.rejects(loadPublications({ env, fetcher: async () => Response.json(call++ ? { ...first, releaseId: crypto.randomUUID() } : first) }));
});
