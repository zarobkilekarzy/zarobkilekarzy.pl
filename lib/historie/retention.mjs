import { classification, fail, text, UUID } from './contract.mjs';

/** Porcje są ograniczone również dla Cron Free; kolejny przebieg kontynuuje zaległości. */
export async function purge(db, { moderation = false, now = new Date().toISOString(), limit = 20 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) fail('invalid-limit');
  const rows = (await db.prepare('SELECT id FROM zgloszenia WHERE expires_at<=? ORDER BY expires_at,id LIMIT ?').bind(now, limit).all()).results;
  const statements = [];
  let deletionIndex;
  if (rows.length) {
    // Stała liczba zapytań, wartości w params; FK usuwa kontakty, zdarzenia i cechy robocze.
    const placeholders = rows.map(() => '?').join(',');
    const ids = rows.map((row) => row.id);
    if (moderation) {
      statements.push(db.prepare(`DELETE FROM zdarzenia_publikacji WHERE slug IN
        (SELECT slug FROM zgody_publikacji WHERE submission_id IN (${placeholders})
        AND slug NOT IN (SELECT slug FROM publikacje))`).bind(...ids));
      statements.push(db.prepare(`DELETE FROM kandydaci_publikacji WHERE slug IN
        (SELECT slug FROM zgody_publikacji WHERE submission_id IN (${placeholders}))`).bind(...ids));
      statements.push(db.prepare(`DELETE FROM zgody_publikacji WHERE submission_id IN (${placeholders})
        AND slug NOT IN (SELECT slug FROM publikacje)`).bind(...ids));
      statements.push(db.prepare(`UPDATE zgody_publikacji SET submission_id=NULL WHERE submission_id IN (${placeholders})`).bind(...ids));
    }
    statements.push(db.prepare(`INSERT INTO usuniecia(id,at,reason)
      SELECT id,?,? FROM zgloszenia WHERE id IN (${placeholders}) ON CONFLICT(id) DO NOTHING`).bind(now, 'retention', ...ids));
    deletionIndex = statements.length;
    statements.push(db.prepare(`DELETE FROM zgloszenia WHERE id IN (${placeholders}) RETURNING id`).bind(...ids));
  }
  // Dowód usunięcia potrzebny tylko przez maksymalne 30 dni Time Travel + margines doby.
  statements.push(db.prepare('DELETE FROM usuniecia WHERE at<?').bind(new Date(Date.parse(now) - 31 * 86400000).toISOString()));
  if (moderation) statements.push(db.prepare("DELETE FROM zdarzenia_publikacji WHERE kind IN ('withdrawn','removed') AND at<?")
    .bind(new Date(Date.parse(now) - 31 * 86400000).toISOString()));
  const results = await db.batch(statements);
  const remaining = await db.prepare('SELECT COUNT(*) AS count FROM zgloszenia WHERE expires_at<=?').bind(now).first();
  return { deleted: deletionIndex === undefined ? 0 : results[deletionIndex].results.length, remaining: remaining.count };
}

/** Żądanie usunięcia obejmuje także publikację i kandydatów; bez cichego zachowania kopii. */
export async function remove(db, id, { moderation = false, now = new Date().toISOString() } = {}) {
  if (!UUID.test(id ?? '')) fail('invalid-id');
  const statements = [];
  if (moderation) {
    statements.push(db.prepare('DELETE FROM zdarzenia_publikacji WHERE slug IN (SELECT slug FROM zgody_publikacji WHERE submission_id=?)').bind(id));
    statements.push(db.prepare(`INSERT INTO zdarzenia_publikacji(slug,kind,actor,at,data)
      SELECT slug,'removed','request',?,'{}' FROM zgody_publikacji WHERE submission_id=?`).bind(now, id));
    statements.push(db.prepare('DELETE FROM publikacje WHERE slug IN (SELECT slug FROM zgody_publikacji WHERE submission_id=?)').bind(id));
    statements.push(db.prepare('DELETE FROM kandydaci_publikacji WHERE slug IN (SELECT slug FROM zgody_publikacji WHERE submission_id=?)').bind(id));
    statements.push(db.prepare('DELETE FROM zgody_publikacji WHERE submission_id=?').bind(id));
    // Zmiana identyfikatora zatrzymuje build pobierający poprzednie wydanie.
    statements.push(db.prepare('UPDATE publikacje SET release_id=?').bind(crypto.randomUUID()));
  }
  statements.push(db.prepare('INSERT INTO usuniecia(id,at,reason) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING').bind(id, now, 'request'));
  statements.push(db.prepare('DELETE FROM zgloszenia WHERE id=? RETURNING id').bind(id));
  const result = await db.batch(statements);
  return { deleted: result.at(-1).results.length, deploymentCleanupRequired: moderation };
}

/** Podgląd łączy tylko policzone cechy z obu baz. Nie przenosi identyfikatorów ani tekstów. */
export async function analysisPreview(databases) {
  const cells = new Map();
  for (const db of databases) {
    const rows = (await db.prepare(`SELECT category,region,year,facility_type,COUNT(*) AS count
      FROM analiza_robocza GROUP BY category,region,year,facility_type`).all()).results;
    for (const row of rows) {
      const features = classification({ category: row.category, region: row.region, year: row.year, facilityType: row.facility_type });
      const key = JSON.stringify(features);
      cells.set(key, { ...features, count: (cells.get(key)?.count ?? 0) + row.count });
    }
  }
  return [...cells.values()].filter((cell) => cell.count >= 5).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

/** Jawnie zatwierdzony snapshot. Próg 5 jest osłoną techniczną, nie dowodem anonimizacji. */
export async function approveAnalysis(db, snapshotId, actor, cells, riskReviewed, now = new Date().toISOString()) {
  if (!UUID.test(snapshotId ?? '') || riskReviewed !== true) fail('anonymisation-review-required');
  actor = text(actor, 120, 'actor', true);
  if (!Array.isArray(cells) || !cells.length || cells.length > 40) fail('invalid-analysis-cells');
  const unique = new Set();
  const statements = cells.map((cell) => {
    const { count, ...features } = cell;
    const value = classification(features);
    const key = JSON.stringify(value);
    if (!Number.isSafeInteger(count) || count < 5 || unique.has(key)) fail('unsafe-analysis-cell');
    unique.add(key);
    return db.prepare(`INSERT INTO analiza(snapshot_id,category,region,year,facility_type,count,approved_at,actor)
      VALUES (?,?,?,?,?,?,?,?)`).bind(snapshotId, value.category, value.region, value.year, value.facilityType, count, now, actor);
  });
  if (await db.prepare('SELECT 1 AS present FROM analiza WHERE snapshot_id=? LIMIT 1').bind(snapshotId).first()) fail('analysis-snapshot-exists');
  await db.batch(statements);
  return { snapshotId, cells: cells.length };
}
