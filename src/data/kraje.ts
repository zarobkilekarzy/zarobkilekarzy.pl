/**
 * Kraje — wspólne liczby do porównywania systemów ochrony zdrowia (teksty o krajach i strona /kraje/).
 *
 * Zasada: liczba porównywana między krajami stoi TUTAJ, nie w treści artykułu. Każda miara ma jedną
 * definicję, jeden zbiór i jeden rok dla wszystkich krajów; kraj bez wartości ma `null` (brak danych ≠ zero).
 * Artykuł o kraju buduje z tego tabele (`compareTable`), a liczby własne kraju — nieporównywalne wprost
 * z innymi (np. belgijskie dopłaty do honorariów) — zapisuje w `facts` ze źródłem.
 *
 * Skąd dane (odczyt z API Eurostatu 19.11.2026, każda wartość odczytana dwukrotnie):
 * - hlth_sha11_hf (aktualizacja 4.11.2026), rok 2024: TOT_HF w PC_GDP / PPS_HAB / EUR_HAB; HF1 i HF3 w PC_CHE,
 * - hlth_rs_prs2 (13.07.2026), 2024: lekarze „practising” (med_spec=PHYS, wstatus=PRACT) na 100 tys.,
 * - hlth_silc_08 (20.10.2026), 2025: niezaspokojona potrzeba badania lekarskiego, 16+, powody TXP_TFAR_WLIST / TXP / WLIST,
 * - demo_mlexpec (13.11.2026), 2024: oczekiwana długość życia przy urodzeniu, obie płcie,
 * - hlth_cd_apr (17.03.2026), 2023: zgony z przyczyn uleczalnych (mortalit=TRT, icd10=TOTAL, unit=RT), obie płcie.
 * Płace lekarzy wobec przeciętnej płacy: OECD Health Statistics 2025 z src/data/swiat/oecd.json (glob płac).
 * Zadowolenie: src/data/zadowolenie-z-ochrony-zdrowia.ts. Jawność płac: src/data/swiat/jawnosc.ts.
 * Notatki źródłowe: research/kraje/.
 */
import oecd from '@/data/swiat/oecd.json';
import { transparency } from '@/data/swiat/jawnosc';
import { IPSOS_COUNTRIES, OECD_COUNTRIES, STADA_COUNTRIES, LINKS as SAT_LINKS, type CountryRow } from '@/data/zadowolenie-z-ochrony-zdrowia';
import { formatPL } from '@/lib/format';
import type { CompareTable } from '@/types';
import type { OecdGroup, OecdValues } from '@/lib/swiat/types';

const EUROSTAT = (code: string) => `https://ec.europa.eu/eurostat/databrowser/view/${code}/default/table?lang=en`;
export const OECD_REMUN_HREF =
  'https://data-explorer.oecd.org/vis?df%5Bds%5D=dsDisseminateFinalDMZ&df%5Bid%5D=DSD_HEALTH_REAC_EMP%40DF_REMUN&df%5Bag%5D=OECD.ELS.HD';

/** Hub /kraje/ jest szkicem (noindex). Po publikacji: `true` — wtedy także opublikowane teksty (Tajwan, Kanada) dostaną okruszek do hubu. */
export const KRAJE_PUBLISHED = true;

export type CountryCode = 'PL' | 'BE' | 'FR' | 'CZ' | 'DE' | 'AT' | 'SE' | 'DK' | 'NL' | 'HU' | 'IT' | 'ES' | 'GB' | 'CA' | 'US' | 'TW' | 'EU';

export type MetricKey =
  | 'healthGdp' | 'perCapitaPps' | 'perCapitaEur' | 'publicShare' | 'oopShare'
  | 'doctors' | 'unmet' | 'unmetCost' | 'unmetWait' | 'lifeExp' | 'treatable'
  | 'paySpecialistSalaried' | 'paySpecialistSelf' | 'payGpSelf'
  | 'satOecd' | 'satStada' | 'satIpsos';

export interface Metric {
  /** pełna nazwa — nagłówek wiersza w artykule */
  label: string;
  /** krótka nazwa — nagłówek kolumny na stronie hubu */
  short: string;
  unit: '%' | '' | '×';
  decimals: number;
  /** rok danych, gdy wspólny dla wszystkich krajów (OECD podaje różne lata — wtedy rok stoi przy wartości) */
  year?: number;
  source: { label: string; href: string };
  /** koniec skali na wykresach (skala zawsze od zera) */
  max: number;
  /** czego z tą liczbą nie robić */
  guardrail?: string;
}

export const METRICS: Record<MetricKey, Metric> = {
  healthGdp: { label: 'Wydatki na zdrowie jako % PKB', short: '% PKB', unit: '%', decimals: 2, max: 14, year: 2024, source: { label: 'Eurostat, hlth_sha11_hf', href: EUROSTAT('hlth_sha11_hf') } },
  perCapitaPps: { label: 'Na mieszkańca, po uwzględnieniu różnic cen (PPS)', short: 'Na mieszkańca (PPS)', unit: '', decimals: 2, max: 6500, year: 2024, source: { label: 'Eurostat, hlth_sha11_hf', href: EUROSTAT('hlth_sha11_hf') }, guardrail: 'PPS to umowna jednostka o tej samej sile nabywczej, nie euro.' },
  perCapitaEur: { label: 'Na mieszkańca, w euro', short: 'Na mieszkańca (euro)', unit: '', decimals: 2, max: 7000, year: 2024, source: { label: 'Eurostat, hlth_sha11_hf', href: EUROSTAT('hlth_sha11_hf') } },
  publicShare: { label: 'Udział pieniędzy publicznych i obowiązkowych składek', short: 'Publiczne', unit: '%', decimals: 2, max: 100, year: 2024, source: { label: 'Eurostat, hlth_sha11_hf (HF1)', href: EUROSTAT('hlth_sha11_hf') } },
  oopShare: { label: 'Udział wydatków z kieszeni pacjenta', short: 'Z kieszeni pacjenta', unit: '%', decimals: 2, max: 30, year: 2024, source: { label: 'Eurostat, hlth_sha11_hf (HF3)', href: EUROSTAT('hlth_sha11_hf') }, guardrail: 'Bez składek na dobrowolne polisy (to osobna pozycja, HF2).' },
  doctors: { label: 'Lekarze pracujący z pacjentami na 100 tys. mieszkańców', short: 'Lekarze na 100 tys.', unit: '', decimals: 0, max: 600, year: 2024, source: { label: 'Eurostat, hlth_rs_prs2', href: EUROSTAT('hlth_rs_prs2') }, guardrail: 'Osoby, nie etaty: lekarze pracujący z pacjentami, a nie wszyscy uprawnieni do zawodu.' },
  unmet: { label: 'Rezygnacja z wizyty z powodu kosztu, odległości lub kolejki', short: 'Rezygnacja z wizyty', unit: '%', decimals: 1, max: 5, year: 2025, source: { label: 'Eurostat, hlth_silc_08', href: EUROSTAT('hlth_silc_08') }, guardrail: 'Deklaracja w ankiecie EU-SILC (16+), nie pomiar kolejek.' },
  unmetCost: { label: 'Rezygnacja z wizyty z powodu kosztu', short: '…z powodu kosztu', unit: '%', decimals: 1, max: 3, year: 2025, source: { label: 'Eurostat, hlth_silc_08', href: EUROSTAT('hlth_silc_08') } },
  unmetWait: { label: 'Rezygnacja z wizyty z powodu kolejki', short: '…z powodu kolejki', unit: '%', decimals: 1, max: 3, year: 2025, source: { label: 'Eurostat, hlth_silc_08', href: EUROSTAT('hlth_silc_08') } },
  lifeExp: { label: 'Oczekiwana długość życia przy urodzeniu, w latach (Eurostat, 2024)', short: 'Długość życia', unit: '', decimals: 1, max: 90, year: 2024, source: { label: 'Eurostat, demo_mlexpec', href: EUROSTAT('demo_mlexpec') }, guardrail: 'Zależy od stylu życia i zamożności, nie tylko od ochrony zdrowia.' },
  treatable: { label: 'Zgony z przyczyn uleczalnych na 100 tys. mieszkańców', short: 'Zgony do uniknięcia leczeniem', unit: '', decimals: 1, max: 200, year: 2023, source: { label: 'Eurostat, hlth_cd_apr', href: EUROSTAT('hlth_cd_apr') }, guardrail: 'Zgony przed 75. rokiem życia, których przy dobrym leczeniu w porę dałoby się uniknąć; współczynnik wyrównany dla wieku. Im mniej, tym lepiej.' },
  paySpecialistSalaried: { label: 'Specjalista na etacie wobec przeciętnej płacy', short: 'Specjalista, etat', unit: '×', decimals: 2, max: 6, source: { label: 'OECD Health Statistics 2025', href: OECD_REMUN_HREF }, guardrail: 'Płaca na etacie, bez dochodów z kontraktów i własnej praktyki.' },
  paySpecialistSelf: { label: 'Specjalista z własną praktyką wobec przeciętnej płacy', short: 'Specjalista, praktyka', unit: '×', decimals: 2, max: 6, source: { label: 'OECD Health Statistics 2025', href: OECD_REMUN_HREF }, guardrail: 'Dochód z działalności, nie pensja. Dla Polski OECD nie ma danych.' },
  payGpSelf: { label: 'Lekarz rodzinny z własną praktyką wobec przeciętnej płacy', short: 'Rodzinny, praktyka', unit: '×', decimals: 2, max: 6, source: { label: 'OECD Health Statistics 2025', href: OECD_REMUN_HREF } },
  satOecd: { label: 'Zadowoleni z dostępności dobrej opieki w miejscu zamieszkania (OECD / Gallup, 2024)', short: 'Zadowoleni z dostępności', unit: '%', decimals: 0, max: 100, year: 2024, source: { label: 'OECD / Gallup, Health at a Glance 2025', href: SAT_LINKS.oecd } },
  satStada: { label: 'Zadowoleni z publicznego systemu ochrony zdrowia (STADA, 2026)', short: 'Zadowoleni z systemu', unit: '%', decimals: 0, max: 100, year: 2026, source: { label: 'STADA Health Report 2026', href: SAT_LINKS.stada } },
  satIpsos: { label: 'Indeks jakości opieki z pięciu pytań (Ipsos, 2026)', short: 'Indeks jakości', unit: '', decimals: 0, max: 100, year: 2026, source: { label: 'Ipsos Health Service Report 2026', href: SAT_LINKS.ipsos } },
};

type EurostatKey = 'healthGdp' | 'perCapitaPps' | 'perCapitaEur' | 'publicShare' | 'oopShare' | 'doctors' | 'unmet' | 'unmetCost' | 'unmetWait' | 'lifeExp' | 'treatable';

/** liczba własna kraju: ważna dla jego systemu, ale nieporównywalna wprost z innymi */
export interface Fact {
  label: string;
  value: string;
  year: number;
  source: { label: string; href: string };
  /** 'wtórne' = prasa albo opracowanie, nie dokument urzędu */
  kind?: 'pierwotne' | 'wtórne';
}

export interface Country {
  code: CountryCode;
  /** kod ISO 3166-1 numeryczny — klucz w danych globu płac */
  iso?: string;
  name: string;
  /** kod flagi w pakiecie flag-icons (ISO 3166-1 alfa-2 małymi literami; Unia: „eu”) */
  flag: string;
  /** „w Belgii”, „we Francji” */
  locative: string;
  /** model w jednym zdaniu: kto płaci i jak */
  model?: string;
  /** co jest jawne — jedno zdanie; gdy brak, bierzemy opis z globu płac */
  openness?: string;
  /** tekst serwisu o tym kraju */
  text?: { href: string; label: string; kind: 'profil' | 'porównanie'; draft?: boolean };
  eurostat: Record<EurostatKey, number | null>;
  /**
   * Kraj spoza Eurostatu: te same miary z innego źródła. Wartość dostaje gwiazdkę (formatMetric), szacunek — także „ok.”,
   * a strona hubu objaśnia źródła w metodzie (`note`). Wydatki (% PKB, udział źródeł publicznych, z kieszeni): OECD,
   * System of Health Accounts — ta sama metoda co w Eurostacie (Polska ma w obu identyczne wartości). Lekarze, długość
   * życia, zgony uleczalne, rezygnacja z wizyty: noty krajowe OECD (lekarze ×100, bo OECD podaje na 1000 mieszkańców).
   * Tajwan: dane tajwańskich urzędów.
   */
  alt?: { sources: { label: string; href: string }[]; values: Partial<Record<EurostatKey, number>>; estimates?: EurostatKey[]; note: string };
  facts?: Fact[];
}

const OECD_NOTE = (file: string) => `https://www.oecd.org/en/publications/health-at-a-glance-2025_15a55280-en/${file}`;
/** Polska i średnia OECD w tych samych notach — do objaśnienia gwiazdek na stronie hubu. */
export const OECD_NOTE_PL = { href: OECD_NOTE('poland_c3917772-en.html'), healthGdp: 8.1, publicShare: 78, doctors: 390, unmet: 3.8, lifeExp: 78.4, treatable: 114 };
/** dokładność not OECD (miejsca po przecinku) */
const ALT_DECIMALS: Partial<Record<EurostatKey, number>> = { healthGdp: 2, publicShare: 1, oopShare: 1, doctors: 0, unmet: 1, lifeExp: 1, treatable: 0 };
/** OECD, System of Health Accounts (API SDMX): % PKB oraz udział schematów finansowania w bieżących wydatkach, 2024 r. */
const OECD_SHA = { label: 'OECD, System of Health Accounts (2024)', href: 'https://sdmx.oecd.org/public/rest/data/OECD.ELS.HD,DSD_SHA@DF_SHA/GBR+CAN+USA+POL.A.EXP_HEALTH.PT_B1GQ+PT_EXP_HLTH.HF1+HF11+HF121+HF122+HF3+_T._Z._T._T._T._Z._Z._Z?startPeriod=2024&endPeriod=2024&format=csvfile' };

const HPR = (file: string) => `https://www.belgiqueenbonnesante.be/images/INAMI/Rapports/HealthcareProviders/HPR2024-${file}.pdf`;
const HCAAM = 'https://www.strategie-plan.gouv.fr/files/files/Publications/2025/2025-10-02%20-%20HCAAM%20-%20D%C3%A9passement%20d%27honoraires/Annexe%202%20Evolution%20secteur%202%20Rapport%20Hcaam.pdf';
const DREES_INCOME = 'https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse/etudes-et-resultats/241220_ER_revenu-des-medecins-liberaux';

export const COUNTRIES: Country[] = [
  {
    code: 'PL', iso: '616', name: 'Polska', flag: 'pl', locative: 'w Polsce',
    model: 'Jeden publiczny płatnik (NFZ), składka od dochodu; świadczenia kontraktowane z placówkami.',
    eurostat: { healthGdp: 7.84, perCapitaPps: 2614.85, perCapitaEur: 1826.78, publicShare: 76.92, oopShare: 16.57, doctors: 386.2, unmet: 2.9, unmetCost: 0.5, unmetWait: 2.2, lifeExp: 78.5, treatable: 132.71 },
  },
  {
    code: 'BE', iso: '056', name: 'Belgia', flag: 'be', locative: 'w Belgii',
    model: 'Obowiązkowe ubezpieczenie przez siedem kas; lekarze opłacani za każdą usługę według publicznego cennika.',
    openness: 'Jawny jest status taryfowy każdego lekarza i przeciętne wypłaty według specjalności. Publikacji sumy dla konkretnego lekarza nie znaleźliśmy.',
    text: { href: '/analizy/belgia-ochrona-zdrowia/', label: 'Jak działa belgijska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 11.07, perCapitaPps: 4891.55, perCapitaEur: 5793.56, publicShare: 73.39, oopShare: 21.78, doctors: 334.25, unmet: 0.9, unmetCost: 0.8, unmetWait: 0.1, lifeExp: 82.4, treatable: 58.83 },
    facts: [
      { label: 'Lekarze, którzy przystąpili do umowy taryfowej 2026–2027', value: '85,72%', year: 2026, source: { label: 'INAMI', href: 'https://www.inami.fgov.be/fr/actualites/chiffres-d-adhesion-aux-accords-tarifaires-disponibles-accords-medecins-dentistes-sages-femmes-et-logopedes-2026-2027' } },
      { label: 'Dermatolodzy stosujący urzędowe taryfy', value: '23%', year: 2024, source: { label: 'INAMI, Health Professionals Report', href: HPR('Dermatologist') } },
      { label: 'Lekarze rodzinni stosujący urzędowe taryfy', value: '88%', year: 2024, source: { label: 'INAMI, Health Professionals Report', href: HPR('General_Practitioner') } },
      { label: 'Refundacja na lekarza rodzinnego w pełnym wymiarze (nie dochód)', value: '228 196 euro', year: 2024, source: { label: 'INAMI, Health Professionals Report', href: HPR('General_Practitioner') } },
      { label: 'Budżet refundacji świadczeń', value: '40,986 mld euro', year: 2026, source: { label: 'INAMI', href: 'https://www.inami.fgov.be/fr/actualites/le-budget-de-l-assurance-soins-de-sante-s-elevera-en-2026-a-46-775-milliards-d-euros' } },
      { label: 'Nienależne rozliczenia wykryte przez kontrolę', value: '15,87 mln euro', year: 2025, source: { label: 'INAMI, raport służby kontrolnej', href: 'https://www.riziv.fgov.be/SiteCollectionDocuments/evaluation_controle_rapport_activites_2025.pdf' } },
    ],
  },
  {
    code: 'FR', iso: '250', name: 'Francja', flag: 'fr', locative: 'we Francji',
    model: 'Jedna publiczna kasa z budżetem uchwalanym przez parlament; resztę kosztów pokrywają polisy uzupełniające.',
    openness: 'Jawny jest sektor taryfowy każdego lekarza i dochody lekarzy według specjalności. Publikacji sumy dla konkretnego lekarza nie znaleźliśmy.',
    text: { href: '/analizy/francja-ochrona-zdrowia/', label: 'Jak działa francuska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 11.33, perCapitaPps: 4490.89, perCapitaEur: 4833.59, publicShare: 83.31, oopShare: 10.17, doctors: 393.85, unmet: 3.7, unmetCost: 1.9, unmetWait: 1.4, lifeExp: 83.0, treatable: 58.76 },
    facts: [
      { label: 'Wydatki objęte krajowym celem ONDAM', value: '265,4 mld euro', year: 2025, source: { label: 'Senat Francji', href: 'https://www.senat.fr/rap/a25-747/a25-7476.html' } },
      { label: 'Deficyt gałęzi chorobowej', value: '15,9 mld euro', year: 2025, source: { label: 'Senat Francji', href: 'https://www.senat.fr/rap/a25-747/a25-747_mono.html' } },
      { label: 'Dopłaty ponad urzędową taryfę', value: '4,5 mld euro', year: 2024, source: { label: 'HCAAM', href: HCAAM } },
      { label: 'Specjaliści z własną praktyką, którzy mogą brać więcej niż taryfa', value: '56%', year: 2024, source: { label: 'HCAAM', href: HCAAM } },
      { label: 'Średni roczny dochód lekarza z własną praktyką', value: '124 tys. euro', year: 2021, source: { label: 'DREES', href: DREES_INCOME } },
      { label: 'Średni roczny dochód lekarza rodzinnego z własną praktyką', value: '98 tys. euro', year: 2021, source: { label: 'DREES', href: DREES_INCOME } },
    ],
  },
  {
    code: 'CZ', iso: '203', name: 'Czechy', flag: 'cz', locative: 'w Czechach',
    model: 'Siedem kas i składka 13,5%; za ponad połowę ubezpieczonych płaci państwo, stawki ustala się co roku w negocjacjach.',
    openness: 'Umowy kas z placówkami muszą być opublikowane, inaczej nie są skuteczne. Płacę konkretnego lekarza urząd poda tylko po wykazaniu przeważającego interesu publicznego.',
    text: { href: '/analizy/czechy-ochrona-zdrowia/', label: 'Jak działa czeska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 8.65, perCapitaPps: 3142.66, perCapitaEur: 2543.74, publicShare: 85.55, oopShare: 13.56, doctors: 429.41, unmet: 0.3, unmetCost: 0.0, unmetWait: 0.2, lifeExp: 80.1, treatable: 107.19 },
  },
  {
    code: 'DE', iso: '276', name: 'Niemcy', flag: 'de', locative: 'w Niemczech',
    model: '93 kasy ustawowe i osobne ubezpieczenie prywatne; pieniądze kas dzieli między lekarzy ich samorząd.',
    openness: 'Jawne są tabele płac, cenniki i wynagrodzenia zarządów kas. Zarobków konkretnego lekarza się nie publikuje.',
    text: { href: '/analizy/niemcy-ochrona-zdrowia/', label: 'Jak działa niemiecka ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 12.21, perCapitaPps: 5790.77, perCapitaEur: 6327.98, publicShare: 85.88, oopShare: 11.1, doctors: 475.4, unmet: 1.0, unmetCost: 0.2, unmetWait: 0.8, lifeExp: 81.2, treatable: 83.32 },
  },
  {
    code: 'AT', iso: '040', name: 'Austria', flag: 'at', locative: 'w Austrii',
    model: 'Kasa z przydziału, lekarze kasowi i rosnąca grupa lekarzy bez umowy, którym pacjent płaci sam.',
    openness: 'Dochody lekarzy policzono z danych podatkowych bez nazwisk, tabele płac szpitalnych są publiczne. Cen w gabinetach bez umowy państwo nie zna.',
    text: { href: '/analizy/austria-ochrona-zdrowia/', label: 'Jak działa austriacka ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 11.71, perCapitaPps: 5347.51, perCapitaEur: 6301.66, publicShare: 75.72, oopShare: 16.72, doctors: 563.51, unmet: 0.9, unmetCost: 0.3, unmetWait: 0.6, lifeExp: 82.1, treatable: 68.46 },
  },
  {
    code: 'SE', iso: '752', name: 'Szwecja', flag: 'se', locative: 'w Szwecji',
    model: 'Bez kas: 21 regionów płaci za leczenie z własnego podatku, lekarze pracują na etatach.',
    openness: 'Płaca każdego pracownika regionu jest dokumentem jawnym na wniosek, a kolejki publikuje się co miesiąc. Płac w prywatnych firmach opłacanych przez region nie widać.',
    text: { href: '/analizy/szwecja-ochrona-zdrowia/', label: 'Jak działa szwedzka ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 11.16, perCapitaPps: 4776.56, perCapitaEur: 5949.59, publicShare: 86.06, oopShare: 12.83, doctors: 465.86, unmet: 2.1, unmetCost: 0.3, unmetWait: 1.7, lifeExp: 83.8, treatable: 58.37 },
  },
  {
    code: 'DK', iso: '208', name: 'Dania', flag: 'dk', locative: 'w Danii',
    model: 'Leczenie opłacane z podatków i bezpłatne dla pacjenta; szpitale prowadzą regiony, lekarze rodzinni mają własne praktyki.',
    openness: 'Urząd publikuje imiennie powiązania lekarzy z przemysłem wraz z roczną kwotą, a płacę pracownika publicznego można poznać na wniosek. Wypłat dla poszczególnych praktyk nie widać.',
    text: { href: '/analizy/dania-ochrona-zdrowia/', label: 'Jak działa duńska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 9.59, perCapitaPps: 4471.49, perCapitaEur: 6298.24, publicShare: 82.71, oopShare: 14.61, doctors: 466.42, unmet: 2.9, unmetCost: 0.4, unmetWait: 2.3, lifeExp: 82.0, treatable: 66.11 },
  },
  {
    code: 'NL', iso: '528', name: 'Holandia', flag: 'nl', locative: 'w Holandii',
    model: 'Obowiązkowa polisa u prywatnych ubezpieczycieli, którzy muszą przyjąć każdego; pakiet świadczeń określa państwo.',
    openness: 'Wynagrodzenia zarządów szpitali są z mocy ustawy publikowane imiennie, a szpitale co dwa tygodnie zgłaszają czas oczekiwania. Limit i publikacja nie obejmują specjalistów pracujących na własny rachunek.',
    text: { href: '/analizy/holandia-ochrona-zdrowia/', label: 'Jak działa holenderska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 10.10, perCapitaPps: 5253.83, perCapitaEur: 6295.67, publicShare: 83.04, oopShare: 11.85, doctors: 395.61, unmet: 0.5, unmetCost: 0.3, unmetWait: 0.2, lifeExp: 81.9, treatable: 59.97 },
  },
  {
    code: 'HU', iso: '348', name: 'Węgry', flag: 'hu', locative: 'na Węgrzech',
    model: 'Jeden publiczny płatnik i państwowe szpitale; płace lekarzy szpitalnych wyznacza tabela w ustawie.',
    openness: 'Pacjent może sprawdzić swoje miejsce w kolejce do operacji, a tabela płac lekarzy jest w ustawie. Zarobków poszczególnych lekarzy i zgód na pracę dodatkową nie widać.',
    text: { href: '/analizy/wegry-ochrona-zdrowia/', label: 'Jak działa węgierska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 6.45, perCapitaPps: 2018.32, perCapitaEur: 1391.13, publicShare: 73.84, oopShare: 22.80, doctors: 371.53, unmet: 1.4, unmetCost: 0.3, unmetWait: 1.1, lifeExp: 76.8, treatable: 172.31 },
  },
  {
    // liczba lekarzy we Włoszech: przerwa w serii Eurostatu, definicja nierozstrzygnięta — w tekście opisana z zastrzeżeniem
    code: 'IT', iso: '380', name: 'Włochy', flag: 'it', locative: 'we Włoszech',
    model: 'Narodowa służba zdrowia finansowana z podatków i prowadzona przez regiony.',
    openness: 'Rząd co roku raportuje parlamentowi prywatną praktykę lekarzy w publicznych szpitalach, a wynagrodzenia kierowników oddziałów są publikowane — bez kwot z prywatnej praktyki. Łącznego dochodu lekarza nie widać.',
    text: { href: '/analizy/wlochy-ochrona-zdrowia/', label: 'Jak działa włoska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 8.46, perCapitaPps: 3224.83, perCapitaEur: 3158.69, publicShare: 73.62, oopShare: 22.98, doctors: 575.43, unmet: 2.5, unmetCost: 1.6, unmetWait: 0.9, lifeExp: 83.7, treatable: 61.85 },
  },
  {
    // liczba lekarzy to szacunek Eurostatu (flaga „e”)
    code: 'ES', iso: '724', name: 'Hiszpania', flag: 'es', locative: 'w Hiszpanii',
    model: 'Narodowy system zdrowia finansowany z podatków i prowadzony przez 17 wspólnot autonomicznych.',
    openness: 'Zgody na łączenie pracy publicznej z prywatną są jawne z mocy ustawy, a kolejki publikuje się co pół roku dla każdego regionu. Zarobki lekarzy pozostają chronione.',
    text: { href: '/analizy/hiszpania-ochrona-zdrowia/', label: 'Jak działa hiszpańska ochrona zdrowia', kind: 'profil' },
    eurostat: { healthGdp: 9.25, perCapitaPps: 3318.68, perCapitaEur: 3015.98, publicShare: 72.25, oopShare: 21.47, doctors: 463.78, unmet: 1.6, unmetCost: 0.2, unmetWait: 1.5, lifeExp: 84.0, treatable: 60.18 },
  },
  {
    code: 'GB', iso: '826', name: 'Wielka Brytania', flag: 'gb', locative: 'w Wielkiej Brytanii',
    model: 'Leczenie opłacane z podatków i bezpłatne dla pacjenta; lekarze szpitalni na krajowych skalach płac.',
    openness: 'Kolejki w każdym szpitalu publikuje się co miesiąc, a każda przychodnia podaje średnie zarobki swoich lekarzy. Zarobków konkretnego lekarza szpitalnego nie widać.',
    text: { href: '/analizy/wielka-brytania-ochrona-zdrowia/', label: 'Jak działa brytyjska ochrona zdrowia', kind: 'profil' },
    // poza Eurostatem (po brexicie); wspólne miary OECD do ręcznego odczytu — research/kraje/wielka-brytania.md
    eurostat: { healthGdp: null, perCapitaPps: null, perCapitaEur: null, publicShare: null, oopShare: null, doctors: null, unmet: null, unmetCost: null, unmetWait: null, lifeExp: null, treatable: null },
    alt: {
      sources: [OECD_SHA, { label: 'OECD, nota krajowa: Wielka Brytania', href: OECD_NOTE('united-kingdom_82034050-en.html') }],
      values: { healthGdp: 11.08, publicShare: 81.0, oopShare: 14.2, doctors: 340, unmet: 4.5, lifeExp: 81, treatable: 71 },
      note: 'Wielka Brytania: wydatki według rachunków zdrowia OECD za 2024 r.; lekarze, rezygnacja z wizyty, długość życia i zgony z przyczyn uleczalnych z noty krajowej OECD.',
    },
  },
  {
    code: 'CA', iso: '124', name: 'Kanada', flag: 'ca', locative: 'w Kanadzie',
    model: 'Trzynaście publicznych planów prowincji i terytoriów; wizyta u lekarza i szpital bez opłat, lekarze rozliczani za usługę.',
    openness: 'Kolumbia Brytyjska publikuje płatności z planu imiennie, a czas oczekiwania na operacje cały kraj mierzy według jednej definicji. Sumy z różnych źródeł publicznych nikt nie zestawia.',
    text: { href: '/analizy/kanada-ochrona-zdrowia/', label: 'Jak działa kanadyjska ochrona zdrowia', kind: 'profil' },
    // poza Eurostatem; wspólne miary z not OECD — research/kraje/oecd-noty-ca-us.md
    eurostat: { healthGdp: null, perCapitaPps: null, perCapitaEur: null, publicShare: null, oopShare: null, doctors: null, unmet: null, unmetCost: null, unmetWait: null, lifeExp: null, treatable: null },
    alt: {
      sources: [OECD_SHA, { label: 'OECD, nota krajowa: Kanada', href: OECD_NOTE('canada_41ea57c7-en.html') }],
      values: { healthGdp: 11.52, publicShare: 70.6, oopShare: 15.0, doctors: 270, unmet: 9.1, lifeExp: 81.7, treatable: 58 },
      note: 'Kanada: wydatki według rachunków zdrowia OECD za 2024 r.; pozostałe miary z noty krajowej OECD.',
    },
  },
  {
    code: 'US', iso: '840', name: 'USA', flag: 'us', locative: 'w USA',
    model: 'Wielu płatników: ubezpieczyciele wybrani przez pracodawców, publiczne programy Medicare i Medicaid; 7,9% mieszkańców bez ubezpieczenia.',
    openness: 'Wypłaty z programu Medicare dla każdego lekarza i płatności przemysłu są publikowane imiennie. Płatności prywatnych ubezpieczycieli i łącznego dochodu nie widać.',
    text: { href: '/analizy/usa-ochrona-zdrowia/', label: 'Jak działa amerykańska ochrona zdrowia', kind: 'profil' },
    // poza Eurostatem; wspólne miary z not OECD — research/kraje/oecd-noty-ca-us.md
    eurostat: { healthGdp: null, perCapitaPps: null, perCapitaEur: null, publicShare: null, oopShare: null, doctors: null, unmet: null, unmetCost: null, unmetWait: null, lifeExp: null, treatable: null },
    alt: {
      sources: [OECD_SHA, { label: 'OECD, nota krajowa: USA', href: OECD_NOTE('united-states_3517f35e-en.html') }],
      values: { healthGdp: 17.20, publicShare: 50.5, oopShare: 11.0, doctors: 270, lifeExp: 78.4, treatable: 95 },
      estimates: ['publicShare'],
      note: 'USA: wydatki według rachunków zdrowia OECD za 2024 r. Udział źródeł publicznych to szacunek: suma programów rządowych (27,4%) i obowiązkowych ubezpieczeń publicznych (23,1%). OECD podaje dla USA 83,1%, bo dolicza obowiązkowe ubezpieczenia prywatne (32,6%), czyli polisy od pracodawców — w Europie taka kategoria prawie nie istnieje. Porównywalnego pomiaru rezygnacji z wizyt dla USA nie ma.',
    },
  },
  {
    code: 'TW', iso: '158', name: 'Tajwan', flag: 'tw', locative: 'na Tajwanie',
    model: 'Jeden publiczny płatnik, budżet globalny i punktowa wycena świadczeń.',
    openness: 'Pacjent dostaje rachunek z każdej wizyty, sprawozdania szpitali są jawne. Zarobków pojedynczych lekarzy Tajwan nie publikuje.',
    text: { href: '/analizy/tajwan-ochrona-zdrowia/', label: 'Jak działa tajwańska ochrona zdrowia', kind: 'profil' },
    // poza Eurostatem i OECD — dane tajwańskich urzędów (research/kraje/luki-hub.md)
    eurostat: { healthGdp: null, perCapitaPps: null, perCapitaEur: null, publicShare: null, oopShare: null, doctors: null, unmet: null, unmetCost: null, unmetWait: null, lifeExp: null, treatable: null },
    alt: {
      sources: [
        { label: 'Ministerstwo zdrowia Tajwanu, National Health Expenditure 2024', href: 'https://www.mohw.gov.tw/dl-99631-cfe880cf-a90b-4eba-b240-351bf8abfd75.html' },
        { label: 'Ministerstwo zdrowia Tajwanu, statystyka personelu medycznego', href: 'https://www.mohw.gov.tw/dl-63140-2b5ec371-267a-4872-90d9-04ddf7f75bfe.html' },
        { label: 'Ministerstwo spraw wewnętrznych Tajwanu, tablice trwania życia', href: 'https://www.moi.gov.tw/News_Content.aspx?n=4&s=340439' },
      ],
      values: { healthGdp: 6.85, publicShare: 59.2, oopShare: 39.9, doctors: 236, lifeExp: 81.3 },
      note: 'Tajwan: dane tajwańskich urzędów — wydatki bieżące za 2024 r. (bez inwestycji), lekarze medycyny zachodniej z prawem praktyki w 2024 r., długość życia w 2025 r. Wydatki z kieszeni są liczone szerzej niż w Europie (m.in. leki bez recepty i suplementy), więc udział 39,9% jest zawyżony względem pozostałych krajów. Zgonów z przyczyn uleczalnych Tajwan nie publikuje.',
    },
  },
  {
    code: 'EU', name: 'UE-27', flag: 'eu', locative: 'w Unii',
    // liczba lekarzy: Eurostat nie podaje wartości dla całej Unii w tym zbiorze
    eurostat: { healthGdp: 10.16, perCapitaPps: 4074.88, perCapitaEur: 4074.88, publicShare: 80.33, oopShare: 15.06, doctors: null, unmet: 2.4, unmetCost: 1.0, unmetWait: 1.2, lifeExp: 81.5, treatable: 86.81 },
  },
];

/** Tekst o innym kraju, który nie jest opisem całego systemu — osobna lista na stronie hubu. */
export const TOPIC_TEXTS = [
  { flag: 'eu', name: 'Porównanie', title: 'Lekarz w szpitalu publicznym i w prywatnym gabinecie — jak regulują to inne kraje', href: '/analizy/praca-publiczna-i-prywatna-w-innych-krajach/', summary: 'Zgoda, zgłoszenie, wybór jednej strony albo nic: zasady łączenia pracy publicznej z prywatną w 15 krajach i to, co o niej wiadomo.' },
  { flag: 'eu', name: 'Porównanie', title: 'Kto liczy kolejki — jak inne kraje mierzą czas oczekiwania na leczenie', href: '/analizy/kolejki-w-innych-krajach/', summary: 'Kto mierzy kolejki, jak często i co się dzieje po przekroczeniu terminu — 15 krajów; ta sama operacja w Polsce ma w OECD dwie różne liczby.' },
  { flag: 'ca', name: 'Kanada', title: 'Kanada: gdy rząd narzuca lekarzom warunki ustawą', href: '/analizy/kanada-lekarze-ustawa-specjalna/', summary: 'Spory prowincji z lekarzami o płace: Quebec, Ontario, Alberta. Część prowincji publikuje płatności imiennie.' },
];

export const country = (code: CountryCode) => COUNTRIES.find((c) => c.code === code)!;

const PAY_GROUP: Partial<Record<MetricKey, OecdGroup>> = { paySpecialistSalaried: 'se', paySpecialistSelf: 'sf', payGpSelf: 'gf' };
const SATISFACTION: Partial<Record<MetricKey, CountryRow[]>> = { satOecd: OECD_COUNTRIES, satStada: STADA_COUNTRIES, satIpsos: IPSOS_COUNTRIES };
const isEurostat = (key: MetricKey): key is EurostatKey => key in country('PL').eurostat;

/** Wartość miary dla kraju; `year` tylko wtedy, gdy różni się między krajami (OECD). */
export function metricValue(code: CountryCode, key: MetricKey): { value: number; year?: number; alt?: boolean; estimate?: boolean; decimals?: number } | null {
  const c = country(code);
  if (isEurostat(key)) {
    const value = c.eurostat[key];
    if (value !== null) return { value };
    const alt = c.alt?.values[key];
    return alt === undefined ? null : { value: alt, alt: true, estimate: c.alt!.estimates?.includes(key), decimals: ALT_DECIMALS[key] };
  }
  const group = PAY_GROUP[key];
  if (group) {
    const obs = c.iso ? (oecd as unknown as Record<string, { v: OecdValues }>)[c.iso]?.v[group]?.r : undefined;
    return obs ? { value: obs[0], year: obs[1] } : null;
  }
  const row = SATISFACTION[key]?.find(([name]) => name === c.name);
  return row ? { value: row[1] } : null;
}

/** Tekst komórki: „11,07%”, „5,32× (2024)”, „11,08%*” (gwiazdka = inne źródło niż Eurostat), „ok. 50,5%*” (szacunek), „brak danych”. */
export function formatMetric(code: CountryCode, key: MetricKey, withYear = true): string {
  const m = METRICS[key];
  const v = metricValue(code, key);
  if (!v) return 'brak danych';
  const text = `${v.estimate ? 'ok. ' : ''}${formatPL(v.value, v.decimals ?? m.decimals)}${m.unit}${v.alt ? '*' : ''}`;
  return withYear && v.year ? `${text} (${v.year})` : text;
}

/** Tabela „miary w wierszach, kraje w kolumnach” — do artykułu o jednym kraju. */
export function compareTable(caption: string, codes: CountryCode[], keys: MetricKey[], marked: MetricKey[] = []): CompareTable {
  return {
    caption,
    columns: ['', ...codes.map((c) => country(c).name)],
    rows: keys.map((key) => ({ cells: [METRICS[key].label, ...codes.map((c) => formatMetric(c, key))], marked: marked.includes(key) })),
  };
}

/** Uwagi do pojedynczych liczb z Eurostatu i OECD — to, co dotyczy jednego kraju, a nie całej miary. */
const CELL_NOTES: Partial<Record<`${CountryCode}:${MetricKey}`, string>> = {
  'BE:doctors': 'Lekarze pracujący z pacjentami. Uprawnionych do zawodu jest w Belgii 660 na 100 tys. mieszkańców, czyli prawie dwa razy więcej.',
  'AT:doctors': 'Austria wlicza do tej liczby lekarzy w trakcie szkolenia.',
  'PL:paySpecialistSalaried': 'Tylko specjaliści na etacie — bez kontraktów, na których pracuje większość polskich specjalistów.',
  'US:publicShare': 'Szacunek: suma programów rządowych (27,4%) i obowiązkowych ubezpieczeń publicznych (23,1%) według rachunków zdrowia OECD za 2024 r. OECD podaje dla USA 83,1%, bo dolicza obowiązkowe ubezpieczenia prywatne (32,6%), czyli polisy od pracodawców.',
  'TW:healthGdp': 'Dane ministerstwa zdrowia Tajwanu za 2024 r.: wydatki bieżące, bez inwestycji. Tajwanu nie ma w Eurostacie ani w OECD.',
  'TW:publicShare': 'Dane ministerstwa zdrowia Tajwanu za 2024 r.: budżet państwa i obowiązkowe ubezpieczenie zdrowotne.',
  'TW:oopShare': 'Dane ministerstwa zdrowia Tajwanu za 2024 r. Liczone szerzej niż w Europie — m.in. z lekami bez recepty i suplementami — więc udział jest zawyżony względem pozostałych krajów.',
  'TW:doctors': 'Dane ministerstwa zdrowia Tajwanu za 2024 r.: lekarze medycyny zachodniej z prawem praktyki.',
  'TW:lifeExp': 'Dane ministerstwa spraw wewnętrznych Tajwanu za 2025 r. — o rok nowsze niż dla pozostałych krajów.',
};
const SHA_KEYS: MetricKey[] = ['healthGdp', 'publicShare', 'oopShare'];

/** Objaśnienie pojedynczej liczby w tabeli hubu: uwaga własna kraju albo — dla wartości spoza Eurostatu — skąd pochodzi. */
export function cellNote(code: CountryCode, key: MetricKey): string | undefined {
  const own = CELL_NOTES[`${code}:${key}`];
  if (own) return own;
  if (!metricValue(code, key)?.alt) return undefined;
  if (SHA_KEYS.includes(key)) return 'Według rachunków zdrowia OECD za 2024 r. — liczone tą samą metodą co w Eurostacie, w którym tego kraju nie ma.';
  const pl = OECD_NOTE_PL[key as keyof typeof OECD_NOTE_PL];
  const m = METRICS[key];
  return `Według noty krajowej OECD (Health at a Glance 2025), która liczy tę miarę nieco inaczej niż Eurostat${typeof pl === 'number' ? `: Polska ma w niej ${formatPL(pl, ALT_DECIMALS[key as EurostatKey] ?? m.decimals)}${m.unit}, a w Eurostacie ${formatMetric('PL', key)}` : ''}.`;
}

/** Tabela „kraje w wierszach, miary w kolumnach” — na stronę hubu. */
export function countryTable(caption: string, codes: CountryCode[], keys: MetricKey[], marked: CountryCode[] = ['PL']): CompareTable {
  return {
    caption,
    columns: ['', ...keys.map((key) => METRICS[key].short)],
    // dymek przy nagłówku: pełna nazwa miary, rok, zastrzeżenie i źródło; przy kraju spoza Eurostatu — skąd liczby
    hints: [undefined, ...keys.map((key) => { const m = METRICS[key]; return `${m.label}${m.year && !m.label.includes(String(m.year)) ? ` (${m.year})` : ''}. ${m.guardrail ? `${m.guardrail} ` : ''}Źródło: ${m.source.label}.`; })],
    rows: codes.map((c) => ({ cells: [country(c).name, ...keys.map((key) => formatMetric(c, key))], marked: marked.includes(c), cellHints: [undefined, ...keys.map((key) => cellNote(c, key))] })),
  };
}

/** Co jest jawne: własny opis kraju albo opis z globu płac. */
export const opennessOf = (code: CountryCode): string | undefined => {
  const c = country(code);
  return c.openness ?? (c.iso ? transparency[c.iso]?.text : undefined);
};

/**
 * Wiersz wykresu rozrzutu (`blocks/SpreadRows`): jedna miara, wyróżniony kraj, pozostałe kraje jako kropki,
 * średnia Unii jako kreska. `max` — koniec skali wiersza (skala od zera).
 */
export function spreadRow(key: MetricKey, max: number, subject: CountryCode = 'PL') {
  const m = METRICS[key];
  const others = COUNTRIES.filter((c) => c.code !== subject && c.code !== 'EU')
    .map((c) => {
      const v = metricValue(c.code, key);
      // wartość z innego źródła niż Eurostat pokazujemy tak jak w tabeli: z gwiazdką, szacunek z „ok.”
      return { label: c.name, value: v?.value, display: v?.alt ? formatMetric(c.code, key, false) : undefined };
    })
    .filter((d): d is { label: string; value: number; display: string | undefined } => d.value !== undefined);
  return {
    label: m.label,
    note: m.year ? `${m.year} r.` : undefined,
    value: metricValue(subject, key)!.value,
    average: metricValue('EU', key)?.value,
    dots: others,
    // koniec skali nie niższy od największej wartości — kropka nie może wyjść poza wykres
    max: Math.max(max, metricValue(subject, key)!.value, ...others.map((d) => d.value)),
    unit: m.unit,
    decimals: m.decimals,
  };
}
