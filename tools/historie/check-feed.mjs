import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { active, UUID } from '../../lib/historie/contract.mjs';

// Jedynie publiczne metadane; żaden z tych kroków nie otrzymuje uprawnień D1.
async function currentEdition() {
  const response = await fetch('https://zarobkilekarzy.pl/api/historie/publikacje', {
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const page = await response.json();
  if (!response.ok || page.version !== 1 || !Array.isArray(page.items) ||
      (page.releaseId !== null && !UUID.test(page.releaseId ?? '')) || (page.items.length && !page.releaseId)) throw new Error();
  return page.releaseId ?? 'empty';
}
try {
  const mode = process.argv[2];
  if (!['capture', 'stamp', 'check'].includes(mode)) throw new Error();
  if (active(process.env.HISTORIE_AKTYWNE)) {
    if (mode === 'capture') {
      const actual = await currentEdition();
      const expected = process.env.HISTORIE_OCZEKIWANE_WYDANIE;
      if (expected && expected !== actual) throw new Error();
      await appendFile(process.env.GITHUB_ENV, `HISTORIE_OCZEKIWANE_WYDANIE=${actual}\n`);
    } else if (mode === 'stamp') {
      const edition = process.env.HISTORIE_OCZEKIWANE_WYDANIE;
      if (edition !== 'empty' && !UUID.test(edition ?? '')) throw new Error();
      await writeFile('dist/historie-wydanie.json', JSON.stringify({ releaseId: edition }));
    } else {
      const manifest = JSON.parse(await readFile('dist/historie-wydanie.json', 'utf8'));
      if (manifest.releaseId !== await currentEdition()) throw new Error();
    }
  }
} catch {
  process.stderr.write('Niepotwierdzone lub zmienione wydanie historii. Build/deploy został zatrzymany.\n');
  process.exitCode = 1;
}
