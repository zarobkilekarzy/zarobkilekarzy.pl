/** Kontury i dymki globu płac: /dane/zarobki-lekarzy-na-swiecie/swiat.json (treść: lib/swiat/tips.ts). */
import type { APIRoute } from 'astro';
import { globePayload } from '@/lib/swiat/tips';

export const GET: APIRoute = async () => Response.json(await globePayload('pl'));
