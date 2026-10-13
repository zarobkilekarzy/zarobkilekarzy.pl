/** Kontrakt danych historii. Bez zależności od Node, Astro ani magazynu danych. */
export const VERSION = 1;
export const CONSENT_VERSION = 'historie-2026-10-13';
export const LIMITS = Object.freeze({ title: 160, body: 50_000, city: 120, facility: 240,
  doctors: 20, name: 160, description: 300, url: 2048, excerpt: 14_000,
  email: 254, token: 2048, cytat: 600, requestBytes: 512 * 1024 });
// Pięć maksymalnych relacji mieści się w 2 MiB także przy sześciobajtowych escape'ach JSON.
export const PUBLIC_FEED = Object.freeze({ pageSize: 5, pageBytes: 2 * 1024 * 1024 });
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const SLUG = /^h-[0-9a-f]{32}$/;
export const CATEGORIES = Object.freeze(['dostep', 'komunikacja', 'opieka', 'dokumentacja', 'rozliczenia', 'inne', 'nieustalone']);
export const FACILITY_TYPES = Object.freeze(['szpital', 'sor', 'poz', 'aos', 'nfz', 'inne', 'nieustalone']);
export const REGIONS = Object.freeze(['dolnoslaskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'lodzkie',
  'malopolskie', 'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie', 'pomorskie', 'slaskie',
  'swietokrzyskie', 'warminsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie', 'nieustalone']);

/** Błąd brzegowy; komunikaty nie zawierają wartości przesłanych przez użytkownika. */
export class HistoryError extends Error {
  constructor(status, code, field = '', retryable = false) {
    super(code);
    this.name = 'HistoryError'; this.status = status; this.code = code;
    this.field = field; this.retryable = retryable;
  }
}
export const fail = (code, field = '', status = 400) => { throw new HistoryError(status, code, field); };
export const length = (value) => [...value].length;
export const normalize = (value) => value.normalize('NFC').replace(/\r\n?/g, '\n').trim();
export const active = (value) => value === true || value === 'true';

export function object(value, fields, field = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid-object', field);
  if (Object.keys(value).some((key) => !fields.includes(key))) fail('unknown-field', field);
  return value;
}
export function text(value, max, field, required = false) {
  if (value == null) { if (required) fail('required', field); return undefined; }
  if (typeof value !== 'string') fail('invalid-text', field);
  const result = normalize(value);
  if (length(result) > max) fail('field-too-long', field, 413);
  if (!result) { if (required) fail('required', field); return undefined; }
  return result;
}
export function httpsUrl(value, field = 'source.url') {
  const result = text(value, LIMITS.url, field);
  if (!result) return undefined;
  let url;
  try { url = new URL(result); } catch { fail('invalid-url', field); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) fail('invalid-url', field);
  return text(url.href, LIMITS.url, field, true);
}

/** NIL: KABCDEF, K=(A+2B+3C+4D+5E+6F) mod 11, K w przedziale 1..9. */
export function validPwz(pwz) {
  if (typeof pwz !== 'string' || !/^[1-9][0-9]{6}$/.test(pwz)) return false;
  return Number(pwz[0]) === [...pwz.slice(1)].reduce((sum, digit, i) => sum + Number(digit) * (i + 1), 0) % 11;
}

/** @typedef {{description?: string, url?: string, excerpt?: string, extractor?: string, truncated?: boolean}} Source */
/** @typedef {{name: string, pwz?: string}} Doctor */
/** @typedef {{version: number, idempotencyKey: string, title: string, body: string, city?: string,
 * facility?: string, doctors: Doctor[], source?: Source, contactEmail?: string,
 * consentVersion: string, healthDataConsent: true, publicationRequested: boolean}} Submission */
/** @typedef {{slug: string, title: string, body: string, cytat?: string,
 * source?: {description?: string, url?: string}, verifiedPwz: string[], date: string}} Publication */

function source(value, privateFields) {
  if (value == null) return undefined;
  object(value, privateFields ? ['description', 'url', 'excerpt', 'extractor', 'truncated'] : ['description', 'url'], 'source');
  const result = {};
  const description = text(value.description, LIMITS.description, 'source.description');
  const url = httpsUrl(value.url);
  if (description) result.description = description;
  if (url) result.url = url;
  if (privateFields) {
    const excerpt = text(value.excerpt, LIMITS.excerpt, 'source.excerpt');
    if (excerpt) result.excerpt = excerpt;
    if (value.extractor != null) {
      if (!['jsonld', 'html-rewriter', 'x-oembed', 'manual'].includes(value.extractor)) fail('invalid-extractor', 'source.extractor');
      result.extractor = value.extractor;
    }
    if (value.truncated != null) {
      if (typeof value.truncated !== 'boolean') fail('invalid-boolean', 'source.truncated');
      result.truncated = value.truncated;
    }
  }
  return Object.keys(result).length ? result : undefined;
}

/** Waliduje i normalizuje żądanie. Token pozostaje poza danymi trwałymi i ich skrótem. */
export function submission(value) {
  object(value, ['version', 'idempotencyKey', 'turnstileToken', 'title', 'body', 'city', 'facility',
    'doctors', 'source', 'contactEmail', 'publicationRequested', 'healthDataConsent', 'consentVersion']);
  if (value.version !== VERSION) fail('invalid-version', 'version');
  if (typeof value.idempotencyKey !== 'string' || !UUID.test(value.idempotencyKey)) fail('invalid-idempotency-key', 'idempotencyKey');
  if (value.healthDataConsent !== true) fail('health-consent-required', 'healthDataConsent');
  if (value.consentVersion !== CONSENT_VERSION) fail('consent-version-changed', 'consentVersion');
  if (typeof value.publicationRequested !== 'boolean') fail('invalid-boolean', 'publicationRequested');
  const doctors = value.doctors ?? [];
  if (!Array.isArray(doctors)) fail('invalid-doctors', 'doctors');
  if (doctors.length > LIMITS.doctors) fail('too-many-doctors', 'doctors', 413);
  /** @type {Submission} */
  const result = { version: VERSION, idempotencyKey: value.idempotencyKey.toLowerCase(),
    consentVersion: CONSENT_VERSION,
    title: text(value.title, LIMITS.title, 'title', true), body: text(value.body, LIMITS.body, 'body', true),
    doctors: doctors.map((doctor, i) => {
      object(doctor, ['name', 'pwz'], `doctors.${i}`);
      const name = text(doctor.name, LIMITS.name, `doctors.${i}.name`, true);
      const pwz = text(doctor.pwz, 7, `doctors.${i}.pwz`);
      if (pwz && !/^[0-9]{7}$/.test(pwz)) fail('invalid-pwz-format', `doctors.${i}.pwz`);
      return pwz ? { name, pwz } : { name };
    }), healthDataConsent: true, publicationRequested: value.publicationRequested };
  const city = text(value.city, LIMITS.city, 'city');
  const facility = text(value.facility, LIMITS.facility, 'facility');
  const src = source(value.source, true);
  const email = text(value.contactEmail, LIMITS.email, 'contactEmail');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('invalid-email', 'contactEmail');
  if (city) result.city = city;
  if (facility) result.facility = facility;
  if (src) result.source = src;
  if (email) result.contactEmail = email;
  const turnstileToken = text(value.turnstileToken, LIMITS.token, 'turnstileToken', true);
  return { data: result, turnstileToken,
    warnings: result.doctors.flatMap((doctor, i) => doctor.pwz && !validPwz(doctor.pwz)
      ? [{ code: 'pwz-checksum', field: `doctors.${i}.pwz` }] : []) };
}

/** Ścisła publiczna granica: nadmiarowe pola są błędem, a nie ignorowaną nadwyżką. */
export function publication(value) {
  object(value, ['slug', 'title', 'body', 'cytat', 'source', 'verifiedPwz', 'date']);
  if (!SLUG.test(value.slug ?? '')) fail('invalid-slug', 'slug');
  if (!Array.isArray(value.verifiedPwz) || value.verifiedPwz.length > LIMITS.doctors ||
      value.verifiedPwz.some((pwz) => !validPwz(pwz)) || new Set(value.verifiedPwz).size !== value.verifiedPwz.length) fail('invalid-public-pwz', 'verifiedPwz');
  if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.date) ||
      !Number.isFinite(Date.parse(value.date)) || new Date(value.date).toISOString() !== value.date) fail('invalid-date', 'date');
  /** @type {Publication} */
  const result = { slug: value.slug, title: text(value.title, LIMITS.title, 'title', true),
    body: text(value.body, LIMITS.body, 'body', true), verifiedPwz: [...value.verifiedPwz], date: value.date };
  const src = source(value.source, false);
  const cytat = text(value.cytat, LIMITS.cytat, 'cytat');
  if (cytat && !src) fail('quote-source-required', 'source');
  if (src) result.source = src;
  if (cytat) result.cytat = cytat;
  return result;
}

/** Tylko kodowane cechy; żadnych pól swobodnego tekstu, PWZ ani identyfikatorów. */
export function classification(value) {
  object(value, ['category', 'region', 'year', 'facilityType']);
  if (!CATEGORIES.includes(value.category) || !REGIONS.includes(value.region) || !FACILITY_TYPES.includes(value.facilityType)) fail('invalid-classification');
  if (value.year !== null && (!Number.isInteger(value.year) || value.year < 1900 || value.year > new Date().getUTCFullYear())) fail('invalid-year');
  return { category: value.category, region: value.region, year: value.year, facilityType: value.facilityType };
}
