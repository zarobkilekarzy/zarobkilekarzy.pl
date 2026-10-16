/**
 * Treść dymków map: /mapy/<zestaw>.json — pobiera ją komponent PolandMap przy pierwszym ruchu
 * nad mapą (zob. lib/mapa/svg.ts, mapTips).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { mapSets, type MapSetId } from '@/lib/mapa/sets';
import { mapTips } from '@/lib/mapa/svg';

export const getStaticPaths = (() => Object.keys(mapSets).map((set) => ({ params: { set } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => Response.json(mapTips(mapSets[params.set as MapSetId]));
