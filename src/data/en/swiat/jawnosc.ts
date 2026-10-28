/**
 * Glob płac lekarzy, warstwa „Jawność”, wersja angielska: teksty z src/data/swiat/jawnosc.ts (opis, przepis, dalsza lektura).
 * Poziom, zakres i adres przepisu bierze się z modułu polskiego; tutaj tylko tekst. Klucz = numeryczny kod ISO 3166-1,
 * te same klucze i ta sama kolejność co w module polskim.
 */
import type { TransparencyText } from '@/lib/swiat/types';

export const transparencyEn: Record<string, TransparencyText> = {
  '616': {
    text: 'Since July 2026 individual contracts of public facilities have been entered in the Central Register of Contracts, and a facility discloses pay on request if it chooses to. Nobody publishes the total for one person.',
    law: 'Public Finance Act, Art. 34a (Central Register of Contracts); Access to Public Information Act',
    more: { label: 'zarobkilekarzy.pl: Lack of transparency', href: '/en/mechanisms/lack-of-transparency/' },
  },

  // ---------- Northern and Western Europe ----------
  '578': {
    text: 'Anyone can look up online the net income, wealth and tax of any person (the taxpayer can see who looked them up). Gross payments to a public employee are public on request.',
    law: 'Skatteforvaltningsloven § 9-7; offentleglova § 25',
  },
  '246': {
    text: 'Every year in November the name, year of birth, taxable income and tax of every taxpayer are made public.',
    law: 'Act on the Public Disclosure and Confidentiality of Tax Information 1346/1999, § 5',
  },
  '352': {
    text: 'Every year the list of taxes levied on each person is put on public display for two weeks. Fixed salaries of public employees are public on request.',
    law: 'Income Tax Act 90/2003, Art. 98; Information Act 140/2012, Art. 7',
  },
  '752': {
    text: 'Anyone, including anonymously, can ask the Tax Agency for the assessed earned income of a specific person. The pay of public employees is a public document.',
    law: 'Offentlighets- och sekretesslagen, ch. 27 § 6; Tryckfrihetsförordningen, ch. 2 § 1',
  },
  '208': {
    text: 'On request, an authority discloses the name, position and pay of a public employee, including a doctor in a regional hospital. The name may be withheld for the employee’s safety.',
    law: 'Offentlighedsloven § 21(3) (2024 amendment)',
  },
  '756': {
    text: 'Only in some cantons, such as Zurich and Neuchâtel, can a third party obtain a given person’s taxable income. In most cantons this is not possible.',
    law: 'Cantonal law; overview by the Federal Tax Administration (FTA), as of 1 January 2025',
  },
  '250': {
    text: 'On request, only the fixed components of a public employee’s salary (grade, index) are disclosed. Bonuses and the total amount are usually not public.',
    law: 'Code of Relations between the Public and the Administration (CRPA), Art. L311-6 (CADA opinion 20226817)',
  },
  '276': {
    text: 'The pay scales for doctors set in collective agreements are public. The pay of a specific person is protected by the Freedom of Information Act and by tax secrecy.',
    law: 'Informationsfreiheitsgesetz § 5(2); Abgabenordnung § 30',
  },
  '040': {
    text: 'Pay scales and the Court of Audit’s statistics for occupational groups are public. The pay of a specific person is protected by the personal data exemption.',
    law: 'Informationsfreiheitsgesetz § 6(1)(7)(a) (in force since 1 September 2025)',
  },
  '528': {
    text: 'The pay of executive and supervisory board members of public institutions is public by name. Doctors’ medical work is expressly excluded from this act.',
    law: 'Wet normering topinkomens, Art. 1.5a and 4.1',
  },
  '372': {
    text: 'The pay scale for a post is public. The actual salary of a specific hospital consultant is personal data and is usually not disclosed.',
    law: 'Freedom of Information Act 2014, sections 2 and 37',
  },
  // ---------- Central, Eastern and Southern Europe ----------
  '380': {
    text: 'Managers in public healthcare, including heads of hospital departments, publish their pay and the total they receive from all public sources. Ordinary doctors are not covered by this obligation.',
    law: 'D.lgs. 33/2013, Art. 14(1)(c) and (1-ter), Art. 41(2)–(3)',
  },
  '705': {
    text: 'The act states expressly that public-sector pay is public, with first name, surname and gross amount. A court ordered a hospital in Celje to disclose names and pay.',
    law: 'Act on the Common Foundations of the Public Sector Salary System (ZSTSPJS), Art. 48(1)',
  },
  '203': {
    text: 'Pay from public money is disclosed on request: always for public officials and members of governing bodies, and for an ordinary employee only if the requester shows an overriding public interest.',
    law: 'Act No. 106/1999 Coll. on Free Access to Information, § 8c',
  },
  '191': {
    text: 'Information on the spending of public funds is available without weighing privacy; the Information Commissioner gives the gross pay of a public service employee as an example. We did not find a decision on a doctor’s pay.',
    law: 'Act on the Right of Access to Information (ZPPI), Art. 16(3)',
  },
  '233': {
    text: 'Documents on the pay of people paid from the budget may not be classified as internal, but access can be restricted to protect privacy. Only civil servants’ salaries are published proactively.',
    law: 'Public Information Act (AvTS), § 28, § 35 and § 36',
  },
  '703': {
    text: 'The pay of managers and officials paid from the budget is public by name. Disclosing an ordinary doctor’s pay requires their consent.',
    law: 'Act No. 211/2000 Coll. on Free Access to Information, § 9(3)',
  },
  '348': {
    text: 'Civil servants’ pay is public, and managers’ pay is disclosed by name on request. For healthcare workers the act lists as public only the employer, the name and the job category.',
    law: 'Act on Informational Self-Determination and Freedom of Information (Infotv.), § 26(2); Act on Health Service Employment (Eszjtv.), § 14(2)',
  },
  '724': {
    text: 'The annual pay of senior officials and heads of institutions is published proactively. The pay of other employees is disclosed only on request, after balancing the interests involved, and usually without names.',
    law: 'Ley 19/2013 de transparencia, Art. 8(1)(f) and Art. 15',
  },

  // ---------- outside Europe ----------
  '076': {
    text: 'Transparency portals publish by name the pay, including allowances, of every employee of the federal administration; the Supreme Federal Court (STF) held that publishing names and pay is lawful. Doctors working through their own companies are not covered.',
    law: 'Decreto 7.724/2012, Art. 7 § 3(VI); STF, Theme 483',
  },
  '152': {
    text: 'Public institutions publish every month a list of staff on permanent posts, fixed-term contracts and fee-based contracts (honorarios), with gross pay and full name.',
    law: 'Ley 20.285 on Access to Public Information, Art. 7(d)',
  },
  '604': {
    text: 'State institutions publish on the transparency portal every amount received by each person in their service, with the person identified, whatever the form of employment.',
    law: 'Consolidated text (TUO) of Law 27806, Art. 5 and 25; regulation DS 072-2003-PCM, Art. 8(m)',
  },
  '840': {
    text: 'The name, position and annual salary of federal employees are public; in many states so is the pay of public employees, e.g. doctors at University of California hospitals. Doctors in private practice are not covered.',
    law: '5 CFR 293.311; state law (e.g. Texas Government Code § 552.022)',
  },
  '124': {
    text: 'British Columbia and New Brunswick publish every year, by name, the payments each doctor receives from the public health plan. Ontario publishes the pay of hospital employees earning CAD 100,000 or more.',
    law: 'Financial Information Act (British Columbia); Public Sector Salary Disclosure Act, 1996 (Ontario)',
    more: { label: 'zarobkilekarzy.pl: disputes with doctors in Canada', href: '/en/analysis/canada-doctors-special-legislation/' },
  },
  '170': {
    text: 'Pay scales by job category are public, and for senior management so are asset and tax declarations. The pay of an ordinary doctor is not published.',
    law: 'Ley 1712/2014, Art. 9(c); Ley 2013/2019, Art. 2',
  },
  '392': {
    text: 'An official’s name, position and duties are public. Individual pay is personal information exempt from disclosure.',
    law: 'Act No. 42/1999 on Access to Information Held by Administrative Organs, Art. 5(1)',
  },
  '410': {
    text: 'An official’s name and position are public; disclosure of a specific person’s pay may be refused as personal data. Public institutions disclose only total personnel costs.',
    law: 'Official Information Disclosure Act, Art. 9(1)(6)',
  },

  '826': {
    text: 'Hospitals publish the total pay of board members, including medical directors. For other doctors only pay scales and pay bands are public.',
    law: 'National Health Service Act 2006, Schedule 7, paragraph 26(2)(ac)',
  },
};
