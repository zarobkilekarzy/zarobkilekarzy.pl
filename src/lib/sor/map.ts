/**
 * Zestaw map „Kolejki na SOR” (kontrakt: lib/mapa/types): jedna warstwa punktowa na żywo.
 *
 * W buildzie powstają tylko punkty (współrzędne z listy pacjent.gov.pl, src/data/sor/lista.json)
 * i stałe dymki z nazwą i adresem. Kolor, wielkość i kolejkę dokłada w przeglądarce adapter
 * lib/sor/live z migawki, którą co 2 minuty uzupełnia Worker workers/sor.
 */
import list from '@/data/sor/lista.json';
import { formatDate, typo } from '@/lib/format';
import { geo } from '@/lib/mapa/geo';
import type { MapSet, PointLayer, Tip } from '@/lib/mapa/types';
import { prettyName } from '@/lib/monitoring/name';
import { adapt } from './live';
import { SOR_DATA_URL } from './source';

interface Sor {
  numer: string;
  nazwa: string;
  miasto: string;
  ulica: string;
  nr: string;
  wojewodztwo: string;
  lat: number;
  lng: number;
}

const sor: Sor[] = list.sor;

/** Delegatury dużych miast („Wrocław-Fabryczna”) → samo miasto. */
const DISTRICT = /^(Kraków|Łódź|Poznań|Wrocław)-.*$/i;
const unshout = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl')) : s);
const city = (s: Sor) => unshout(s.miasto).replace(DISTRICT, '$1');
const street = (s: Sor) => [s.ulica, s.nr].map(unshout).filter(Boolean).join(' ');

// pięć numerów ma po dwa SOR — kolejka jest jedna i nie wiadomo, którego oddziału dotyczy
const byKey = new Map<string, Sor[]>();
for (const s of sor) byKey.set(s.numer, [...(byKey.get(s.numer) ?? []), s]);

function tip(s: Sor): Tip {
  const twin = byKey.get(s.numer)!.find((o) => o !== s);
  const where = twin && (city(twin) === city(s) ? `${city(twin)}, ${street(twin)}` : city(twin));
  return {
    title: prettyName(s.nazwa).replace(/ - /g, ' – '),
    meta: [city(s), street(s)].filter(Boolean).join(' · '),
    ...(where && { warn: typo(`Ten sam numer w danych pacjent.gov.pl ma też SOR: ${where}. Nie wiadomo, którego oddziału dotyczy kolejka.`) }),
  };
}

// lokalny podgląd przed włączeniem crona: PUBLIC_SOR_URL=/ścieżka/do/migawki.json
const url = import.meta.env.PUBLIC_SOR_URL || SOR_DATA_URL;

const queues: PointLayer = {
  kind: 'points',
  id: 'teraz',
  label: 'Teraz',
  alt: `Mapa Polski z ${sor.length} szpitalnymi oddziałami ratunkowymi. Kolor punktu: najdłuższy czas oczekiwania w SOR wobec normy z rozporządzenia; wielkość: liczba osób przed kontaktem z lekarzem. Kolejka każdego SOR jest w dymku po kliknięciu, a najdłuższe kolejki — na liście obok mapy.`,
  scale: {
    title: 'Najdłuższy czas oczekiwania wobec normy',
    edges: [1, 2, 3],
    labels: ['nikt nie czeka na lekarza', 'czas w normie', 'ponad normę', 'ponad dwukrotność normy'],
    tones: [0, 1, 3, 4],
  },
  summary: { value: '–', text: 'Wczytuję stan kolejek z systemu TOPSOR…' },
  size: { title: 'Osób przed kontaktem z lekarzem', samples: [1, 10, 40], radius: { base: 2.4, k: 0.75, min: 2.4 } },
  missing: { label: 'brak pomiaru czasu', count: 0 },
  live: { url, adapter: 'sor', pending: 'Wczytuję stan kolejek…' },
  top: { title: 'Najdłużej ponad normą' },
  search: { label: 'Znajdź SOR', placeholder: 'Miasto albo nazwa szpitala', empty: 'Nie ma SOR w takim mieście ani o takiej nazwie.' },
  note: typo(
    'Kolor to najgorszy wynik w kategoriach żółtej, zielonej i niebieskiej: czas z systemu TOPSOR wobec normy. Czasy są <b>średnie i przybliżone</b>, a portal je ucina — „powyżej 2 godzin” przy normie 60 minut to na pewno ponad dwukrotność. ' +
      'W kategorii czerwonej portal zawsze podaje „natychmiast”, w pomarańczowej „poniżej 10 minut” — to tekst normy, nie pomiar, więc te kategorie nie wpływają na kolor.',
  ),
  caption: typo('Punkt stoi w miejscu SOR według współrzędnych z pacjent.gov.pl; w miastach z kilkoma oddziałami punkty są rozsunięte.'),
  sources: [
    { label: 'Źródło', name: 'pacjent.gov.pl, dane systemu TOPSOR (administrator: NFZ)', href: list.zrodlo.strona, detail: `lista SOR — stan ${formatDate(new Date(list.zrodlo.stan))}` },
    {
      label: 'Normy',
      name: 'rozporządzenie Ministra Zdrowia w sprawie szpitalnego oddziału ratunkowego, § 6 ust. 9',
      href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250001646',
      detail: 'Dz.U. 2025 poz. 1646',
    },
    { label: 'Granice', name: `${geo.source.name}, ${geo.source.publisher}`, href: geo.source.url, detail: `stan ${formatDate(new Date(geo.source.asOf))}` },
    { label: 'Wybrzeże', name: `${geo.source.coast.name}, ${geo.source.coast.publisher}`, href: geo.source.coast.url, detail: geo.source.coast.copyright },
  ],
  points: sor.map((s) => ({ at: { lat: s.lat, lng: s.lng }, key: s.numer, value: null, tip: tip(s) })),
};

export const sorMap: MapSet = { id: 'sor', layers: [queues] };

/**
 * Warstwa z kolorami i wielkościami z jednej, zamrożonej migawki (adapter jak na stronie) — do
 * ilustracji, która nie może się zmieniać (obrazek OG). Bez godziny i liczb: to nie jest stan na żywo.
 */
export function frozenLayer(snapshot: unknown): PointLayer {
  const r = adapt(snapshot, { keys: queues.points.map((p) => p.key ?? null), tips: queues.points.map((p) => p.tip) });
  return { ...queues, live: undefined, points: queues.points.map((p, i) => ({ ...p, value: r.points[i].value, size: r.points[i].size })) };
}
export const sorCount = sor.length;
