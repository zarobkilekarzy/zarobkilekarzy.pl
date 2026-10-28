/**
 * Wersja angielska src/data/kolejki-sor.ts (strona /en/patient-rights/emergency-department/) — te same punkty
 * w tej samej kolejności, te same podstawy i źródła. Oprócz treści strony: napisy mapy (`sorMapText`, czyta
 * lib/sor/map → zestaw `sor-en`) i napisy liczone w przeglądarce (`sorLiveText`, trafiają do danych mapy).
 * Nazwy szpitali, miast i województw zostają po polsku (przychodzą z danych pacjent.gov.pl).
 */
import list from '@/data/sor/lista.json';
import { MZ_REPLY, NIK_REPORT, page as pagePl, SOR_SOURCE_PAGE, type Gap, type HistoryChart, type Step } from '@/data/kolejki-sor';
import { formatDateIn, formatEN } from '@/lib/format';
import type { SorHistory } from '@/lib/sor/history';
import { geo } from '@/lib/mapa/geo';
import type { SorMapText } from '@/lib/sor/map';
import type { SorDayText, SorText } from '@/lib/sor/text';
import type { Source } from '@/types';

const isap = (year: number, pos: number) => `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU${year}${String(pos).padStart(7, '0')}`;

export const page = {
  title: 'Emergency department queues',
  seoTitle: 'Live hospital ED queues in Poland',
  lead: 'How many people are waiting to see a doctor right now in each hospital emergency department (SOR), and whether the waiting time is within the standard. Below the map: how the emergency department queue works and what these data do not tell you.',
  description: 'A map of Polish emergency departments, refreshed every 10 minutes: how many wait for a doctor and whether within the standard. Triage and data limits.',
  emergency: { title: 'Life in danger?', text: 'Call 112 — don’t check the queues.' },
  checked: pagePl.checked,
};

/** Napisy układu strony (w PL wpisane w stronę). */
export const labels = {
  eyebrow: 'For patients · live',
  crumb: 'Patient rights',
  map: { eyebrow: 'Map', title: 'Emergency department queues now', id: 'map' },
  how: { eyebrow: 'How it works', title: 'An emergency department queue is not a queue at a counter', id: 'how-it-works' },
  limits: { eyebrow: 'Data limitations', title: 'What these data do not tell you', id: 'limitations' },
  normsCaption: 'Longest permitted time to first contact with a doctor',
  /** podpis etapu w tabeli norm: „priorytet średni” → „medium priority” */
  priority: (label: string) => `${label.toLowerCase()} priority`,
  checked: 'Regulations and documents checked on',
};

export const steps: Step[] = [
  {
    title: 'Your health decides the order, not your arrival time',
    text: 'When you arrive, you take a ticket. A nurse, a paramedic or a doctor carries out medical triage and assigns one of five urgency categories. A patient in a more serious condition will be seen before you, even if they arrived later.',
    basis: 'State Emergency Medical Services Act, Art. 33a(1)–(2) · regulation on hospital emergency departments, § 6(7) and (9)',
  },
  {
    title: 'Each category has a maximum time to see a doctor',
    text: 'In the TOPSOR system and on the map, the categories are called priorities: from the highest (red) to the lowest (blue).',
    basis: 'regulation on hospital emergency departments, § 6(9) · NIK, “System ratownictwa medycznego” (Emergency medical services system), p. 78, footnote 107',
    norms: true,
  },
  {
    title: 'You have the right to know where you stand',
    text: 'After triage, staff are required to tell you your assigned category, the number of people ahead of you and the longest expected waiting time. The ticket machine should show your individual time after you scan the code on your ticket.',
    basis: 'regulation on hospital emergency departments, § 6(10) · TOPSOR regulation, § 2 points 5–6',
  },
  {
    title: 'While you wait, your condition is reassessed',
    text: 'Staff reassess the condition of the people waiting at least every 90 minutes from the time they took their ticket, and the category may change. If you feel worse, say so straight away.',
    basis: 'regulation on hospital emergency departments, § 6(14) · TOPSOR regulation, § 2 point 12(a)',
  },
  {
    title: 'Green and blue categories: the emergency department may send you to a clinic',
    text: 'An emergency department may refer a patient in the green or blue category to primary care, including night and holiday care. The rules are set out in the hospital’s internal regulations, posted at registration and published on the hospital’s website. In the ten hospitals audited by the Supreme Audit Office (NIK), such patients made up 44.6%, but staff rarely referred them elsewhere.',
    basis: 'regulation on hospital emergency departments, § 6(11)–(12) · NIK, “System ratownictwa medycznego”, p. 78',
  },
  {
    title: 'The time on the screen is the category average, not your time',
    text: 'The screens in the emergency department and this map show the average expected time for the whole category. Yours may be shorter or longer — it depends on who arrives after you.',
    basis: 'TOPSOR regulation, § 2 point 4 and § 3 point 1',
  },
  {
    title: 'When something goes wrong',
    text: 'If you think your rights have been violated — for example, nobody told you how long you would wait — see where to report it.',
    link: { href: '/en/patient-rights/#what-happened', label: 'Patient rights: where to report a violation' },
  },
];

export const gaps: Gap[] = [
  {
    title: 'This is the time to see a doctor, not the whole stay',
    text: 'The map shows the wait for first contact with a doctor. The whole stay in the emergency department takes longer: tests, consultations, observation and waiting for results.',
    basis: 'Ministry of Health, reply to MP’s question No. 3725 (3.08.2026)',
  },
  {
    title: 'The most urgent categories are not measured',
    text: 'For the red category the portal shows “immediately”, and for orange “under 10 minutes” — this is the text of the standard, not a measured time. In our review of all emergency departments on 17 October 2026, this was the case in all 14 and all 47 cases, respectively, in which someone in these categories was waiting. Public data therefore cannot show whether these two standards are being met.',
    basis: 'zarobkilekarzy.pl measurement, pacjent.gov.pl, 17.10.2026, 01:28',
  },
  {
    title: 'Long times are cut off — although the exact ones exist',
    text: 'The portal shows at most “over 2 hours” in the yellow category, “over 4 hours” in green and “over 6 hours” in blue, so all that is known is that the standard has been exceeded. The Ministry knows the exact values: for the emergency department in Toruń it gave averages for the first half of 2026 to the second, for example 22 min 34 s in the yellow category.',
    basis: 'zarobkilekarzy.pl measurement · Ministry of Health, reply to question No. 3725',
  },
  {
    title: 'A dash means zero or no data',
    text: 'When nobody is waiting in a category, the portal shows a dash. Missing data from a department looks the same — the two situations cannot be told apart.',
  },
  {
    title: 'One queue, two departments',
    text: 'Five pairs of emergency departments share the same number in the data. There is then a single queue, and it is not known which department it refers to — the map warns about this in the pop-up.',
  },
  {
    title: 'The history exists — in reports for the ministry',
    text: 'pacjent.gov.pl shows only the current state. The TOPSOR administrator, the National Health Fund (NFZ), sends the Ministry of Health monthly reports including the number of patients, average waiting times and the total length of stay in the emergency department.',
    basis: 'TOPSOR regulation, § 5(1) point 16 · Ministry of Health, reply to question No. 3725',
  },
  {
    title: 'Since July 2026, no statistics “for the website”',
    text: 'Until July 2026, the regulation required the TOPSOR central server to make “current and historical” statistics available for the purposes of the website (our translation). After the amendment, the provision refers to statistics from historical data, but makes no reference to the website.',
    basis: 'TOPSOR regulation, § 3 point 3 — wording of 2021 and after the amendment Dz.U. 2026 item 963',
  },
  {
    title: 'Times in the system are sometimes entered after the fact',
    text: 'NIK examined TOPSOR data from ten hospitals: in 77.7% of records, the time of the doctor’s attendance and the time of discharge were no more than a minute apart. The audit’s conclusion: TOPSOR did not provide reliable data on how long doctors took to attend to patients. The Ministry admits that for the most urgent patients, data are sometimes entered only after emergency procedures have been completed.',
    basis: 'NIK, “System ratownictwa medycznego” (KSS.430.5.2026, June 2026), p. 76 · Ministry of Health, reply to question No. 3725',
  },
  {
    title: 'The map is a snapshot',
    text: 'At night and at peak times, the queues look completely different. We record measurements every 10 minutes — over a few weeks, they will build up a picture of the typical load on each emergency department.',
  },
];

export const editorial = {
  title: 'Full times and historical data — in public',
  text: 'The Ministry has exact average times and monthly reports from TOPSOR, while patients see only a truncated “now”. It would be enough to publish what is already produced: times without truncation, including in the red and orange categories, and monthly summaries for each department. Then the patient, the hospital and the NFZ would be looking at the same figures — and it would be clear where the system is not keeping up.',
};

export const sources: Source[] = [
  { publisher: 'Sejm of the Republic of Poland (ISAP)', title: 'State Emergency Medical Services Act (ustawa o Państwowym Ratownictwie Medycznym), consolidated text Dz.U. 2026 item 141 (Art. 33a) (in Polish)', url: isap(2026, 141) },
  { publisher: 'Sejm of the Republic of Poland (ISAP)', title: 'Regulation of the Minister of Health on the system managing patient handling in hospital emergency departments (TOPSOR), Dz.U. 2021 item 1182 (in Polish)', url: isap(2021, 1182) },
  { publisher: 'Sejm of the Republic of Poland (ISAP)', title: 'Regulation amending the TOPSOR regulation, Dz.U. 2026 item 963 (in Polish)', url: isap(2026, 963) },
  { publisher: 'Sejm of the Republic of Poland (ISAP)', title: 'Regulation of the Minister of Health on hospital emergency departments, consolidated text Dz.U. 2025 item 1646 (§ 6) (in Polish)', url: isap(2025, 1646) },
  { publisher: 'Sejm of the Republic of Poland', title: 'Ministry of Health reply to MP’s question No. 3725 on the emergency department in Toruń (in Polish)', url: MZ_REPLY, date: '3.08.2026' },
  { publisher: 'Supreme Audit Office (NIK)', title: 'Information on the audit results “System ratownictwa medycznego” (Emergency medical services system), KSS.430.5.2026 (in Polish)', url: NIK_REPORT, date: 'June 2026' },
  { publisher: 'pacjent.gov.pl', title: 'Szpitalny Oddział Ratunkowy — map and queues (TOPSOR data, administrator: NFZ) (in Polish)', url: 'https://pacjent.gov.pl/szpitalny-oddzial-ratunkowy-sor' },
];

/** Napisy liczone w przeglądarce (adapter lib/sor/live): idą do danych mapy, nie do skryptu. */
export const sorLiveText: SorText = {
  locale: 'en',
  stages: [
    { label: 'Registration' },
    { label: 'Triage' },
    { label: 'Highest', color: 'red' },
    { label: 'High', color: 'orange' },
    { label: 'Medium', color: 'yellow' },
    { label: 'Low', color: 'green' },
    { label: 'Lowest', color: 'blue' },
  ],
  normNow: 'immediately',
  normUpTo: 'up to {n} min',
  people: ['person', 'people'],
  otherStage: 'stage outside the standard list',
  inSor: '{people} in the ED',
  beforeDoctor: 'waiting to see a doctor',
  cols: ['Stage', 'People', 'Time'],
  asOf: 'As of {time}',
  noData: 'No data from TOPSOR.',
  noDataError: 'No data from TOPSOR ({error}).',
  staleNote: ' — more than {min} minutes older than the rest; does not colour the point',
  previousNote: ' (last successful measurement)',
  onlyUrgent: '{foot}. Only red and orange patients are waiting — the portal gives no time for them.',
  topDetail: '{count} {people} · {stage} priority, standard {norm}',
  waited: ['person was waiting', 'people were waiting'],
  summary: '{waited} for a doctor in {measured} emergency departments; all patients in emergency departments: {total}',
  noFresh: 'No recent data from the TOPSOR system',
  stampNone: 'No measurements in the data file.',
  stampOutdated: 'Last measurement: {when} — the data are not updating at the moment.',
  stampFresh: 'As of {when} · each emergency department checked every {cycle} minutes',
  usualAt: 'usually at {hours}',
  usualMore: 'More people than usual at this time.',
  usualLess: 'Fewer people than usual at this time.',
  usualSame: 'About as many people as usual at this time.',
  waits: { overHours: 'over {n} hours', underMinutes: 'under {n} minutes', now: 'immediately' },
};

const asOf = (iso: string) => formatDateIn(new Date(iso), 'en');

/** Napisy mapy (lib/sor/map → zestaw `sor-en`). */
export const sorMapText: SorMapText = {
  live: sorLiveText,
  label: 'Now',
  alt: (count) => `Map of Poland with ${count} hospital emergency departments. Point colour: the longest waiting time in the department compared with the standard in the regulation; size: the number of people waiting to see a doctor. Each department’s queue is in the pop-up shown on click, and the longest queues are in the list next to the map.`,
  scale: { title: 'Longest wait compared with the standard', labels: ['nobody waiting for a doctor', 'within the standard', 'over the standard', 'over twice the standard'] },
  summary: 'Loading queue data from the TOPSOR system…',
  size: 'People waiting to see a doctor',
  missing: 'no waiting-time measurement',
  pending: 'Loading queue data…',
  top: 'Longest over the standard',
  search: { label: 'Find an ED', placeholder: 'Town or hospital name', empty: 'No emergency department in that town or with that name.' },
  note:
    'The colour is the worst result in the yellow, green and blue categories: the time from the TOPSOR system compared with the standard. Times are <b>average and approximate</b>, and the portal cuts them off — “over 2 hours” against a 60-minute standard is certainly more than twice the standard. ' +
    'In the red category the portal always shows “immediately”, and in orange “under 10 minutes” — this is the text of the standard, not a measurement, so these categories do not affect the colour.',
  caption: 'Each point stands where the emergency department is, according to coordinates from pacjent.gov.pl; in towns with several departments, the points are moved apart.',
  warn: (where) => `In the pacjent.gov.pl data, the same number also covers an emergency department in ${where}. It is not known which department the queue refers to.`,
  usual: {
    title: 'Usually during the day',
    ticks: ['0', '6', '12', '18'],
    caption: 'Usually quietest: {calm}. Average of the last {days} days.',
    captionNoCalm: 'Average of the last {days} days.',
  },
  sources: [
    { label: 'Source', name: 'pacjent.gov.pl, TOPSOR system data (administrator: NFZ)', href: list.zrodlo.strona, detail: `list of emergency departments as of ${asOf(list.zrodlo.stan)}` },
    {
      label: 'Standards',
      name: 'Regulation of the Minister of Health on hospital emergency departments, § 6(9)',
      href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250001646',
      detail: 'Dz.U. 2025 item 1646',
    },
    { label: 'Boundaries', name: `National Register of Boundaries (${geo.source.name}), ${geo.source.publisher}`, href: geo.source.url, detail: `as of ${asOf(geo.source.asOf)}` },
    { label: 'Coastline', name: `GISCO, country boundaries 1:1 million (2024), ${geo.source.coast.publisher}`, href: geo.source.coast.url, detail: geo.source.coast.copyright },
  ],
};

/* ---------- historia kolejek (lib/sor/history): wykres doby, wykresy danych; tabela tylko na stronie polskiej ---------- */

const warsaw = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/Warsaw', ...opts });
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** „2026-10-17” → „17 October” */
const dayMonth = (day: string) => `${Number(day.slice(8))} ${MONTH[Number(day.slice(5, 7)) - 1]}`;
const periodText = (from: string, to: string) => `${dayMonth(from)}–${dayMonth(to)} ${to.slice(0, 4)}`;
const pct = (v: number) => `${formatEN(v, Number.isInteger(v) ? 0 : 1)}%`;
const upper = (s: string) => s[0].toUpperCase() + s.slice(1);

export const dayChartText: SorDayText = {
  eyebrow: 'Usually during the day',
  national: 'All of Poland — how many people on average wait for a doctor in one emergency department',
  hint: 'Click an emergency department on the map or find it with the search box to see its day.',
  back: 'All of Poland',
  calm: 'Quietest {calm}.',
  peak: 'Busiest {peak}.',
  days: 'Average of the last {days} days; the current hour in cobalt, the line shows the state now.',
  now: 'now',
  alt: 'Chart: how many people usually wait for a doctor in each hour of the day. Quietest {calm}, busiest {peak}.',
};

/** Te same wykresy co w PL (src/data/kolejki-sor.ts → historyCharts), napisy po angielsku. */
export function historyCharts(h: SorHistory) {
  const { regions, overCap, over, outage } = h.facts;
  const source = { label: `pacjent.gov.pl (TOPSOR), measurements every 10 minutes, ${periodText(h.window.from, h.window.to)}; own calculations`, href: SOR_SOURCE_PAGE };
  const top = regions[0];
  const bottom = regions.at(-1);
  const byRegion: HistoryChart | null = top && bottom && over.window != null ? {
    title: `Over the standard most often: ${upper(top.region)} (${pct(Math.round(top.over))}), least often: ${upper(bottom.region)} (${pct(Math.round(bottom.over))})`,
    rows: regions.map((r, i) => ({ label: upper(r.region), value: r.over, display: pct(r.over), highlight: i === 0 })),
    max: Math.ceil(top.over / 10) * 10,
    average: over.window,
    averageLabel: `Poland ${pct(over.window)}`,
    caption: `Share of readings over the time standard in the emergency departments of each voivodeship: ${regions.map((r) => `${upper(r.region)} ${pct(r.over)}`).join(', ')}; all of Poland ${pct(over.window)}.`,
    note: 'Reading: the yellow, green or blue category in which someone is waiting and the portal gives a time.',
  } : null;
  const colors = [['Yellow', 'over 2 hours'], ['Green', 'over 4 hours'], ['Blue', 'over 6 hours']] as const;
  const capped: HistoryChart | null = overCap[0] != null ? {
    title: `${pct(Math.round(overCap[0]))} of readings in the yellow category say only “over 2 hours” — the portal does not say exactly how long`,
    rows: colors.flatMap(([color, text], i) => (overCap[i] == null ? [] : [{ label: `${color}: “${text}”`, value: overCap[i]!, display: pct(overCap[i]!), highlight: i === 0 }])),
    max: Math.ceil(Math.max(...overCap.map((v) => v ?? 0)) / 10) * 10,
    caption: `Share of readings that give only “over…” instead of a time: ${colors.map(([c, t], i) => `${c.toLowerCase()} (“${t}”) ${overCap[i] == null ? '–' : pct(overCap[i]!)}`).join(', ')}.`,
    note: 'This is how the portal records any time above twice the standard (in blue — one and a half times), in every emergency department.',
  } : null;
  const gap = outage
    ? `On ${warsaw(outage.from, { day: 'numeric', month: 'long' })}, from ${warsaw(outage.from, { hour: '2-digit', minute: '2-digit' })} to ${warsaw(outage.to, { hour: '2-digit', minute: '2-digit' })}, the pacjent.gov.pl portal did not respond correctly even once (${formatEN(outage.requests)} ${outage.requests === 1 ? 'request' : 'requests'}) — during that time there was no way to know what was happening in any emergency department in Poland.`
    : null;
  return { byRegion, capped, gap, source };
}

export const historyLabels = {
  facts: { eyebrow: 'From the measurements', id: 'in-the-data', title: (days: number) => `What the data from the last ${days} days show` },
  gap: 'Gap in the data.',
  table: {
    eyebrow: 'Data',
    id: 'all-departments',
    title: 'All emergency departments',
    text: (h: SorHistory) =>
      `A table of all ${h.rows.length} emergency departments for the last ${h.window.days} full days (${periodText(h.window.from, h.window.to)}): over the standard by colour, how many people usually wait, “over…” and missing data. Filter, sort, download as CSV.`,
    link: 'Open the table (in Polish)',
  },
};
