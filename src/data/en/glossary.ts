/**
 * Wersja angielska słownika pojęć (strona /en/glossary/; oryginał: src/content/glossary.yaml + src/pages/slownik/index.astro).
 * Hasło (`term`) zostaje po polsku — czytelnik spotyka polskie słowo w źródłach — a tu są teksty EN każdego hasła
 * pod tym samym id (kotwica /en/glossary/#kontrakt jak /slownik/#kontrakt). Strona EN bierze hasła z getGlossary()
 * i podmienia teksty; brak hasła tutaj (albo hasło, którego nie ma już w PL) to błąd builda strony EN.
 *
 *   full     angielskie objaśnienie hasła
 *   def      definicja (te same tezy i zastrzeżenia co w PL)
 *   more     „More”, tylko gdy nie da się go wyliczyć: strona PL „Więcej” prowadzi do artykułu z tłumaczeniem
 *            bez kotwicy → strona EN sama bierze adres i tytuł tłumaczenia. Podaj `more`, gdy w PL jest kotwica
 *            (kotwice EN są inne) albo cel nie ma wersji EN (adres PL — strona dopisze „(in Polish)”).
 *   sources  te same adresy w tej samej kolejności co w PL (sprawdza strona); opisy po angielsku.
 *            Wszystkie źródła są po polsku — strona dopisuje „(in Polish)”; źródło angielskie: `english: true`.
 */
import type { Link } from '@/types';

export interface GlossarySourceEn {
  label: string;
  href: string;
  /** źródło po angielsku — bez dopisku „(in Polish)” */
  english?: boolean;
}

export interface GlossaryEntryEn {
  full: string;
  def: string;
  more?: Link[];
  sources?: GlossarySourceEn[];
}

export const glossaryPage = {
  title: 'Glossary',
  docTitle: 'Glossary of Polish healthcare terms',
  eyebrow: 'Without jargon',
  lead: 'Healthcare speaks a language of its own. Here we explain the key terms used in our texts in a few sentences — for each entry we give the legal basis or a source and point to a text that covers the subject in more depth. Each entry keeps the Polish term, as it appears in Polish sources, with an English explanation.',
  description: 'Contract, capitation, lump sum, standby, PWZ, JGP — Polish healthcare terms explained in a few sentences, with the legal basis or a source for each entry.',
  updated: '16.10.2026',
};

const UOSOZ = 'Act on healthcare services financed from public funds (consolidated text Dz.U. 2025 item 1461)';
const UODL = 'Act on medical activity (consolidated text Dz.U. 2026 item 156)';
const UZL = 'Act on the professions of doctor and dentist (consolidated text Dz.U. 2026 item 37)';
const UIL = 'Act on medical chambers (consolidated text Dz.U. 2021 item 1342)';
const ACT_972 = 'Act of 19 June 2026 (Dz.U. 2026 item 972), new wording of Art. 27a of the Act on medical activity';
const CRL_STATS = 'Supreme Medical Chamber, Central Register of Doctors — statistical information';

const MULTIPLE_JOBS = { href: '/en/mechanisms/multiple-jobs-parallel-contracts/', label: 'Multiple jobs and parallel contracts' };
const NFZ_PAYMENTS = { href: '/en/mechanisms/nfz-payment-system/', label: 'How the NFZ pays hospitals: lump sums, points and overperformance' };
const at = (link: Link, anchor: string): Link => ({ ...link, href: `${link.href}#${anchor}` });
const DEMAND: Link = { href: '/en/demand/', label: 'Our demand: public amounts, protected names' };

export const glossaryEn: Record<string, GlossaryEntryEn> = {
  aotmit: {
    full: 'Agency for Health Technology Assessment and Tariff System',
    def: 'AOTMiT is a state agency supervised by the Minister of Health. It sets the tariffs for healthcare services, which the National Health Fund (NFZ) transfers into its own orders once the minister has approved them, issues recommendations on their financing and collects pay data from facilities.',
    sources: [
      { label: `${UOSOZ}, Art. 31lb, 31lc, 31m and 31n`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1461/text.pdf' },
    ],
  },
  'dyzur-medyczny': {
    full: 'on-call duty: hospital work outside normal hours',
    def: 'On-call duty is work by a doctor or another medical employee of a hospital outside normal working hours, on site at the facility. It counts as working time and is paid like overtime, with a supplement of 50% or 100% of the rate (at night, on Sundays and public holidays). It is a different concept from standby “on the phone”.',
    sources: [
      { label: `${UODL}, Art. 95`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/156/text.pdf' },
      { label: 'Labour Code (consolidated text Dz.U. 2025 item 277), Art. 151¹ § 1–3', href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/277/text.pdf' },
    ],
  },
  etat: {
    full: 'employment contract',
    def: 'An etat is an employment contract under the Labour Code and, in healthcare facilities, also under the Act on medical activity. The law sets the lowest basic salary for each medical profession, and actual pay may be higher. Working time is limited: the standard is an average of 37 hours 55 minutes a week, and more with the written consent of a hospital employee (opt-out).',
    sources: [
      { label: 'Act of 8 June 2017 on the method of determining the lowest basic salary of certain employees of medical entities, Art. 3', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20170001473' },
      { label: `${UODL}, Art. 93 and 96`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/156/text.pdf' },
    ],
  },
  gotowosc: {
    full: 'standby “on the phone”',
    def: 'Standby is time during which a hospital employee must be available and report when called; colloquially it is called on-call duty “on the phone”. For each hour of standby the employee receives half of the hourly rate of basic salary, and once called in, the work is settled like on-call duty.',
    more: [at(MULTIPLE_JOBS, 'standby-on-the-phone')],
    sources: [
      { label: `${UODL}, Art. 98`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/156/text.pdf' },
    ],
  },
  ikp: {
    full: 'Internet Patient Account',
    def: 'The Internet Patient Account (IKP) at pacjent.gov.pl shows, after logging in, among other things e-prescriptions, e-referrals and the services that facilities have billed to the NFZ under your PESEL number (national identification number). It lets you check whether the visits entered in the billing actually took place.',
    sources: [
      { label: 'pacjent.gov.pl, Internet Patient Account', href: 'https://pacjent.gov.pl/internetowe-konto-pacjenta' },
    ],
  },
  jgp: {
    full: 'Diagnosis-Related Groups',
    def: 'JGP is the system in which the NFZ assigns each hospital stay to a group on the basis of diagnoses and the procedures performed. Each group has a value in points, which determines how much the hospital bills for the stay.',
    more: [
      at(NFZ_PAYMENTS, 'jgp-points-the-description-of-the-stay-decides-the-payment'),
      { href: '/en/mechanisms/pricing-of-healthcare-services/', label: 'Pricing of healthcare services: who sets what the NFZ pays' },
    ],
    sources: [
      { label: 'NFZ, Diagnosis-Related Groups (JGP) — materials for healthcare providers', href: 'https://www.nfz.gov.pl/dla-swiadczeniodawcy/jednorodne-grupy-pacjentow/' },
    ],
  },
  kapitacja: {
    full: 'a rate per patient on a primary care doctor’s list',
    def: 'Capitation is a way of paying in primary healthcare (POZ): the NFZ pays a fixed annual rate for each patient registered on a doctor’s list, regardless of the number of visits. The rate is multiplied by a coefficient that depends on the patient’s age. Apart from capitation, primary care receives separate payments, e.g. for coordinated care.',
    sources: [
      { label: 'Order of the President of the NFZ No. 65/2026/DSOZ of 14 July 2026 (capitation rates in primary care)', href: 'https://baw.nfz.gov.pl/NFZ/document/43917/Zarzadzenie-65_2026_DSOZ' },
    ],
  },
  'komin-placowy': {
    full: 'pay chimney; the “chimney act” (ustawa kominowa)',
    def: 'A pay chimney is the pay of one person that is clearly higher than the pay of everyone else. The so-called chimney act limits the salary of the head of an independent public hospital to six times the average wage, but does not cover doctors working under contracts.',
    more: [{ href: '/en/analysis/hospital-directors-pay/', label: 'How much hospital directors earn in Poland, and what a pay chimney is' }],
    sources: [
      { label: 'Act of 3 March 2000 on the remuneration of persons managing certain legal entities (consolidated text Dz.U. 2019 item 2136), Art. 8 point 10', href: 'https://api.sejm.gov.pl/eli/acts/DU/2019/2136/text.pdf' },
    ],
  },
  kontrakt: {
    full: 'civil-law contract (B2B or contract of mandate)',
    def: 'A contract (kontrakt) is a civil-law contract, not an employment contract: the doctor runs a business (B2B) and invoices the facility, or works under a contract of mandate. The rate is agreed by the parties, and the working-time limits for employees do not apply to it. Nobody publishes the total amount one person receives under contracts with several facilities.',
    sources: [
      { label: `${UODL}, Art. 26 and 27 (contracts for the provision of healthcare services)`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/156/text.pdf' },
    ],
  },
  'liczba-lekarzy': {
    full: 'with a licence to practise, practising, working with patients',
    def: 'Doctors are counted in three ways: everyone with a licence to practise (including those not working in the profession), those who practise according to the medical chamber’s register, and those who, according to Statistics Poland (GUS), work directly with patients. These figures differ in definition and reference date, so we do not combine them in one calculation.',
    more: [
      { href: '/en/analysis/why-poland-is-short-of-doctors/', label: 'Why Poland is short of doctors' },
      { href: '/analizy/symulator-podazy-lekarzy/', label: 'Doctor supply simulator 1987–2050' },
    ],
    sources: [
      { label: `${UIL}, Art. 49(1) (register of practising and non-practising doctors)`, href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210001342' },
      { label: CRL_STATS, href: 'https://nil.org.pl/rejestry/centralny-rejestr-lekarzy/informacje-statystyczne' },
    ],
  },
  nadwykonania: {
    full: 'services above the plan in the contract with the NFZ',
    def: 'Overperformance means services provided above the plan or limit in a facility’s contract with the NFZ. The Fund does not always pay for them in full: it pays, among other things, for saving lives in an emergency, and in the hospital network overperformance counts only partly when the next lump sum is set.',
    more: [at(NFZ_PAYMENTS, 'overperformance-work-above-the-plan')],
    sources: [
      { label: 'NFZ, “NFZ settles overperformance in non-limited services” (20.04.2026)', href: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/nfz-rozlicza-nadwykonania-w-swiadczeniach-nielimitowanych,8926.html' },
      { label: 'Resolution of seven judges of the Supreme Court of 19 March 2019, III CZP 80/18 (summary in Rzeczpospolita)', href: 'https://www.rp.pl/ochrona-zdrowia/art1427731-sad-najwyzszy-w-sprawie-zasad-placenia-za-nadwykonania-ratujace-zycie-w-stanach-naglych' },
    ],
  },
  nfz: {
    full: 'National Health Fund',
    def: 'The National Health Fund is the state payer that signs contracts with facilities and pays them for treating patients. The health contribution is collected by the Social Insurance Institution (ZUS) and the Agricultural Social Insurance Fund (KRUS), which then pass it on to the Fund; in addition to the contribution, the Fund receives, among other things, subsidies from the state budget.',
    sources: [
      { label: `${UOSOZ}, Art. 87–91, 96, 97 and 116`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1461/text.pdf' },
    ],
  },
  'nil-crl': {
    full: 'Supreme Medical Chamber and Central Register of Doctors',
    def: 'The Supreme Medical Chamber (NIL) is the professional self-government of doctors and dentists. It keeps the Central Register of Doctors (CRL), a database of people with a licence to practise; our figures on the medical workforce come from its statistics.',
    sources: [
      { label: `${UIL}, Art. 49–50`, href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210001342' },
      { label: CRL_STATS, href: 'https://nil.org.pl/rejestry/centralny-rejestr-lekarzy/informacje-statystyczne' },
    ],
  },
  'opt-out': {
    full: 'consent to longer working time',
    def: 'The opt-out is the written consent of a hospital’s medical employee to work on average more than 48 hours a week in a settlement period (of up to 4 months). In practice the upper limit is about 78 hours a week, because the employee must be guaranteed rest. It applies to employment contracts, and the provision is due to expire on 1 January 2028.',
    more: [
      at(MULTIPLE_JOBS, 'the-provision-that-allows-it-and-its-expiry-date'),
      { href: '/en/mechanisms/contract-vs-employment/', label: 'Contract or employment: this decides what can be seen' },
    ],
    sources: [
      { label: `${UODL}, Art. 96 and 97`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/156/text.pdf' },
    ],
  },
  pseudonimizacja: {
    full: 'a permanent identifier instead of a name',
    def: 'Pseudonymisation means replacing a name with a permanent code. The same person always has the same code, so their payments from many facilities can be added up, but without an additional key it is not known who they are. It is not anonymisation: such data are still personal data.',
    more: [DEMAND],
    sources: [
      { label: 'Regulation (EU) 2016/679 of the European Parliament and of the Council (GDPR), Art. 4(5)', href: 'https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:32016R0679' },
    ],
  },
  pwz: {
    full: 'licence to practise',
    def: 'The licence to practise (PWZ) is the authorisation to treat patients that a regional medical council grants to a doctor; it has a unique seven-digit number, visible in the register of doctors. Since 5 August 2026 the Minister of Health can require facilities to provide pay data marked with the PESEL number and the PWZ number, and our demand is the publication of the total payments to each person under a permanent identifier, without names.',
    more: [
      { href: '/en/analysis/pay-data-act-vs-public-register/', label: 'The pay data act: what the state collects and what it will not show' },
      DEMAND,
    ],
    sources: [
      { label: `${UZL}, Art. 5`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/37/text.pdf' },
      { label: 'Supreme Medical Chamber, Rules for verifying the licence-to-practise number', href: 'https://nil.org.pl/rejestry/centralny-rejestr-lekarzy/zasady-weryfikowania-nr-prawa-wykonywania-zawodu' },
      { label: ACT_972, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/972/text.pdf' },
    ],
  },
  rezydentura: {
    full: 'a mode of specialist training',
    def: 'Residency is a mode of specialist training in which the doctor works under an employment contract at the facility providing the training. The basic salary is financed from the state budget by the Minister of Health and paid by the facility. Its level is set by a regulation and depends on the field and on whether the doctor is in the first two years of training.',
    sources: [
      { label: `${UZL}, Art. 16h and 16j`, href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000037' },
      { label: 'Regulation of the Minister of Health of 25 June 2026 on the pay of resident doctors (Dz.U. 2026 item 856)', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000856' },
    ],
  },
  ryczalt: {
    full: 'the amount for a network hospital for a settlement period',
    def: 'The lump sum is the amount the NFZ pays a hospital in the hospital network for the whole settlement period, instead of paying separately for each stay. Its level depends, among other things, on how many services, and of what kind, the hospital reported in the previous period.',
    more: [at(NFZ_PAYMENTS, 'the-lump-sum-an-amount-in-advance-for-the-whole-period')],
    sources: [
      { label: `${UOSOZ}, Art. 136c`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1461/text.pdf' },
    ],
  },
  'siec-szpitali': {
    full: 'system of basic hospital provision (PSZ)',
    def: 'The hospital network, i.e. the system of basic hospital provision, is a group of hospitals qualified for four years for stable lump-sum financing. It covers, among other things, inpatient treatment, hospital outpatient clinics and rehabilitation.',
    sources: [
      { label: `${UOSOZ}, Art. 95l, 95m, 136c and 159a`, href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1461/text.pdf' },
    ],
  },
  wieloetatowosc: {
    full: 'working in several facilities at once',
    def: 'Holding multiple jobs means one person working in several facilities at the same time: as an employee, under a contract or under a contract of mandate. Each facility knows only its own share of the hours and payments. Since August 2026 the Minister of Health can collect data from which they can be added up, but does not publish them.',
    sources: [
      { label: ACT_972, href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/972/text.pdf' },
    ],
  },
};
