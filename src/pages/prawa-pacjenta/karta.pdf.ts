/** /prawa-pacjenta/karta.pdf — dwie karty kieszonkowe na kartce A4 (przetnij i złóż), z danych strony. */
import type { APIRoute } from 'astro';
import { getPdf } from '@/lib/pacjent/downloads';

export const GET: APIRoute = async () => new Response(new Uint8Array(await getPdf('card')), { headers: { 'Content-Type': 'application/pdf' } });
