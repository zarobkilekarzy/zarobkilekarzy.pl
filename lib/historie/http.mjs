import { active, HistoryError, LIMITS } from './contract.mjs';
import { boundedText } from './import.mjs';

export function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  } });
}
export function errorResponse(error) {
  const known = error instanceof HistoryError;
  return json({ error: known ? error.code : 'service-unavailable',
    ...(known && error.field ? { field: error.field } : {}), retryable: known ? error.retryable : true }, known ? error.status : 503);
}
export function enabled(env) {
  if (!active(env.HISTORIE_API_AKTYWNE)) throw new HistoryError(503, 'histories-disabled', '', false);
}
export async function requestJson(request) {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) throw new HistoryError(400, 'json-required');
  if (Number(request.headers.get('content-length')) > LIMITS.requestBytes) throw new HistoryError(413, 'request-too-large');
  try { return JSON.parse(await boundedText(request, LIMITS.requestBytes)); }
  catch (error) {
    if (error instanceof HistoryError) throw error;
    throw new HistoryError(400, 'invalid-json');
  }
}

/** Osobne klucze, brak remoteip. Awaria dostawcy zamyka zapis, nigdy go nie omija. */
export async function turnstile(token, env, fetcher = fetch) {
  if (!env.TURNSTILE_HISTORIE_SITE_KEY || !env.TURNSTILE_HISTORIE_SECRET_KEY) throw new HistoryError(503, 'challenge-unavailable', '', true);
  if (typeof token !== 'string' || !token || token.length > LIMITS.token) throw new HistoryError(403, 'challenge-rejected');
  let response;
  try {
    response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(3000),
      body: JSON.stringify({ secret: env.TURNSTILE_HISTORIE_SECRET_KEY, response: token, idempotency_key: crypto.randomUUID() }),
    });
    if (!response.ok) throw new Error('unavailable');
    const result = await response.json();
    const hostnames = String(env.TURNSTILE_HISTORIE_HOSTNAMES ?? 'zarobkilekarzy.pl').split(',').map((host) => host.trim());
    if (result.success !== true || result.action !== 'historie' || !hostnames.includes(result.hostname)) throw new HistoryError(403, 'challenge-rejected');
  } catch (error) {
    if (error instanceof HistoryError) throw error;
    throw new HistoryError(503, 'challenge-unavailable', '', true);
  }
}

/** Stałoczasowe porównanie sekretu wydania; endpoint nie udostępnia zapytań D1. */
export function authorizeRelease(request, env) {
  const expected = env.HISTORIE_RELEASE_KEY;
  if (typeof expected !== 'string' || expected.length < 32) throw new HistoryError(503, 'release-unavailable');
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  let different = supplied.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) different |= expected.charCodeAt(i) ^ (supplied.charCodeAt(i) || 0);
  if (different) throw new HistoryError(403, 'release-forbidden');
}
