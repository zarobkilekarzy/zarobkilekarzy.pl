-- Zastosować osobno w każdej bazie. Bez surowych kontaktów w JSON zgłoszenia.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS usuniecia (
  id TEXT PRIMARY KEY, at TEXT NOT NULL, reason TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS zgloszenia (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  received_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  publication_requested INTEGER NOT NULL CHECK (publication_requested IN (0, 1)),
  consent_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS zgloszenia_retencja ON zgloszenia(expires_at);
CREATE TABLE IF NOT EXISTS kontakty (
  submission_id TEXT PRIMARY KEY REFERENCES zgloszenia(id) ON DELETE CASCADE,
  email TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS zdarzenia (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL REFERENCES zgloszenia(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  actor TEXT NOT NULL,
  at TEXT NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data))
);
CREATE INDEX IF NOT EXISTS zdarzenia_historia ON zdarzenia(submission_id, seq);
CREATE TABLE IF NOT EXISTS analiza_robocza (
  submission_id TEXT PRIMARY KEY REFERENCES zgloszenia(id) ON DELETE CASCADE,
  category TEXT NOT NULL, region TEXT NOT NULL, year INTEGER, facility_type TEXT NOT NULL
);
