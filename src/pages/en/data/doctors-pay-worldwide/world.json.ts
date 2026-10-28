/** Kontury i dymki globu płac po angielsku: /en/data/doctors-pay-worldwide/world.json (treść: lib/swiat/tips.ts). */
import type { APIRoute } from 'astro';
import { globePayload } from '@/lib/swiat/tips';

export const GET: APIRoute = async () => Response.json(await globePayload('en'));
