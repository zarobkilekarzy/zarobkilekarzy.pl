/** /en/patient-rights/card.pdf — angielska karta kieszonkowa (dwie na kartce A4), z tych samych danych co /en/patient-rights/. */
import type { APIRoute } from 'astro';
import { getPdfEn } from '@/lib/pacjent/downloads-en';

export const GET: APIRoute = async () => new Response(new Uint8Array(await getPdfEn('card')), { headers: { 'Content-Type': 'application/pdf' } });
