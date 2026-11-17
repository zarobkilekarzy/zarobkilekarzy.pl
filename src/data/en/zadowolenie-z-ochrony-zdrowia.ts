/**
 * Wersja angielska modułu src/data/zadowolenie-z-ochrony-zdrowia.ts: te same liczby i adresy źródeł
 * (importowane), tu tylko angielskie napisy — opisy badań, nazwy krajów, stwierdzenia CBOS i etykiety pomiarów.
 * Brak tłumaczenia nowego wiersza z modułu polskiego wywraca build (funkcja `en`).
 * Treść artykułu: src/content/en/articles/satisfaction-with-healthcare-in-poland.mdx.
 */
import { CBOS_OPINIONS, CBOS_SERIES, IPSOS_COUNTRIES, IRIS_COUNTRIES, STADA_COUNTRIES, STUDIES, type CountryRow, type Study } from '@/data/zadowolenie-z-ochrony-zdrowia';

export { LINKS, study } from '@/data/zadowolenie-z-ochrony-zdrowia';

const en = (map: Record<string, string>, pl: string, what: string) => {
  const value = map[pl];
  if (!value) throw new Error(`[zadowolenie EN] brak tłumaczenia (${what}): „${pl}”`);
  return value;
};

const STUDY_TEXT: Record<Study['key'], { headline: string; measure: string; when: string }> = {
  iris: { headline: 'System “excellent” or “basically good”', measure: 'system “excellent” or “basically good”', when: 'Q4 2025' },
  cbos: { headline: 'Satisfied with healthcare', measure: 'satisfied with healthcare', when: 'June 2025' },
  ipsos: { headline: 'Quality of care index, five questions', measure: 'index of five questions', when: 'July–August 2026' },
  stada: { headline: 'Satisfied with the public system', measure: 'satisfied with the public system', when: 'February–March 2026' },
};

export const STUDIES_EN: Study[] = STUDIES.map((s) => ({ ...s, ...STUDY_TEXT[s.key] }));

const COUNTRY: Record<string, string> = {
  'Korea Płd.': 'South Korea', Malezja: 'Malaysia', Japonia: 'Japan', Hiszpania: 'Spain', Indonezja: 'Indonesia', Australia: 'Australia',
  Szwajcaria: 'Switzerland', Niemcy: 'Germany', USA: 'USA', Austria: 'Austria', Kanada: 'Canada', Irlandia: 'Ireland', Finlandia: 'Finland',
  Włochy: 'Italy', Dominikana: 'Dominican Republic', Rumunia: 'Romania', Bułgaria: 'Bulgaria', Grecja: 'Greece', Polska: 'Poland', Turcja: 'Turkey',
  Singapur: 'Singapore', Indie: 'India', Wietnam: 'Vietnam', Holandia: 'Netherlands', Tajlandia: 'Thailand', RPA: 'South Africa', Belgia: 'Belgium',
  Szwecja: 'Sweden', Argentyna: 'Argentina', 'Nowa Zelandia': 'New Zealand', Francja: 'France', 'Wielka Brytania': 'Great Britain', Meksyk: 'Mexico',
  Brazylia: 'Brazil', Chile: 'Chile', Kolumbia: 'Colombia', Peru: 'Peru', Węgry: 'Hungary', Uzbekistan: 'Uzbekistan', Litwa: 'Lithuania',
  Portugalia: 'Portugal', Kazachstan: 'Kazakhstan', Słowacja: 'Slovakia', Serbia: 'Serbia',
};
const countries = (rows: CountryRow[]): CountryRow[] => rows.map(([name, value]) => [en(COUNTRY, name, 'kraj'), value]);

export const IRIS_COUNTRIES_EN = countries(IRIS_COUNTRIES);
export const IPSOS_COUNTRIES_EN = countries(IPSOS_COUNTRIES);
export const STADA_COUNTRIES_EN = countries(STADA_COUNTRIES);

const MONTH: Record<string, string> = { I: 'Jan', II: 'Feb', III: 'Mar', VI: 'Jun', VII: 'Jul', VIII: 'Aug', IX: 'Sep' };
export const CBOS_SERIES_EN = CBOS_SERIES.map((r) => {
  const [month, year] = r.label.split(' ');
  return { ...r, label: `${en(MONTH, month, 'miesiąc')} ${year}` };
});

const OPINION: Record<string, string> = {
  'Lekarze są kompetentni': 'Doctors are competent',
  'Lekarze angażują się w swoją pracę': 'Doctors are committed to their work',
  'Do lekarza POZ można dostać się bez trudności': 'It is easy to get to a primary care doctor',
  'Wykorzystuje się nowoczesną aparaturę': 'Modern medical equipment is used',
  'Lekarze POZ właściwie rozpoznają problemy pacjenta': 'Primary care doctors diagnose patients’ problems correctly',
  'Pacjenci są traktowani z życzliwością i troską': 'Patients are treated with kindness and care',
  'Jest dobra informacja, gdzie uzyskać pomoc': 'There is good information on where to get help',
  'Nawet w nocy można liczyć na natychmiastową pomoc': 'Immediate medical help is available even at night',
  'Wszyscy pacjenci są równo traktowani': 'All patients are treated equally',
  'Wykorzystuje się nowoczesne rozwiązania': 'Modern solutions are used',
  'Pomoc łatwo uzyskać poza miejscem zamieszkania': 'Help is easy to get away from home',
  'Lekarze i pracownie są w dogodnych lokalizacjach': 'Doctors and diagnostic labs are conveniently located',
  'Opieka nocna i świąteczna dobrze działa': 'Night and holiday care works well',
  'Badania diagnostyczne można wykonać szybko': 'Diagnostic tests can be done quickly',
  'Wizytę można umówić na dogodną godzinę': 'An appointment can be booked at a convenient time',
  'Personelu w szpitalach jest wystarczająco dużo': 'Hospitals have enough medical staff',
  'Łatwo dostać się do specjalisty': 'It is easy to get to a specialist',
};
export const CBOS_OPINIONS_EN = CBOS_OPINIONS.map((r) => ({ ...r, label: en(OPINION, r.label, 'stwierdzenie CBOS') }));
