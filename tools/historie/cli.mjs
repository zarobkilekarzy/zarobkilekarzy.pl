#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { HistoryError, fail, text } from '../../lib/historie/contract.mjs';
import { list, record } from '../../lib/historie/store.mjs';
import { draft, verifyPwz, approve, reject, classify } from '../../lib/historie/moderation.mjs';
import { previewPublic, withdraw, release } from '../../lib/historie/publication.mjs';
import { purge, remove, analysisPreview, approveAnalysis } from '../../lib/historie/retention.mjs';
import { localDatabases, remoteDatabase, migrate } from './database.mjs';

const HELP = `historie <polecenie> [id lub slug] [opcje]
  init                         migracje obu lokalnych baz; zdalnie wymaga --remote
  list | show <id>              --queue moderacja|prywatne; show --contact ujawnia e-mail
  draft <id> --file draft.json  osobna zredagowana projekcja (plik lub --file - ze stdin)
  verify-pwz <id> --pwz NUMER --match   ręczne potwierdzenie zgodności w CRL
  approve <id> [--pwz NUMER ...]       tylko jawnie wskazane, zweryfikowane PWZ
  reject <id> | withdraw <slug>        wycofanie wymaga także usunięcia deploymentów
  classify <id> --file cechy.json     obie kolejki; kodowane cechy bez PWZ
  analysis-preview                   łączy agregaty z obu baz, próg 5
  analysis-approve --snapshot UUID --file cells.json --risk-reviewed
  preview-public               kandydaci, nigdy eksport do src/content
  release --release-id UUID    TYLKO lokalnie do testów; zdalne wydanie przez workflow
  purge [--limit 20]           jedna porcja dla wskazanej kolejki
  delete <id>                  usuwa zgłoszenie i jego projekcję
  Wszystkie decyzje: --actor IDENTYFIKATOR. Domyślnie lokalnie.
  --persist PATH (domyślnie .wrangler/state), --remote (jawnie zdalnie).
  Zdalnie: CLOUDFLARE_ACCOUNT_ID, HISTORIE_D1_TOKEN,
    HISTORIE_MODERACJA_DATABASE_ID, HISTORIE_PRYWATNE_DATABASE_ID.
  Prywatne wyjście show przekierowuj wyłącznie do chronionych plików poza repo.`;

let local;
try {
  const { positionals: [command, id, ...extra], values: opts } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean' }, remote: { type: 'boolean' }, persist: { type: 'string' },
    queue: { type: 'string', default: 'moderacja' }, actor: { type: 'string' }, file: { type: 'string' },
    contact: { type: 'boolean' }, pwz: { type: 'string', multiple: true }, match: { type: 'boolean' },
    snapshot: { type: 'string' }, 'risk-reviewed': { type: 'boolean' },
    'release-id': { type: 'string' }, limit: { type: 'string' },
  } });
  if (opts.help || !command) { process.stdout.write(HELP + '\n'); process.exit(0); }
  if (extra.length || !['moderacja', 'prywatne'].includes(opts.queue)) fail('invalid-cli-arguments');
  const known = ['init', 'list', 'show', 'draft', 'verify-pwz', 'approve', 'reject', 'withdraw', 'classify',
    'analysis-preview', 'analysis-approve', 'preview-public', 'release', 'purge', 'delete'];
  if (!known.includes(command)) fail('unknown-command');
  const onlyModeration = ['draft', 'verify-pwz', 'approve', 'reject', 'withdraw', 'analysis-approve', 'preview-public', 'release'];
  if (onlyModeration.includes(command) && opts.queue !== 'moderacja') fail('private-submission-not-publishable');
  if (command === 'release' && opts.remote) fail('use-manual-release-workflow');
  const actors = ['draft', 'verify-pwz', 'approve', 'reject', 'withdraw', 'classify', 'analysis-approve'];
  const actor = actors.includes(command) ? text(opts.actor, 120, 'actor', true) : undefined;
  if (!opts.remote) local = await localDatabases(opts.persist);
  const dbFor = (queue) => opts.remote ? remoteDatabase(queue) : local.databases[queue];
  const db = dbFor(opts.queue);
  const input = async () => {
    if (!opts.file) fail('file-required');
    let contents;
    if (opts.file === '-') {
      const chunks = []; let size = 0;
      for await (const chunk of process.stdin) { size += chunk.length; if (size > 512 * 1024) fail('file-too-large'); chunks.push(chunk); }
      contents = Buffer.concat(chunks).toString('utf8');
    } else contents = await readFile(opts.file, 'utf8');
    if (Buffer.byteLength(contents) > 512 * 1024) fail('file-too-large');
    try { return JSON.parse(contents); } catch { fail('invalid-json-file'); }
  };
  let result;
  switch (command) {
    case 'init':
      await migrate(dbFor('moderacja'), true); await migrate(dbFor('prywatne'), false);
      result = { initialized: ['moderacja', 'prywatne'], remote: !!opts.remote }; break;
    case 'list': result = await list(db, Number(opts.limit ?? 50)); break;
    case 'show': result = await record(db, id, opts.contact === true); break;
    case 'draft': result = await draft(db, id, actor, await input()); break;
    case 'verify-pwz':
      if (opts.pwz?.length !== 1) fail('one-pwz-required');
      result = await verifyPwz(db, id, actor, opts.pwz[0], opts.match === true); break;
    case 'approve': result = await approve(db, id, actor, opts.pwz ?? []); break;
    case 'reject': result = await reject(db, id, actor); break;
    case 'withdraw': result = await withdraw(db, id, actor); break;
    case 'classify': result = await classify(db, id, actor, await input()); break;
    case 'preview-public': result = await previewPublic(db); break;
    case 'release': result = await release(db, opts['release-id']); break;
    case 'purge': result = await purge(db, { moderation: opts.queue === 'moderacja', limit: Number(opts.limit ?? 20) }); break;
    case 'delete': result = await remove(db, id, { moderation: opts.queue === 'moderacja' }); break;
    case 'analysis-preview': result = await analysisPreview([dbFor('moderacja'), dbFor('prywatne')]); break;
    case 'analysis-approve': result = await approveAnalysis(db, opts.snapshot, actor, await input(), opts['risk-reviewed'] === true); break;
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} catch (error) {
  // Ani wyjątek SQL, ani błąd parsera JSON nie mogą wypisać prywatnego tekstu lub sekretu.
  process.stderr.write(JSON.stringify({ error: error instanceof HistoryError ? error.code : 'cli-operation-failed',
    retryable: error instanceof HistoryError ? error.retryable : false }) + '\n');
  process.exitCode = 1;
} finally { await local?.dispose(); }
