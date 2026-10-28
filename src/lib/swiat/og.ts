/**
 * Glob płac na obrazku OG (src/data/og.ts, src/data/en/og.ts): statyczny rysunek w dziennych barwach serwisu,
 * kolory jak w widoku „× przeciętna płaca, na etacie”, Polska obrysowana. Bez napisów, więc ten sam w PL i EN.
 */
import { geoOrthographic, geoPath } from 'd3-geo';
import type { Topology } from 'topojson-specification';
import topology from '@/data/geo/swiat-110m.json';
import { tokenColor } from '@/lib/tokens';
import { countries, facing, graticule } from './globe';
import { defaultTones } from './index';

const c = (name: string) => tokenColor(name, false);
const FILL: Record<string, string> = { '0': 'seq-0', '1': 'seq-1', '2': 'seq-2', '3': 'seq-3', '4': 'seq-4', c: 'chart', s: 'chart-soft' };

/** `width` × `height` z globem o średnicy wysokości, zwróconym do punktu `at` [lon, lat] (Europa i Atlantyk) */
export function globeOgBody(width: number, height: number, at: [number, number] = [-5, 32]): string {
  const r = height / 2 - 2;
  const proj = geoOrthographic().scale(r).translate([width / 2, height / 2]).clipAngle(90).precision(0.4).rotate(facing(at));
  const path = geoPath(proj).pointRadius(3).digits(1);
  const tones = defaultTones();
  const land = countries(topology as unknown as Topology)
    .map((f) => {
      const d = path(f);
      return d ? `<path d="${d}" fill="${c(FILL[tones[f.id] ?? 's']!)}" stroke="${c('bg')}" stroke-width="0.7"/>` : '';
    })
    .join('');
  const poland = countries(topology as unknown as Topology).find((f) => f.id === '616');
  return [
    `<path d="${path({ type: 'Sphere' })}" fill="${c('bg-soft')}" stroke="${c('line-2')}" stroke-width="1"/>`,
    `<path d="${path(graticule)}" fill="none" stroke="${c('line')}" stroke-width="0.6"/>`,
    land,
    poland ? `<path d="${path(poland)}" fill="none" stroke="${c('ink')}" stroke-width="1.8"/>` : '',
  ].join('');
}
