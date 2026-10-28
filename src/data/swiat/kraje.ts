/**
 * Glob płac lekarzy: dane krajowe spoza bazy OECD (urzędy statystyczne, ministerstwa, tabele płac).
 * Klucz = numeryczny kod ISO 3166-1 (jak w konturach src/data/geo/swiat-110m.json).
 * Liczby sprawdzone w źródłach pierwotnych 27.10.2026; notatki z wyszukiwania: research/swiat/.
 *
 * Na mapę trafia tylko `kind: 'avg'` — przeciętna płaca lekarzy i przeciętna płaca w kraju z tego samego urzędu.
 * Kursy do dolara: średnie roczne Banku Światowego (PA.NUS.FCRF), Tajwan — Fed G.5A.
 * PPP: Bank Światowy, konsumpcja prywatna (PA.NUS.PRVT.PP) — ta sama miara co u OECD; Tajwan — MFW (PPP całego PKB).
 */
import type { NationalEntry, Rate } from '@/lib/swiat/types';
import { LINKS as CANADA_LINKS, PAYMENTS as CANADA_PAYMENTS } from '@/data/kanada-lekarze-ustawa-specjalna';
import { formatPL } from '@/lib/format';

const canadaAvg = CANADA_PAYMENTS.find((p) => p.name === 'Kanada')!.avg;

const WB_FX = 'Bank Światowy, średni kurs roczny (PA.NUS.FCRF)';
const WB_PPP = 'Bank Światowy, PPP konsumpcji prywatnej (PA.NUS.PRVT.PP)';
const fx = (value: number, year: number, source = WB_FX): Rate => ({ value, year, source });
const ppp = (value: number, year: number, source = WB_PPP): Rate => ({ value, year, source });

const EUROSTAT_SES = (geo: string) =>
  `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/earn_ses22_49?format=JSON&lang=en&geo=${geo}&sex=T&indic_se=ERN&unit=NAC`;
const ILOSTAT = 'https://sdmx.ilo.org/rest/data/ILO,DF_EAR_EMTA_SEX_ECO_CUR_NB/';

/** Eurostat SES 2022: specjaliści (ISCO 2) w sekcji Q wobec wszystkich pracowników, rocznie */
function ses(geo: string, currency: string, group: string, all: string, ratio: string): NationalEntry {
  return {
    kind: 'broad',
    group: 'Specjaliści z wyższym wykształceniem (ISCO 2) w ochronie zdrowia i pomocy społecznej',
    rows: [
      ['Specjaliści w ochronie zdrowia', `${group} ${currency} rocznie, średnia 2022 (${ratio}×)`],
      ['Wszyscy pracownicy', `${all} ${currency} rocznie`],
    ],
    note: 'Eurostat podaje płace całej grupy specjalistów w sekcji „ochrona zdrowia i pomoc społeczna”: lekarzy razem m.in. z pielęgniarkami z wyższym wykształceniem, farmaceutami i psychologami. Bez administracji publicznej i zakładów poniżej 10 osób. Płac samych lekarzy nie znaleźliśmy.',
    sources: [{ label: 'Eurostat, Structure of Earnings Survey 2022, zbiór earn_ses22_49', href: EUROSTAT_SES(geo) }],
  };
}

/** cały sektor „ochrona zdrowia i pomoc społeczna” wobec wszystkich pracowników, miesięcznie */
function sector(currency: string, value: string, all: string, ratio: string, period: string, who: string, source: { label: string; href: string }, extra = ''): NationalEntry {
  return {
    kind: 'broad',
    group: 'Cały sektor „ochrona zdrowia i pomoc społeczna”',
    rows: [
      ['Sektor', `${value} ${currency} miesięcznie, średnia ${period} (${ratio}×)`],
      ['Wszyscy pracownicy', `${all} ${currency} miesięcznie`],
    ],
    note: `${who} podaje płace całego sektora, razem z pielęgniarkami, personelem pomocniczym i pomocą społeczną. Płac samych lekarzy nie znaleźliśmy.${extra}`,
    sources: [source],
  };
}

const ilo = { label: 'ILOSTAT, przeciętne miesięczne zarobki według sektorów (EAR_EMTA)', href: ILOSTAT };

/** ILOSTAT: grupa „specjaliści” (ISCO 2) wobec wszystkich pracowników, miesięcznie — wyliczenie MOP z mikrodanych badań krajowych */
function isco2(currency: string, value: string, all: string, ratio: string, year: number): NationalEntry {
  return {
    kind: 'broad',
    group: 'Cała grupa „specjaliści” (ISCO 2)',
    rows: [
      ['Grupa „specjaliści”', `${value} ${currency} miesięcznie, średnia ${year} (${ratio}×)`],
      ['Wszyscy pracownicy', `${all} ${currency} miesięcznie`],
    ],
    note: 'Międzynarodowa Organizacja Pracy wylicza płace z mikrodanych krajowego badania, ale tylko dla całych grup zawodów. W grupie „specjaliści” lekarze są razem m.in. z nauczycielami i pielęgniarkami. Płac samych lekarzy ani oficjalnej tabeli płac lekarzy nie znaleźliśmy.',
    sources: [{ label: 'ILOSTAT, przeciętne miesięczne zarobki według zawodów (EAR_EMTA, ISCO-08)', href: 'https://sdmx.ilo.org/rest/data/ILO,DF_EAR_EMTA_SEX_OCU_CUR_NB/' }],
  };
}

export const national: Record<string, NationalEntry> = {
  // ---------- dane na mapie ----------
  '840': {
    kind: 'avg',
    group: 'Lekarze ogółem, pracownicy najemni (bez samozatrudnionych)',
    pay: { annual: 277260, average: 69770, currency: 'USD', year: 2025, fx: fx(1, 2025), ppp: ppp(1, 2025) },
    rows: [
      ['Lekarze ogółem', '277 260 USD rocznie, średnia, maj 2025'],
      ['Lekarze rodzinni', '255 820 USD rocznie (3,67×)'],
      ['Przeciętna płaca', '69 770 USD rocznie, wszystkie zawody'],
    ],
    note: 'BLS liczy tylko pracowników najemnych, więc lekarze z własną praktyką są poza tymi danymi. OECD nie ma aktualnych danych o płacach lekarzy w USA: ostatnie pochodzą z badania American Medical Association do 2001 r.',
    sources: [
      { label: 'BLS, Occupational Employment and Wage Statistics, maj 2025 (tabela krajowa)', href: 'https://www.bls.gov/oes/current/oes_nat.htm' },
      { label: 'OECD Health Statistics 2025, Definitions, Sources and Methods', href: 'https://stats.oecd.org/wbos/fileview2.aspx?IDFile=e0150697-13c1-4896-9a5b-f67ed76ab61c' },
    ],
  },
  '158': {
    kind: 'avg',
    group: 'Lekarze zatrudnieni na pełny etat (bez właścicieli praktyk)',
    pay: {
      annual: 2497000, average: 60984 * 12, currency: 'TWD', year: 2024,
      fx: fx(32.1064, 2024, 'Fed, G.5A, średni kurs roczny'),
      ppp: ppp(13.661, 2024, 'MFW, PPP całego PKB (PPPEX)'),
    },
    rows: [
      ['Lekarze', '2 497 000 TWD rocznie, średnia za 2024 r.'],
      ['Płaca regularna', '180 000 TWD miesięcznie, lipiec 2025'],
      ['Przeciętna płaca', '731 808 TWD rocznie (60 984 TWD × 12, DGBAS 2024)'],
    ],
    note: 'Ministerstwo pracy liczy tylko zatrudnionych, bez lekarzy z własną praktyką; roczny dochód to wynagrodzenia z PIT, bez dochodów z działalności. Kategoria „醫師” może obejmować też dentystów i lekarzy medycyny chińskiej, tej definicji nie potwierdziliśmy. Tajwan nie publikuje płac poszczególnych osób, tylko średnie zawodowe i dane szpitali.',
    sources: [
      { label: 'MOL, 職類別薪資調查 2025 (badanie płac według zawodów)', href: 'https://www.mol.gov.tw/1607/1632/1633/90814/' },
      { label: 'DGBAS, płace w przemyśle i usługach w 2024 r.', href: 'https://www.dgbas.gov.tw/News_Content.aspx?n=3602&s=234606' },
      { label: 'Fed, G.5A, kursy roczne', href: 'https://www.federalreserve.gov/releases/g5a/current/default.htm' },
      { label: 'zarobkilekarzy.pl, analiza o Tajwanie', href: '/analizy/tajwan-ochrona-zdrowia/' },
    ],
  },
  '392': {
    kind: 'avg',
    group: 'Lekarze na pełnym etacie w zakładach prywatnych od 10 pracowników',
    pay: { annual: 1163200 * 12 + 1164100, average: 370500 * 12 + 1009600, currency: 'JPY', year: 2025, fx: fx(149.657926890951, 2025), ppp: ppp(103.33658, 2025) },
    rows: [
      ['Lekarze', '1 163 200 JPY w czerwcu 2025 i 1 164 100 JPY premii rocznych'],
      ['Rocznie', '15 122 500 JPY (czerwiec × 12 + premie, nasze przeliczenie)'],
      ['Przeciętna płaca', '370 500 JPY w czerwcu i 1 009 600 JPY premii, czyli 5 455 600 JPY rocznie'],
    ],
    note: 'Tabele badania płac MHLW obejmują zakłady prywatne od 10 pracowników, bez właścicieli klinik i niepełnych etatów. Czerwcowa płaca zawiera nadgodziny, premie są za poprzedni rok. Japonia nie przekazuje OECD danych o płacach lekarzy.',
    sources: [
      { label: 'MHLW, 令和7年賃金構造基本統計調査, tabela 1 (płace według zawodów)', href: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040421116&fileKind=4' },
      { label: 'MHLW, to samo badanie, wszyscy pracownicy', href: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040420843&fileKind=4' },
    ],
  },
  '036': {
    kind: 'avg',
    group: 'Lekarze na pełnym etacie, pracownicy najemni (z rezydentami, bez kadry kierowniczej)',
    pay: { annual: 3554.1 * 52, average: 2061.0 * 52, currency: 'AUD', year: 2025, fx: fx(1.5519978866485, 2025), ppp: ppp(1.464593, 2025) },
    rows: [
      ['Lekarze', '3 554,10 AUD tygodniowo, średnia, maj 2025'],
      ['Przeciętna płaca', '2 061,00 AUD tygodniowo, wszyscy pracownicy na pełnym etacie'],
      ['Rocznie', 'tydzień × 52, nasze przeliczenie'],
    ],
    note: 'Badanie ABS obejmuje pracodawców publicznych i prywatnych, ale tylko pracowników najemnych. Lekarze z własną praktyką i na kontraktach są poza nim; OECD ma dla Australii tylko ich dane. Błąd standardowy dla lekarzy to 191 AUD tygodniowo.',
    sources: [{ label: 'ABS, Employee Earnings and Hours, Australia, May 2025, Data cube 13', href: 'https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/employee-earnings-and-hours-australia/may-2025/63060DO013_202505.xlsx' }],
  },
  '076': {
    kind: 'avg',
    group: 'Lekarze na umowę o pracę (płaca na umowę, nie na osobę)',
    pay: { annual: 14330.85 * 12, average: 4290.24 * 12, currency: 'BRL', year: 2024, fx: fx(5.38893490570959, 2024), ppp: ppp(2.52449654597584, 2024) },
    rows: [
      ['Lekarze', '14 330,85 BRL w grudniu 2024, średnia (mediana 12 541,18)'],
      ['Przeciętna płaca', '4 290,24 BRL w grudniu 2024, wszystkie umowy o pracę'],
      ['Liczba umów lekarzy', '224 967 (zawody CBO 2251–2253)'],
    ],
    note: 'Nasze obliczenie z oficjalnych mikrodanych RAIS 2024, rejestru zatrudnienia formalnego. Płaca jest liczona na umowę: lekarz z kilkoma etatami jest liczony kilka razy, a jego łączny dochód jest wyższy. Poza danymi są lekarze samozatrudnieni i pracujący przez własną firmę. Przeciętny wymiar umowy lekarza to 31,8 godziny tygodniowo.',
    sources: [
      { label: 'Ministério do Trabalho e Emprego, komunikat o mikrodanych RAIS 2024', href: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/comunicados/comunicado-microdados-rais-2024' },
      { label: 'mikrodane RAIS 2024 (serwer FTP ministerstwa)', href: 'ftp://ftp.mtps.gov.br/pdet/microdados/RAIS/2024/' },
    ],
  },
  '643': {
    kind: 'avg',
    group: 'Lekarze i inni pracownicy z wyższym wykształceniem w placówkach państwowych i komunalnych',
    pay: { annual: 113602.3 * 12, average: 57210 * 12, currency: 'RUB', year: 2023, fx: fx(85.1620083333333, 2023), ppp: ppp(27.5803161319327, 2023) },
    rows: [
      ['Lekarze', '113 602 RUB miesięcznie, średnia 2023'],
      ['Przeciętna płaca', '57 210 RUB miesięcznie, pracownicy najemni'],
      ['Relacja według Rosstatu', '198,6%'],
    ],
    note: 'Rosstat podaje te dane w osobnym monitoringu płac w sferze socjalnej. Grupa obejmuje lekarzy i innych pracowników placówek medycznych z wyższym wykształceniem, bez sektora prywatnego. Najnowsze dane za pełny rok dotyczą 2023 r.',
    sources: [
      { label: 'Rosstat, wyniki monitoringu płac w sferze socjalnej za 2023 r.', href: 'https://rosstat.gov.ru/storage/mediabank/itog-monitor_04-2023.htm' },
      { label: 'Rosstat, tabela: płace lekarzy, 2023', href: 'https://rosstat.gov.ru/storage/mediabank/04-23-06.xlsx' },
    ],
  },
  '398': {
    kind: 'avg',
    group: 'Lekarze, pracownicy, którzy przepracowali cały kwiecień',
    pay: { annual: 491400 * 12, average: 486388 * 12, currency: 'KZT', year: 2026, approx: true, fx: fx(521.035, 2025) },
    rows: [
      ['Lekarze', '491 400 KZT, kwiecień 2026'],
      ['Przeciętna płaca', '486 388 KZT miesięcznie, II kw. 2026 (inne badanie)'],
    ],
    note: 'Płace według zawodów pochodzą z badania kwietniowego, które nie podaje przeciętnej dla wszystkich; przeciętna płaca jest z badania kwartalnego, więc relacja jest orientacyjna. Kwoty zawierają premie, dodatki, podatki i składki emerytalne. Na dolary przeliczamy średnim kursem z 2025 r., bo średniej za 2026 r. jeszcze nie ma; przelicznika siły nabywczej za 2026 r. też nie ma.',
    sources: [
      { label: 'Biuro Statystyki Narodowej, płace według zawodów (kwiecień 2026)', href: 'https://stat.gov.kz/ru/news/pokazateli-zarabotnoy-platy-rabotnikov-po-professiyam-i-dolzhnostyam-v-respublike-kazakhstan/' },
      { label: 'Biuro Statystyki Narodowej, przeciętna płaca w II kw. 2026', href: 'https://stat.gov.kz/api/iblock/element/352971/file/ru/' },
    ],
  },
  '112': {
    kind: 'avg',
    group: 'Lekarze w ochronie zdrowia',
    pay: { annual: 4278.3 * 12, average: 2857.2 * 12, currency: 'BYN', year: 2026, approx: true, fx: fx(3.069175, 2025) },
    rows: [
      ['Lekarze', '4 278,3 BYN miesięcznie, styczeń–kwiecień 2026'],
      ['Przeciętna płaca', '2 857 BYN, średnia z czterech miesięcy (nasze przeliczenie)'],
    ],
    note: 'Strona Belstatu była dla nas niedostępna, więc liczbę odczytaliśmy z kopii oficjalnego pliku w Internet Archive. Przeciętną płacę za styczeń–kwiecień liczymy sami z czterech miesięcznych komunikatów, więc relacja jest orientacyjna. Na dolary przeliczamy średnim kursem z 2025 r.; przelicznika siły nabywczej za 2026 r. jeszcze nie ma.',
    sources: [
      { label: 'Belstat, Dzień pracowników medycznych, przegląd statystyczny 2026', href: 'https://www.belstat.gov.by/upload-belstat/upload-belstat-pdf/oficial_statistika/statobzor_med_2026.pdf' },
      { label: 'ten sam plik w Internet Archive', href: 'https://web.archive.org/web/2026id_/https://www.belstat.gov.by/upload-belstat/upload-belstat-pdf/oficial_statistika/statobzor_med_2026.pdf' },
    ],
  },

  // ---------- dane cząstkowe: tylko szczegóły kraju, bez wartości na mapie ----------
  '124': {
    kind: 'partial',
    group: 'Lekarze, pensje i dochód z praktyki razem',
    rows: [
      ['Specjaliści', '150 000 CAD rocznie, mediana za 2020 r. (2,36×)'],
      ['Lekarze rodzinni', '126 000 CAD rocznie (1,98×)'],
      ['Wszyscy pracujący', '63 600 CAD rocznie'],
      ['Płatności z planów publicznych', `${formatPL(canadaAvg)} CAD brutto na lekarza, rok 2023–24 (przed kosztami praktyki)`],
    ],
    note: 'Większość lekarzy w Kanadzie pracuje na własny rachunek; według spisu 2021 pracownikami najemnymi było tylko 34–38% lekarzy. Ich dochód pokazuje OECD w widoku „na własny rachunek”. Spis łączy pensje z dochodem netto z praktyki i nie obejmuje dywidend z własnych spółek, więc dla lekarzy jest zaniżony. Płatności z planów publicznych (CIHI) to kwota brutto, z której lekarz pokrywa koszty praktyki.',
    sources: [
      { label: 'Statistics Canada, tabela 98-10-0586-01 (dochód z pracy według zawodu, spis 2021)', href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810058601' },
      { label: 'Statistics Canada, tabela 98-10-0593-01 (status zatrudnienia według zawodu)', href: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810059301' },
      { label: 'CIHI, National Physician Database 2023–2024, tabele płatności', href: CANADA_LINKS.cihiPayments },
      { label: 'zarobkilekarzy.pl, analiza o sporach z lekarzami w Kanadzie', href: '/analizy/kanada-lekarze-ustawa-specjalna/' },
    ],
  },
  '702': {
    kind: 'partial',
    group: 'Lekarze w zakładach prywatnych',
    rows: [
      ['GP i interniści', '7 165 SGD miesięcznie, mediana brutto bez premii, czerwiec 2025'],
      ['To samo w ochronie zdrowia', '15 001 SGD miesięcznie'],
    ],
    note: 'Badanie ministerstwa pracy obejmuje tylko prywatne zakłady od 25 pracowników, bez sektora publicznego. Płac lekarzy w sektorze publicznym nie znaleźliśmy, dlatego nie liczymy relacji do przeciętnej płacy.',
    sources: [{ label: 'MOM, Occupational Wage Survey 2025, tabela 4', href: 'https://stats.mom.gov.sg/iMAS_Tables1/Wages/Wages_2025/mrsd_2025Wages_table4.xlsx' }],
  },
  '608': {
    kind: 'partial',
    group: 'Lekarze w prywatnych placówkach',
    note: 'Urząd statystyczny (PSA) opublikował płace lekarzy w prywatnych placówkach z badania płac według zawodów za 2022 r., ale plik jest za weryfikacją antybotową i nie mogliśmy sprawdzić liczb w źródle. Dlatego ich nie podajemy.',
    sources: [{ label: 'PSA, 2022 Occupational Wages Survey (infografika)', href: 'https://psa.gov.ph/system/files/lsredsd/3-(ons-cleared)-2022%20OWS%20Infographics_29%20Aug_JRV_rev07Sept-signed.pdf' }],
  },

  // ---------- tylko tabela płac ----------
  '710': {
    kind: 'scale',
    group: 'Lekarze w służbie publicznej',
    rows: [
      ['Medical Officer, stopień 1', '1 041 402 ZAR rocznie (pakiet), październik 2026'],
      ['Specjalista, stopień 1', '1 395 528 ZAR rocznie (pakiet)'],
      ['Przeciętna płaca', '30 611 ZAR miesięcznie, maj 2026 (sektor formalny pozarolniczy)'],
    ],
    note: 'To stawki początkowe stopni z ogłoszeń o naborze, a nie średnia. Pakiet zawiera też składki pracodawcy, więc relacji do przeciętnej płacy nie liczymy.',
    sources: [
      { label: 'DPSA, Public Service Vacancy Circular 38 of 2026 (Western Cape)', href: 'https://www.dpsa.gov.za/dpsa2g/documents/vacancies/2026/38/aa.pdf' },
      { label: 'DPSA, Public Service Vacancy Circular 38 of 2026 (Gauteng)', href: 'https://www.dpsa.gov.za/dpsa2g/documents/vacancies/2026/38/u.pdf' },
      { label: 'Stats SA, QES Q2:2026', href: 'https://www.statssa.gov.za/publications/P0277/Media_20Release_20QES_202026_20Q2.pdf' },
    ],
  },
  '566': {
    kind: 'scale',
    group: 'Lekarze w federalnej służbie publicznej',
    rows: [
      ['Najniższy stopień (CONMESS 01)', '2 564 501 NGN rocznie, od 29.07.2024'],
      ['Stopień CONMESS 07, krok 1', '9 952 637 NGN rocznie'],
    ],
    note: 'Skala płacy podstawowej bez dodatków za dyżury i specjalizację. Okólnik nie podaje nazw stanowisk przypisanych do stopni, a stany wdrażają skalę nierówno. Średniej płacy lekarzy nie znaleźliśmy.',
    sources: [{ label: 'NSIWC, okólnik SWC.04/T/207 z 23.09.2024 (CONMESS)', href: 'https://nsiwc.gov.ng/download/implementation-of-the-new-national-minimum-wage-in-the-federal-public-service-the-consolidated-medical-salary-structure-conmess/' }],
  },
  '032': {
    kind: 'scale',
    group: 'Wszyscy profesjonaliści szpitali federalnych, nie tylko lekarze',
    rows: [
      ['Asystent, poziom 0', '1 242 770,04 ARS miesięcznie, od 1.08.2026'],
      ['Najwyższa kategoria, poziom 0', '3 103 746,66 ARS miesięcznie'],
    ],
    note: 'Skala płac zasadniczych profesjonalistów zdrowia w szpitalach ministerstwa zdrowia, bez dodatków. Relacji do przeciętnej płacy nie liczymy, bo przy wysokiej inflacji przeciętna z innego roku nie pasuje.',
    sources: [{ label: 'Decreto 1133/09, skala od sierpnia 2026', href: 'https://www.argentina.gob.ar/sites/default/files/2025/01/d_1133-agosto-2026.pdf' }],
  },

  '800': {
    kind: 'scale',
    group: 'Lekarze w służbie publicznej',
    rows: [
      ['Medical Officer (U4)', '5 408 476 UGX miesięcznie, rok budżetowy 2026/27'],
      ['Konsultant (U1SE)', '12 321 555 UGX miesięcznie'],
      ['Starszy konsultant (U1SE)', '13 113 953 UGX miesięcznie'],
    ],
    note: 'Skonsolidowana tabela płac personelu medycznego w służbie publicznej, kwoty takie same jak w roku 2025/26. Średniej płacy lekarzy ani przeciętnej płacy z tego samego roku nie znaleźliśmy, więc relacji nie liczymy.',
    sources: [{ label: 'Ministry of Public Service, Circular Standing Instruction No. 6 of 2026, Schedule 6', href: 'https://www.publicservice.go.ug/download/circular-standing-instruction-csi-no-6-salary-structure-for-fy-2026-2027/' }],
  },

  // ---------- tylko szersza grupa ----------
  '072': {
    kind: 'broad',
    group: 'Cała grupa „specjaliści” (ISCO 2), sektor formalny',
    rows: [
      ['Grupa „specjaliści”', '18 361 BWP miesięcznie, średnia, IV kw. 2022 (2,70×)'],
      ['Sektor ochrony zdrowia i pomocy społecznej', '9 006 BWP miesięcznie (1,32×)'],
      ['Wszyscy pracownicy', '6 803 BWP miesięcznie'],
    ],
    note: 'Urząd statystyczny publikuje płace według całych grup zawodów i sektorów. Lekarzy osobno nie ma.',
    sources: [{ label: 'Statistics Botswana, Quarterly Multi-Topic Survey, Q4 2022, tabele 1.14–1.15', href: 'https://www.statsbots.org.bw/sites/default/files/Quarterly%20Multi-Topic%20Survey%20Quarter%204%2C%202022.pdf' }],
  },
  '516': {
    kind: 'broad',
    group: 'Cały sektor „ochrona zdrowia i pomoc społeczna”',
    rows: [
      ['Sektor', '14 900 NAD miesięcznie, średnia brutto 2018 (1,88×)'],
      ['Wszyscy pracownicy', '7 935 NAD miesięcznie'],
    ],
    note: 'Badanie siły roboczej z 2018 r. podaje płace według sektorów, bez zawodów. Lekarze są w sektorze razem z pielęgniarkami i pomocą społeczną.',
    sources: [{ label: 'Namibia Statistics Agency, Labour Force Survey 2018, tabela 4.14', href: 'https://microdata.nsanamibia.com/index.php/catalog/3/download/25' }],
  },
  '356': {
    kind: 'scale',
    group: 'Lekarze w służbie centralnej (Central Health Service)',
    rows: [
      ['Medical Officer, Level 10', '56 100–177 500 INR miesięcznie, płaca zasadnicza, 2026'],
      ['Dodatek za rezygnację z praktyki (NPA)', '20% płacy zasadniczej, czyli 67 320 INR na starcie'],
      ['Przeciętna płaca na etacie', '24 217 INR (mężczyźni) i 18 353 INR (kobiety) miesięcznie, 2025'],
    ],
    note: 'To stawki z ogłoszenia o naborze do służby centralnej, bez dodatku drożyźnianego i mieszkaniowego. Większość lekarzy w Indiach pracuje w służbie stanowej albo prywatnie, a statystyka nie podaje płac według zawodów, więc relacji nie liczymy.',
    sources: [
      { label: 'UPSC, Examination Notice No. 9/2026-CMS', href: 'https://www.upsc.gov.in/sites/default/files/Notification-CMSE-2026-English-110326.pdf' },
      { label: 'PIB, Ministry of Health, Private Practice by Doctors (2019)', href: 'https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1580414&reg=48&lang=2' },
      { label: 'MoSPI, PLFS Annual Report 2025, komunikat', href: 'https://www.mospi.gov.in/uploads/latestReleases/latest_release_1774607827733_3e8964a9-268b-4cc9-ad65-cfc8a9e32f08_Press_note_AR_PLFS_2025_23032025_V2.1_26032026_final.pdf' },
    ],
  },
  '586': {
    kind: 'broad',
    group: 'Cała grupa „specjaliści” (ISCO 2)',
    rows: [
      ['Grupa „specjaliści”', '62 822 PKR miesięcznie, średnia 2024–25 (1,61×)'],
      ['Wszyscy pracownicy najemni', '39 042 PKR miesięcznie'],
    ],
    note: 'Badanie siły roboczej podaje płace tylko dla całych grup zawodów; lekarze są w niej razem m.in. z nauczycielami i inżynierami. Większość lekarzy pracuje w placówkach prowincji, które mają własne tabele płac.',
    sources: [{ label: 'PBS, Labour Force Survey 2024-25, tabela 46', href: 'https://www.pbs.gov.pk/wp-content/uploads/2020/07/Report-46.pdf' }],
  },
  '050': isco2('BDT', '23 053', '15 517', '1,49', 2024),
  '144': isco2('LKR', '83 217', '48 843', '1,70', 2024),
  '360': { ...isco2('IDR', '3 437 605', '2 778 129', '1,24', 2023), note: 'Międzynarodowa Organizacja Pracy wylicza płace z mikrodanych krajowego badania (kwoty netto), ale tylko dla całych grup zawodów. W grupie „specjaliści” lekarze są razem m.in. z nauczycielami i pielęgniarkami. Płac samych lekarzy nie znaleźliśmy, a urząd statystyczny był dla nas niedostępny.' },
  '764': isco2('THB', '29 576', '16 699', '1,77', 2025),
  '704': isco2('VND', '11 938 149', '8 579 562', '1,39', 2024),
  '834': isco2('TZS', '1 655 166', '603 973', '2,74', 2025),
  '646': isco2('RWF', '191 362', '69 851', '2,74', 2024),
  '894': isco2('ZMW', '8 148', '4 458', '1,83', 2024),
  '686': isco2('XOF', '293 293', '161 915', '1,81', 2025),
  '384': isco2('XOF', '296 338', '128 952', '2,30', 2022),
  '756': {
    kind: 'broad',
    group: 'Zawody zdrowotne z wyższym wykształceniem (ISCO 22)',
    rows: [
      ['Grupa ISCO 22', '8 000 CHF miesięcznie, mediana 2024 (1,14×)'],
      ['Wszyscy pracownicy', '7 024 CHF miesięcznie'],
    ],
    note: 'Federalny urząd statystyczny nie publikuje płac samych lekarzy. Grupa 22 obejmuje też pielęgniarki, dentystów, farmaceutów i fizjoterapeutów. Dochód lekarzy na własny rachunek pokazuje OECD.',
    sources: [{ label: 'BFS, Schweizerische Lohnstrukturerhebung 2024, tabela T17', href: 'https://www.bfs.admin.ch/asset/de/je-d-03.04.01.02.47' }],
  },
  '040': {
    kind: 'broad',
    group: 'Zawody zdrowotne z wyższym wykształceniem (ISCO 22)',
    rows: [
      ['Grupa ISCO 22', '26,79 EUR za godzinę, mediana, październik 2022 (1,53×)'],
      ['Wszyscy pracownicy', '17,49 EUR za godzinę'],
    ],
    note: 'Statistik Austria podaje dla tej grupy tylko stawkę godzinową, razem z pielęgniarkami i innymi zawodami, bez administracji publicznej. Płac samych lekarzy na etacie nie publikuje. Dochód lekarzy na własny rachunek pokazuje OECD.',
    sources: [{ label: 'Statistik Austria, Verdienststrukturerhebung 2022, tabela 6.5', href: 'https://www.statistik.at/fileadmin/publications/Verdienststrukturerhebung_2022_barr.pdf' }],
  },
  '156': {
    kind: 'broad',
    group: 'Cały sektor „ochrona zdrowia i pomoc społeczna”',
    rows: [
      ['Sektor, jednostki nieprywatne', '146 266 CNY rocznie, średnia 2025 (1,13×)'],
      ['Wszyscy, jednostki nieprywatne', '129 441 CNY rocznie'],
    ],
    note: 'Krajowe Biuro Statystyczne publikuje płace całego sektora, razem z pielęgniarkami i personelem pomocniczym. Oficjalnej średniej tylko dla lekarzy nie znaleźliśmy.',
    sources: [{ label: 'NBS, przeciętne płace w jednostkach miejskich w 2025 r.', href: 'https://www.stats.gov.cn/sj/zxfb/202605/t20260515_1963707.html' }],
  },
  '344': {
    kind: 'broad',
    group: 'Cała grupa „specjaliści” (ISCO 2)',
    note: 'Urząd statystyczny publikuje mediany zarobków tylko dla całej grupy specjalistów, w której lekarze są razem z inżynierami czy prawnikami. Tabeli płac lekarzy szpitali publicznych nie znaleźliśmy.',
    sources: [{ label: 'Census and Statistics Department, tabela 210-06321', href: 'https://www.censtatd.gov.hk/en/web_table.html?id=210-06321' }],
  },
  '458': {
    kind: 'broad',
    group: 'Cała grupa „specjaliści” (ISCO 2)',
    rows: [
      ['Grupa „specjaliści”', '6 124 MYR miesięcznie, mediana 2025'],
      ['Wszyscy pracownicy', '2 940 MYR miesięcznie'],
    ],
    note: 'Urząd statystyczny nie publikuje płac poszczególnych zawodów, tylko całe grupy. Dotyczy obywateli Malezji.',
    sources: [{ label: 'DOSM, Salaries & Wages Survey Report 2025', href: 'https://storage.dosm.gov.my/labour/salaries_wages_2025.pdf' }],
  },
  '642': ses('RO', 'RON', '135 387', '81 821', '1,65'),
  '688': ses('RS', 'RSD', '2 115 374', '1 365 723', '1,55'),
  '807': ses('MK', 'MKD', '954 024', '615 158', '1,55'),
  '070': ses('BA', 'BAM', '41 973', '23 211', '1,81'),
  '008': ses('AL', 'ALL', '939 483', '860 599', '1,09'),
  '634': {
    kind: 'broad',
    group: 'Cała grupa „specjaliści” (ISCO 2), wszystkie sektory',
    rows: [
      ['Grupa „specjaliści”', '26 665 QAR miesięcznie, średnia 2023 (2,13×)'],
      ['Wszyscy zatrudnieni', '12 535 QAR miesięcznie'],
    ],
    note: 'Badanie siły roboczej, kwoty z deklaracji respondentów. Lekarze są razem z innymi specjalistami; osobno ich nie ma.',
    sources: [{ label: 'NPC, Labor Force Sample Survey 2023, tabela 14', href: 'https://www.npc.qa/en/statistics/Statistical%20Releases/Social/Labor%20Force/Labor_Force_Sample_Survey_2023_EN.pdf' }],
  },
  '499': {
    kind: 'broad',
    group: 'Cały sektor „ochrona zdrowia i pomoc społeczna”',
    rows: [
      ['Sektor', '1 220 EUR miesięcznie, średnia brutto 2025 (1,01×)'],
      ['Wszyscy pracownicy', '1 206 EUR miesięcznie'],
    ],
    note: 'Monstat publikuje płace sektorów, nie zawodów. Lekarze są w sektorze razem z pielęgniarkami i personelem pomocniczym.',
    sources: [{ label: 'Monstat, przeciętne płace brutto według sektorów 2012–2025', href: 'https://www.monstat.org/uploads/files/zarade/2025/13/Bruto%20zarade%20po%20sektorima%20djelatnosti%202012-2025.xls' }],
  },
  '804': sector('UAH', '16 769', '21 074', '0,80', '2025', 'Derżstat', { label: 'Derżstat, płace według rodzajów działalności, 2025', href: 'https://ck.ukrstat.gov.ua/source/arch/2026/zp_vid_2_2512.pdf' }),
  '860': sector('tys. UZS', '4 440,3', '7 091,1', '0,63', 'I–VI 2026, dane wstępne', 'Komitet statystyki', { label: 'Komitet statystyki Uzbekistanu, raport za I–VI 2026, rozdz. XVII', href: 'https://stat.uz/files/624/Chorakli-natijalar-2026-yanvar-iyun-ru/4409/17---.pdf' }),
  '268': sector('GEL', '1 834,5', '2 165,2', '0,85', '2025', 'Geostat', { label: 'Geostat, przeciętne płace według działalności (baza PxWeb)', href: 'https://pc-axis.geostat.ge/PXWeb/api/v1/en/Database/Social%20Statistics/Labour/Wages_Nace2.px/' }),
  '051': sector('AMD', '261 687', '303 140', '0,86', '2025', 'Armstat', { label: 'Armstat, przeciętne płace według działalności', href: 'https://armstat.am/file/doc/99571898.xlsx' }),
  '031': sector('AZN', '939,6', '1 103,2', '0,85', '2025', 'Komitet statystyki', { label: 'Komitet statystyki Azerbejdżanu, przeciętne płace według działalności', href: 'https://stat.gov.az/source/labour/en/004_2-3en.xls' }),
  '404': {
    kind: 'broad',
    group: 'Cały sektor „ochrona zdrowia i pomoc społeczna”',
    rows: [
      ['Sektor, część publiczna', '1 879 754,8 KES rocznie, 2025 (1,90×)'],
      ['Sektor, część prywatna', '1 394 432,4 KES rocznie (1,41×)'],
      ['Wszyscy pracownicy', '988 177,5 KES rocznie'],
    ],
    note: 'Urząd statystyczny podaje płace całego sektora, razem z pielęgniarkami i innymi zawodami; dane tymczasowe. Skali płac lekarzy w źródle pierwotnym nie znaleźliśmy.',
    sources: [{ label: 'KNBS, Economic Survey 2026, tabela 3.7 (egzemplarz z biblioteki parlamentu)', href: 'https://libraryir.parliament.go.ke/server/api/core/bitstreams/39f56f1a-69dd-481f-86ec-a27bf0e75af0/content' }],
  },
  '068': sector('BOB', '4 486,6', '3 189,6', '1,41', '2025', 'Międzynarodowa Organizacja Pracy (za krajowym badaniem siły roboczej)', ilo),
  '858': sector('UYU', '51 250', '47 939', '1,07', '2024', 'Międzynarodowa Organizacja Pracy (za krajowym badaniem siły roboczej)', ilo),
  '818': sector('EGP', '4 455', '4 954', '0,90', '2024', 'Międzynarodowa Organizacja Pracy (za krajowym badaniem siły roboczej)', ilo),
  '288': sector('GHS', '4 084', '2 728', '1,50', '2025', 'Międzynarodowa Organizacja Pracy (za krajowym badaniem siły roboczej)', ilo, ' Inne badanie z 2024 r. daje 0,82×, więc wynik jest niestabilny.'),
  '231': sector('ETB', '5 696', '4 196', '1,36', '2021', 'Międzynarodowa Organizacja Pracy (za krajowym badaniem siły roboczej)', ilo),

  // ---------- nic oficjalnego ----------
  '682': {
    kind: 'scale',
    group: 'Lekarze w placówkach rządowych, obywatele Arabii Saudyjskiej',
    rows: [
      ['Rezydent, poziom 1', '9 200 SAR zasadniczej miesięcznie'],
      ['Konsultant, poziom 1', '14 950 SAR zasadniczej miesięcznie'],
      ['Dodatek za pracę tylko w sektorze publicznym', '70% pierwszej stawki poziomu (poziom 1)'],
    ],
    note: 'Kwoty pochodzą z tabeli opublikowanej przez dział kadr państwowego Uniwersytetu Księcia Sattama; regulamin ministerstwa zasobów ludzkich odsyła do tabeli, ale samych kwot w nim nie ma. Urząd statystyczny podaje płace tylko według wieku, wykształcenia i grup sektorów, bez zawodów.',
    sources: [
      { label: 'PSAU, skala płac personelu medycznego (2023)', href: 'https://www.psau.edu.sa/dhr/sitesuploads/dhr/2024-12/%D8%A7%D9%84%D8%B5%D8%AD%D9%8A%D9%8A%D9%86.pdf' },
      { label: 'HRSD, regulamin stanowisk w ochronie zdrowia', href: 'https://www.hrsd.gov.sa/sites/default/files/2023-11/%D9%84%D8%A7%D8%A6%D8%AD%D8%A9%20%D8%A7%D9%84%D9%88%D8%B8%D8%A7%D8%A6%D9%81%20%D8%A7%D9%84%D8%B5%D8%AD%D9%8A%D8%A9.pdf' },
      { label: 'GASTAT, Labour Market Statistics Q2 2026', href: 'https://www.stats.gov.sa/documents/20117/2435273/Labor+Market+Statistics+Q2+2026+EN+%282%29.xlsx/1eb7c5ce-46c1-c8b3-b8e6-9538d3e76422?t=1790766266916' },
    ],
  },
  '784': {
    kind: 'scale',
    group: 'Lekarze w administracji federalnej, obywatele ZEA',
    rows: [
      ['Lekarz początkujący (stopień 4)', '11 180 AED zasadniczej, 22 295 AED z dodatkami miesięcznie'],
      ['Konsultant (A), stopień 1', '17 300 AED zasadniczej, 56 900 AED z dodatkami'],
    ],
    note: 'Skala płac rządu federalnego z 2012 r. (dodatki: mieszkaniowy, techniczny, transportowy). Nowszej tabeli płac lekarzy nie mogliśmy otworzyć, bo strona z przepisami jest za blokadą. Przeciętnej płacy w kraju nie znaleźliśmy.',
    sources: [{ label: 'FAHR, Cabinet Resolution No. 23 of 2012, Salary Scales in Federal Government, tabela 4', href: 'https://www.fahr.gov.ae/Portal/Userfiles/Assets/Documents/1b46f5fb.pdf' }],
  },
  '512': {
    kind: 'scale',
    group: 'Lekarze w rządowych placówkach medycznych',
    rows: [
      ['Lekarz ogólny', '900 OMR zasadniczej, 1 381 OMR z dodatkami miesięcznie'],
      ['Specjalista', '1 200 OMR zasadniczej, 2 120 OMR z dodatkami'],
      ['Konsultant', '2 300 OMR zasadniczej, 4 220 OMR z dodatkami'],
    ],
    note: 'Dekret królewski nr 33/2013, stawki od 1.07.2012; sumy z dodatkami (mieszkanie, media, transport, dodatek zawodowy) liczymy sami. Nowszej nowelizacji nie znaleźliśmy. Przeciętnej płacy w kraju urząd statystyczny nie podaje, tylko rozkład pensji zasadniczych.',
    sources: [{ label: 'Dekret królewski 33/2013 o płacach pracowników medycznych, załącznik 1', href: 'https://qanoon.om/p/2013/rd2013033/' }],
  },
  '414': { kind: 'none', note: 'Nie znaleźliśmy oficjalnej tabeli płac lekarzy ani płac według zawodów.' },
  '012': { kind: 'none', note: 'Nie znaleźliśmy tekstu tabeli płac lekarzy; strony urzędów były dla nas niedostępne.' },
  '788': { kind: 'none', note: 'Nie znaleźliśmy aktu ani tabeli płac lekarzy w sektorze publicznym.' },
  '400': { kind: 'none', note: 'Nie znaleźliśmy oficjalnych płac lekarzy. Strona urzędu statystycznego była dla nas niedostępna.' },
  '364': { kind: 'none', note: 'Nie znaleźliśmy oficjalnych płac lekarzy. Jedyne badanie, na jakie trafiliśmy, dotyczy 2016 r. i podaje kwoty w dolarach po nieokreślonym kursie, więc go nie używamy.' },
  '498': { kind: 'none', note: 'Strona urzędu statystycznego Mołdawii była dla nas zablokowana, więc danych nie sprawdziliśmy.' },
  '600': { kind: 'none', note: 'Nie znaleźliśmy oficjalnych płac lekarzy; strony urzędów były dla nas nieosiągalne.' },
  '504': { kind: 'none', note: 'Nie znaleźliśmy oficjalnych płac lekarzy ani danych w ILOSTAT.' },
};

/** Grupa w widoku „na etacie”, gdy opis OECD („Specjaliści na etacie”) mówi za mało. */
export const oecdGroups: Record<string, string> = {
  '616': 'Specjaliści na umowie o pracę, bez kontraktów i bez sumowania płac z kilku miejsc pracy',
};

/** Zastrzeżenie wyróżnione w szczegółach kraju, zawsze widoczne. */
export const alerts: Record<string, string> = {
  '616': 'Dane dla Polski obejmują tylko lekarzy na umowie o pracę. Nie ma w nich kontraktów, a wynagrodzenia jednej osoby z kilku miejsc pracy nie są sumowane — każde miejsce pracy to osobny zapis.',
};

/** Noty do krajów z danymi OECD (metodologia OECD i GUS). */
export const oecdNotes: Record<string, string> = {
  '616': 'Źródło OECD dla Polski to badanie GUS „Struktura wynagrodzeń według zawodów”: płaca z października razy 12, zakłady od 10 osób, raport każdego pracodawcy osobno. Dla samozatrudnionych OECD nie ma danych z Polski.',
  '604': 'Peru przekazuje OECD kwoty, ale bez relacji do przeciętnej płacy w kraju.',
};
