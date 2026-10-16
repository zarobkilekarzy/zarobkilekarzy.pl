/**
 * Audyt SEO wygenerowanego serwisu: zbiera fakty ze wszystkich stron HTML, sitemapy, rejestru
 * przekierowań i kontraktu starych adresów, uruchamia reguły i składa raport.
 * Jedna reguła = jeden temat w audit/rules/. Nowa reguła: plik + wpis w RULES.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFacts, type PageFacts } from '../facts';
import type { Redirect } from '../redirects';
import type { AuditContext, Finding, Rule } from './context';
import { content } from './rules/content';
import { head } from './rules/head';
import { legacy } from './rules/legacy';
import { links } from './rules/links';
import { redirects } from './rules/redirects';
import { sitemap } from './rules/sitemap';
import { structuredData } from './rules/structured-data';

const RULES: Rule[] = [head, content, structuredData, links, sitemap, redirects, legacy];

export interface AuditReport {
  generated: string;
  strict: boolean;
  pages: number;
  errors: number;
  warnings: number;
  findings: Finding[];
}

/** Wszystkie pliki katalogu buildu jako ścieżki w serwisie ('/og/index.png'). */
export async function listFiles(root: string, dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? listFiles(root, full) : [`/${path.relative(root, full).split(path.sep).join('/')}`];
    }),
  );
  return nested.flat();
}

/** Plik HTML → ścieżka strony: /dane/index.html → /dane/, /404.html bez zmian. */
const pagePath = (file: string) => (file.endsWith('/index.html') ? file.slice(0, -'index.html'.length) : file);

export async function runAudit(opts: {
  dir: URL;
  site: URL;
  redirects: Redirect[];
  legacy: AuditContext['legacy'];
  strict: boolean;
}): Promise<AuditReport> {
  const root = fileURLToPath(opts.dir);
  const files = new Set(await listFiles(root));

  const pages = new Map<string, PageFacts>();
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const facts = await readFacts(opts.dir, pagePath(file));
    if (facts) pages.set(facts.path, facts);
  }

  const sitemapUrls = new Set<string>();
  for (const file of files) {
    if (!/^\/sitemap-(?!index).*\.xml$/.test(file)) continue;
    const xml = await readFile(path.join(root, file), 'utf8');
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(loc);
  }

  const ctx: AuditContext = { site: opts.site, pages, files, sitemap: sitemapUrls, redirects: opts.redirects, legacy: opts.legacy, strict: opts.strict };
  const findings = RULES.flatMap((rule) => rule(ctx));
  return {
    generated: new Date().toISOString(),
    strict: opts.strict,
    pages: pages.size,
    errors: findings.filter((f) => f.level === 'error').length,
    warnings: findings.filter((f) => f.level === 'warn').length,
    findings,
  };
}

/** Raport dla konsoli: wszystkie błędy, ostrzeżenia zwinięte do liczby na regułę i kilku przykładów. */
export function formatReport(report: AuditReport, reportFile: string): string[] {
  const lines = [`${report.pages} stron · ${report.errors} błędów · ${report.warnings} ostrzeżeń${report.strict ? ' · tryb wydania' : ''}`];
  const where = (f: Finding) => (f.pages?.length ? ` [${f.pages.slice(0, 3).join(', ')}${f.pages.length > 3 ? ` +${f.pages.length - 3}` : ''}]` : '');
  for (const f of report.findings.filter((f) => f.level === 'error')) lines.push(`  ✗ ${f.rule}: ${f.message}${where(f)}`);
  const byRule = Map.groupBy(report.findings.filter((f) => f.level === 'warn'), (f) => f.rule);
  for (const [rule, list] of byRule) {
    lines.push(`  ! ${rule}: ${list.length} ostrzeżeń`);
    for (const f of list.slice(0, 4)) lines.push(`      ${f.message}${where(f)}`);
  }
  lines.push(`  pełny raport: ${reportFile}`);
  return lines;
}
