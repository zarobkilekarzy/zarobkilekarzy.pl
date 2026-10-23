/**
 * Integracja podprojektu „Prototypy mObywatela”: warianty prototypu (src/mobywatel/prototypy/, składa je zloz.mjs)
 * jako statyczne aplikacje pod /mobywatel/<wariant>/ — bez serwera i bez Workera.
 * - build: przed audytem SEO (pierwsza na liście integracji) — audyt sprawdza warianty i linki do nich ze strony konkursu,
 * - dev: składa do katalogu tymczasowego i serwuje go; przy zmianie pliku w prototypy/ składa od nowa.
 * Usunięcie podprojektu: także wpis tej integracji w astro.config.mjs.
 */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { zloz } from './prototypy/zloz.mjs';

const TYPY: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
};

export default function mobywatel(): AstroIntegration {
  return {
    name: 'zl-mobywatel-prototypy',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        // składamy obok i kopiujemy wariantami — dist/mobywatel/ ma też strony Astro (strona konkursu)
        const tmp = mkdtempSync(join(tmpdir(), 'zl-mobywatel-'));
        const lista: string[] = zloz(tmp);
        for (const slug of lista) {
          const cel = fileURLToPath(new URL(`mobywatel/${slug}/`, dir));
          if (existsSync(cel)) throw new Error(`/mobywatel/${slug}/ jest już stroną Astro — wariant musi mieć inną nazwę`);
          cpSync(join(tmp, slug), cel, { recursive: true });
        }
        rmSync(tmp, { recursive: true, force: true });
        logger.info(`warianty: ${lista.map((s) => `/mobywatel/${s}/`).join(', ')}`);
      },
      'astro:server:setup': ({ server, logger }) => {
        const out = join(tmpdir(), 'zl-mobywatel-prototypy');
        let lista: string[] = zloz(out);
        server.watcher.on('change', (plik) => {
          if (!plik.includes('/src/mobywatel/prototypy/')) return;
          lista = zloz(out);
          logger.info('warianty złożone od nowa');
        });
        server.middlewares.use((req, res, next) => {
          const sciezka = decodeURIComponent((req.url ?? '').split('?')[0]);
          const m = /^\/mobywatel\/([^/]+)\/(.*)$/.exec(sciezka);
          if (!m || !lista.includes(m[1])) return next();
          const plik = normalize(join(out, m[1], m[2] || 'index.html'));
          if (!plik.startsWith(out) || !existsSync(plik) || statSync(plik).isDirectory()) return next();
          res.setHeader('Content-Type', TYPY[extname(plik)] ?? 'application/octet-stream');
          res.end(readFileSync(plik));
        });
      },
    },
  };
}
