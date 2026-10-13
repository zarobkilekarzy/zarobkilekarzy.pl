// Sprawdza artefakt Astro, nie tylko flagę czy kontrakt loadera.
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const enabled = process.argv[2] === 'enabled';
const html = await readFile('dist/index.html', 'utf8');
const privacy = await readFile('dist/prywatnosc/index.html', 'utf8');
const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
assert.equal(html.includes('href="/historie/"'), enabled);
assert.equal(privacy.includes('id="historie"'), enabled);
assert.equal(sitemap.includes('/historie/'), enabled);
assert.equal(sitemap.includes('/dzialaj/opowiedz/'), false);
if (enabled) {
  const form = await readFile('dist/dzialaj/opowiedz/index.html', 'utf8');
  assert.match(form, /noindex/); assert.match(form, /112/); assert.match(form, /800 190 590/);
  const story = await readFile('dist/historie/h-00000000000000000000000000000001/index.html', 'utf8');
  assert.match(story, /Relacja niezweryfikowana/);
  assert.equal(story.includes('"@type":"Article"'), false);
  await access('dist/og/historie.png');
  assert.match(story, /\/og\/historie.png/);
} else {
  await assert.rejects(access('dist/historie'));
  await assert.rejects(access('dist/dzialaj/opowiedz'));
  await assert.rejects(access('dist/og/historie.png'));
  assert.equal(html.includes('h-00000000000000000000000000000001'), false);
}
process.stdout.write(`Artefakt: historie ${enabled ? 'włączone w teście' : 'wyłączone'}, poprawne linki, polityka i sitemap.\n`);
