# Kontrakt danych: monitoring „Ile zarabiają lekarze?”

Plik **`src/data/monitoring-watchdog.json`** zasila przeglądarkę `/dane/monitoring-watchdog/`. Generuje go skrypt spoza serwisu. Serwis tylko go czyta.

- **Walidacja.** Każdy build sprawdza plik schematem z `src/lib/monitoring/index.ts` (zod). Brakujące pole, literówka w kodzie województwa albo histogram, który nie sumuje się do liczby lekarzy, zatrzymują build. Komunikat wskazuje ścieżkę, np. `facilities[412].payroll.histogram`.
- **Co jeszcze się aktualizuje.** Po podmianie pliku nic więcej nie trzeba zmieniać. Strona, publiczny plik `/dane/monitoring-watchdog/monitoring-watchdog.json` i obrazek OG liczą wszystko z danych.
- **Formatowanie pliku** (wcięcia, kolejność kluczy) nie ma znaczenia. Nieznane pola są pomijane.

## Poziom główny

| Pole | Typ | Opis |
|---|---|---|
| `version` | `1` | Wersja kontraktu. Przy zmianie niezgodnej wstecz podbijamy ją razem ze schematem. |
| `updated` | `"RRRR-MM-DD"` | Stan danych, pokazywany na stronie jako „Stan danych”. |
| `year` | liczba | Rok, którego dotyczą wynagrodzenia (np. `2025`). |
| `source` | obiekt | `name`, `monitoring` (tytuł), `url` (strona monitoringu). |
| `population` | obiekt | `source` (np. „GUS, Bank Danych Lokalnych”) i `asOf` (`"RRRR-MM-DD"`). |
| `buckets` | liczby | Granice przedziałów histogramu w zł, rosnąco. *n* granic daje *n + 1* przedziałów. Obecnie `[100000, 200000, 300000, 500000, 750000, 1000000]`, czyli 7 przedziałów od „do 100 tys.” do „ponad 1 mln”. Podpisy strona tworzy sama. |
| `facilities` | tablica | Placówki, opis niżej. Kolejność dowolna. |

## Placówka (`facilities[]`)

| Pole | Typ | Opis |
|---|---|---|
| `id` | liczba całkowita > 0 | Numer sprawy w fedrowaniu. Musi być unikalny, bo jest kluczem wiersza. |
| `name` | tekst | Nazwa rejestrowa, jak we wniosku. |
| `displayName` | tekst, *opcjonalnie* | Nazwa do wyświetlania. Bez niej strona porządkuje nazwę rejestrową sama: zamienia wersaliki, skraca formę prawną do „sp. z o.o.” czy „SP ZOZ”, wstawia polskie cudzysłowy. Pełna nazwa zostaje w dymku i w szczegółach. |
| `city` | tekst | Miejscowość siedziby. |
| `voivodeship` | kod | Małymi literami, z polskimi znakami: `dolnośląskie`, `kujawsko-pomorskie`, `lubelskie`, `lubuskie`, `łódzkie`, `małopolskie`, `mazowieckie`, `opolskie`, `podkarpackie`, `podlaskie`, `pomorskie`, `śląskie`, `świętokrzyskie`, `warmińsko-mazurskie`, `wielkopolskie`, `zachodniopomorskie`. |
| `population` | liczba albo `null` | Ludność miejscowości z GUS. |
| `populationScope` | `"city"` / `"commune"` | Liczba dotyczy miasta albo całej gminy (dla gmin wiejskich). |
| `network` | kod albo `null` | Poziom w sieci szpitali (PSZ), zob. tabela kodów. `null` oznacza brak znacznika: placówki nie dopasowano do wykazu albo dopasowanie było niepewne. |
| `response` | kod | Kategoria odpowiedzi, zob. tabela kodów. Placówka z `payroll` powinna mieć `disclosed`. |
| `url` | adres | Sprawa w fedrowaniu. |
| `payroll` | obiekt albo `null` | Pełna roczna lista płac. `null` oznacza brak listy: odmowę, ciszę albo dane nieporównywalne. |

### Lista płac (`payroll`)

Wypełniana tylko dla pełnych rocznych list brutto w podziale na lekarzy. Obecne kryterium to co najmniej 10 pozycji i mediana od 60 tys. zł. Opis kryterium jest też w tekście strony, w sekcji „Jak czytać”, więc zmiana kryterium w skrypcie wymaga poprawki tego tekstu.

| Pole | Typ | Opis |
|---|---|---|
| `doctors` | liczba całkowita > 0 | Liczba pozycji na liście. |
| `total` | zł | Suma kwot, czyli fundusz płac. |
| `median`, `p25`, `p75` | zł | Mediana i kwartyle. |
| `max` | zł | Najwyższa kwota. |
| `over500k`, `over1m` | liczby całkowite | Liczba osób z kwotą powyżej 500 tys. zł i powyżej 1 mln zł. |
| `top10Share` | 0–1 | Udział 10 najwyższych kwot w `total`, jako ułamek (`0.07`, nie `7`). |
| `histogram` | liczby całkowite | Liczebności przedziałów z `buckets`. Długość musi wynosić `buckets.length + 1`. |

Build odrzuci plik, w którym nie zachodzi któryś z warunków: `p25 ≤ median ≤ p75 ≤ max`, `over1m ≤ over500k ≤ doctors` albo suma `histogram` równa `doctors`.

## Kody

**`response`** (kategorie platformy fedrowanie)

| Kod | Fedrowanie | Na stronie |
|---|---|---|
| `disclosed` | A | ujawniła dane |
| `refused` | B | odmówiła |
| `other` | C | inna odpowiedź |
| `receipt` | receipt | tylko potwierdzenie |
| `silence` | none | cisza |
| `forwarded` | E | przekazana dalej (inna instytucja) |
| `unknown` | G | nieustalona |

**`network`** (sieć szpitali PSZ)

| Kod | Znaczenie |
|---|---|
| `I`, `II`, `III` | szpital I, II, III stopnia |
| `national` | szpital ogólnopolski |
| `oncology`, `pulmonology`, `oncology-pulmonology`, `pediatric` | szpitale onkologiczne, pulmonologiczne, pediatryczne |
| `unspecified` | w sieci, poziom nieustalony |

## Przykład

```json
{
  "version": 1,
  "updated": "2026-10-12",
  "year": 2025,
  "source": { "name": "Sieć Obywatelska Watchdog Polska", "monitoring": "Ile zarabiają lekarze?", "url": "https://fedrowanie.siecobywatelska.pl/monitoringi/ile-zarabiaja-lekarze" },
  "population": { "source": "GUS, Bank Danych Lokalnych", "asOf": "2025-12-31" },
  "buckets": [100000, 200000, 300000, 500000, 750000, 1000000],
  "facilities": [
    {
      "id": 362,
      "name": "REGIONALNY SZPITAL SPECJALISTYCZNY IM. DR. WŁADYSŁAWA BIEGAŃSKIEGO",
      "city": "Grudziądz",
      "voivodeship": "kujawsko-pomorskie",
      "population": 86811,
      "populationScope": "city",
      "network": null,
      "response": "disclosed",
      "url": "https://fedrowanie.siecobywatelska.pl/sprawy/ile-zarabiaja-lekarze-362",
      "payroll": {
        "doctors": 547, "total": 166851557, "median": 219503, "p25": 105000, "p75": 463000,
        "max": 1324531, "over500k": 120, "over1m": 11, "top10Share": 0.07,
        "histogram": [130, 119, 97, 81, 73, 36, 11]
      }
    },
    {
      "id": 1, "name": "\"ALEKSANDER IV\" Spółka z ograniczoną odpowiedzialnością spółka komandytowa",
      "city": "Warszawa", "voivodeship": "mazowieckie", "population": 1866729, "populationScope": "city",
      "network": null, "response": "receipt",
      "url": "https://fedrowanie.siecobywatelska.pl/sprawy/ile-zarabiaja-lekarze-1", "payroll": null
    }
  ]
}
```

## Obecny plik

Obecny plik (stan na 12.10.2026) odtworzono z poprzedniej wersji strony, a nie wygenerowano skryptem. Dlatego:

- `p25` i `p75` są zaokrąglone do tysięcy, bo stara strona pokazywała je tylko w przybliżeniu. Skrypt powinien podawać wartości dokładne.
- `top10Share` ma dokładność do 1 punktu procentowego.
