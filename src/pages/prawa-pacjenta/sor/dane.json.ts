/**
 * Historia kolejek na SOR (lib/sor/history) jako plik statyczny /prawa-pacjenta/sor/dane.json:
 * dane tabeli wszystkich SOR (przeglądarka pobiera je do filtrowania i CSV) i migawka, z której
 * korzystają kolejne buildy, żeby nie czytać D1 częściej niż raz na dobę.
 */
import type { APIRoute } from 'astro';
import { sorHistory } from '@/lib/sor/history';

export const GET: APIRoute = async () => Response.json(await sorHistory());
