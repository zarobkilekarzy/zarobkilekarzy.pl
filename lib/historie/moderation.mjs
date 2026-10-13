import { fail, object, publication, validPwz, normalize, classification } from './contract.mjs';
import { record, eventBatch } from './store.mjs';

function eligible(current, now = new Date().toISOString()) {
  if (!current.publication_requested) fail('private-submission-not-publishable');
  if (current.expires_at <= now) fail('submission-expired');
  if (current.events.some((event) => ['deleted', 'withdrawn'].includes(event.kind))) fail('submission-withdrawn');
}
function publicSlug(current) {
  return current.events.find((event) => event.kind === 'draft')?.data.slug ?? `h-${crypto.randomUUID().replaceAll('-', '')}`;
}

/** Reprezentacje URL do kontroli prywatnych wartości, także w query z '+' i kodowaniem wielokrotnym. */
function sourceUrlText(value) {
  if (!value) return [];
  const candidates = [value, ...new URL(value).searchParams.values()];
  const variants = [];
  for (let candidate of candidates) {
    variants.push(candidate);
    let depth = 0;
    while (/%[0-9a-f]{2}/i.test(candidate)) {
      if (++depth > 4) fail('invalid-url', 'source.url');
      try { candidate = decodeURIComponent(candidate); }
      catch { fail('invalid-url', 'source.url'); }
      variants.push(candidate);
    }
  }
  return variants;
}

/** Mechaniczna osłona znanych identyfikatorów; nie zastępuje ręcznej oceny anonimizacji. */
async function excludePrivateData(db, current, value) {
  const contact = await db.prepare('SELECT email FROM kontakty WHERE submission_id=?').bind(current.id).first();
  const haystack = normalize([value.title, value.body, value.cytat ?? '', value.source?.description ?? '',
    ...sourceUrlText(value.source?.url)].join('\n')).toLocaleLowerCase('pl');
  const privateValues = [...current.payload.doctors.flatMap((doctor) => [doctor.name, doctor.pwz]),
    current.payload.city, current.payload.facility, contact?.email].filter(Boolean);
  if (privateValues.some((value) => haystack.includes(normalize(value).toLocaleLowerCase('pl')))) fail('private-data-in-draft');
}

/** Szkic ma osobną treść; nie kopiuje automatycznie surowej relacji ani excerpt. */
export async function draft(db, id, actor, input) {
  const current = await record(db, id); eligible(current);
  object(input, ['title', 'body', 'cytat', 'source']);
  const value = publication({ ...input, slug: publicSlug(current), verifiedPwz: [], date: new Date().toISOString() });
  await excludePrivateData(db, current, value);
  return eventBatch(db, current, 'draft', actor, { slug: value.slug, value });
}

/** Ręczne potwierdzenie zgodności z CRL. Nie stanowi weryfikacji faktów relacji. */
export async function verifyPwz(db, id, actor, pwz, confirmedMatch) {
  const current = await record(db, id); eligible(current);
  if (!validPwz(pwz)) fail('invalid-pwz-checksum');
  const matches = current.payload.doctors.filter((doctor) => doctor.pwz === pwz);
  if (matches.length !== 1) fail('ambiguous-or-missing-doctor');
  if (confirmedMatch !== true) fail('explicit-match-confirmation-required');
  return eventBatch(db, current, 'pwz-verified', actor, { pwz, name: matches[0].name });
}

/** Jawne zatwierdzenie numerów osobno od tekstu. Kandydat nie jest publikacją. */
export async function approve(db, id, actor, selectedPwz = []) {
  const current = await record(db, id); eligible(current);
  const lastDraft = current.events.findLast((event) => event.kind === 'draft');
  if (!lastDraft) fail('draft-required');
  if (!Array.isArray(selectedPwz) || selectedPwz.length > 20) fail('invalid-pwz-list');
  if (new Set(selectedPwz).size !== selectedPwz.length) fail('duplicate-pwz');
  for (const pwz of selectedPwz) {
    const doctors = current.payload.doctors.filter((doctor) => doctor.pwz === pwz);
    const verified = current.events.findLast((event) => event.kind === 'pwz-verified' && event.data.pwz === pwz);
    if (!validPwz(pwz) || doctors.length !== 1 || !verified || verified.data.name !== doctors[0].name) fail('unverified-pwz-not-publishable');
  }
  const value = publication({ ...lastDraft.data.value, verifiedPwz: selectedPwz });
  await excludePrivateData(db, current, value);
  return eventBatch(db, current, 'approved', actor, { draftSeq: lastDraft.seq, slug: value.slug, verifiedPwz: selectedPwz },
    ({ guard, params, now, actor }) => [
      db.prepare(`INSERT INTO kandydaci_publikacji(slug,title,body,cytat,source,verified_pwz,date)
        SELECT ?,?,?,?,?,?,? WHERE ${guard}
        ON CONFLICT(slug) DO UPDATE SET title=excluded.title,body=excluded.body,cytat=excluded.cytat,
        source=excluded.source,verified_pwz=excluded.verified_pwz,date=excluded.date`)
        .bind(value.slug, value.title, value.body, value.cytat ?? null, value.source ? JSON.stringify(value.source) : null,
          JSON.stringify(value.verifiedPwz), now, ...params),
      db.prepare(`INSERT INTO zgody_publikacji(slug,submission_id,consent_version,consent_at,approval_at,actor)
        SELECT ?,?,?,?,?,? WHERE ${guard}
        ON CONFLICT(slug) DO UPDATE SET approval_at=excluded.approval_at,actor=excluded.actor`)
        .bind(value.slug, id, current.consent_version, current.received_at, now, actor, ...params),
      db.prepare(`INSERT INTO zdarzenia_publikacji(slug,kind,actor,at,data)
        SELECT ?,'approved',?,?,? WHERE ${guard}`)
        .bind(value.slug, actor, now, JSON.stringify({ verifiedPwz: selectedPwz.map((pwz) => {
          const verification = current.events.findLast((event) => event.kind === 'pwz-verified' && event.data.pwz === pwz);
          return { pwz, actor: verification.actor, at: verification.at };
        }) }), ...params),
    ]);
}

export async function reject(db, id, actor) {
  const current = await record(db, id); eligible(current);
  const slug = current.events.find((event) => event.kind === 'draft')?.data.slug;
  // Odrzucenie zmienionego szkicu nie wycofuje wcześniejszej publikacji.
  return eventBatch(db, current, 'rejected', actor, {}, ({ guard, params }) => slug ? [
    db.prepare(`DELETE FROM kandydaci_publikacji WHERE slug=? AND ${guard}`).bind(slug, ...params),
  ] : []);
}

export async function classify(db, id, actor, input) {
  const current = await record(db, id);
  const value = classification(input);
  return eventBatch(db, current, 'classified', actor, value, ({ guard, params }) => [
    db.prepare(`INSERT INTO analiza_robocza(submission_id,category,region,year,facility_type)
      SELECT ?,?,?,?,? WHERE ${guard} ON CONFLICT(submission_id) DO UPDATE SET
      category=excluded.category,region=excluded.region,year=excluded.year,facility_type=excluded.facility_type`)
      .bind(id, value.category, value.region, value.year, value.facilityType, ...params),
  ]);
}
