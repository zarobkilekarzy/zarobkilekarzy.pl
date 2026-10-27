/**
 * Indeks wyszukiwarki wersji angielskiej jako plik statyczny /en/search.json (lib/search/build-en.ts).
 */
import type { APIRoute } from 'astro';
import { buildSearchIndexEn } from '@/lib/search/build-en';

export const GET: APIRoute = async () => Response.json(await buildSearchIndexEn());
