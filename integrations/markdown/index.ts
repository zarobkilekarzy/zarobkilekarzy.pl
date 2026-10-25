/**
 * Integracja Markdown: po buildzie zapisuje dla każdej strony plik `.md` — tę samą treść w Markdownie,
 * dla agentów i modeli językowych (mniej tokenów niż HTML). Strony HTML zostają bez zmian.
 * Adres: strona bez końcowego ukośnika + `.md` (np. /slownik.md, główna: /index.md); wspomina o nim
 * llms.txt, a _headers daje plikom `text/markdown` i noindex (integrations/seo/headers.ts).
 *
 * Gdy w pliku zostanie ślad interfejsu (convert.ts, `suspicious`), build tylko ostrzega — nie przerywa.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { listFiles } from '../seo/audit';
import { htmlToMarkdown, suspicious } from './convert';

export default function markdown(): AstroIntegration {
  return {
    name: 'zl-markdown',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const pages = (await listFiles(fileURLToPath(dir))).filter((f) => f.endsWith('/index.html'));
        let written = 0;
        const leaks: string[] = [];
        for (const page of pages) {
          const md = htmlToMarkdown(await readFile(new URL(`.${page}`, dir), 'utf8'));
          if (!md) continue;
          // /slownik/index.html → /slownik.md, /index.html → /index.md
          const file = page === '/index.html' ? '/index.md' : page.replace(/\/index\.html$/, '.md');
          await writeFile(new URL(`.${file}`, dir), md);
          written++;
          const leak = suspicious(md);
          if (leak) leaks.push(`  ${file}: ${leak[0]} — „${leak[1]}”`);
        }
        logger.info(`${written} plików .md dla stron (${pages.length - written} stron bez treści pominiętych)`);
        if (leaks.length) {
          logger.warn(`${leaks.length} plików .md z podejrzanym fragmentem — element interfejsu do dopisania w integrations/markdown/convert.ts (UI):`);
          leaks.forEach((line) => logger.warn(line));
        }
      },
    },
  };
}
