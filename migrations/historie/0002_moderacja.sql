-- Tylko baza moderacji. Kandydaci i publikacje zawierają wyłącznie projekcję publiczną.
CREATE TABLE IF NOT EXISTS kandydaci_publikacji (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL, body TEXT NOT NULL,
  cytat TEXT CHECK (cytat IS NULL OR length(cytat) <= 600),
  source TEXT CHECK (source IS NULL OR json_valid(source)),
  verified_pwz TEXT NOT NULL CHECK (json_valid(verified_pwz)),
  date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS publikacje (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL, body TEXT NOT NULL,
  cytat TEXT CHECK (cytat IS NULL OR length(cytat) <= 600),
  source TEXT CHECK (source IS NULL OR json_valid(source)),
  verified_pwz TEXT NOT NULL CHECK (json_valid(verified_pwz)),
  date TEXT NOT NULL,
  release_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS zgody_publikacji (
  slug TEXT PRIMARY KEY,
  submission_id TEXT UNIQUE,
  consent_version TEXT NOT NULL, consent_at TEXT NOT NULL,
  approval_at TEXT NOT NULL, actor TEXT NOT NULL,
  blocked INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0, 1))
);
CREATE TABLE IF NOT EXISTS wydania (
  id TEXT PRIMARY KEY, at TEXT NOT NULL,
  count INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS analiza (
  snapshot_id TEXT NOT NULL,
  category TEXT NOT NULL, region TEXT NOT NULL, year INTEGER, facility_type TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 5),
  approved_at TEXT NOT NULL, actor TEXT NOT NULL
);
-- Dowód decyzji dotyczącej publicznego identyfikatora, bez prywatnych nazwisk i kontaktu.
CREATE TABLE IF NOT EXISTS zdarzenia_publikacji (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL, kind TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data))
);
CREATE UNIQUE INDEX IF NOT EXISTS analiza_snapshot_cell
  ON analiza(snapshot_id,category,region,COALESCE(year,-1),facility_type);
