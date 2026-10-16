/** /prawa-pacjenta/duzy-druk.pdf — prawa pacjenta dużą czcionką na dwóch stronach A4, z danych strony. */
import type { APIRoute } from 'astro';
import { getPdf } from '@/lib/pacjent/downloads';

export const GET: APIRoute = async () => new Response(new Uint8Array(await getPdf('large')), { headers: { 'Content-Type': 'application/pdf' } });
