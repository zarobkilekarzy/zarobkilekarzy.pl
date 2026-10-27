/**
 * Integracja tłumaczeń: po buildzie kontrola par PL↔EN (./qa.ts) — raport w .astro/i18n-qa.json i podsumowanie
 * w logu. Same ostrzeżenia: build nigdy nie staje z powodu wersji angielskiej (spec wersji EN, §1 i §9).
 */
import type { AstroIntegration } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { checkTranslations, type QaRule } from './qa';

const RULES: Record<QaRule, string> = {
  numbers: 'liczby z PL, których nie ma w EN',
  footnotes: 'inne przypisy',
  links: 'brak linku do źródła',
  structure: 'inna liczba nagłówków, wykresów lub tabel',
  polish: 'polskie słowa poza lang="pl"',
  terms: 'zakazany wariant terminu',
};

/** ile uwag wypisać w logu; reszta w raporcie */
const LOG_MAX = 12;

export default function i18nQa(): AstroIntegration {
  let cacheDir: URL | undefined;
  return {
    name: 'zl-i18n-qa',
    hooks: {
      'astro:config:done': ({ config }) => {
        cacheDir = new URL('.astro/', config.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const pages = await checkTranslations(fileURLToPath(dir));
        const issues = pages.flatMap((p) => p.issues.map((i) => ({ ...i, en: p.en, pl: p.pl })));
        await mkdir(cacheDir!, { recursive: true });
        const reportFile = new URL('i18n-qa.json', cacheDir);
        await writeFile(reportFile, `${JSON.stringify({ pairs: pages.length, issues }, null, 2)}\n`);

        if (!issues.length) {
          logger.info(`${pages.length} par PL↔EN · bez uwag`);
          return;
        }
        const byRule = Object.entries(RULES)
          .map(([rule, label]) => [issues.filter((i) => i.rule === rule).length, label] as const)
          .filter(([n]) => n > 0);
        logger.warn(`${pages.length} par PL↔EN · ${issues.length} uwag (ostrzeżenia, build idzie dalej): ${byRule.map(([n, label]) => `${label} ${n}`).join(' · ')}`);
        issues.slice(0, LOG_MAX).forEach((i) => logger.warn(`  ${i.rule}: ${i.detail.slice(0, 140)} [${i.en}]`));
        logger.warn(`  pełny raport: ${fileURLToPath(reportFile)}`);
      },
    },
  };
}
