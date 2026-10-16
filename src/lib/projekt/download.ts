/**
 * PDF projektu ustawy do pobrania: bajty i liczba stron z prawdziwego pliku. Endpoint
 * (pages/projekt-nowelizacji/[name].pdf.ts) i strony z linkiem biorą je stąd, więc liczba stron
 * przy linku to liczba stron pliku — nie wpis w danych.
 */
import { projekt } from '@/data/projekt-ustawy';
import { plural } from '@/lib/format';
import { renderProjekt, type RenderedPdf } from './pdf';

// W buildzie składamy raz; w dev za każdym razem, żeby zmiana treści była od razu widoczna
let cache: Promise<RenderedPdf> | undefined;
export const projektPdf = () => (import.meta.env.PROD ? (cache ??= renderProjekt()) : renderProjekt());

/** „8 stron” — do podpisu linku. */
export const projektPdfPages = async () => {
  const { pages } = await projektPdf();
  return `${pages} ${plural(pages, ['strona', 'strony', 'stron'])}`;
};

/** Nazwa pliku bez rozszerzenia z `projekt.pdf.href` (/projekt-nowelizacji/<nazwa>.pdf). */
export const projektPdfName = () => {
  const m = projekt.pdf.href.match(/^\/projekt-nowelizacji\/([^/]+)\.pdf$/);
  if (!m) throw new Error(`[pdf] projekt.pdf.href (${projekt.pdf.href}) musi mieć postać /projekt-nowelizacji/<nazwa>.pdf — tam stoi endpoint`);
  return m[1];
};
