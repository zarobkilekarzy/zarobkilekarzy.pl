/**
 * Migawka sekcji „Wyniki na tej stronie” jako plik statyczny /egzamin/statystyki.json. Z D1 czyta ją
 * tylko nocny build; pozostałe pobierają ten plik z produkcji i publikują go dalej (lib/egzamin/site-stats.ts).
 * `null`, gdy statystyk brak.
 */
import type { APIRoute } from 'astro';
import { siteStats } from '@/lib/egzamin/site-stats';

export const GET: APIRoute = async () => Response.json(await siteStats());
