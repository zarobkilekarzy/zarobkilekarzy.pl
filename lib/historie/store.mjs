import { CONSENT_VERSION, HistoryError, fail, text, UUID } from './contract.mjs';

export const QUEUES = Object.freeze({ moderacja: 'HISTORIE_MODERACJA_DB', prywatne: 'HISTORIE_PRYWATNE_DB' });
export function database(env, queue) {
  if (!Object.hasOwn(QUEUES, queue)) fail('invalid-queue');
  const db = env[QUEUES[queue]];
  if (!db) throw new HistoryError(503, 'storage-unavailable', '', true);
  return db;
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((v) => v.toString(16).padStart(2, '0')).join('');
}
/** Dodaje 12 miesięcy kalendarzowych UTC, przycinając dzień do końca miesiąca. */
export function expiry(receivedAt) {
  const date = new Date(receivedAt);
  const day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCFullYear(date.getUTCFullYear() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.toISOString();
}

/** Idempotencja w wybranej bazie. Batch obejmuje zgłoszenie, kontakt i fakt przyjęcia. */
export async function receive(db, data, now = new Date().toISOString()) {
  const hash = await digest(data);
  const id = crypto.randomUUID();
  const { contactEmail, ...payload } = data;
  const statements = [db.prepare(`INSERT INTO zgloszenia
    (id,idempotency_key,payload_hash,payload,received_at,expires_at,publication_requested,consent_version)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING`)
    .bind(id, data.idempotencyKey, hash, JSON.stringify(payload), now, expiry(now), Number(data.publicationRequested), CONSENT_VERSION)];
  if (contactEmail) statements.push(db.prepare(`INSERT INTO kontakty(submission_id,email)
    SELECT id,? FROM zgloszenia WHERE idempotency_key=? AND payload_hash=?
    ON CONFLICT(submission_id) DO NOTHING`).bind(contactEmail, data.idempotencyKey, hash));
  statements.push(db.prepare(`INSERT INTO zdarzenia(submission_id,kind,actor,at,data)
    SELECT id,'received','submitter',?,? FROM zgloszenia
    WHERE id=? AND NOT EXISTS (SELECT 1 FROM zdarzenia WHERE submission_id=? AND kind='received')`)
    .bind(now, JSON.stringify({ consentVersion: CONSENT_VERSION }), id, id));
  await db.batch(statements);
  const row = await db.prepare('SELECT id,payload_hash FROM zgloszenia WHERE idempotency_key=?').bind(data.idempotencyKey).first();
  if (!row) throw new HistoryError(503, 'write-unconfirmed', '', true);
  if (row.payload_hash !== hash) fail('idempotency-conflict', 'idempotencyKey');
  return { id: row.id };
}

export async function record(db, id, contact = false) {
  if (!UUID.test(id ?? '')) fail('invalid-id');
  const row = await db.prepare(`SELECT id,payload,received_at,expires_at,publication_requested,consent_version
    FROM zgloszenia WHERE id=?`).bind(id).first();
  if (!row) fail('submission-not-found');
  const events = await db.prepare('SELECT seq,kind,actor,at,data FROM zdarzenia WHERE submission_id=? ORDER BY seq').bind(id).all();
  const result = { ...row, payload: JSON.parse(row.payload), events: events.results.map((event) => ({ ...event, data: JSON.parse(event.data) })) };
  if (contact) result.contact = await db.prepare('SELECT email FROM kontakty WHERE submission_id=?').bind(id).first();
  return result;
}

/** Jawny fakt + optymistyczna kontrola wersji. Dodatkowe zapisy muszą użyć eventGuard. */
export async function eventBatch(db, current, kind, actor, data, extra = () => [], now = new Date().toISOString()) {
  actor = text(actor, 120, 'actor', true);
  const operationId = crypto.randomUUID();
  const lastSeq = current.events.at(-1)?.seq ?? 0;
  const eventData = JSON.stringify({ ...data, operationId });
  const guard = `EXISTS (SELECT 1 FROM zdarzenia WHERE submission_id=? AND json_extract(data,'$.operationId')=?)`;
  const params = [current.id, operationId];
  const insert = db.prepare(`INSERT INTO zdarzenia(submission_id,kind,actor,at,data)
    SELECT ?,?,?,?,? WHERE (SELECT COALESCE(MAX(seq),0) FROM zdarzenia WHERE submission_id=?)=?`)
    .bind(current.id, kind, actor, now, eventData, current.id, lastSeq);
  const results = await db.batch([insert, ...extra({ guard, params, now, actor })]);
  if (results[0].meta.changes !== 1) fail('stale-submission');
  return { kind, at: now, operationId };
}

export async function list(db, limit = 50) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) fail('invalid-limit');
  return (await db.prepare(`SELECT id,received_at,expires_at,publication_requested,
    (SELECT kind FROM zdarzenia WHERE submission_id=zgloszenia.id ORDER BY seq DESC LIMIT 1) AS last_event
    FROM zgloszenia ORDER BY received_at DESC,id LIMIT ?`).bind(limit).all()).results;
}
