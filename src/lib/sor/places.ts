/**
 * Lista SOR z pacjent.gov.pl (src/data/sor/lista.json) i nazwy do wyświetlania — wspólne dla mapy
 * (lib/sor/map) i historii kolejek (lib/sor/history).
 */
import list from '@/data/sor/lista.json';
import { prettyName } from '@/lib/monitoring/name';

export interface SorPlace {
  numer: string;
  nazwa: string;
  miasto: string;
  ulica: string;
  nr: string;
  wojewodztwo: string;
  lat: number;
  lng: number;
}

export const sorPlaces: SorPlace[] = list.sor;
export const sorSource = list.zrodlo;

/** Delegatury dużych miast („Wrocław-Fabryczna”) → samo miasto. */
const DISTRICT = /^(Kraków|Łódź|Poznań|Wrocław)-.*$/i;
const unshout = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl')) : s);
export const sorCity = (s: SorPlace) => unshout(s.miasto).replace(DISTRICT, '$1');
export const sorStreet = (s: SorPlace) => [s.ulica, s.nr].map(unshout).filter(Boolean).join(' ');
export const sorTitle = (s: SorPlace) => prettyName(s.nazwa).replace(/ - /g, ' – ');

/** SOR według numeru TOPSOR — pięć numerów ma po dwa SOR (kolejka jest jedna, nie wiadomo, którego oddziału dotyczy). */
export const sorByKey = new Map<string, SorPlace[]>();
for (const s of sorPlaces) sorByKey.set(s.numer, [...(sorByKey.get(s.numer) ?? []), s]);
