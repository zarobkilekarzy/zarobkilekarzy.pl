/**
 * Wersja angielska modułu src/data/lekarze-radni.ts: te same wiersze i liczby (importowane), tylko teksty
 * po angielsku — tabele statystyk, rozkład, statusy i błędy oraz opisy w wierszach pełnego zbioru
 * (forma dochodu, specjalność, uwaga). Kwoty w tabelach w złotych, bez euro (wiele kwot naraz).
 * Nazwy rad zostają po polsku (nazwy własne; radni/RadniTable oznacza je lang="pl").
 * Uwagi są przypisane do numeru wiersza (`nr`) — po zmianie uwagi w module polskim popraw ją tutaj
 * (brak tłumaczenia zatrzyma build).
 * Treść artykułu: src/content/en/articles/doctor-councillors-public-income.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import {
  BLEDY,
  LATA,
  RADNI as RADNI_PL,
  STATS,
  STATUS,
  rozklad as rozkladPl,
  type Miara,
  type Radny,
  type Rodzaj,
  type Rok,
  type Status,
  type Typ,
} from '@/data/lekarze-radni';

export { LINKS, STATS, STATUS, BLEDY, RODZAJ, WIERSZY, Z_BLEDEM, POZA_LATAMI, PRAKTYKA, STARE, ZBIOR, LATA, MAX_PRZYCHOD } from '@/data/lekarze-radni';

const zl =(n: number) => `PLN ${formatEN(n)}`;
const thousand = (n: number) => `PLN ${formatEN(n / 1000, 1)} thousand`;

/* ————————————————— labels —————————————————— */

export const STATUS_LABEL: Record<Status, string> = {
  zgodne: 'matches the declaration',
  poprawione: 'corrected',
  niepewne: 'uncertain',
  niedostepne: 'no declaration',
};

export const RODZAJ_LABEL: Record<Rodzaj, string> = {
  dochod: 'income',
  jednaKwota: 'single amount “revenue and income”',
  tylkoPrzychod: 'revenue only',
  brakPraktyki: 'no practice',
  nieustalony: 'not established',
};

export const TYP_LABEL: Record<Typ, string> = {
  gmina: 'municipal or city council',
  powiat: 'county council',
  województwo: 'regional assembly',
};

/* ————————————————— row texts —————————————————— */

/** Tytuły dochodu (`forma`) — po polskim brzmieniu. */
const FORMA: Record<string, string> = {
  'praktyka (JDG)': 'practice (sole proprietorship)',
  'praktyka + etat': 'practice + employment',
  'własna placówka (NZOZ)': 'own non-public facility (NZOZ)',
  'praktyka + własna placówka': 'practice + own facility',
  'praktyka (ryczałt)': 'practice (flat-rate tax)',
  'praktyka + spółka jawna': 'practice + general partnership',
  'praktyka + spółka cywilna': 'practice + civil-law partnership',
  'etat + działalność wykonywana osobiście': 'employment + personally performed activities',
  'spółka cywilna': 'civil-law partnership',
  'praktyka + zarząd spółki z o.o.': 'practice + management board of a limited company',
  'praktyka + dwa etaty': 'practice + two employment contracts',
  'trzy spółki + etat': 'three companies + employment',
  'spółka partnerska': 'professional partnership',
  'spółka jawna': 'general partnership',
  'spółka jawna + praktyka ze stratą': 'general partnership + practice with a loss',
  'spółka jawna (NZOZ)': 'general partnership (NZOZ)',
  'spółka cywilna (przychodnia)': 'civil-law partnership (outpatient clinic)',
  'spółka cywilna (gabinety POZ)': 'civil-law partnership (primary care offices)',
  'spółka cywilna (NZOZ)': 'civil-law partnership (NZOZ)',
  'praktyka + zarządzanie centrum medycznym': 'practice + managing a medical centre',
  'praktyka + zarząd spółki z o.o. + zlecenie': 'practice + management board of a limited company + contract of mandate',
  'praktyka + zarząd spółki z o.o. + udziały': 'practice + management board of a limited company + shares',
  'praktyka + zarząd placówki': 'practice + managing a facility',
  'praktyka + umowa ze szpitalem': 'practice + contract with a hospital',
  'praktyka + umowa w placówce + biegły sądowy': 'practice + contract at a facility + court expert',
  'praktyka + udziały w spółkach jawnej i partnerskiej': 'practice + shares in a general and a professional partnership',
  'praktyka + udziały w dwóch spółkach jawnych': 'practice + shares in two general partnerships',
  'praktyka + szpital': 'practice + hospital',
  'praktyka + spółka z o.o.': 'practice + limited company',
  'praktyka + spółka partnerska': 'practice + professional partnership',
  'praktyka + spółka partnerska + etat': 'practice + professional partnership + employment',
  'praktyka + spółka cywilna wynajmująca lokale': 'practice + civil-law partnership renting out premises',
  'praktyka + spółka cywilna + etat': 'practice + civil-law partnership + employment',
  'praktyka + spółka cywilna (NZOZ)': 'practice + civil-law partnership (NZOZ)',
  'praktyka + najem + etat': 'practice + rental + employment',
  'praktyka + kierowanie poradnią i umowy': 'practice + heading an outpatient clinic and contracts',
  'praktyka + etat za granicą': 'practice + employment abroad',
  'praktyka + etat w placówce': 'practice + employment at a facility',
  'praktyka + etat i umowy w trzech szpitalach': 'practice + employment and contracts in three hospitals',
  'praktyka + etat i dyżury': 'practice + employment and on-call duty',
  'praktyka + etat + umowy': 'practice + employment + contracts',
  'praktyka + dywidenda + etat': 'practice + dividend + employment',
  'praktyka + druga działalność + zlecenie': 'practice + second business + contract of mandate',
  'praktyka + dochody ze spółek': 'practice + income from companies',
  'praktyka (ryczałt) + zarząd dwóch spółek': 'practice (flat-rate tax) + management boards of two companies',
  'praktyka (ryczałt) + spółka z o.o.': 'practice (flat-rate tax) + limited company',
  'praktyka (ryczałt) + spółka cywilna': 'practice (flat-rate tax) + civil-law partnership',
  'praktyka (ryczałt) + rady nadzorcze + stowarzyszenie': 'practice (flat-rate tax) + supervisory boards + association',
  'praktyka (ryczałt) + rada nadzorcza': 'practice (flat-rate tax) + supervisory board',
  'praktyka (ryczałt) + etat': 'practice (flat-rate tax) + employment',
  'praktyka (osobno i wspólnie)': 'practice (separately and jointly)',
  'praktyka (karta podatkowa) + etat': 'practice (tax card) + employment',
  gabinet: 'medical office',
  'gabinet + umowy': 'medical office + contracts',
  'gabinet + udział w spółce cywilnej': 'medical office + share in a civil-law partnership',
  'gabinet + spółka partnerska': 'medical office + professional partnership',
  'gabinet + spółka cywilna (POZ)': 'medical office + civil-law partnership (primary care)',
  'gabinet + spółka cywilna (NZOZ)': 'medical office + civil-law partnership (NZOZ)',
  'gabinet + etat': 'medical office + employment',
  'etat w szpitalu': 'employment in a hospital',
  'etat + zlecenie': 'employment + contract of mandate',
  'etat + umowy zlecenia': 'employment + contracts of mandate',
  'etat + umowa': 'employment + contract',
  'etat + praktyki prywatne': 'employment + private practices',
  'etat + dywidenda + umowy': 'employment + dividend + contracts',
  'etat (praktyka zawieszona)': 'employment (practice suspended)',
  'etat (dyrektor, ordynator) + umowa': 'employment (director, head of ward) + contract',
  'etat (dyrektor i dyżury) + zlecenie': 'employment (director and on-call duty) + contract of mandate',
};

/** Specjalności według autora zbioru — pojedyncze nazwy (w wierszu rozdzielone przecinkiem). */
const SPEC: Record<string, string> = {
  anestezjolog: 'anaesthesiologist',
  chirurg: 'surgeon',
  diabetolog: 'diabetologist',
  dermatolog: 'dermatologist',
  gastroenterolog: 'gastroenterologist',
  geriatra: 'geriatrician',
  ginekolog: 'gynaecologist',
  hematolog: 'haematologist',
  internista: 'internist',
  kardiochirurg: 'cardiac surgeon',
  kardiolog: 'cardiologist',
  laryngolog: 'otolaryngologist',
  'lekarz rodzinny': 'family doctor',
  neurolog: 'neurologist',
  okulista: 'ophthalmologist',
  onkolog: 'oncologist',
  ortopeda: 'orthopaedist',
  pediatra: 'paediatrician',
  psychiatra: 'psychiatrist',
  pulmonolog: 'pulmonologist',
  radiolog: 'radiologist',
  reumatolog: 'rheumatologist',
  stomatolog: 'dentist',
  urolog: 'urologist',
  wenerolog: 'venereologist',
};

const ONE_AMOUNT_HANDWRITTEN = 'A single amount in the “revenue and income” box (handwritten).';
const ONE_AMOUNT = 'A single “revenue and income” amount.';
const REVENUE_ONLY = 'The declaration gives revenue only.';
const HANDWRITTEN = 'Handwritten.';
const NO_LINK_NO_YEAR = 'The dataset has no link to the declaration and no year.';

/** Uwagi do wierszy (`uwaga`), po numerze wiersza `nr`. */
const UWAGA: Record<number, string> = {
  2: ONE_AMOUNT_HANDWRITTEN,
  3: 'Amounts match the dataset, but the declaration filed in April 2026 refers in its text to income “in 2024”. Joint marital property.',
  5: 'About PLN 1,431,616 in the declaration (the word “revenue” crossed out), PLN 1,491,932 in the dataset. Handwritten, last digits uncertain. The dataset also mentions employment; we did not record its amount, so total income is a lower bound.',
  6: 'The declaration gives revenue only; the dataset also entered it as income.',
  7: ONE_AMOUNT_HANDWRITTEN,
  10: 'According to the corrected declaration of 21.10.2025. For 2025 the same councillor declared PLN 1,334,692 of income.',
  11: 'The link leads to the declaration for 2024; the dataset amounts (PLN 1,258,519 for 2025) are not in it.',
  12: 'Year added (as of 31.12.2025). The amount also includes a partnership renting out premises; it cannot be separated.',
  13: 'A single amount in the “revenue and income” box (handwritten). The dataset also mentions the post of head of a hospital ward; we did not record that income, so total income is a lower bound.',
  14: 'Income given with the PIT-28 tax return (flat-rate tax).',
  15: NO_LINK_NO_YEAR,
  16: 'The link in the dataset led to a file on the dataset author’s drive, not to BIP.',
  17: 'The dataset amount is a sum: practice about PLN 462.6 thousand and employment about PLN 684.8 thousand, plus minor sources of income. Handwritten, digits uncertain.',
  18: 'The dataset added revenue from the practice (PLN 1,092,529) to income from a company (PLN 52,992). The declaration does not give income from the practice.',
  19: REVENUE_ONLY,
  20: 'Handwritten; the declaration does not give revenue.',
  22: 'Practice about PLN 382.5 thousand (last digits illegible). Separately a dividend of PLN 715,252, employment about PLN 163–182 thousand (illegible) and contracts (PLN 2,131); total income excludes employment. The dataset amount (PLN 1,078,854) cannot be put together from the items in the declaration.',
  23: 'Declaration filed on 30.04.2025, i.e. for 2024 (2025 in the dataset). The dataset amount is the sum of the practice and employment (PLN 575,395).',
  24: 'Income matches. Revenue read from the handwriting as about PLN 2,646,370 (PLN 2,676,376 in the dataset), digits uncertain.',
  25: 'For the practice the declaration gives revenue only; separately, income from a civil-law partnership of PLN 24,243.',
  27: 'The practice accounts for PLN 314.7 thousand of income, the rest is employment and contracts in three hospitals. The sum from the declaration is higher than in the dataset (PLN 1,024,636).',
  28: 'A single amount described as “revenue after deductions” (PLN 1,009,570 in the dataset), which also includes rental within the business. The declaration does not give income.',
  29: HANDWRITTEN,
  30: 'There is no practice in the declaration. The amount is employment (PLN 885,623) and personally performed activities (PLN 114,649).',
  31: 'Year added. The dataset amount is the sum of the practice and employment (PLN 460,986).',
  33: HANDWRITTEN,
  34: 'Year added. A single “revenue and income” amount.',
  35: 'The dataset amount is the sum of the practice and two sources of income from companies (PLN 66,340 and 183,149). Handwritten.',
  36: NO_LINK_NO_YEAR,
  37: 'The dataset amount is the sum of the practice and employment (PLN 387,880).',
  39: 'For the practice the declaration gives revenue only; the dataset added it to income from employment (PLN 312,884).',
  40: 'Amounts in the dataset rounded (PLN 910,000 and 918,000). Practice about PLN 755.8 thousand, employment and on-call duty about PLN 155.3 thousand. Handwritten, last digits uncertain.',
  41: 'Business activity with zero income. The amount is employment (PLN 834,772) and personally performed activities (PLN 69,267).',
  45: 'The link leads to the declaration filed at the start of the term of office, with income for 2023 (2024 in the dataset). Separately, “other income” of PLN 161,431 without description.',
  46: 'There is no practice in the declaration. PLN 864,000 in the dataset, i.e. rounded income from employment (PLN 864,626).',
  47: 'For the practice the declaration gives flat-rate revenue only; separately, income from a supervisory board of PLN 49,845.',
  51: 'The link leads to the declaration filed on 28.04.2025, i.e. for 2024 (2025 in the dataset).',
  52: 'The declaration itself adds up flat-rate revenue from the practice (PLN 714,530) and income from a civil-law partnership (PLN 104,199). It does not give income from the practice.',
  53: 'There is no practice in the declaration. The amount is employment (PLN 546,214) and contracts of mandate (PLN 272,272).',
  54: 'The dataset amount is the sum of the practice (PLN 691,492), a professional partnership (PLN 57,280) and employment (PLN 58,924).',
  57: 'Income from the practice is an estimate entered in the declaration. The rest: supervisory boards PLN 75,322, a doctors’ association PLN 68,640.',
  58: 'According to the corrected declaration of 04.11.2025 (a difference of about PLN 200). Including contracts of mandate and employment in a public office (about PLN 14.4 thousand).',
  60: 'The highest revenue in the dataset. Handwritten, checked under magnification.',
  61: 'A single amount for the practice (PIT-28). The dataset amount is the sum including income from the management boards of two companies (PLN 125,395).',
  62: 'Two amounts next to the practice (“53,825/358,509”) without description. The dataset took PLN 358,509 as income (with employment of PLN 413,055: PLN 771,564); if the income is PLN 53,825, the total comes to PLN 466,880.',
  63: 'A single amount (PIT-28). Handwritten.',
  64: 'The practice accounts for PLN 168.4 thousand of income, the rest is employment, contracts and a supervisory board. The dataset amount (PLN 755,955) cannot be reconstructed exactly.',
  65: 'The dataset amount is the sum of the practice and employment in a hospital (PLN 287,962).',
  66: 'The dataset amount is the sum of the practice and employment (PLN 339,286). Including income from a municipal committee (PLN 4,873).',
  67: 'For the practice the declaration gives revenue only; the dataset added it to income from employment (PLN 443,915).',
  68: REVENUE_ONLY,
  69: 'The dataset amount is the sum of the practice and employment in a hospital (PLN 349,754). Handwritten.',
  71: 'Medical office PLN 134,063 and a share in a professional partnership PLN 595,969. Handwritten.',
  72: 'Revenue and income entered as the same amount.',
  75: 'Handwritten; the date under the declaration is illegible, BIP describes the file as “for 2025”.',
  76: 'The dataset amount is the sum of the practice and employment (PLN 141,846). Handwritten.',
  78: 'The dataset added the loss of one of the companies (PLN 41,914) instead of subtracting it: PLN 701,443 instead of PLN 617,617. Including contracts of mandate (PLN 10,813).',
  80: 'There is no practice in the declaration. The amount is employment (PLN 118,516), a dividend from the councillor’s own medical company (PLN 560,000) and contracts (PLN 7,028).',
  81: 'The dataset amount is income from employment, not from a practice (the dataset described it as a sole proprietorship). Including personally performed activities (PLN 5,079).',
  82: 'The dataset amount is the sum of the practice and employment in a hospital (PLN 274,460). Handwritten.',
  83: 'Declaration filed on 30.04.2025, i.e. for 2024 (2025 in the dataset). The dataset amount is the sum of the practice and two employment contracts.',
  84: 'The declaration gives revenue, and next to income only the word “ryczałt” (flat-rate tax).',
  85: 'The dataset added up the practice, rental (PLN 27,165) and employment (PLN 155,161). Without rental: PLN 642,761. Handwritten.',
  86: 'Handwritten with a correction; the second and third digits of the income are uncertain.',
  87: 'There is no practice in the declaration. Amounts in the dataset rounded (PLN 665,000 and 701,000). Two employment contracts and a contract with a private facility; minor contracts (about PLN 8.3 thousand) not included. Handwritten.',
  89: REVENUE_ONLY,
  90: 'The “total” entered by the councillor. Handwritten.',
  91: 'The dataset gave income from a general partnership (PLN 638,036) and omitted the loss from the councillor’s own practice (PLN 42,196).',
  92: 'The dataset amount is the sum of the practice and employment (PLN 217,598).',
  93: 'Including a second, minor business activity (about PLN 18.6 thousand, approximate reading).',
  94: 'The dataset amount is the sum of the practice and income from a contract with a hospital (PLN 420,113). Handwritten.',
  95: 'The dataset amount is the sum of the practice and employment (PLN 271,616).',
  96: 'The dataset amount is the sum of the practice and employment in a hospital (PLN 253,734).',
  98: 'The dataset amount is the sum of the practice (about PLN 101.3 thousand), a civil-law partnership (PLN 162,065) and employment (PLN 330,788). Handwritten, some digits illegible.',
  99: 'The dataset amount (PLN 593,507) cannot be put together from the items in the declaration: the practice, PLN 401,414, and management, PLN 183,601, give PLN 585,016. Handwritten.',
  100: HANDWRITTEN,
  101: 'Year added. The declaration gives revenue and “revenue after deductions” (PLN 587,746); the dataset entered the latter as income.',
  102: 'The dataset amount is the sum of the practice and income from a limited company (PLN 52,500).',
  103: 'Including training (PLN 2,660).',
  104: 'The link leads to the declaration for 2025 with illegible income. The dataset amounts (PLN 581,707 for 2024) are not in it; we did not check the declaration for 2024.',
  105: 'The dataset amount is the sum of the medical office and employment (PLN 402,629). Handwritten.',
  107: 'The dataset amount is the sum of the practice, company management (PLN 152,061) and shares (PLN 24,000).',
  108: 'The dataset amount is the sum of the practice and employment in a hospital (PLN 190,028).',
  111: 'The dataset amount is the sum of the practice and employment in a hospital (PLN 297,169).',
  113: 'The revenue in the declaration contains an obvious writing error, so we do not give it.',
  114: 'Amounts match (practice PLN 26,693 and two general partnerships). The dataset describes the councillor as a physiotherapist — we have not confirmed that this is a doctor.',
  115: ONE_AMOUNT,
  116: 'Including sponsorship contracts (PLN 8,856).',
  117: 'There is no practice in the declaration (the dataset described it as a sole proprietorship). The amount is employment (PLN 277,212) and personally performed activities (PLN 225,170).',
  119: 'Typo in the dataset: PLN 488,053 instead of PLN 488,083.',
  120: 'Medical office about PLN 7.7 thousand and civil-law partnership about PLN 466.6 thousand. Handwritten; our reading differs from the dataset by PLN 40 in the illegible digits.',
  121: HANDWRITTEN,
  122: 'The practice accounts for PLN 46.7 thousand of income, the rest is a civil-law contract (PLN 371,748) and court expert opinions (PLN 54,973).',
  123: 'The dataset amount is the sum of the practice, company management (PLN 46,000) and a contract of mandate (PLN 22,421).',
  124: 'A single “revenue and income” amount for the practice. Separately, pay from a hospital abroad (PLN 417,193), which the dataset did not include.',
  125: 'The dataset amount is the sum of the practice and employment (PLN 294,901).',
  126: 'The link leads to the declaration for 2025 (2024 in the dataset) with revenue only; the dataset amount (PLN 460,927) does not come from any item. Separately, pay from a committee.',
  127: 'The practice accounts for PLN 21.7 thousand of income, the rest is employment at a facility in which the councillor holds shares (PLN 438,154).',
  128: 'The dataset amount is the sum of the practice and employment (PLN 206,545).',
  129: 'The dataset amount is the sum of the practice and two employment contracts (PLN 129,228 and 178,508).',
  130: 'Employment in a hospital shown separately; we did not record its amount, so total income is a lower bound.',
  132: REVENUE_ONLY,
  133: 'The dataset amount is the sum of the practice and “other income” (PLN 54,867: heading an outpatient clinic, contracts with companies).',
  134: 'A single amount “revenue = income” (handwritten). Including contracts (PLN 48,775) and lectures (PLN 10,000).',
  135: 'The dataset amount is the sum of the medical office and employment (PLN 220,478).',
  136: 'The declaration is internally inconsistent: under business activity, income of PLN 25,433; under other income, PLN 325,433. The dataset took the second amount (with employment: PLN 410,609).',
  137: 'The declaration gives revenue only (the word “income” crossed out).',
  138: ONE_AMOUNT,
  141: 'According to the corrected declaration of 18.05.2026: practice PLN 332,436 and employment PLN 55,732 (PLN 388,227 in the dataset). Handwritten.',
  142: 'The dataset amount is the sum of the practice and income from a company management board (PLN 40,200).',
  144: REVENUE_ONLY,
  145: 'The practice accounts for PLN 52.2 thousand of income, the rest is employment (PLN 295,838).',
  146: REVENUE_ONLY,
  147: 'The dataset amount is the sum of employment (about PLN 276.5 thousand) and private practices (about PLN 57.2 thousand). Handwritten, some digits illegible.',
  149: HANDWRITTEN,
  150: 'Contracts shown separately; we did not record their amounts, so total income is a lower bound. Handwritten.',
  153: 'The practice accounts for PLN 46.9 thousand of income, the rest is employment (PLN 253,228).',
  154: 'There is no practice in the declaration. The dataset amount is employment; including a contract of mandate (PLN 34,080). Handwritten.',
  155: 'The dataset added revenue from the practice (PLN 180,000) to income from a limited company (PLN 117,000).',
  156: REVENUE_ONLY,
  160: 'The practice accounts for about PLN 127.2 thousand of income, the rest is employment (PLN 158,498).',
  163: 'Practice suspended; the dataset amount is pay from employment.',
  164: 'The practice accounts for about PLN 94.9 thousand of income, the rest is employment (PLN 142,451). Handwritten.',
  165: 'The practice accounts for PLN 15.7 thousand of income, the rest is employment in a hospital (PLN 220,114).',
  167: 'Practice about PLN 152 thousand, a second business about PLN 35 thousand, contract of mandate about PLN 29.9 thousand. Handwritten, some digits uncertain.',
  171: 'The dataset amounts (PLN 205,702 of income) do not correspond to any item in the declaration.',
  172: 'There is no practice in the declaration. The dataset amount is employment; including a contract (PLN 6,600).',
  174: 'The practice accounts for PLN 12.7 thousand of income, the rest is employment (PLN 168,114).',
  175: 'A single “revenue and income” amount. Including a contract of mandate (PLN 42,600).',
  178: 'Amounts from the declaration filed in 2025, i.e. for 2024 (2025 in the dataset). For 2025: income of PLN 117,207.',
  180: 'Amounts from the declaration filed on 23.04.2025, i.e. for 2024 (2025 in the dataset).',
  182: 'Typo in the dataset: PLN 25,325 instead of PLN 825,325 (a missing digit).',
};

const forma = (r: Radny) => {
  const en = FORMA[r.forma];
  if (!en) throw new Error(`[en] brak angielskiego opisu formy dochodu „${r.forma}” (wiersz ${r.nr})`);
  return en;
};
const spec = (r: Radny) =>
  r.spec &&
  r.spec
    .split(', ')
    .map((s) => {
      const en = SPEC[s];
      if (!en) throw new Error(`[en] brak angielskiej nazwy specjalności „${s}” (wiersz ${r.nr})`);
      return en;
    })
    .join(', ');
const uwaga = (r: Radny) => {
  if (!r.uwaga) return undefined;
  const en = UWAGA[r.nr];
  if (!en) throw new Error(`[en] brak angielskiej uwagi do wiersza ${r.nr}`);
  return en;
};

/** Wiersze pełnego zbioru z angielskimi opisami; liczby, statusy i linki bez zmian. */
export const RADNI: Radny[] = RADNI_PL.map((r) => ({ ...r, forma: forma(r), spec: spec(r), uwaga: uwaga(r) }));

/* ————————————————— tables and charts for the article —————————————————— */

/** Statystyki jednej miary za oba lata, z liczbą wierszy w każdej. */
export const statsTable = (miara: Miara): CompareTable => {
  const s = LATA.map((rok) => STATS[miara][rok]);
  return {
    columns: ['', ...LATA.map((rok) => `For ${rok}`)],
    rows: [
      { cells: ['Rows in the statistics', ...s.map((x) => `${x.n} of ${x.wierszy} (including ${x.jednaKwota} with a single “revenue and income” amount)`)] },
      { cells: ['Median', ...s.map((x) => thousand(x.mediana))], marked: true },
      { cells: ['PLN 500,000 and more', ...s.map((x) => `${x.od500} of ${x.n}`)] },
      { cells: ['PLN 1 million and more', ...s.map((x) => `${x.od1mln} of ${x.n}`)] },
      { cells: ['Highest', ...s.map((x) => zl(x.max))] },
    ],
  };
};

/** Przedziały w kolejności z modułu polskiego (PRZEDZIALY). */
const BRACKETS = [
  'under PLN 250,000',
  'PLN 250,000–500,000',
  'PLN 500,000–750,000',
  'PLN 750,000 – 1 million',
  'PLN 1–1.5 million',
  'PLN 1.5 million and more',
];

/** Rozkład dochodu z pracy łącznie za jeden rok — liczby z modułu polskiego, etykiety po angielsku. */
export const rozklad = (rok: Rok): BarRow[] => {
  const rows = rozkladPl(rok);
  if (rows.length !== BRACKETS.length) throw new Error('[en] liczba przedziałów rozkładu różni się od wersji polskiej');
  return rows.map((row, i) => ({ ...row, label: BRACKETS[i] }));
};

/** Statusy weryfikacji z liczbą wierszy. */
export const statusTable: CompareTable = {
  columns: ['Status', 'Rows', 'What it means'],
  rows: [
    { cells: ['Matches the declaration', String(STATUS.zgodne), `the dataset’s amount and year are in the declaration; in ${RADNI_PL.filter((r) => r.status === 'zgodne' && r.bledy.includes('suma')).length} of these rows the amount was a sum of several sources of income, which we split into the practice and total income`] },
    { cells: ['Corrected', String(STATUS.poprawione), 'the dataset had a different amount, a different year, revenue instead of income, or a loss added instead of subtracted — we entered the values from the declaration'] },
    { cells: ['Uncertain', String(STATUS.niepewne), 'the declaration does not settle it: contradictory amounts, an amount without description, a year in the text different from the filing date, or the profession not confirmed'] },
    { cells: ['No declaration', String(STATUS.niedostepne), 'the dataset has no working link, and we did not find the declaration'] },
  ],
};

/** Typy błędów w zbiorze (wiersz może mieć kilka). */
export const bledyTable: CompareTable = {
  columns: ['What was wrong', 'Rows'],
  rows: [
    { cells: ['A sum of several sources (practice, employment, company, contracts) given as income from the practice', String(BLEDY.suma)] },
    { cells: ['Revenue entered as income — the declaration gives revenue only', String(BLEDY.przychod)] },
    { cells: ['A different amount: a typo, a missing digit, a corrected declaration', String(BLEDY.kwota)] },
    { cells: ['Wrong year — a declaration for a different year than in the dataset', String(BLEDY.rok)] },
    { cells: ['No year in the dataset', String(BLEDY.brakRoku)] },
    { cells: ['Amount rounded to thousands', String(BLEDY.zaokraglenie)] },
    { cells: ['A loss added instead of subtracted, or omitted', String(BLEDY.strata)] },
  ],
};
