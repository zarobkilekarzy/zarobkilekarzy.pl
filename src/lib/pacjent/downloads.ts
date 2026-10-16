/**
 * PDF-y do pobrania: adres, nazwa pliku i rozmiar. Endpointy (pages/prawa-pacjenta/*.pdf.ts)
 * i strony z przyciskami biorą je stąd, więc rozmiar przy przycisku to rozmiar prawdziwego pliku.
 */
import { card, emergency, helpline, page } from '@/data/prawa-pacjenta';
import { formatPL } from '@/lib/format';
import { renderCard, renderLargePrint } from './pdf';

const phones = { helpline, emergency };

export const PDF_FILES = {
  card: {
    href: '/prawa-pacjenta/karta.pdf',
    download: 'prawa-pacjenta-karta.pdf',
    render: () => renderCard(card, phones, page.checked),
  },
  large: {
    href: '/prawa-pacjenta/duzy-druk.pdf',
    download: 'prawa-pacjenta-duzy-druk.pdf',
    render: () => renderLargePrint(card, phones, page.checked),
  },
};

export type PdfId = keyof typeof PDF_FILES;

// W buildzie liczymy raz; w dev za każdym razem, żeby zmiana treści była od razu widoczna
const cache = new Map<PdfId, Promise<Uint8Array>>();
export const getPdf = (id: PdfId) => {
  if (!import.meta.env.PROD) return PDF_FILES[id].render();
  if (!cache.has(id)) cache.set(id, PDF_FILES[id].render());
  return cache.get(id)!;
};

/** „PDF · 49 kB” — do podpisu przycisku. */
export const pdfMeta = async (id: PdfId) => `PDF · ${formatPL(Math.ceil((await getPdf(id)).byteLength / 1024))} kB`;
