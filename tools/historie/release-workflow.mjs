import { appendFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { UUID } from '../../lib/historie/contract.mjs';

// Job wydania ma wyłącznie sekret tej jednej operacji. Nie dostaje tokenu D1.
try {
  const secret = process.env.HISTORIE_RELEASE_KEY;
  if (!secret || secret.length < 32 || !process.env.GITHUB_RUN_ID) throw new Error();
  const bytes = createHash('sha256').update(`historie-release:${process.env.GITHUB_RUN_ID}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  const generated = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const id = process.env.HISTORIE_RELEASE_ID || generated;
  if (!UUID.test(id)) throw new Error();
  const response = await fetch('https://zarobkilekarzy.pl/api/historie/wydanie', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ releaseId: id }),
  });
  const receipt = await response.json();
  if (!response.ok || (receipt.releaseId !== null && receipt.releaseId !== id) || !Number.isInteger(receipt.count) || receipt.count < 0) throw new Error();
  await appendFile(process.env.GITHUB_OUTPUT, `release_id=${receipt.releaseId ?? 'empty'}\n`);
  process.stdout.write(`Wydanie potwierdzone; liczba historii: ${receipt.count}.\n`);
} catch {
  process.stderr.write('Wydanie niepotwierdzone. Nie uruchamiaj deployu; sprawdź stan feedu i powtórz ręcznie z tym samym id wydania.\n');
  process.exitCode = 1;
}
