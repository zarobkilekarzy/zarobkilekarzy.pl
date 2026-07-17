// Integracja Astro: buduje statyczny indeks wyszukiwania (Pagefind) z gotowego
// `dist/` po zakończeniu buildu.
//
// Pagefind indeksuje wygenerowany HTML i zapisuje do `dist/pagefind/` sam indeks
// (fragmenty + WASM) oraz gotowe UI (`pagefind-ui.js/.css`). Całość jest statyczna
// i działa w przeglądarce użytkownika — zapytania nigdzie nie wychodzą, brak
// serwera i firm trzecich (spójne z prywatnością i anonimowością projektu).
//
// Zakres indeksu wyznaczają szablony: `data-pagefind-body` na <main> stron, które
// mają być przeszukiwalne (patrz `BaseLayout.astro`). Strony bez tego atrybutu
// (admin, wydruki, sama /szukaj, 404) do indeksu nie trafiają.
import * as pagefind from 'pagefind';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function pagefindSearch() {
  return {
    name: 'pagefind',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);

        const { index, errors } = await pagefind.createIndex({
          // `.hanchor` to doklejane przez middleware linki „#" przy nagłówkach —
          // narzędzie nawigacyjne, nie treść. Poza tym Pagefind sam pomija skrypty.
          excludeSelectors: ['.hanchor'],
        });
        if (errors.length || !index) {
          logger.error(`nie udało się utworzyć indeksu: ${errors.join('; ')}`);
          return;
        }

        const { page_count, errors: addErrors } = await index.addDirectory({ path: dist });
        if (addErrors.length) logger.warn(`ostrzeżenia przy indeksowaniu: ${addErrors.join('; ')}`);

        await index.writeFiles({ outputPath: join(dist, 'pagefind') });
        await pagefind.close();

        // `page_count` to liczba przejrzanych stron; do indeksu wchodzą tylko te
        // z `data-pagefind-body` (reszta — admin, wydruki, /szukaj — pomijana).
        logger.info(`indeks wyszukiwarki gotowy → /pagefind/ (przejrzano ${page_count} stron)`);
      },
    },
  };
}
