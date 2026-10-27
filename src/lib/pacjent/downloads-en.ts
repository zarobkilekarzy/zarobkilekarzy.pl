/**
 * Angielskie PDF-y do pobrania (/en/patient-rights/*.pdf): adres, nazwa pliku i rozmiar — jak downloads.ts,
 * z tym samym generatorem (pdf.ts), treścią z src/data/en/prawa-pacjenta.ts i angielskimi napisami (pdfText).
 * Osobny moduł, bo dane EN mają strażniki — importują go tylko strony i endpointy /en/.
 */
import { card, emergency, helpline, page, pdfText } from '@/data/en/prawa-pacjenta';
import { formatEN } from '@/lib/format';
import { renderCard, renderLargePrint } from './pdf';

const phones = { helpline, emergency };

export const PDF_FILES_EN = {
  card: {
    href: '/en/patient-rights/card.pdf',
    download: 'patient-rights-poland-card.pdf',
    render: () => renderCard(card, phones, page.checked, pdfText),
  },
  large: {
    href: '/en/patient-rights/large-print.pdf',
    download: 'patient-rights-poland-large-print.pdf',
    render: () => renderLargePrint(card, phones, page.checked, pdfText),
  },
};

export type PdfIdEn = keyof typeof PDF_FILES_EN;

// W buildzie liczymy raz; w dev za każdym razem, żeby zmiana treści była od razu widoczna
const cache = new Map<PdfIdEn, Promise<Uint8Array>>();
export const getPdfEn = (id: PdfIdEn) => {
  if (!import.meta.env.PROD) return PDF_FILES_EN[id].render();
  if (!cache.has(id)) cache.set(id, PDF_FILES_EN[id].render());
  return cache.get(id)!;
};

/** „PDF · 49 kB” — do podpisu przycisku. */
export const pdfMetaEn = async (id: PdfIdEn) => `PDF · ${formatEN(Math.ceil((await getPdfEn(id)).byteLength / 1024))} kB`;
