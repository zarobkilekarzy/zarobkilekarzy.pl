# Prototypy mObywatela — warianty na froncie z mobywatel.ai

Klikalne prototypy na konkurs mObywatel Challenge. Każdy wariant to statyczna aplikacja pod
`/mobywatel/<wariant>/` (bez serwera): składa ją `zloz.mjs`, a do buildu strony wpina integracja
`../integracja.ts`. Strona konkursu: `/mobywatel/` (`src/pages/mobywatel/index.astro`, treść w `../data.ts`).

## Pochodzenie i licencja bazy

`baza/` to front prototypu z paczki `mobywatel-ai.zip` ze strony konkursu (https://mobywatel.ai/pobierz/,
pobrana 23.10.2026), bez zmian; `baza-i18n/` to słowniki interfejsu z tej samej paczki (`serwer/i18n/`).
Według strony konkursu kod prototypu jest na **licencji MIT** „poza godłem, oznaczeniami mObywatela i zdjęciami
osób z pokazu”. Nota praw autorskich i tekst licencji: `baza/LICENSE` — trafia też do każdego złożonego wariantu
(`/mobywatel/<wariant>/LICENSE`), bo MIT wymaga jej przy każdej kopii. Prawa autorskie do `baza/` i `baza-i18n/`
mają autorzy prototypu mObywatel.ai, nie zarobkilekarzy.pl. Nasze (MIT repozytorium): `wspolne/`, `warianty/`,
`narzedzia/`, `zloz.mjs`.

## Układ

- `baza/`, `baza-i18n/` — nie edytować. Przy nowej wersji paczki podmienia się całe katalogi; `zloz.mjs`
  zatrzyma build, jeśli zmieni się to, co łata (wczytanie słownika, `<meta charset>`, `<body>`).
- `wspolne/` — warstwa wszystkich wariantów: `bez-serwera.js` (zapytania bazy do `/api/…` kończą się błędem
  sieci przed wyjściem z przeglądarki — baza zostaje w trybie skryptowym), `challenge.js`/`.css` (napis
  „mObywatel Challenge”, na komputerze telefon w skali okna i panel z opisem z `opis.json`, wybór języka).
- `warianty/<wariant>/` — jedna wersja do zgłoszenia, tylko różnice wobec bazy:
  - `opis.json` — tytuł, opis, funkcje, instrukcja (panel w prototypie i strona konkursu),
  - `wariant-dane.js` — przed `core.js` (po osobach z `osoby.js`): dokumenty, sprawy, dane,
  - `wariant.js`, `wariant.css` — po plikach bazy: ekrany, zachowanie, wygląd,
  - `i18n/<język>.json` — tłumaczenia tekstów wariantu (dokładane do słownika bazy),
  - plik o nazwie jak w bazie podmienia go; nowe pliki (grafiki, dane) po prostu dochodzą.
- `narzedzia/` — `sor-mapa.mjs` (mapa SOR z builda strony), `klucze-i18n.mjs` (klucze do tłumaczenia),
  `og.mjs` (obrazek OG ze zrzutem telefonu; instrukcja w pliku).

## Obrazek OG

`narzedzia/og.mjs <wariant>` robi `src/assets/mobywatel/og-<wariant>.png` z pola `og` w `opis.json` (tytuł,
lead, ekran do zrzutu). Wpis w `src/data/og.ts` wystawia go pod `/og/mobywatel/<wariant>.png`, a `zloz.mjs`
dopisuje wariantowi tagi `og:*`, gdy plik istnieje. Strona konkursu `/mobywatel/` ma ten sam obrazek.

## Nowy wariant

Katalog w `warianty/` z `opis.json` + wpis w `prototypes` w `../data.ts`. Nazwa wariantu nie może być
nazwą strony Astro pod `/mobywatel/` (np. `baza`).

## Tłumaczenia

Mechanizm bazy tłumaczy węzły tekstu słownikiem polski → język, w którym liczby są zamienione na `{0}`, `{1}`…
Nazwy własne (lekarze, miasta, szpitale) idą w `<span data-t="0">`, żeby reszta zdania była jednym kluczem.
Po zmianie tekstów: `narzedzia/klucze-i18n.mjs` (instrukcja w pliku) → przetłumaczyć nowe klucze →
dopisać do `warianty/<wariant>/i18n/<język>.json`. Brakujące teksty zostają po polsku. Język: `?lang=en` itd.

## Podgląd

`npm run dev` (warianty pod `/mobywatel/<wariant>/`) albo `npm run build` + konfiguracja `mobywatel-cf-preview`
(nagłówki jak na produkcji). Mapa SOR po zmianie listy SOR na stronie:
`node --experimental-strip-types src/mobywatel/prototypy/narzedzia/sor-mapa.mjs` (po `npm run build`).
