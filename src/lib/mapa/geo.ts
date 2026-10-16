/**
 * Geometria Polski do map: województwa i środki gmin z Państwowego Rejestru Granic (GUGiK).
 *
 * Plik src/data/geo/polska.json generuje skrypt spoza serwisu z warstw PRG (usługa WFS GUGiK):
 * granice uproszczone do ok. 1 km i przeliczone z układu PUWG 1992 (EPSG:2180) na płaszczyznę
 * width × height, więc ścieżki i punkty są gotowe do SVG. Czytany jako tekst (?raw), żeby
 * TypeScript nie wyprowadzał typu z 2,5 tys. kluczy.
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

export interface Geo {
  source: { name: string; publisher: string; url: string; asOf: string };
  width: number;
  height: number;
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
