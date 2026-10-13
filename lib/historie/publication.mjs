import { HistoryError, fail, publication, PUBLIC_FEED, SLUG, UUID, text } from './contract.mjs';

// Jeden jawny zestaw kolumn. Żaden odczyt publiczny nie dotyka tabel prywatnych.
const COLUMNS = 'slug,title,body,cytat,source,verified_pwz,date';
export function fromRow(row) {
  return publication({ slug: row.slug, title: row.title, body: row.body,
    ...(row.cytat ? { cytat: row.cytat } : {}), ...(row.source ? { source: JSON.parse(row.source) } : {}),
    verifiedPwz: JSON.parse(row.verified_pwz), date: row.date });
}
export async function previewPublic(db) {
  return (await db.prepare(`SELECT ${COLUMNS} FROM kandydaci_publikacji ORDER BY slug`).all()).results.map(fromRow);
}

/** Ręczne wydanie: atomowo aktualizuje projekcję. Powtórka nie wydaje ponownie. */
export async function release(db, id, now = new Date().toISOString()) {
  if (!UUID.test(id ?? '')) fail('invalid-release-id');
  const previous = await db.prepare('SELECT id,count FROM wydania WHERE id=?').bind(id).first();
  if (previous) return { releaseId: previous.count ? previous.id : null, count: previous.count };
  // Walidacja schematu magazynu przed operacją; wszyscy pisarze kandydatów używają tego samego kontraktu.
  await previewPublic(db);
  const result = await db.batch([
    db.prepare(`INSERT INTO publikacje(slug,title,body,cytat,source,verified_pwz,date,release_id)
      SELECT c.slug,c.title,c.body,c.cytat,c.source,c.verified_pwz,
        COALESCE((SELECT date FROM publikacje p WHERE p.slug=c.slug),?),?
      FROM kandydaci_publikacji c JOIN zgody_publikacji z ON z.slug=c.slug
      JOIN zgloszenia s ON s.id=z.submission_id
      WHERE z.blocked=0 AND s.expires_at>? AND NOT EXISTS (SELECT 1 FROM wydania WHERE id=?)
      ON CONFLICT(slug) DO UPDATE SET title=excluded.title,body=excluded.body,cytat=excluded.cytat,
        source=excluded.source,verified_pwz=excluded.verified_pwz,release_id=excluded.release_id`).bind(now, id, now, id),
    // Poprzednie publikacje zachowują się, gdy redakcja odrzuciła nowy szkic.
    db.prepare(`UPDATE publikacje SET release_id=? WHERE NOT EXISTS (SELECT 1 FROM wydania WHERE id=?)`).bind(id, id),
    db.prepare(`INSERT INTO wydania(id,at,count) SELECT ?,?,COUNT(*) FROM publikacje
      WHERE NOT EXISTS (SELECT 1 FROM wydania WHERE id=?) ON CONFLICT(id) DO NOTHING`).bind(id, now, id),
  ]);
  if (!result.every((item) => item.success)) throw new HistoryError(503, 'release-unconfirmed', '', true);
  const receipt = await db.prepare('SELECT id,count FROM wydania WHERE id=?').bind(id).first();
  if (!receipt) throw new HistoryError(503, 'release-unconfirmed', '', true);
  return { releaseId: receipt.count ? receipt.id : null, count: receipt.count };
}

/** Jedna transakcja odczytu gwarantuje zgodność metadanych i strony wydania. */
export async function publicPage(db, { cursor = '', releaseId = undefined } = {}) {
  if (cursor && !SLUG.test(cursor)) fail('invalid-cursor');
  if (releaseId !== undefined && releaseId !== null && !UUID.test(releaseId)) fail('invalid-release-id');
  const result = await db.batch([
    db.prepare('SELECT MIN(release_id) AS release_id,COUNT(DISTINCT release_id) AS versions FROM publikacje'),
    db.prepare(`SELECT ${COLUMNS} FROM publikacje WHERE slug>? ORDER BY slug LIMIT ?`).bind(cursor, PUBLIC_FEED.pageSize + 1),
  ]);
  const meta = result[0].results[0];
  if (meta.versions > 1 || (releaseId !== undefined && releaseId !== meta.release_id)) throw new HistoryError(503, 'release-changed', '', true);
  const rows = result[1].results;
  return { version: 1, releaseId: meta.release_id, items: rows.slice(0, PUBLIC_FEED.pageSize).map(fromRow),
    nextCursor: rows.length > PUBLIC_FEED.pageSize ? rows[PUBLIC_FEED.pageSize - 1].slug : null };
}

/** Wycofanie działa także po usunięciu surowego zgłoszenia. Publiczne kopie wymagają osobnej procedury. */
export async function withdraw(db, slug, actor, now = new Date().toISOString()) {
  if (!SLUG.test(slug ?? '')) fail('invalid-slug');
  actor = text(actor, 120, 'actor', true);
  const consent = await db.prepare('SELECT submission_id FROM zgody_publikacji WHERE slug=?').bind(slug).first();
  if (!consent) fail('publication-not-found');
  const newReleaseId = crypto.randomUUID();
  const statements = [
    db.prepare('DELETE FROM kandydaci_publikacji WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM publikacje WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM zdarzenia_publikacji WHERE slug=?').bind(slug),
    db.prepare('DELETE FROM zgody_publikacji WHERE slug=?').bind(slug),
    db.prepare('UPDATE publikacje SET release_id=?').bind(newReleaseId),
    db.prepare('INSERT INTO wydania(id,at,count) SELECT ?,?,COUNT(*) FROM publikacje').bind(newReleaseId, now),
    db.prepare("INSERT INTO zdarzenia_publikacji(slug,kind,actor,at,data) VALUES (?,'withdrawn',?,?,?)")
      .bind(slug, actor, now, '{}'),
  ];
  if (consent.submission_id) statements.push(db.prepare(`INSERT INTO zdarzenia(submission_id,kind,actor,at,data)
    SELECT id,'withdrawn',?, ?,? FROM zgloszenia WHERE id=?`)
    .bind(actor, now, JSON.stringify({ slug }), consent.submission_id));
  await db.batch(statements);
  return { slug, withdrawn: true, deploymentCleanupRequired: true };
}
