// Sprawdza artefakt Astro, nie tylko flagę czy kontrakt loadera.
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(process.env.HISTORIE_TEST_DIST || 'dist');
const enabled = process.argv[2] === 'enabled';
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const privacy = await readFile(resolve(root, 'prywatnosc/index.html'), 'utf8');
const sitemap = await readFile(resolve(root, 'sitemap-0.xml'), 'utf8');
assert.equal(html.includes('href="/historie/"'), enabled);
assert.equal(privacy.includes('id="historie"'), enabled);
assert.equal(sitemap.includes('/historie/'), enabled);
assert.equal(sitemap.includes('/dzialaj/opowiedz/'), false);
if (enabled) {
  const form = await readFile(resolve(root, 'dzialaj/opowiedz/index.html'), 'utf8');
  assert.match(form, /noindex/); assert.match(form, /112/); assert.match(form, /800 190 590/);
  const story = await readFile(resolve(root, 'historie/h-00000000000000000000000000000001/index.html'), 'utf8');
  assert.match(story, /Relacja niezweryfikowana/);
  assert.equal(story.includes('"@type":"Article"'), false);
  await access(resolve(root, 'og/historie.png'));
  assert.match(story, /\/og\/historie.png/);
} else {
  await assert.rejects(access(resolve(root, 'historie')));
  await assert.rejects(access(resolve(root, 'dzialaj/opowiedz')));
  await assert.rejects(access(resolve(root, 'og/historie.png')));
  assert.equal(html.includes('h-00000000000000000000000000000001'), false);
}
process.stdout.write(`Artefakt: historie ${enabled ? 'włączone w teście' : 'wyłączone'}, poprawne linki, polityka i sitemap.\n`);
