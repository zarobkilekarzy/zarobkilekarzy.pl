/**
 * Geometria Polski do map: województwa i środki gmin z Państwowego Rejestru Granic (GUGiK).
 *
 * Plik src/data/geo/polska.json generuje skrypt spoza serwisu z warstw PRG (usługa WFS GUGiK):
 * granice uproszczone do ok. 1 km i przeliczone z układu PUWG 1992 (EPSG:2180) na płaszczyznę
 * width × height, więc ścieżki i punkty są gotowe do SVG. Województwa w PRG obejmują morskie wody
 * wewnętrzne (Zatoka Gdańska, zalewy), więc są przycięte do lądu z GISCO (Eurostat): brzeg morza z GISCO,
 * granice lądowe i między województwami z PRG. Mierzeje (Helska, Wiślana, Dziwnowska) są poszerzone o ok.
 * 1,5 km, bo przy tej skali mają poniżej pół piksela i znikały pod obrysem; środki gmin, które wypadały
 * na wodzie, stoją w siedzibach gmin. Czytany jako tekst (?raw), żeby
 * TypeScript nie wyprowadzał typu z 2,5 tys. kluczy. Parametry tego przeliczenia są w pliku
 * (`projection`), więc punkt podany współrzędnymi geograficznymi trafia w to samo miejsce
 * co granice (`project`).
 */
import raw from '@/data/geo/polska.json?raw';
import { VOIVODESHIPS } from '@/lib/monitoring/codes';

type Voivodeship = (typeof VOIVODESHIPS)[number];

export interface Region {
  /** kod TERYT województwa, 2 cyfry */
  teryt: string;
  name: Voivodeship;
  /** ścieżka SVG */
  d: string;
  /** punkt etykiety: środek największej części */
  label: [number, number];
}

/**
 * Odwzorowanie PUWG 1992 (EPSG:2180: poprzeczne Merkatora na elipsoidzie GRS80) i przejście na
 * płaszczyznę mapy: x = pad + (E − minE)·scale, y = pad + (maxN − N)·scale.
 */
export interface Projection {
  crs: 'EPSG:2180';
  ellipsoid: 'GRS80';
  lon0: number;
  k0: number;
  falseEasting: number;
  falseNorthing: number;
  minE: number;
  maxN: number;
  scale: number;
  pad: number;
}

export interface Geo {
  source: {
    name: string; publisher: string; url: string; asOf: string;
    /** linia brzegowa, do której przycięto województwa */
    coast: { name: string; publisher: string; copyright: string; url: string };
  };
  width: number;
  height: number;
  projection: Projection;
  voivodeships: Region[];
  /** kod TERYT gminy (7 cyfr, rodzaj 1–3) → środek gminy */
  communes: Record<string, [number, number]>;
}

function load(): Geo {
  const g = JSON.parse(raw) as Geo;
  const names = new Set(g.voivodeships.map((r) => r.name));
  const missing = VOIVODESHIPS.filter((v) => !names.has(v));
  if (missing.length || g.voivodeships.length !== VOIVODESHIPS.length) {
    throw new Error(`src/data/geo/polska.json: województwa niezgodne ze słownikiem (brak: ${missing.join(', ') || '—'})`);
  }
  return g;
}

export const geo = load();
export const regionByTeryt = new Map(geo.voivodeships.map((r) => [r.teryt, r]));
export const regionByName = new Map(geo.voivodeships.map((r) => [r.name, r]));

/**
 * Środek gminy dla kodu TERYT siedziby. Rejestry placówek podają też jednostki, których PRG nie ma
 * jako gmin: dzielnice Warszawy (rodzaj 8) i delegatury dużych miast (9) → całe miasto (…011),
 * miasto (4) i obszar wiejski (5) gminy miejsko-wiejskiej → cała gmina (…3). Bywa też inna ostatnia
 * cyfra niż w PRG, stąd zapas: ta sama gmina, dowolny rodzaj.
 */
export function communePoint(teryt: string): [number, number] | null {
  const gmina = teryt.slice(0, 6);
  const kind = teryt[6];
  const first = kind === '8' || kind === '9' ? teryt.slice(0, 4) + '011' : kind === '4' || kind === '5' ? gmina + '3' : teryt;
  for (const code of [first, gmina + '1', gmina + '2', gmina + '3']) {
    const p = geo.communes[code];
    if (p) return p;
  }
  return null;
}

/* ---------- WGS84 → płaszczyzna mapy ---------- */

// GRS80; różnica ETRS89 a WGS84 (poniżej metra) jest na tej mapie niewidoczna
const A_ = 6378137, F_ = 1 / 298.257222101, N_ = F_ / (2 - F_);
const RECT = (A_ / (1 + N_)) * (1 + N_ ** 2 / 4 + N_ ** 4 / 64);
// szereg Krügera do trzeciego rzędu: w pasie Polski błąd rzędu milimetrów
const ALPHA = [N_ / 2 - (2 * N_ ** 2) / 3 + (5 * N_ ** 3) / 16, (13 * N_ ** 2) / 48 - (3 * N_ ** 3) / 5, (61 * N_ ** 3) / 240];
const CONF = (2 * Math.sqrt(N_)) / (1 + N_);

/** Współrzędne PUWG 1992 [E, N] w metrach. */
export function puwg92(lat: number, lng: number, p: Projection = geo.projection): [number, number] {
  const phi = (lat * Math.PI) / 180, lam = ((lng - p.lon0) * Math.PI) / 180;
  const t = Math.sinh(Math.atanh(Math.sin(phi)) - CONF * Math.atanh(CONF * Math.sin(phi)));
  const xi = Math.atan(t / Math.cos(lam)), eta = Math.atanh(Math.sin(lam) / Math.sqrt(1 + t * t));
  let e = eta, n = xi;
  ALPHA.forEach((a, j) => {
    e += a * Math.cos(2 * (j + 1) * xi) * Math.sinh(2 * (j + 1) * eta);
    n += a * Math.sin(2 * (j + 1) * xi) * Math.cosh(2 * (j + 1) * eta);
  });
  return [p.falseEasting + p.k0 * RECT * e, p.falseNorthing + p.k0 * RECT * n];
}

/** Punkt mapy dla szerokości i długości geograficznej (WGS84), w układzie ścieżek województw. */
export function project(lat: number, lng: number): [number, number] {
  const p = geo.projection;
  const [e, n] = puwg92(lat, lng, p);
  return [p.pad + (e - p.minE) * p.scale, p.pad + (p.maxN - n) * p.scale];
}
