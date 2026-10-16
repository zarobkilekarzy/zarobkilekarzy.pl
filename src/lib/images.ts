import type { ImageMetadata } from 'astro';

/**
 * Kopia metadanych obrazka bez śledzenia. W buildzie importowany obrazek to Proxy: odczyt dowolnego
 * pola (src, width…) oznacza oryginał jako „użyty wprost” i Astro kopiuje go do dist/_astro obok
 * wersji zoptymalizowanych — kilka MB nieużywanych JPG. Pole `clone` Proxy (getter, nie metoda)
 * zwraca kopię bez tego znacznika; poza buildem obrazek jest zwykłym obiektem.
 * Używaj, gdy kod tylko czyta metadane, a obrazek trafia na stronę przez <Image>/<Picture>.
 */
export const raw = (img: ImageMetadata): ImageMetadata =>
  (img as ImageMetadata & { clone?: ImageMetadata }).clone ?? img;

/**
 * Szerokości wariantów do srcset. Większe od oryginału Astro pomija samo,
 * więc dokładamy szerokość oryginału — największy wariant nie będzie mniejszy niż plik źródłowy.
 */
export const variantWidths = (src: ImageMetadata, widths: number[]) => [...new Set([...widths, raw(src).width])];
