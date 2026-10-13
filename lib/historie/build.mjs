import { active, object, publication, PUBLIC_FEED, SLUG, UUID } from './contract.mjs';
import { boundedText } from './import.mjs';

export const historiesEnabled = () => active(process.env.HISTORIE_AKTYWNE);

/** Build pobiera wyłącznie publiczny feed. Błąd źródła nie staje się pustą kolekcją. */
export async function loadPublications({ env = process.env, fetcher = fetch, development = false } = {}) {
  if (!active(env.HISTORIE_AKTYWNE)) return [];
  if (env.HISTORIE_FIKSTURY === 'true') {
    if (!development) throw new Error('Fikstury historii są zabronione w buildzie produkcyjnym.');
    const { fixtures } = await import('../../tests/fixtures/historie.mjs');
    return fixtures.map(publication);
  }
  const source = env.HISTORIE_PUBLIKACJE_URL;
  if (!source) throw new Error('Aktywne historie wymagają HISTORIE_PUBLIKACJE_URL.');
  const base = new URL(source);
  if (!development && (base.protocol !== 'https:' || base.origin !== 'https://zarobkilekarzy.pl' || base.pathname !== '/api/historie/publikacje')) {
    throw new Error('Produkcyjny loader historii wymaga publicznego endpointu serwisu.');
  }
  if (base.username || base.password || base.search || base.hash) throw new Error('Niepoprawny adres feedu historii.');
  const all = []; const slugs = new Set(); const cursors = new Set();
  let cursor = ''; let releaseId; let pages = 0;
  do {
    if (++pages > 1000) throw new Error('Przekroczony limit stron feedu historii.');
    const url = new URL(base);
    if (cursor) url.searchParams.set('cursor', cursor);
    if (releaseId) url.searchParams.set('wydanie', releaseId);
    const response = await fetcher(url.href, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10_000), redirect: 'error' });
    if (!response.ok) throw new Error(`Feed historii niedostępny: HTTP ${response.status}.`);
    const page = object(JSON.parse(await boundedText(response, PUBLIC_FEED.pageBytes)), ['version', 'releaseId', 'items', 'nextCursor']);
    if (page.version !== 1 || !Array.isArray(page.items) || page.items.length > PUBLIC_FEED.pageSize ||
        (page.releaseId !== null && !UUID.test(page.releaseId ?? '')) ||
        (page.nextCursor !== null && !SLUG.test(page.nextCursor ?? ''))) throw new Error('Niepoprawny schemat feedu historii.');
    if (releaseId === undefined) releaseId = page.releaseId;
    if (releaseId !== page.releaseId || (page.items.length && !page.releaseId)) throw new Error('Zmiana wydania podczas buildu historii.');
    if (env.HISTORIE_OCZEKIWANE_WYDANIE && env.HISTORIE_OCZEKIWANE_WYDANIE !== (page.releaseId ?? 'empty')) throw new Error('Feed nie zawiera wydania wybranego przez workflow.');
    for (const item of page.items) {
      const value = publication(item);
      if (slugs.has(value.slug)) throw new Error('Powtórzony slug w feedzie historii.');
      slugs.add(value.slug); all.push(value);
    }
    if (page.nextCursor && (!page.items.length || page.nextCursor !== page.items.at(-1).slug || cursors.has(page.nextCursor))) throw new Error('Niepoprawna paginacja historii.');
    cursor = page.nextCursor;
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return all;
}
