import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
const exec = promisify(execFile);
const script = resolve('tools/historie/check-feed.mjs');
const issuer = resolve('tools/historie/release-workflow.mjs');
const stub = resolve('tests/historie-workflow-stub.mjs');

test('workflow blokuje deploy po zmianie feedu i zachowuje id przy powtórce wydania', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'historie-workflow-'));
  try {
    await mkdir(join(cwd, 'dist'));
    const id = crypto.randomUUID();
    const env = { ...process.env, HISTORIE_AKTYWNE: 'true', TEST_FEED_RELEASE: id,
      GITHUB_ENV: join(cwd, 'env'), GITHUB_OUTPUT: join(cwd, 'output'), TEST_TRACE: join(cwd, 'trace'),
      HISTORIE_OCZEKIWANE_WYDANIE: id };
    const run = (file, args, overrides = {}) => exec(process.execPath, ['--import', stub, file, ...args], { cwd, env: { ...env, ...overrides } });
    await run(script, ['capture']);
    assert.match(await readFile(env.GITHUB_ENV, 'utf8'), new RegExp(id));
    await run(script, ['stamp']); await run(script, ['check']);
    await assert.rejects(run(script, ['check'], { TEST_FEED_RELEASE: crypto.randomUUID() }));
    await assert.rejects(run(script, ['capture'], { TEST_FEED_FAILURE: 'true' }));
    await run(script, ['check'], { HISTORIE_AKTYWNE: 'false', TEST_FEED_FAILURE: 'true' });
    const issueEnv = { HISTORIE_RELEASE_KEY: 'test-only-key-01234567890123456789', GITHUB_RUN_ID: '101', HISTORIE_RELEASE_ID: '' };
    await run(issuer, [], issueEnv); await run(issuer, [], issueEnv);
    const traces = (await readFile(env.TEST_TRACE, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(traces[0].releaseId, traces[1].releaseId);
    await assert.rejects(run(issuer, [], { ...issueEnv, HISTORIE_RELEASE_ID: 'invalid' }));
  } finally { await rm(cwd, { recursive: true, force: true }); }
});
