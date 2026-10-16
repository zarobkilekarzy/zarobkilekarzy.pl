/**
 * Analiza /analizy/poz-pieniadz-za-pacjenta/: stawka kapitacyjna lekarza POZ i współczynniki wieku.
 * Tekst i źródła są w content/articles/poz-pieniadz-za-pacjenta.mdx — tu tylko liczby do wykresów.
 *
 * Nowa stawka (zarządzenie Prezesa NFZ): dopisz rok na końcu RATE_HISTORY. Kwoty dla grup wieku
 * i wyliczenie dla pełnej listy przeliczą się same; liczby w treści artykułu trzeba poprawić ręcznie.
 */

/**
 * Roczna stawka bazowa za pacjenta (współczynnik 1,0): ostatnia stawka obowiązująca w danym roku.
 * Gdy stawka zmienia się w trakcie roku (2018–2020, a od 2022 co roku od 1 lipca), rok ma stawkę z drugiego
 * półrocza (albo ostatnią ze zmian), a wcześniejsze podaje `note`. Numery zarządzeń: przypis [^stawki] w artykule.
 */
export const RATE_HISTORY = [
  { year: 2018, rate: 154.2, note: 'od XI 2018' },
  { year: 2019, rate: 162.6, note: 'rosła 156,60 → 159,00 → 162,60 zł' },
  { year: 2020, rate: 171.0, note: 'od IX 2020' },
  { year: 2021, rate: 171.0 },
  { year: 2022, rate: 191.88, note: 'od VII 2022 (I–III: 171,00 zł; od IV: 178,80 zł, zarządzenie 38/2022)' },
  { year: 2023, rate: 204.36, note: 'od VII 2023 — zarządzenie 99/2023 (I–VI: 191,88 zł)' },
  { year: 2024, rate: 215.28, note: 'od VII 2024 — zarządzenie 61/2024 (I–VI: 204,36 zł)' },
  { year: 2025, rate: 226.08, note: 'od VII 2025 — zarządzenie 47/2025 (I–VI: 215,28 zł, zarządzenia 22/2025 i 34/2025)' },
  { year: 2026, rate: 232.56, note: 'od VII 2026 — zarządzenie 65/2026 (I–VI: 226,08 zł, zarządzenie 8/2026)' },
] as const;

export const RATE = RATE_HISTORY.at(-1)!;

/** Współczynniki wieku lekarza POZ — zarządzenie 22/2025/DSOZ, § 23 ust. 2. */
export const AGE_WEIGHTS = [
  { group: 'do 2. roku życia', weight: 4.0 },
  { group: '3–6 lat', weight: 2.8 },
  { group: '7–19 lat', weight: 1.3 },
  { group: '20–39 lat', weight: 1.0 },
  { group: '40–65 lat', weight: 1.34 },
  { group: '66–75 lat', weight: 2.7 },
  { group: 'powyżej 75 lat', weight: 3.4 },
  { group: 'podopieczny DPS', weight: 3.1 },
] as const;

/** Model pełnej listy: limit pacjentów na lekarza i szacowany średni współczynnik wieku listy. */
export const LIST = { patients: 2500, avgWeight: 1.6 } as const;
