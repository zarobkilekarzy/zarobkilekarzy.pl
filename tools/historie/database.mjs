import { Miniflare } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HistoryError, UUID } from '../../lib/historie/contract.mjs';
import { QUEUES } from '../../lib/historie/store.mjs';

/** Lokalny D1, zgodny z nazwami bindingów przekazanych do `wrangler pages dev --d1`. */
export async function localDatabases(persistence = '.wrangler/state') {
  const mf = new Miniflare({ modules: true, script: 'export default {}',
    compatibilityDate: '2026-07-30', d1Persist: resolve(persistence, 'v3/d1'),
    d1Databases: Object.fromEntries(Object.values(QUEUES).map((name) => [name, name])) });
  const entries = await Promise.all(Object.entries(QUEUES).map(async ([queue, name]) => [queue, await mf.getD1Database(name)]));
  return { databases: Object.fromEntries(entries), dispose: () => mf.dispose() };
}

/** Wąski adapter D1 HTTP API; SQL jest stały, wartości trafiają tylko do `params`. */
export function remoteDatabase(queue, env = process.env, fetcher = fetch) {
  const account = env.CLOUDFLARE_ACCOUNT_ID;
  const database = env[queue === 'moderacja' ? 'HISTORIE_MODERACJA_DATABASE_ID' : 'HISTORIE_PRYWATNE_DATABASE_ID'];
  const token = env.HISTORIE_D1_TOKEN;
  if (!/^[0-9a-f]{32}$/i.test(account ?? '') || !UUID.test(database ?? '') || !token) throw new HistoryError(400, 'remote-configuration-required');
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`;
  async function batch(statements) {
    try {
      const response = await fetcher(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batch: statements.map(({ sql, params }) => ({ sql, params })) }) });
      const body = await response.json();
      if (!response.ok || body.success !== true || !Array.isArray(body.result) ||
          body.result.length !== statements.length || body.result.some((item) => item.success !== true)) throw new Error('failed');
      return body.result;
    } catch { throw new HistoryError(503, 'd1-request-unconfirmed', '', true); }
  }
  function prepare(sql, params = []) {
    return { sql, params, bind: (...values) => prepare(sql, values),
      run: async () => (await batch([{ sql, params }]))[0],
      all: async () => (await batch([{ sql, params }]))[0],
      first: async () => (await batch([{ sql, params }]))[0].results?.[0] ?? null };
  }
  return { prepare, batch };
}

/** Jedynie zaufane migracje z repo. Żaden tekst zgłoszenia nie jest częścią SQL. */
export async function migrate(db, moderation) {
  const files = ['0001_wspolne.sql', ...(moderation ? ['0002_moderacja.sql'] : [])];
  for (const file of files) {
    const source = await readFile(new URL(`../../migrations/historie/${file}`, import.meta.url), 'utf8');
    const statements = source.replace(/^\s*--.*$/gm, '').split(';').map((sql) => sql.trim()).filter(Boolean);
    await db.batch(statements.map((sql) => db.prepare(sql)));
  }
}
