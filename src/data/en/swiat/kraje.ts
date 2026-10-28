/**
 * Glob płac lekarzy, wersja angielska: teksty wpisów krajowych z src/data/swiat/kraje.ts
 * (te same klucze ISO, pola, wiersze i źródła w tej samej kolejności). Liczby dla mapy (`pay`, `kind`)
 * i adresy źródeł zostają w module polskim — kod łączy oba moduły. Kwoty: liczba, spacja, kod ISO waluty
 * (strona dopisuje przeliczenie tuż za tym wzorcem).
 */
import type { NationalText } from '@/lib/swiat/types';
import { PAYMENTS as CANADA_PAYMENTS } from '@/data/kanada-lekarze-ustawa-specjalna';
import { formatEN } from '@/lib/format';

const canadaAvg = CANADA_PAYMENTS.find((p) => p.name === 'Kanada')!.avg;

/** Eurostat SES 2022 — odpowiednik `ses()` z modułu polskiego (geo bez użycia: adres źródła jest w module polskim) */
function sesEn(geo: string, currency: string, group: string, all: string, ratio: string): NationalText {
  return {
    group: 'Professionals with higher education (ISCO 2) in human health and social work',
    rows: [
      ['Professionals in healthcare', `${group} ${currency} a year, average 2022 (${ratio}×)`],
      ['All employees', `${all} ${currency} a year`],
    ],
    note: 'Eurostat publishes pay for the whole group of professionals in the “human health and social work” section: doctors together with nurses with higher education, pharmacists and psychologists, among others. Public administration and enterprises with fewer than 10 employees are excluded. We did not find pay for doctors alone.',
    sources: ['Eurostat, Structure of Earnings Survey 2022, dataset earn_ses22_49'],
  };
}

/** cały sektor — odpowiednik `sector()`; źródło to sama etykieta */
function sectorEn(currency: string, value: string, all: string, ratio: string, period: string, who: string, source: string, extra = ''): NationalText {
  return {
    group: 'The whole “human health and social work” sector',
    rows: [
      ['Sector', `${value} ${currency} a month, average ${period} (${ratio}×)`],
      ['All employees', `${all} ${currency} a month`],
    ],
    note: `${who} publishes pay for the whole sector, including nurses, support staff and social work. We did not find pay for doctors alone.${extra}`,
    sources: [source],
  };
}

const ILO_WHO = 'The International Labour Organization (based on the national labour force survey)';
const ilo = 'ILOSTAT, average monthly earnings by economic activity (EAR_EMTA)';

/** ILOSTAT, grupa ISCO 2 — odpowiednik `isco2()` */
function isco2En(currency: string, value: string, all: string, ratio: string, year: number): NationalText {
  return {
    group: 'The whole “professionals” group (ISCO 2)',
    rows: [
      ['“Professionals” group', `${value} ${currency} a month, average ${year} (${ratio}×)`],
      ['All employees', `${all} ${currency} a month`],
    ],
    note: 'The International Labour Organization calculates pay from the microdata of a national survey, but only for whole occupational groups. In the “professionals” group, doctors are counted together with teachers and nurses, among others. We did not find pay for doctors alone or an official pay scale for doctors.',
    sources: ['ILOSTAT, average monthly earnings by occupation (EAR_EMTA, ISCO-08)'],
  };
}

export const nationalEn: Record<string, NationalText> = {
  // ---------- dane na mapie ----------
  '840': {
    group: 'All doctors, employees (excluding the self-employed)',
    rows: [
      ['All doctors', '277,260 USD a year, average, May 2025'],
      ['General practitioners', '255,820 USD a year (3.67×)'],
      ['Average wage', '69,770 USD a year, all occupations'],
    ],
    note: 'The BLS counts only employees, so doctors with their own practice are not in these data. The OECD has no recent data on doctors’ pay in the United States: the latest come from an American Medical Association survey and end in 2001.',
    sources: [
      'BLS, Occupational Employment and Wage Statistics, May 2025 (national table)',
      'OECD Health Statistics 2025, Definitions, Sources and Methods',
    ],
  },
  '158': {
    group: 'Full-time employed doctors (excluding practice owners)',
    rows: [
      ['Doctors', '2,497,000 TWD a year, average for 2024'],
      ['Regular earnings', '180,000 TWD a month, July 2025'],
      ['Average wage', '731,808 TWD a year (60,984 TWD × 12, DGBAS 2024)'],
    ],
    note: 'The Ministry of Labor counts only employees, without doctors who run their own practice; annual income means wages reported for personal income tax, without business income. The category “醫師” may also include dentists and doctors of Chinese medicine; we have not confirmed this definition. Taiwan does not publish the pay of individual people, only averages by occupation and hospital data.',
    sources: [
      'MOL, 職類別薪資調查 2025 (wage survey by occupation)',
      'DGBAS, earnings in industry and services in 2024',
      'Fed, G.5A, annual exchange rates',
      { label: 'zarobkilekarzy.pl, analysis of Taiwan', href: '/en/analysis/taiwan-healthcare-transparency/' },
    ],
  },
  '392': {
    group: 'Full-time doctors in private establishments with 10 or more employees',
    rows: [
      ['Doctors', '1,163,200 JPY in June 2025 and 1,164,100 JPY in annual bonuses'],
      ['Per year', '15,122,500 JPY (June × 12 + bonuses, our calculation)'],
      ['Average wage', '370,500 JPY in June and 1,009,600 JPY in bonuses, i.e. 5,455,600 JPY a year'],
    ],
    note: 'The tables of the MHLW wage survey cover private establishments with 10 or more employees, without clinic owners and part-time staff. June pay includes overtime; the bonuses are for the previous year. Japan does not report data on doctors’ pay to the OECD.',
    sources: [
      'MHLW, 令和7年賃金構造基本統計調査, table 1 (wages by occupation)',
      'MHLW, the same survey, all employees',
    ],
  },
  '036': {
    group: 'Full-time doctors, employees (including residents, excluding managers)',
    rows: [
      ['Doctors', '3,554.10 AUD a week, average, May 2025'],
      ['Average wage', '2,061.00 AUD a week, all full-time employees'],
      ['Per year', 'week × 52, our calculation'],
    ],
    note: 'The ABS survey covers public and private employers, but only employees. Doctors with their own practice and doctors working on contracts are outside it; for Australia, the OECD has data only on this second group. The standard error for doctors is 191 AUD a week.',
    sources: ['ABS, Employee Earnings and Hours, Australia, May 2025, Data cube 13'],
  },
  '076': {
    group: 'Doctors with employment contracts (pay per contract, not per person)',
    rows: [
      ['Doctors', '14,330.85 BRL in December 2024, average (median 12,541.18)'],
      ['Average wage', '4,290.24 BRL in December 2024, all employment contracts'],
      ['Number of doctors’ contracts', '224,967 (CBO occupations 2251–2253)'],
    ],
    note: 'Our calculation from the official RAIS 2024 microdata, the register of formal employment. Pay is counted per contract: a doctor with several jobs is counted several times, and their total income is higher. Self-employed doctors and doctors working through their own company are not included. A doctor’s contract covers 31.8 hours a week on average.',
    sources: [
      'Ministério do Trabalho e Emprego, announcement on the RAIS 2024 microdata',
      'RAIS 2024 microdata (ministry FTP server)',
    ],
  },
  '643': {
    group: 'Doctors and other staff with higher education in state and municipal facilities',
    rows: [
      ['Doctors', '113,602 RUB a month, average 2023'],
      ['Average wage', '57,210 RUB a month, employees'],
      ['Ratio according to Rosstat', '198.6%'],
    ],
    note: 'Rosstat publishes these data in a separate monitoring of pay in the social sphere. The group covers doctors and other staff of medical facilities with higher education, without the private sector. The latest full-year data are for 2023.',
    sources: [
      'Rosstat, results of the monitoring of pay in the social sphere for 2023',
      'Rosstat, table: doctors’ pay, 2023',
    ],
  },
  '398': {
    group: 'Doctors, employees who worked the whole of April',
    rows: [
      ['Doctors', '491,400 KZT, April 2026'],
      ['Average wage', '486,388 KZT a month, Q2 2026 (a different survey)'],
    ],
    note: 'Pay by occupation comes from the April survey, which does not give an average for all employees; the average wage comes from the quarterly survey, so the ratio is indicative. The amounts include bonuses, allowances, taxes and pension contributions. We convert to dollars at the 2025 average exchange rate, because the 2026 average is not yet available; there is no purchasing power parity (PPP) factor for 2026 either.',
    sources: [
      'Bureau of National Statistics, pay by occupation (April 2026)',
      'Bureau of National Statistics, average wage in Q2 2026',
    ],
  },
  '112': {
    group: 'Doctors in healthcare',
    rows: [
      ['Doctors', '4,278.3 BYN a month, January–April 2026'],
      ['Average wage', '2,857 BYN, average of four months (our calculation)'],
    ],
    note: 'The Belstat website was not accessible to us, so we read the figure from a copy of the official file in the Internet Archive. We calculate the average wage for January–April ourselves from four monthly releases, so the ratio is indicative. We convert to dollars at the 2025 average exchange rate; a purchasing power parity (PPP) factor for 2026 is not yet available.',
    sources: [
      'Belstat, Medical Workers’ Day, statistical review 2026',
      'the same file in the Internet Archive',
    ],
  },

  // ---------- dane cząstkowe ----------
  '124': {
    group: 'Doctors, salaries and practice income combined',
    rows: [
      ['Specialists', '150,000 CAD a year, median for 2020 (2.36×)'],
      ['General practitioners', '126,000 CAD a year (1.98×)'],
      ['All workers', '63,600 CAD a year'],
      ['Payments from public plans', `${formatEN(canadaAvg)} CAD gross per doctor, 2023–24 (before practice costs)`],
    ],
    note: 'Most doctors in Canada are self-employed; according to the 2021 census only 34–38% of doctors were employees. The OECD shows their income in the “self-employed” view. The census combines wages with net income from practice and does not include dividends from doctors’ own companies, so for doctors it is understated. Payments from public plans (CIHI) are a gross amount from which the doctor covers the costs of the practice.',
    sources: [
      'Statistics Canada, table 98-10-0586-01 (employment income by occupation, 2021 Census)',
      'Statistics Canada, table 98-10-0593-01 (employment status by occupation)',
      'CIHI, National Physician Database 2023–2024, payment tables',
      { label: 'zarobkilekarzy.pl, analysis of disputes with doctors in Canada', href: '/en/analysis/canada-doctors-special-legislation/' },
    ],
  },
  '702': {
    group: 'Doctors in private establishments',
    rows: [
      ['GPs and internists', '7,165 SGD a month, gross median without bonuses, June 2025'],
      ['The same in the health industry', '15,001 SGD a month'],
    ],
    note: 'The Ministry of Manpower survey covers only private establishments with at least 25 employees, without the public sector. We did not find the pay of doctors in the public sector, so we do not calculate a ratio to the average wage.',
    sources: ['MOM, Occupational Wage Survey 2025, table 4'],
  },
  '608': {
    group: 'Doctors in private establishments',
    note: 'The statistics office (PSA) published the pay of doctors in private establishments from its 2022 survey of wages by occupation, but the file is behind an anti-bot check and we could not verify the figures in the source. That is why we do not give them.',
    sources: ['PSA, 2022 Occupational Wages Survey (infographic)'],
  },

  // ---------- tylko tabela płac ----------
  '710': {
    group: 'Doctors in the public service',
    rows: [
      ['Medical Officer, grade 1', '1,041,402 ZAR a year (package), October 2026'],
      ['Specialist, grade 1', '1,395,528 ZAR a year (package)'],
      ['Average wage', '30,611 ZAR a month, May 2026 (formal non-agricultural sector)'],
    ],
    note: 'These are the starting rates of the grades taken from job advertisements, not an average. The package also includes employer contributions, so we do not calculate a ratio to the average wage.',
    sources: [
      'DPSA, Public Service Vacancy Circular 38 of 2026 (Western Cape)',
      'DPSA, Public Service Vacancy Circular 38 of 2026 (Gauteng)',
      'Stats SA, QES Q2:2026',
    ],
  },
  '566': {
    group: 'Doctors in the federal public service',
    rows: [
      ['Lowest grade (CONMESS 01)', '2,564,501 NGN a year, from 29 July 2024'],
      ['Grade CONMESS 07, step 1', '9,952,637 NGN a year'],
    ],
    note: 'A scale of basic pay, without allowances for on-call duty and specialisation. The circular does not give the job titles assigned to the grades, and the states apply the scale unevenly. We did not find the average pay of doctors.',
    sources: ['NSIWC, circular SWC.04/T/207 of 23 September 2024 (CONMESS)'],
  },
  '032': {
    group: 'All professionals in federal hospitals, not only doctors',
    rows: [
      ['Assistant, level 0', '1,242,770.04 ARS a month, from 1 August 2026'],
      ['Highest category, level 0', '3,103,746.66 ARS a month'],
    ],
    note: 'The scale of basic pay for health professionals in Ministry of Health hospitals, without allowances. We do not calculate a ratio to the average wage, because with high inflation an average from a different year does not fit.',
    sources: ['Decreto 1133/09, scale from August 2026'],
  },

  '800': {
    group: 'Doctors in the public service',
    rows: [
      ['Medical Officer (U4)', '5,408,476 UGX a month, financial year 2026/27'],
      ['Consultant (U1SE)', '12,321,555 UGX a month'],
      ['Senior consultant (U1SE)', '13,113,953 UGX a month'],
    ],
    note: 'The consolidated salary structure for medical staff in the public service; the amounts are the same as in 2025/26. We did not find the average pay of doctors or the average wage for the same year, so we do not calculate a ratio.',
    sources: ['Ministry of Public Service, Circular Standing Instruction No. 6 of 2026, Schedule 6'],
  },

  // ---------- tylko szersza grupa ----------
  '072': {
    group: 'The whole “professionals” group (ISCO 2), formal sector',
    rows: [
      ['“Professionals” group', '18,361 BWP a month, average, Q4 2022 (2.70×)'],
      ['Human health and social work sector', '9,006 BWP a month (1.32×)'],
      ['All employees', '6,803 BWP a month'],
    ],
    note: 'The statistics office publishes pay by whole occupational groups and by sector. Doctors are not shown separately.',
    sources: ['Statistics Botswana, Quarterly Multi-Topic Survey, Q4 2022, tables 1.14–1.15'],
  },
  '516': {
    group: 'The whole “human health and social work” sector',
    rows: [
      ['Sector', '14,900 NAD a month, gross average 2018 (1.88×)'],
      ['All employees', '7,935 NAD a month'],
    ],
    note: 'The 2018 labour force survey gives pay by sector, not by occupation. Doctors are in the sector together with nurses and social work.',
    sources: ['Namibia Statistics Agency, Labour Force Survey 2018, table 4.14'],
  },
  '356': {
    group: 'Doctors in the central service (Central Health Service)',
    rows: [
      ['Medical Officer, Level 10', '56,100–177,500 INR a month, basic pay, 2026'],
      ['Allowance for giving up private practice (NPA)', '20% of basic pay, i.e. 67,320 INR at entry'],
      ['Average wage of regular employees', '24,217 INR (men) and 18,353 INR (women) a month, 2025'],
    ],
    note: 'These are the rates from the recruitment notice for the central service, without the dearness and housing allowances. Most doctors in India work in state services or privately, and the statistics do not give pay by occupation, so we do not calculate a ratio.',
    sources: [
      'UPSC, Examination Notice No. 9/2026-CMS',
      'PIB, Ministry of Health, Private Practice by Doctors (2019)',
      'MoSPI, PLFS Annual Report 2025, press note',
    ],
  },
  '586': {
    group: 'The whole “professionals” group (ISCO 2)',
    rows: [
      ['“Professionals” group', '62,822 PKR a month, average 2024–25 (1.61×)'],
      ['All paid employees', '39,042 PKR a month'],
    ],
    note: 'The labour force survey gives pay only for whole occupational groups; doctors are in this group together with teachers and engineers, among others. Most doctors work in provincial facilities, which have their own pay scales.',
    sources: ['PBS, Labour Force Survey 2024-25, table 46'],
  },
  '050': isco2En('BDT', '23,053', '15,517', '1.49', 2024),
  '144': isco2En('LKR', '83,217', '48,843', '1.70', 2024),
  '360': { ...isco2En('IDR', '3,437,605', '2,778,129', '1.24', 2023), note: 'The International Labour Organization calculates pay from the microdata of a national survey (net amounts), but only for whole occupational groups. In the “professionals” group, doctors are counted together with teachers and nurses, among others. We did not find pay for doctors alone, and the statistics office was not accessible to us.' },
  '764': isco2En('THB', '29,576', '16,699', '1.77', 2025),
  '704': isco2En('VND', '11,938,149', '8,579,562', '1.39', 2024),
  '834': isco2En('TZS', '1,655,166', '603,973', '2.74', 2025),
  '646': isco2En('RWF', '191,362', '69,851', '2.74', 2024),
  '894': isco2En('ZMW', '8,148', '4,458', '1.83', 2024),
  '686': isco2En('XOF', '293,293', '161,915', '1.81', 2025),
  '384': isco2En('XOF', '296,338', '128,952', '2.30', 2022),
  '756': {
    group: 'Health professionals with higher education (ISCO 22)',
    rows: [
      ['ISCO group 22', '8,000 CHF a month, median 2024 (1.14×)'],
      ['All employees', '7,024 CHF a month'],
    ],
    note: 'The Federal Statistical Office does not publish pay for doctors alone. Group 22 also includes nurses, dentists, pharmacists and physiotherapists. The OECD shows the income of self-employed doctors.',
    sources: ['BFS, Schweizerische Lohnstrukturerhebung 2024, table T17'],
  },
  '040': {
    group: 'Health professionals with higher education (ISCO 22)',
    rows: [
      ['ISCO group 22', '26.79 EUR an hour, median, October 2022 (1.53×)'],
      ['All employees', '17.49 EUR an hour'],
    ],
    note: 'For this group Statistik Austria gives only the hourly rate, together with nurses and other occupations, without public administration. It does not publish pay for employed doctors alone. The OECD shows the income of self-employed doctors.',
    sources: ['Statistik Austria, Verdienststrukturerhebung 2022, table 6.5'],
  },
  '156': {
    group: 'The whole “human health and social work” sector',
    rows: [
      ['Sector, non-private units', '146,266 CNY a year, average 2025 (1.13×)'],
      ['All employees, non-private units', '129,441 CNY a year'],
    ],
    note: 'The National Bureau of Statistics publishes pay for the whole sector, including nurses and support staff. We did not find an official average for doctors alone.',
    sources: ['NBS, average wages in urban units in 2025'],
  },
  '344': {
    group: 'The whole “professionals” group (ISCO 2)',
    note: 'The statistics department publishes median earnings only for the whole group of professionals, in which doctors are counted together with engineers or lawyers. We did not find a pay scale for doctors in public hospitals.',
    sources: ['Census and Statistics Department, table 210-06321'],
  },
  '458': {
    group: 'The whole “professionals” group (ISCO 2)',
    rows: [
      ['“Professionals” group', '6,124 MYR a month, median 2025'],
      ['All employees', '2,940 MYR a month'],
    ],
    note: 'The statistics office does not publish pay for individual occupations, only for whole groups. The data cover Malaysian citizens.',
    sources: ['DOSM, Salaries & Wages Survey Report 2025'],
  },
  '642': sesEn('RO', 'RON', '135,387', '81,821', '1.65'),
  '688': sesEn('RS', 'RSD', '2,115,374', '1,365,723', '1.55'),
  '807': sesEn('MK', 'MKD', '954,024', '615,158', '1.55'),
  '070': sesEn('BA', 'BAM', '41,973', '23,211', '1.81'),
  '008': sesEn('AL', 'ALL', '939,483', '860,599', '1.09'),
  '634': {
    group: 'The whole “professionals” group (ISCO 2), all sectors',
    rows: [
      ['“Professionals” group', '26,665 QAR a month, average 2023 (2.13×)'],
      ['All employed people', '12,535 QAR a month'],
    ],
    note: 'Labour force survey; the amounts are as declared by respondents. Doctors are counted together with other professionals; there is no separate figure for them.',
    sources: ['NPC, Labor Force Sample Survey 2023, table 14'],
  },
  '499': {
    group: 'The whole “human health and social work” sector',
    rows: [
      ['Sector', '1,220 EUR a month, gross average 2025 (1.01×)'],
      ['All employees', '1,206 EUR a month'],
    ],
    note: 'Monstat publishes pay by sector, not by occupation. Doctors are in the sector together with nurses and support staff.',
    sources: ['Monstat, average gross wages by sector 2012–2025'],
  },
  '804': sectorEn('UAH', '16,769', '21,074', '0.80', '2025', 'The State Statistics Service of Ukraine (Derzhstat)', 'Derzhstat, wages by type of economic activity, 2025'),
  '860': sectorEn('thousand UZS', '4,440.3', '7,091.1', '0.63', 'H1 2026, preliminary data', 'The statistics committee', 'Statistics committee of Uzbekistan, report for January–June 2026, chapter XVII'),
  '268': sectorEn('GEL', '1,834.5', '2,165.2', '0.85', '2025', 'Geostat', 'Geostat, average wages by economic activity (PxWeb database)'),
  '051': sectorEn('AMD', '261,687', '303,140', '0.86', '2025', 'Armstat', 'Armstat, average wages by economic activity'),
  '031': sectorEn('AZN', '939.6', '1,103.2', '0.85', '2025', 'The statistics committee', 'Statistics committee of Azerbaijan, average wages by economic activity'),
  '404': {
    group: 'The whole “human health and social work” sector',
    rows: [
      ['Sector, public part', '1,879,754.8 KES a year, 2025 (1.90×)'],
      ['Sector, private part', '1,394,432.4 KES a year (1.41×)'],
      ['All employees', '988,177.5 KES a year'],
    ],
    note: 'The statistics office gives pay for the whole sector, including nurses and other occupations; the data are provisional. We did not find a pay scale for doctors in a primary source.',
    sources: ['KNBS, Economic Survey 2026, table 3.7 (copy held by the Parliament library)'],
  },
  '068': sectorEn('BOB', '4,486.6', '3,189.6', '1.41', '2025', ILO_WHO, ilo),
  '858': sectorEn('UYU', '51,250', '47,939', '1.07', '2024', ILO_WHO, ilo),
  '818': sectorEn('EGP', '4,455', '4,954', '0.90', '2024', ILO_WHO, ilo),
  '288': sectorEn('GHS', '4,084', '2,728', '1.50', '2025', ILO_WHO, ilo, ' Another survey, from 2024, gives 0.82×, so the result is unstable.'),
  '231': sectorEn('ETB', '5,696', '4,196', '1.36', '2021', ILO_WHO, ilo),

  // ---------- nic oficjalnego ----------
  '682': {
    group: 'Doctors in government facilities, Saudi nationals',
    rows: [
      ['Resident, level 1', '9,200 SAR basic pay a month'],
      ['Consultant, level 1', '14,950 SAR basic pay a month'],
      ['Allowance for working only in the public sector', '70% of the first rate of the level (level 1)'],
    ],
    note: 'The amounts come from a table published by the human resources department of the state-run Prince Sattam bin Abdulaziz University; the regulations of the Ministry of Human Resources refer to the table, but do not contain the amounts. The statistics authority gives pay only by age, education and groups of sectors, not by occupation.',
    sources: [
      'PSAU, pay scale for medical staff (2023)',
      'HRSD, regulations on healthcare positions',
      'GASTAT, Labour Market Statistics Q2 2026',
    ],
  },
  '784': {
    group: 'Doctors in the federal administration, UAE nationals',
    rows: [
      ['Junior doctor (grade 4)', '11,180 AED basic pay, 22,295 AED with allowances a month'],
      ['Consultant (A), grade 1', '17,300 AED basic pay, 56,900 AED with allowances'],
    ],
    note: 'The federal government pay scale from 2012 (allowances: housing, technical, transport). We could not open a newer pay scale for doctors, because the legislation website is blocked. We did not find the national average wage.',
    sources: ['FAHR, Cabinet Resolution No. 23 of 2012, Salary Scales in Federal Government, table 4'],
  },
  '512': {
    group: 'Doctors in government medical facilities',
    rows: [
      ['General practitioner', '900 OMR basic pay, 1,381 OMR with allowances a month'],
      ['Specialist', '1,200 OMR basic pay, 2,120 OMR with allowances'],
      ['Consultant', '2,300 OMR basic pay, 4,220 OMR with allowances'],
    ],
    note: 'Royal Decree No. 33/2013, rates from 1 July 2012; we add up the totals with allowances (housing, utilities, transport, professional allowance) ourselves. We did not find a newer amendment. The statistics office does not give a national average wage, only the distribution of basic salaries.',
    sources: ['Royal Decree 33/2013 on the pay of medical staff, annex 1'],
  },
  '414': { note: 'We did not find an official pay scale for doctors or pay by occupation.' },
  '012': { note: 'We did not find the text of a pay scale for doctors; government websites were not accessible to us.' },
  '788': { note: 'We did not find a legal act or a pay scale for doctors in the public sector.' },
  '400': { note: 'We did not find official pay data for doctors. The statistics office website was not accessible to us.' },
  '364': { note: 'We did not find official pay data for doctors. The only survey we came across covers 2016 and gives amounts in dollars at an unspecified exchange rate, so we do not use it.' },
  '498': { note: 'The website of Moldova’s statistics office was blocked for us, so we did not check the data.' },
  '600': { note: 'We did not find official pay data for doctors; government websites were unreachable for us.' },
  '504': { note: 'We did not find official pay data for doctors or data in ILOSTAT.' },
};

/** Grupa w widoku „na etacie” — odpowiednik `oecdGroups`. */
export const oecdGroupsEn: Record<string, string> = {
  '616': 'Specialists with employment contracts, without civil-law (B2B) contracts and without adding up pay from several workplaces',
};

/** Zastrzeżenie w szczegółach kraju — odpowiednik `alerts`. */
export const alertsEn: Record<string, string> = {
  '616': 'The data for Poland cover only doctors with employment contracts. They do not include civil-law (B2B) contracts, and the pay of one person from several workplaces is not added up — each workplace is a separate record.',
};

/** Noty do krajów z danymi OECD — odpowiednik `oecdNotes`. */
export const oecdNotesEn: Record<string, string> = {
  '616': 'The OECD source for Poland is the Statistics Poland (GUS) survey “Structure of wages and salaries by occupation”: October pay times 12, establishments with 10 or more employees, a separate report from each employer. The OECD has no data from Poland for the self-employed.',
  '604': 'Peru reports amounts to the OECD, but without a ratio to the national average wage.',
};
