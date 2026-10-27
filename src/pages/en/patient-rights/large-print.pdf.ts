/** /en/patient-rights/large-print.pdf — angielski duży druk na dwóch stronach A4, z tych samych danych co /en/patient-rights/. */
import type { APIRoute } from 'astro';
import { getPdfEn } from '@/lib/pacjent/downloads-en';

export const GET: APIRoute = async () => new Response(new Uint8Array(await getPdfEn('large')), { headers: { 'Content-Type': 'application/pdf' } });
