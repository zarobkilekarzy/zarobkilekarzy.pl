// Wersja generowanych grafik (karty OG, karty petycji) do adresu `?v=…`.
//
// Grafiki mają STAŁE ścieżki (/og/home.png, /petycja/udostepnij/zero.png), a X,
// Facebook czy Wykop zapamiętują obrazek po adresie — po zmianie wyglądu kart
// pokazywałyby stary podgląd jeszcze tygodniami. Serwer deweloperski dodatkowo
// wysyła je z `immutable`, więc przeglądarka trzymała starą wersję na stronie,
// choć przycisk „Pobierz” dawał już nową. Ten sam wzór co dane /egzamin
// (`?v=<hash treści>`): hash plików, z których karty powstają — zmiana wyglądu,
// fontów, logo czy danych na karcie = nowy adres; bez zmian = adres stały.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const ZRODLA = [
  'src/lib/ogCard.ts',
  'src/lib/ogCardEgzamin.ts',
  'src/lib/ogCardGra.ts',
  'src/lib/ogPages.ts',
  'src/pages/og/[...route].png.ts',
  'src/pages/petycja/udostepnij/[karta].png.ts',
  'src/assets/fonts/archivo-latin-full-400.woff',
  'src/assets/fonts/archivo-latin-full-600.woff',
  'src/assets/fonts/archivo-wide-latin-full-800.woff',
  'src/assets/fonts/ibm-plex-mono-latin-full-500.woff',
  'public/favicon.svg',
  'src/data/egzamin-lek/index.json',
];

const h = createHash('sha1');
for (const p of ZRODLA) h.update(readFileSync(p));
export const wersjaGrafik = h.digest('hex').slice(0, 10);

/** Adres grafiki z wersją, np. `/og/home.png?v=1a2b3c4d5e`. */
export const zWersja = (sciezka: string) => `${sciezka}?v=${wersjaGrafik}`;
