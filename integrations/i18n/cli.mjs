/**
 * Stan tłumaczeń i stempel źródła (frontmatter `translation` w src/content/en/{articles,news}/*).
 *
 *   npm run i18n:status                 — które tłumaczenia są nieaktualne względem polskiego oryginału
 *   npm run i18n:stamp -- <plik.mdx>    — zapisuje bieżący skrót oryginału i dzisiejszą datę
 *   npm run i18n:stamp -- /en/faq/      — to samo dla strony z rejestru src/i18n/pages.json
 *                                         (po poprawieniu tłumaczenia albo po sprawdzeniu, że zmiana oryginału go nie dotyczy)
 *
 * Status kończy się kodem 0 także przy nieaktualnych tłumaczeniach — wersja angielska nie blokuje polskiej.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { lastChange, sourceHash } from './source.mjs';

/** Katalogi tłumaczeń i ich polskich oryginałów: artykuły i aktualności */
const DIRS = [
  { en: 'src/content/en/articles', pl: 'src/content/articles' },
  { en: 'src/content/en/news', pl: 'src/content/aktualnosci' },
];
const PAGES = 'src/i18n/pages.json';

/** Rejestr tłumaczeń stron .astro (src/i18n/pages.ts). */
const readPages = () => (existsSync(PAGES) ? JSON.parse(readFileSync(PAGES, 'utf8')) : []);
const unquote = (value) => value.trim().replace(/^(["'])(.*)\1$/, '$2');

/**
 * Lista `files` w obu zapisach YAML: `files: [a, b]` albo kolejne wiersze `- a`. Inny zapis to błąd —
 * cicha pusta lista dałaby stempel niezgodny z buildem (ten czyta frontmatter pełnym parserem).
 */
function filesOf(file, block) {
  const lines = block.split('\n');
  const at = lines.findIndex((l) => /^\s+files:/.test(l));
  if (at < 0) return [];
  const inline = lines[at].replace(/^\s+files:/, '').trim();
  if (inline.startsWith('[') && inline.endsWith(']')) return inline.slice(1, -1).split(',').map(unquote).filter(Boolean);
  if (inline) throw new Error(`${file}: nieobsługiwany zapis translation.files — użyj [a, b] albo listy „- a”`);
  const items = [];
  for (const line of lines.slice(at + 1)) {
    const item = /^\s+-\s+(.+)$/.exec(line);
    if (!item) break;
    items.push(unquote(item[1]));
  }
  return items;
}

/** Pola `translation` z frontmattera (prosty YAML: of, files, hash, date). */
function readTranslation(file) {
  const plDir = DIRS.find((d) => file.startsWith(`${d.en}/`))?.pl;
  if (!plDir) throw new Error(`${file}: poza ${DIRS.map((d) => d.en).join(' i ')}`);
  const text = readFileSync(file, 'utf8');
  const block = /^translation:\n((?:[ \t]+.*\n)+)/m.exec(text)?.[1];
  if (!block) throw new Error(`${file}: brak pola translation we frontmatterze`);
  const field = (name) => new RegExp(`^\\s+${name}:\\s*(.*)$`, 'm').exec(block)?.[1]?.trim().replace(/^"|"$/g, '');
  const of = field('of');
  const files = filesOf(file, block);
  const source = ['mdx', 'md'].map((ext) => join(plDir, `${of}.${ext}`)).find((f) => existsSync(f));
  return { text, of, plDir, files: source ? [source, ...files] : undefined, hash: field('hash'), date: field('date') };
}

const enFiles = () =>
  DIRS.flatMap(({ en }) => (existsSync(en) ? readdirSync(en).filter((f) => /\.mdx?$/.test(f)).map((f) => join(en, f)) : []));
/** RRRR-MM-DD w czasie lokalnym (toISOString dałby po północy wczorajszy dzień UTC) */
const day = (d) => d.toLocaleDateString('sv-SE');

function status() {
  const rows = enFiles().map((file) => {
    const t = readTranslation(file);
    // oryginał usunięty albo scalony z innym tekstem — tłumaczenie trzeba usunąć albo przepiąć (`of`)
    if (!t.files) return { file, stale: true, line: `BRAK ORYG.   ${file}  ←  ${t.of}  (nie ma ${t.plDir}/${t.of}.md(x))` };
    const current = sourceHash(t.files);
    const stale = current !== t.hash;
    const changed = stale ? lastChange(t.files) : undefined;
    return { file, stale, line: `${stale ? 'NIEAKTUALNE' : 'ok         '}  ${file}  ←  ${t.of}  (tłumaczenie ${t.date}${changed ? `, oryginał zmieniony ${day(changed)}` : ''})` };
  });
  for (const page of readPages()) {
    const stale = sourceHash(page.files) !== page.hash;
    const changed = stale ? lastChange(page.files) : undefined;
    rows.push({ file: page.en, stale, line: `${stale ? 'NIEAKTUALNE' : 'ok         '}  ${page.en}  ←  ${page.pl}  (tłumaczenie ${page.date}${changed ? `, oryginał zmieniony ${day(changed)}` : ''})` });
  }
  if (!rows.length) return console.log('Brak tłumaczeń.');
  rows.forEach((r) => console.log(r.line));
  const stale = rows.filter((r) => r.stale).length;
  console.log(`\n${rows.length} tłumaczeń, nieaktualnych: ${stale}.${stale ? ' Przejrzyj zmiany oryginału (git diff), popraw tekst EN i uruchom npm run i18n:stamp -- <plik>.' : ''}`);
}

function stampPage(path) {
  const pages = readPages();
  const page = pages.find((p) => p.en === path);
  if (!page) throw new Error(`${path}: brak w ${PAGES}`);
  page.hash = sourceHash(page.files);
  page.date = day(new Date());
  writeFileSync(PAGES, `${JSON.stringify(pages, null, 2)}\n`);
  console.log(`${path}: hash ${page.hash}, date ${page.date}`);
}

function stamp(file) {
  if (!file) throw new Error('Podaj plik: npm run i18n:stamp -- src/content/en/articles/<plik>.mdx (albo adres strony /en/…/)');
  if (file.startsWith('/')) return stampPage(file);
  const t = readTranslation(file);
  if (!t.files) throw new Error(`${file}: nie ma oryginału ${t.plDir}/${t.of}.md(x)`);
  const hash = sourceHash(t.files);
  const today = day(new Date());
  const block = /^translation:\n((?:[ \t]+.*\n)+)/m;
  const text = t.text.replace(block, (whole) =>
    whole.replace(/^(\s+hash:\s*).*$/m, `$1"${hash}"`).replace(/^(\s+date:\s*).*$/m, `$1${today}`),
  );
  writeFileSync(file, text);
  console.log(`${file}: hash ${hash}, date ${today}`);
}

const [command, arg] = process.argv.slice(2);
if (command === 'status') status();
else if (command === 'stamp') stamp(arg);
else {
  console.error('Użycie: node integrations/i18n/cli.mjs status | stamp <plik>');
  process.exit(1);
}
