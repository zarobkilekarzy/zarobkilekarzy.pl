/**
 * Wersja angielska modułu src/data/reglamentacja-dostepu.ts: te same liczby i adresy (importowane),
 * tabele po angielsku. Liczby w komórkach tabel są w module polskim wpisane w tekst — przepisane dokładnie.
 * Treść artykułu: src/content/en/articles/restricted-access-to-the-profession.mdx.
 */
import type { CompareTable } from '@/types';

export { LINKS, SPRING_2025 } from '@/data/reglamentacja-dostepu';

/** Who decides at successive stages of the path to the profession and to specialisation (same rows as in Polish). */
export const GATES_TABLE: CompareTable = {
  columns: ['', 'Who decides', 'Instrument'],
  rows: [
    { cells: ['New medical programme', 'Minister of science; the Polish Accreditation Committee (PKA) gives an opinion', 'Permission to run the programme'] },
    { cells: ['Places at medical school', 'Minister of health; the medical self-government gives an opinion on the draft', 'Annual regulation with a limit for each university'] },
    { cells: ['Licence to practise', 'Regional medical council', 'Grant of the licence after the diploma, the postgraduate internship and the Medical Final Examination (LEK)'] },
    { cells: ['Residency places', 'Minister of health', 'Allocates places by field and pays the resident’s salary from the state budget'] },
    { cells: ['Training facility', 'Director of the CMKP on the basis of an opinion of an expert team', 'Accreditation and a maximum number of training places for 5 years'] },
    { cells: ['Specialisation supervisor', 'Head of the facility appoints; the national consultant agrees to an exception', 'At most 3 trainees at a time, exceptionally 4'] },
    { cells: ['Order of candidates', 'Director of the CMKP, through the voivodes', 'Ranking by score as a percentage of the maximum number of points'] },
    { cells: ['Diploma from outside the European Union', 'Regional medical council; in the simplified procedure the minister of health', 'Recognition of the diploma or the LEW examination; the minister’s consent for a specified scope, period and place'] },
  ],
};

/**
 * Lowest score of a person qualified for residency in a given voivodeship, spring 2025.
 * Range across the voivodeships in which someone was given residency in the field.
 * Internal medicine: one entry with a score of 0.00% (Śląskie) omitted.
 */
export const THRESHOLDS_TABLE: CompareTable = {
  columns: ['', 'Lowest score of a person admitted to residency', 'Voivodeships with admissions'],
  rows: [
    { cells: ['Endocrinology', '91.3–93.4%', '8'], marked: true },
    { cells: ['Dermatology and venereology', '91.2–92.8%', '9'], marked: true },
    { cells: ['Plastic surgery', '90.2–91.9%', '4'], marked: true },
    { cells: ['Ophthalmology', '86.0–88.4%', '12'] },
    { cells: ['Cardiology', '63.8–88.5%', '16'] },
    { cells: ['Internal medicine', '54.4–80.2%', '16'] },
  ],
};
