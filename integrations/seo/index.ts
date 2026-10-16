/**
 * Integracja SEO:
 * - zapisuje dist/_redirects z rejestru przekierowań (301 na krawędzi Cloudflare)
 *   i dist/_headers (cache, nagłówki bezpieczeństwa, noindex dla plików JSON),
 * - daje `serialize` dla @astrojs/sitemap (mapa z faktów HTML: noindex wypada, lastmod z grafu),
 * - po buildzie uruchamia audyt i zapisuje raport w .astro/seo-report.json.
 * SEO_STRICT=1 (npm run build:release) — błędy audytu i niespełniony kontrakt starych adresów przerywają build.
 *
 * W astro.config ta integracja stoi PO sitemap(): audyt czyta gotowe pliki sitemapy.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { legacyUrls, removedUrls } from '../../src/data/seo/legacy-urls';
import { clearFactsCache } from './facts';
import { headersFile } from './headers';
import { redirects, redirectsFile } from './redirects';
import { createSitemapSerializer } from './sitemap';
import { formatReport, listFiles, runAudit } from './audit';

export { astroRedirects } from './redirects';

export default function seo() {
  let outDir: URL | undefined;
  let site: URL | undefined;
  let cacheDir: URL | undefined;
  const strict = process.env.SEO_STRICT === '1';

  const integration: AstroIntegration = {
    name: 'zl-seo',
    hooks: {
      'astro:config:done': ({ config }) => {
        outDir = config.outDir;
        site = config.site ? new URL(config.site) : undefined;
        cacheDir = new URL('.astro/', config.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        await writeFile(new URL('_redirects', dir), redirectsFile());
        await writeFile(new URL('_headers', dir), headersFile(await listFiles(fileURLToPath(dir))));
        logger.info(`dist/_redirects (${redirects.length} przekierowań) i dist/_headers zapisane`);

        if (!site) {
          logger.warn('brak `site` w astro.config — audyt SEO pominięty');
          return;
        }
        clearFactsCache();
        const report = await runAudit({ dir, site, redirects, legacy: { urls: legacyUrls, removed: removedUrls }, strict });
        await mkdir(cacheDir!, { recursive: true });
        const reportFile = new URL('seo-report.json', cacheDir);
        await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`);

        const lines = formatReport(report, fileURLToPath(reportFile));
        const log = report.errors ? logger.warn.bind(logger) : logger.info.bind(logger);
        lines.forEach((line) => log(line));
        if (strict && report.errors) throw new Error(`Audyt SEO: ${report.errors} błędów (tryb wydania, SEO_STRICT=1)`);
      },
    },
  };

  return Object.assign(integration, { serializeSitemapItem: createSitemapSerializer(() => outDir) });
}
