// Integracja Astro: wycina komentarze HTML z wygenerowanych stron.
//
// Komentarze w szablonach są robocze — znaczniki sekcji, notatki redakcyjne,
// przypomnienia dla samego siebie. Pomagają przy pisaniu, ale w opublikowanym
// kodzie są tylko szumem (i potrafią wynieść na produkcję notatkę, która nigdy
// nie miała jej opuścić). Źródło zostaje z komentarzami, `dist/` idzie bez nich.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Elementy o treści surowej (RAWTEXT/RCDATA): „<!--" w środku to kod albo
// widoczny tekst, nie komentarz. Przeskakujemy je w całości, bez zmian.
const NEXT = /<!--|<(script|style|textarea|title)\b/gi;

export function stripComments(html) {
  let out = '';
  let last = 0;
  let count = 0;
  let m;

  NEXT.lastIndex = 0;
  while ((m = NEXT.exec(html))) {
    if (m[1]) {
      const close = new RegExp(`</${m[1]}\\s*>`, 'gi');
      close.lastIndex = NEXT.lastIndex;
      const end = close.exec(html);
      if (!end) break;
      NEXT.lastIndex = end.index + end[0].length;
      continue;
    }
    const end = html.indexOf('-->', m.index + 4);
    if (end === -1) break; // niedomknięty — zostawiamy nietknięty
    out += html.slice(last, m.index);
    last = end + 3;
    count++;
    NEXT.lastIndex = last;
  }

  return { html: out + html.slice(last), count };
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

export default function stripHtmlComments() {
  return {
    name: 'strip-html-comments',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let files = 0;
        let removed = 0;
        for (const file of await htmlFiles(fileURLToPath(dir))) {
          const { html, count } = stripComments(await readFile(file, 'utf8'));
          if (!count) continue;
          await writeFile(file, html);
          files += 1;
          removed += count;
        }
        logger.info(`usunięto ${removed} komentarzy w ${files} plikach`);
      },
    },
  };
}
