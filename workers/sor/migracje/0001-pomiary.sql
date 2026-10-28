-- Migracja D1 `zarobki-sor`: pomiary z tabeli `archiwum` (WITHOUT ROWID, klucz ISO UTC, ok. 4,1 KB
-- na wiersz) do tabeli `pomiary` (zwykła, klucz INTEGER = sekundy unix, ok. 1,34 KB na wiersz).
-- BLOB-y kopiujemy bajt w bajt — ich treść (JSON partii z polem `uruchomienie` w ISO UTC) się nie zmienia.
--
-- To NIE jest migracja `wrangler d1 migrations` — nic tu nie uruchamia się samo. Kolejność:
--   1. Wdrożyć Workera, który pisze do `pomiary`:  npx wrangler deploy -c workers/sor/wrangler.jsonc
--      Od tej chwili `archiwum` się nie zmienia, więc wystarczy jedna kopia.
--   2. Odczekać pierwszy cron (najwyżej 2 minuty) i uruchomić kroki 0–3 po kolei, każdy osobno:
--        npx wrangler d1 execute zarobki-sor --remote --command "<zapytanie z kroku>"
--      Krok 3 (DROP) dopiero wtedy, gdy krok 2 zwrócił 0.
--
-- Koszt przy ok. 11 tys. wierszy (stan z początku listopada 2026):
--   krok 1: ok. 11 tys. zapisów (11% dziennego limitu zapisów konta) i 11–22 tys. odczytów;
--   krok 2: 11–22 tys. odczytów (skan `archiwum` + odczyt po kluczu z `pomiary`);
--   kroki 0 i 3: pomijalne.
-- Kopia na chwilę powiększa plik bazy (ok. 1,34 KB na wiersz, przy 11 tys. ok. 15 MB). Po DROP plik
-- nie maleje, ale zwolnione strony (ok. 4,1 KB na wiersz, przy 11 tys. ok. 45 MB) zapełnią nowe pomiary
-- (ok. 1 MB na dobę) w ok. półtora miesiąca.
--
-- Testy wykonują każdy blok na prawdziwym SQLite: workers/sor/test/sor.test.js („migracja: …”).
-- Blok = linia „-- Krok N:” albo „-- Wycofanie:”, komentarze i jedno zapytanie zakończone średnikiem.

-- Krok 0: nowy Worker już pisze — `nowe` > 0, `od` ≈ czas wdrożenia.
SELECT COUNT(*) AS nowe, strftime('%Y-%m-%dT%H:%M:%SZ', MIN(uruchomienie), 'unixepoch') AS od FROM pomiary;

-- Krok 1: kopia. Klucz ISO UTC → sekundy unix (strftime('%s') daje to samo co Date.parse / 1000).
-- Warunek IS NOT NULL chroni przed kluczem, którego SQLite nie rozpozna: NULL w INTEGER PRIMARY KEY
-- dostałby nowy, zmyślony numer wiersza. OR IGNORE: powtórzenie kroku niczego nie psuje.
INSERT OR IGNORE INTO pomiary (uruchomienie, partia, gz)
  SELECT CAST(strftime('%s', uruchomienie) AS INTEGER), partia, gz FROM archiwum
  WHERE strftime('%s', uruchomienie) IS NOT NULL;

-- Krok 2: kontrola — `brakuje` musi być 0. Liczy wiersze `archiwum` bez identycznej kopii w `pomiary`
-- (ten sam czas, partia i bajty BLOB-a), w tym te z kluczem, którego krok 1 nie rozpoznał.
SELECT COUNT(*) AS brakuje FROM archiwum AS a
  LEFT JOIN pomiary AS p ON p.uruchomienie = CAST(strftime('%s', a.uruchomienie) AS INTEGER)
  WHERE p.uruchomienie IS NULL OR p.partia <> a.partia OR p.gz <> a.gz;

-- Krok 3: dopiero po zerze w kroku 2. Od tej chwili pomiary są tylko w `pomiary`.
DROP TABLE archiwum;

-- Wycofanie: zamiast kroku 3, gdy coś poszło nie tak. Najpierw poprzednia wersja Workera
-- (npx wrangler rollback -c workers/sor/wrangler.jsonc), potem dopisać do `archiwum` pomiary, które
-- trafiły tylko do `pomiary`. `archiwum` do kroku 3 jest nietknięte.
INSERT OR IGNORE INTO archiwum (uruchomienie, partia, gz)
  SELECT strftime('%Y-%m-%dT%H:%M:%SZ', uruchomienie, 'unixepoch'), partia, gz FROM pomiary;
