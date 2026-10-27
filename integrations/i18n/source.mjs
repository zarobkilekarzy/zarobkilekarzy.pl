/**
 * Stempel tłumaczenia: skrót polskich plików źródłowych z chwili tłumaczenia. Build porównuje go
 * z bieżącym skrótem (src/i18n/translations.ts → ramka „oryginał się zmienił”), a polecenia
 * `npm run i18n:status` / `npm run i18n:stamp` (./cli.mjs) go wypisują i odświeżają.
 * Czysty JavaScript bez aliasów, żeby działał i w buildzie, i wprost z Node.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * Skrót treści plików (12 znaków sha256). Ścieżka wchodzi do skrótu, więc zmiana listy plików też go zmienia.
 * @param {string[]} files ścieżki względem katalogu projektu
 */
export function sourceHash(files) {
  const hash = createHash('sha256');
  for (const file of files) hash.update(`${file}\0`).update(readFileSync(file)).update('\0');
  return hash.digest('hex').slice(0, 12);
}

/**
 * Data ostatniej zmiany plików według gita; niezacommitowana zmiana = teraz. Bez gita (np. archiwum) — undefined.
 * @param {string[]} files
 * @returns {Date | undefined}
 */
export function lastChange(files) {
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', ...files], { encoding: 'utf8' }).trim();
    if (dirty) return new Date();
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...files], { encoding: 'utf8' }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}
