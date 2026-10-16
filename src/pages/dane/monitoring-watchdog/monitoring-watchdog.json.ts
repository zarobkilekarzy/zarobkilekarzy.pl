/**
 * Pełne dane przeglądarki monitoringu jako plik statyczny:
 * /dane/monitoring-watchdog/monitoring-watchdog.json. Pobiera go datagrid na stronie,
 * a czytelnicy mogą go ściągnąć (zwalidowany, w formacie ze schematu w src/lib/monitoring).
 */
import type { APIRoute } from 'astro';
import { monitoring } from '@/lib/monitoring';

export const GET: APIRoute = () => Response.json(monitoring);
