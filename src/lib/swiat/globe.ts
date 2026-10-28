/**
 * Glob: odwzorowanie ortograficzne (d3-geo) wspólne dla serwera (statyczny SVG w HTML, zwiastun na stronie głównej)
 * i przeglądarki (obrót, przybliżenie). Kontury: Natural Earth 1:110 mln (domena publiczna) w topologii world-atlas
 * (src/data/geo/swiat-110m.json); Antarktyda pominięta, państwa za małe na kontur — punkty.
 */
import { geoArea, geoCentroid, geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, GeometryObject, MultiPolygon, Point, Polygon } from 'geojson';
import type { Topology } from 'topojson-specification';

export const SIZE = 600;
export const SCALES = [286, 430, 640, 920];

export type Country = Feature<GeometryObject, { name?: string; point?: true }> & { id: string };

/** państwa za małe na kontur w skali 1:110 mln: [lon, lat] */
const POINTS: Record<string, [number, number]> = { '344': [114.17, 22.32], '702': [103.82, 1.35], '048': [50.55, 26.07] };

export function countries(topology: Topology): Country[] {
  const fc = feature(topology, topology.objects.countries!) as unknown as { features: Country[] };
  const list = fc.features.filter((f) => f.id && f.id !== '010');
  for (const [id, coordinates] of Object.entries(POINTS)) {
    list.push({ type: 'Feature', id, properties: { point: true }, geometry: { type: 'Point', coordinates } as Point });
  }
  return list;
}

/** środek kraju = środek największego wielokąta (Francja bez Gujany, Norwegia bez Svalbardu) */
export function center(f: Country): [number, number] {
  if (f.geometry.type !== 'MultiPolygon') return geoCentroid(f);
  let best: Polygon | undefined;
  let area = -1;
  for (const coordinates of (f.geometry as MultiPolygon).coordinates) {
    const p: Polygon = { type: 'Polygon', coordinates };
    const a = geoArea(p);
    if (a > area) [area, best] = [a, p];
  }
  return geoCentroid(best!);
}

/** obrót, który stawia punkt na środku tarczy (szerokość ograniczona, żeby biegun nie wypełniał globu) */
export const facing = ([lon, lat]: [number, number]): [number, number] => [-lon, -Math.max(-55, Math.min(55, lat))];

export function projection(rotate: [number, number], scale = SCALES[0]!): GeoProjection {
  return geoOrthographic().scale(scale).translate([SIZE / 2, SIZE / 2]).clipAngle(90).precision(0.4).rotate(rotate);
}

/** współrzędne do pełnych jednostek: przy tarczy 600 to piksel, a HTML z globem jest o ~30% lżejszy */
export function pathOf(proj: GeoProjection) {
  return geoPath(proj).pointRadius(4.5).digits(0);
}

/** czy punkt jest po widocznej stronie globu (z marginesem, żeby etykieta nie wisiała na krawędzi) */
export const visible = (point: [number, number], proj: GeoProjection) =>
  geoDistance(point, [-proj.rotate()[0], -proj.rotate()[1]]) < 1.25;

export const graticule = geoGraticule10();
