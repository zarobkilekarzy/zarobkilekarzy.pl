/**
 * Zestaw map „Kolejki na SOR” (kontrakt: lib/mapa/types): jedna warstwa punktowa na żywo.
 *
 * W buildzie powstają tylko punkty (współrzędne z listy pacjent.gov.pl, src/data/sor/lista.json)
 * i stałe dymki z nazwą i adresem. Kolor, wielkość i kolejkę dokłada w przeglądarce adapter
 * lib/sor/live z migawki, którą co 2 minuty uzupełnia Worker workers/sor.
 * Dwa zestawy: `sor` (polski) i `sor-en` (napisy z src/data/en/kolejki-sor.ts) — punkty te same.
 */
import { formatDate, typo } from '@/lib/format';
import { geo } from '@/lib/mapa/geo';
import type { MapSet, MapSource, PointLayer, Tip } from '@/lib/mapa/types';
import { sorHistory, type SorHistory } from './history';
import { adapt } from './live';
import { sorByKey as byKey, sorCity as city, sorPlaces as sor, sorSource, sorStreet as street, sorTitle, type SorPlace as Sor } from './places';
import { SOR_DATA_URL } from './source';
import { fill, type SorText } from './text';
import { hoursText, usualCalm } from './usual';
import { sorMapText as sorMapTextEn } from '@/data/en/kolejki-sor';

// „Zwykle o tej porze” w dymkach: profil doby każdego SOR z historii liczonej przy buildzie (lib/sor/history)
const history: SorHistory | null = await sorHistory();
const usualByKey = new Map((history?.rows ?? []).filter((r) => r.usual.length).map((r) => [r.key, r.usual]));

/** Napisy warstwy w jednym języku; polskie niżej, angielskie w src/data/en/kolejki-sor.ts. */
export interface SorMapText {
  /** napisy adaptera w przeglądarce (lib/sor/text); bez nich — polskie */
  live?: SorText;
  label: string;
  alt: (count: number) => string;
  scale: { title: string; labels: string[] };
  summary: string;
  size: string;
  missing: string;
  pending: string;
  top: string;
  search: { label: string; placeholder: string; empty: string };
  note: string;
  caption: string;
  /** zastrzeżenie przy numerze z dwoma SOR; `where` = miasto (i ulica) drugiego */
  warn: (where: string) => string;
  /** profil doby w dymku: tytuł, podpisy godzin, podpis z {calm} (np. „8:00–11:00”) i {days} albo tylko z {days} */
  usual: { title: string; ticks: string[]; caption: string; captionNoCalm: string };
  sources: MapSource[];
}

const PL: SorMapText = {
  label: 'Teraz',
  alt: (count) => `Mapa Polski z ${count} szpitalnymi oddziałami ratunkowymi. Kolor punktu: najdłuższy czas oczekiwania w SOR wobec normy z rozporządzenia; wielkość: liczba osób przed kontaktem z lekarzem. Kolejka każdego SOR jest w dymku po kliknięciu, a najdłuższe kolejki — na liście obok mapy.`,
  scale: { title: 'Najdłuższy czas oczekiwania wobec normy', labels: ['nikt nie czeka na lekarza', 'czas w normie', 'ponad normę', 'ponad dwukrotność normy'] },
  summary: 'Wczytuję stan kolejek z systemu TOPSOR…',
  size: 'Osób przed kontaktem z lekarzem',
  missing: 'brak pomiaru czasu',
  pending: 'Wczytuję stan kolejek…',
  top: 'Najdłużej ponad normą',
  search: { label: 'Znajdź SOR', placeholder: 'Miasto albo nazwa szpitala', empty: 'Nie ma SOR w takim mieście ani o takiej nazwie.' },
  note: typo(
    'Kolor to najgorszy wynik w kategoriach żółtej, zielonej i niebieskiej: czas z systemu TOPSOR wobec normy. Czasy są <b>średnie i przybliżone</b>, a portal je ucina — „powyżej 2 godzin” przy normie 60 minut to na pewno ponad dwukrotność. ' +
      'W kategorii czerwonej portal zawsze podaje „natychmiast”, w pomarańczowej „poniżej 10 minut” — to tekst normy, nie pomiar, więc te kategorie nie wpływają na kolor.',
  ),
  caption: typo('Punkt stoi w miejscu SOR według współrzędnych z pacjent.gov.pl; w miastach z kilkoma oddziałami punkty są rozsunięte.'),
  warn: (where) => typo(`Ten sam numer w danych pacjent.gov.pl ma też SOR: ${where}. Nie wiadomo, którego oddziału dotyczy kolejka.`),
  usual: {
    title: 'Zwykle w ciągu doby',
    ticks: ['0', '6', '12', '18'],
    caption: 'Zwykle najspokojniej: {calm}. Średnia z ostatnich {days} dni.',
    captionNoCalm: 'Średnia z ostatnich {days} dni.',
  },
  sources: [
    { label: 'Źródło', name: 'pacjent.gov.pl, dane systemu TOPSOR (administrator: NFZ)', href: sorSource.strona, detail: `lista SOR — stan ${formatDate(new Date(sorSource.stan))}` },
    {
      label: 'Normy',
      name: 'rozporządzenie Ministra Zdrowia w sprawie szpitalnego oddziału ratunkowego, § 6 ust. 9',
      href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250001646',
      detail: 'Dz.U. 2025 poz. 1646',
    },
    { label: 'Granice', name: `${geo.source.name}, ${geo.source.publisher}`, href: geo.source.url, detail: `stan ${formatDate(new Date(geo.source.asOf))}` },
    { label: 'Wybrzeże', name: `${geo.source.coast.name}, ${geo.source.coast.publisher}`, href: geo.source.coast.url, detail: geo.source.coast.copyright },
  ],
};

function tip(s: Sor, t: SorMapText): Tip {
  const twin = byKey.get(s.numer)!.find((o) => o !== s);
  const where = twin && (city(twin) === city(s) ? `${city(twin)}, ${street(twin)}` : city(twin));
  const usual = usualByKey.get(s.numer);
  const calm = usual && usualCalm(usual);
  return {
    title: sorTitle(s),
    meta: [city(s), street(s)].filter(Boolean).join(' · '),
    // bieżącą godzinę (`mark`), stan teraz (`now`) i porównanie dokłada adapter na żywo (lib/sor/live)
    ...(usual && {
      profile: {
        title: t.usual.title,
        values: usual,
        ticks: t.usual.ticks,
        caption: fill(calm != null ? t.usual.caption : t.usual.captionNoCalm, { calm: calm != null ? hoursText(calm, 3) : '', days: history!.window.days }),
      },
    }),
    ...(where && { warn: t.warn(where) }),
  };
}

// lokalny podgląd przed włączeniem crona: PUBLIC_SOR_URL=/ścieżka/do/migawki.json
const url = import.meta.env.PUBLIC_SOR_URL || SOR_DATA_URL;

/** Warstwa „Teraz” w języku napisów `t`: te same punkty, numery i skala, inne podpisy. */
function queuesOf(t: SorMapText): PointLayer {
  return {
    kind: 'points',
    id: 'teraz',
    label: t.label,
    alt: t.alt(sor.length),
    scale: {
      title: t.scale.title,
      edges: [1, 2, 3],
      labels: t.scale.labels,
      tones: [0, 1, 3, 4],
    },
    summary: { value: '–', text: t.summary },
    size: { title: t.size, samples: [1, 10, 40], radius: { base: 2.4, k: 0.75, min: 2.4 } },
    missing: { label: t.missing, count: 0 },
    live: { url, adapter: 'sor', pending: t.pending, ...(t.live && { text: t.live }) },
    top: { title: t.top },
    search: t.search,
    note: t.note,
    caption: t.caption,
    sources: t.sources,
    points: sor.map((s) => ({ at: { lat: s.lat, lng: s.lng }, key: s.numer, value: null, tip: tip(s, t) })),
  };
}

const queues = queuesOf(PL);

export const sorMap: MapSet = { id: 'sor', layers: [queues] };
/** Ta sama mapa po angielsku (/en/patient-rights/emergency-department/); nazwy szpitali i miast zostają polskie. */
export const sorMapEn: MapSet = { id: 'sor-en', layers: [queuesOf(sorMapTextEn)] };

/**
 * Warstwa z kolorami i wielkościami z jednej, zamrożonej migawki (adapter jak na stronie) — do
 * ilustracji, która nie może się zmieniać (obrazek OG). Bez godziny i liczb: to nie jest stan na żywo.
 */
export function frozenLayer(snapshot: unknown): PointLayer {
  const r = adapt(snapshot, { keys: queues.points.map((p) => p.key ?? null), tips: queues.points.map((p) => p.tip) });
  return { ...queues, live: undefined, points: queues.points.map((p, i) => ({ ...p, value: r.points[i].value, size: r.points[i].size })) };
}
export const sorCount = sor.length;
