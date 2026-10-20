/**
 * Warstwy mapy monitoringu „Ile zarabiają lekarze?” (kontrakt: lib/mapa/types).
 *
 * - „Zarobki”: placówka = koło w gminie siedziby; kolor = mediana rocznych wypłat z pełnej listy,
 *   pole koła = liczba pozycji; placówki bez pełnej listy jako szare punkty.
 * - „Jawność”: odsetek placówek, które ujawniły dane, w każdym województwie.
 *
 * Wszystkie liczby i zastrzeżenia liczone z danych, więc po podmianie pliku monitoringu mapa i jej
 * podpisy aktualizują się same (także to, czy różnice między województwami są istotne).
 */
import { formatDate, formatPL, typo } from '@/lib/format';
import { geo, regionByName } from '@/lib/mapa/geo';
import { homogeneityP } from '@/lib/mapa/stat';
import type { MapSet, MapSource, PointLayer, RegionLayer } from '@/lib/mapa/types';
import { monitoring, type MonitoringDoc, type Response } from '.';
import { VOIVODESHIPS } from './codes';
import { prettyName } from './name';

const MEDIAN_EDGES = [100_000, 150_000, 200_000, 300_000];
const MEDIAN_LABELS = ['do 100 tys.', '100–150 tys.', '150–200 tys.', '200–300 tys.', 'ponad 300 tys.'];
const SHARE_EDGES = [0.05, 0.1, 0.15, 0.2];
const SHARE_LABELS = ['do 5%', '5–10%', '10–15%', '15–20%', 'ponad 20%'];

/** Odpowiedź placówki bez pełnej listy — jak w komórce tabeli (components/monitoring/grid.ts, RESPONSE.title). */
const NO_LIST: Record<Response, string> = {
  disclosed: 'dane nieprzetworzone', refused: 'odmowa', silence: 'cisza', other: 'inna odpowiedź',
  receipt: 'tylko potwierdzenie', forwarded: 'przekazana dalej', unknown: 'odpowiedź nieustalona',
};

const money = (n: number) => (n >= 1e6 ? `${formatPL(n / 1e6, 2)} mln zł` : `${formatPL(Math.round(n / 1e3))} tys. zł`);
const percent = (share: number, decimals = 1) => `${formatPL(share * 100, decimals)}%`;
const capitalize = (s: string) => s.replace(/(^|-)(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pl'));
const TIMES = ['', '', 'dwukrotnie', 'trzykrotnie', 'czterokrotnie', 'pięciokrotnie', 'sześciokrotnie', 'siedmiokrotnie', 'ośmiokrotnie', 'dziewięciokrotnie', 'dziesięciokrotnie'];
const times = (k: number) => TIMES[k] ?? `${k}-krotnie`;

function build(doc: MonitoringDoc) {
  const { facilities } = doc;
  const total = facilities.length;
  const withList = facilities.filter((f) => f.payroll);

  const sources: MapSource[] = [
    { label: 'Źródło', name: `${doc.source.name}, monitoring „${doc.source.monitoring}”`, href: doc.source.url, detail: `stan ${formatDate(new Date(doc.updated))}` },
    { label: 'Granice', name: `${geo.source.name}, ${geo.source.publisher}`, href: geo.source.url, detail: `stan ${formatDate(new Date(geo.source.asOf))}` },
    { label: 'Wybrzeże', name: `${geo.source.coast.name}, ${geo.source.coast.publisher}`, href: geo.source.coast.url, detail: geo.source.coast.copyright },
  ];

  /* ---------- Zarobki ---------- */

  const medianCounts = MEDIAN_LABELS.map(() => 0);
  for (const f of withList) {
    const i = MEDIAN_EDGES.findIndex((e) => f.payroll!.median < e);
    medianCounts[i < 0 ? MEDIAN_EDGES.length : i]++;
  }

  // największy rozrzut median w jednym województwie (co najmniej 3 listy) — pokazuje, że kolor
  // zależy od szpitala, nie od regionu
  const spread = VOIVODESHIPS.map((v) => {
    const m = withList.filter((f) => f.voivodeship === v).map((f) => f.payroll!.median);
    return { v, n: m.length, min: Math.min(...m), max: Math.max(...m) };
  })
    .filter((s) => s.n >= 3)
    .sort((a, b) => b.max / b.min - a.max / a.min)[0];
  const ratio = spread ? spread.max / spread.min : 0;
  const k = Math.floor(ratio);

  const pay: PointLayer = {
    kind: 'points',
    id: 'zarobki',
    label: 'Zarobki',
    alt: `Mapa Polski: ${withList.length} placówek z pełną roczną listą płac jako koła (wielkość — liczba pozycji na liście, kolor — mediana rocznych wypłat) i ${total - withList.length} pozostałych jako szare punkty. Te same dane są w przeglądarce monitoringu.`,
    scale: { title: 'Mediana rocznych wypłat w placówce', edges: MEDIAN_EDGES, labels: MEDIAN_LABELS, counts: medianCounts },
    summary: { value: formatPL(withList.length), text: typo(`z ${formatPL(total)} placówek przysłało pełną roczną listę płac lekarzy`) },
    size: { title: 'Pozycji na liście', samples: [20, 100, 500] },
    missing: { label: typo('placówka bez pełnej listy: odmowa, cisza, dane zbiorcze albo nieprzetworzone'), count: total - withList.length },
    note: spread && k >= 2
      ? typo(`Każde koło to jeden szpital. Kolor zależy bardziej od rodzaju szpitala niż od regionu: w województwie ${spread.v} mediany różnią się <b>${ratio - k >= 0.05 ? 'ponad ' : ''}${times(k)}</b> (od ${formatPL(Math.round(spread.min / 1e3))} do ${formatPL(Math.round(spread.max / 1e3))} tys. zł), więc mapa nie pokazuje „stawek w województwie”.`)
      : typo('Każde koło to jeden szpital. Kolor zależy bardziej od rodzaju szpitala niż od regionu, więc mapa nie pokazuje „stawek w województwie”.'),
    caption: typo('Koło stoi w środku gminy siedziby placówki, a koła z jednej gminy są rozsunięte, żeby się nie zasłaniały.'),
    sources,
    points: facilities
      .filter((f) => f.teryt)
      .map((f) => {
        const meta = `${f.city} · ${capitalize(f.voivodeship)}`;
        const link = { href: f.url, hrefLabel: `sprawa #${f.id}` };
        const title = f.displayName ?? prettyName(f.name);
        return f.payroll
          ? {
              teryt: f.teryt!,
              value: f.payroll.median,
              size: f.payroll.doctors,
              tip: { title, meta, rows: [['Mediana roczna', money(f.payroll.median)], ['Najwyższa wypłata', money(f.payroll.max)], ['Pozycji na liście', formatPL(f.payroll.doctors)]] as [string, string][], ...link },
            }
          : { teryt: f.teryt!, value: null, tip: { title, meta, rows: [['Odpowiedź', f.aggregate ? 'dane zbiorcze' : NO_LIST[f.response]]] as [string, string][], ...link } };
      }),
  };

  /* ---------- Jawność ---------- */

  const byRegion = VOIVODESHIPS.map((v) => {
    const fs = facilities.filter((f) => f.voivodeship === v);
    const count = (r: Response) => fs.filter((f) => f.response === r).length;
    const all = fs.length, disclosed = count('disclosed'), refused = count('refused'), silence = count('silence');
    return { v, all, disclosed, refused, silence, lists: fs.filter((f) => f.payroll).length, other: all - disclosed - refused - silence };
  });
  const disclosed = byRegion.reduce((s, r) => s + r.disclosed, 0);
  const p = homogeneityP(byRegion.map((r) => ({ k: r.disclosed, n: r.all })));
  const minHidden = Math.min(...byRegion.map((r) => 1 - r.disclosed / r.all));
  const maxShare = Math.max(...byRegion.map((r) => r.disclosed / r.all));

  const openness: RegionLayer = {
    kind: 'regions',
    id: 'jawnosc',
    label: 'Jawność',
    alt: 'Mapa województw: odsetek placówek, które ujawniły dane o wynagrodzeniach lekarzy. Te same liczby są w rankingu obok mapy.',
    scale: { title: 'Odsetek placówek, które ujawniły dane', edges: SHARE_EDGES, labels: SHARE_LABELS },
    summary: { value: percent(disclosed / total), text: typo(`placówek ujawniło dane (${disclosed} z ${formatPL(total)})`) },
    ranking: { title: 'Odsetek placówek, które ujawniły dane, według województw', max: Math.max(0.25, Math.ceil(maxShare * 20) / 20) },
    note: typo(
      (p >= 0.05 ? 'Różnice między województwami to <b>po kilka placówek</b> i mieszczą się w granicach przypadku. ' : '') +
        `W każdym województwie danych nie ujawniło <b>co najmniej ${Math.floor(minHidden * 100)}%</b> placówek.`,
    ),
    caption: typo('Ujawniła dane = odpowiedziała danymi o wynagrodzeniach, także takimi, których nie udało się zestawić w roczną listę (arkusze, skany, widełki, sumy oddziałów).'),
    sources,
    regions: byRegion.map((r) => {
      const share = r.disclosed / r.all;
      return {
        teryt: regionByName.get(r.v)!.teryt,
        value: share,
        display: percent(share, 0),
        exact: percent(share),
        detail: `${r.disclosed} z ${r.all}`,
        tip: {
          title: capitalize(r.v),
          meta: typo(`${r.disclosed} z ${r.all} placówek ujawniło dane (${percent(share)})`),
          rows: [['w tym pełna lista płac', String(r.lists)], ['odmowa', String(r.refused)], ['cisza', String(r.silence)], ['inne odpowiedzi', String(r.other)]],
        },
      };
    }),
  };

  return { set: { id: 'monitoring', layers: [pay, openness] } satisfies MapSet, opennessP: p };
}

const built = build(monitoring);

/** Zestaw map monitoringu: „Zarobki” i „Jawność”. */
export const monitoringMap: MapSet = built.set;
/** p testu χ² jednorodności odsetka ujawnień między województwami (do opisu metody). */
export const opennessP = built.opennessP;
