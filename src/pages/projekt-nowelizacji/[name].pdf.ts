/**
 * /projekt-nowelizacji/projekt-nowelizacji-art27a-v<wersja>.pdf — PDF projektu ustawy składany
 * przy buildzie z src/data/projekt-ustawy.ts (adres z `projekt.pdf.href`, wersja z `projekt.version`).
 * Zamrożone PDF-y poprzednich wersji leżą w public/projekt-nowelizacji/ pod własnymi nazwami.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { projekt } from '@/data/projekt-ustawy';
import { projektPdf, projektPdfName } from '@/lib/projekt/download';

export const getStaticPaths: GetStaticPaths = () => {
  // plik o tej samej nazwie w public/ nadpisałby wynik endpointu (albo odwrotnie) — tylko jedno źródło
  if (existsSync(path.join(process.cwd(), 'public', projekt.pdf.href))) {
    throw new Error(`[pdf] public${projekt.pdf.href} koliduje z endpointem PDF projektu ustawy — usuń plik z public/`);
  }
  return [{ params: { name: projektPdfName() } }];
};

export const GET: APIRoute = async () => new Response(new Uint8Array((await projektPdf()).bytes), { headers: { 'Content-Type': 'application/pdf' } });
