// Typy danych dla komponentu OsCzasu.astro (oś czasu z dymkami).
export type RodzajZdarzenia = 'rzad' | 'lekarze' | 'porozumienie' | 'sad';
export interface Zdarzenie {
  /** 'RRRR-MM-DD' albo 'RRRR-MM' (dzień nieznany) albo 'RRRR'. */
  data: string;
  /** Tekst daty pokazywany zamiast wyliczonego (np. „20–23.04.2026”). */
  dataTekst?: string;
  tytul: string;
  /** HTML (może zawierać <strong>). */
  opis: string;
  rodzaj: RodzajZdarzenia;
  zrodlo?: { nazwa: string; url: string };
}
