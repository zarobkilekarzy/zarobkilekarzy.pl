/**
 * Indeks wyszukiwarki jako plik statyczny /szukaj.json. Przeglądarka pobiera go dopiero wtedy,
 * gdy użytkownik sięga po wyszukiwarkę (lib/search/engine.ts → loadSearch).
 */
import type { APIRoute } from 'astro';
import { buildSearchIndex } from '@/lib/search/build';

export const GET: APIRoute = async () => Response.json(await buildSearchIndex());
