import type { ImageMetadata } from 'astro';

/**
 * Szerokości wariantów do srcset. Większe od oryginału Astro pomija samo,
 * więc dokładamy szerokość oryginału — największy wariant nie będzie mniejszy niż plik źródłowy.
 */
export const variantWidths = (src: ImageMetadata, widths: number[]) => [...new Set([...widths, src.width])];
