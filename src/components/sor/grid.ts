/**
 * Konfiguracja datagridu „Wszystkie SOR” (/prawa-pacjenta/sor/): liczby z historii kolejek liczonej przy
 * buildzie (lib/sor/history). Wspólna dla serwera (pierwszy widok) i przeglądarki — z historii tylko typy,
 * bo moduł historii czyta D1 i pliki. Opisy kolumn (`hint`) są zarazem legendą pod tabelą.
 */
import type { Column, GridConfig, Html } from '@/components/datagrid/types';
import { formatPL, slug } from '@/lib/format';
import { VOIVODESHIPS } from '@/lib/monitoring/codes';
import type { SorHistory, SorHistoryRow, SorStats } from '@/lib/sor/history';

type Data = Pick<SorHistory, 'window' | 'week'>;

const NONE = '<span class="sorg-none">–</span>';
/** procent z jednym miejscem po przecinku, bez zbędnego „,0” */
const pct = (v: number | null): Html => (v == null ? NONE : `${formatPL(v, Number.isInteger(v) ? 0 : 1)}%`);
const capitalize = (s: string) => s[0].toLocaleUpperCase('pl') + s.slice(1);

/** Kolumna z liczbą z okna 28 dni (albo z tygodnia, gdy `week`). */
function stat(id: string, pick: (s: SorStats) => number | null, cell: (v: number | null) => Html, opts: Partial<Column<SorHistoryRow, Data>> & { week?: boolean } = {}): Column<SorHistoryRow, Data> {
  const { week, ...rest } = opts;
  const value = (row: SorHistoryRow) => pick(week ? row.week : row.window);
  return { id, label: id, align: 'end', width: '4.75rem', sort: value, dir: 'desc', cell: (row) => cell(value(row)), ...rest };
}

const COLORS = [
  { id: 'zolta', label: 'żółta', of: 'żółtej', norm: 60 },
  { id: 'zielona', label: 'zielona', of: 'zielonej', norm: 120 },
  { id: 'niebieska', label: 'niebieska', of: 'niebieskiej', norm: 240 },
];

export const grid: GridConfig<SorHistoryRow, Data> = {
  load: (json) => {
    const h = json as SorHistory;
    return { rows: h.rows, data: { window: h.window, week: h.week } };
  },
  key: (row) => row.key,
  noun: ['SOR', 'SOR-y', 'SOR-ów'],
  caption: 'Szpitalne oddziały ratunkowe: odsetek odczytów ponad normą czasu, liczba czekających na lekarza i jakość danych z portalu pacjent.gov.pl',
  search: {
    label: 'Szukaj SOR',
    placeholder: 'Miasto albo nazwa szpitala',
    text: (row) => `${row.city} ${row.title} ${row.region} ${row.twin ?? ''}`,
  },
  columns: [
    {
      id: 'sor',
      label: 'SOR',
      hint: 'Szpital z oddziałem ratunkowym, miasto i województwo według listy pacjent.gov.pl. Pięć numerów TOPSOR ma po dwa SOR — kolejka jest wtedy jedna i nie wiadomo, którego oddziału dotyczy.',
      sort: (row) => `${row.city} ${row.title}`,
      dir: 'asc',
      cell: (row, ctx) =>
        `<span class="sorg-name">${ctx.mark(row.title)}</span>` +
        `<span class="sorg-meta">${ctx.mark(row.city)} · ${ctx.mark(capitalize(row.region))}${row.twin ? ` · kolejka wspólna z SOR: ${ctx.mark(row.twin)}` : ''}</span>`,
    },
    stat('ponad', (s) => s.over, pct, {
      label: 'Ponad normą',
      short: 'Ponad normą',
      width: '6.5rem',
      bar: true,
      hint: 'Odsetek odczytów z czasem powyżej normy. Odczyt to kategoria żółta, zielona albo niebieska, w której w danym pomiarze ktoś czeka i portal podał czas. Normy: żółta do 60 min, zielona do 120, niebieska do 240 (rozporządzenie w sprawie SOR, § 6 ust. 9). „Powyżej 2 godzin” liczymy jako 121 minut, więc to dolna granica. Czerwona i pomarańczowa są poza liczbą — portal pokazuje w nich zawsze tekst normy, nie pomiar.',
    }),
    stat('tydzien', (s) => s.over, pct, {
      week: true,
      label: '7 dni',
      priority: 2,
      hint: 'Ten sam odsetek ponad normą, tylko z ostatnich 7 dni okresu.',
    }),
    // bez grupy kolumn: wiersz grupy zostaje pusty, gdy wąska tabela chowa jej kolumny
    ...COLORS.map((c, i) =>
      stat(c.id, (s) => s.byColor[i], pct, {
        label: c.label[0].toLocaleUpperCase('pl') + c.label.slice(1),
        priority: 3,
        hint: `Odsetek odczytów ponad normą w kategorii ${c.of} (norma: do ${c.norm} min).`,
      }),
    ),
    stat('czeka', (s) => s.waitingAvg, (v) => (v == null ? NONE : formatPL(v, 1)), {
      label: 'Czeka średnio',
      short: 'Czeka',
      width: '6rem',
      bar: true,
      hint: 'Ile osób średnio czeka przed kontaktem z lekarzem (suma etapów od rejestracji do kategorii pilności) — ta sama liczba co w dymku na mapie.',
    }),
    stat('powyzej', (s) => s.overCap, pct, {
      label: '„Powyżej…”',
      priority: 2,
      hint: 'Odsetek odczytów, w których portal zamiast czasu podaje tylko „powyżej 2 godzin” (żółta), „powyżej 4 godzin” (zielona) albo „powyżej 6 godzin” (niebieska). To reguła portalu, ta sama dla wszystkich SOR: liczbę pokazuje do 119, 239 i 359 minut. Wysoki odsetek znaczy, że czas często przekracza dwukrotność normy (w niebieskiej półtorakrotność).',
    }),
    stat('braki', (s) => s.missing, pct, {
      label: 'Braki danych',
      short: 'Braki',
      priority: 2,
      hint: 'Odsetek pomiarów, w których portal nie podał danych o kolejce („brak danych”, nieaktualna kopia, zły format). Nasze błędy połączenia się nie liczą.',
    }),
  ],
  facets: [
    {
      id: 'woj',
      label: 'Województwo',
      options: VOIVODESHIPS.map((v) => ({ value: slug(v), label: capitalize(v) })),
      value: (row) => slug(row.region),
    },
  ],
  sort: { by: 'sor', dir: 'asc' },
  tiebreak: (a, b) => a.city.localeCompare(b.city, 'pl') || a.title.localeCompare(b.title, 'pl'),
  pageSize: 10,
  pageSizes: [10, 25, 100, 0],
  csv: {
    filename: 'kolejki-sor.csv',
    columns: (data) => [
      { label: 'Numer TOPSOR', value: (r) => r.key },
      { label: 'SOR', value: (r) => r.title },
      { label: 'Miasto', value: (r) => r.city },
      { label: 'Województwo', value: (r) => r.region },
      { label: 'Wspólna kolejka z SOR w', value: (r) => r.twin ?? null },
      { label: 'Okres od', value: () => data.window.from },
      { label: 'Okres do', value: () => data.window.to },
      { label: 'Ponad normą (%)', value: (r) => r.window.over },
      ...COLORS.map((c, i) => ({ label: `Ponad normą: ${c.label} (%)`, value: (r: SorHistoryRow) => r.window.byColor[i] })),
      { label: 'Czeka średnio', value: (r) => r.window.waitingAvg },
      { label: 'Czeka najwięcej', value: (r) => r.window.waitingMax },
      { label: '„Powyżej…” (%)', value: (r) => r.window.overCap },
      { label: 'Braki danych (%)', value: (r) => r.window.missing },
      { label: 'Zapytania', value: (r) => r.window.requests },
      { label: `Ponad normą, 7 dni ${data.week.from}–${data.week.to} (%)`, value: (r) => r.week.over },
    ],
  },
};
