/**
 * Rachunek drogi do zawodu: suma okresów z przepisów, od października roku matury. Bez przerw, powtórek i czekania na miejsce.
 * Czyta go strona przy budowaniu i skrypt planera w przeglądarce, więc plik nie importuje danych.
 */
import type { Locale } from '@/i18n/locales';
import { plural } from '@/lib/format';

/** Studia: 12 semestrów. Staż: 13 miesięcy (Dz.U. 2023 poz. 377, § 3). */
export const STUDIES_MONTHS = 72;
export const INTERNSHIP_MONTHS = 13;
const OCTOBER = 9;
/** Wiek przy maturze w podpisie rachunku. */
const MATURA_AGE = 19;

const yearOf = (month: number) => Math.floor(month / 12);

/** „5 lat”, „4,5 roku”; po angielsku „5 years”, „4.5 years” */
export const lengthLabel = (months: number, locale: Locale = 'pl') => {
  const years = months / 12;
  if (locale === 'en') return `${years} ${years === 1 ? 'year' : 'years'}`;
  return Number.isInteger(years) ? `${years} ${plural(years, ['rok', 'lata', 'lat'])}` : `${String(years).replace('.', ',')} roku`;
};

export const roadOf = (matura: number, fieldMonths: number, locale: Locale = 'pl') => {
  const start = matura * 12 + OCTOBER;
  const studiesEnd = start + STUDIES_MONTHS;
  const internshipEnd = studiesEnd + INTERNSHIP_MONTHS;
  const end = internshipEnd + fieldMonths;
  const age = MATURA_AGE + yearOf(end) - matura;
  return {
    /** miesiące na osi: do znacznika „dziś” */
    start,
    end,
    labels: {
      year: String(matura),
      studiesEnd: String(yearOf(studiesEnd)),
      internshipEnd: String(yearOf(internshipEnd)),
      end: String(yearOf(end)),
      studies: `${matura}–${yearOf(studiesEnd)}`,
      internship: `${yearOf(studiesEnd)}–${yearOf(internshipEnd)}`,
      spec: `${yearOf(internshipEnd)}–${yearOf(end)}`,
      specLen: lengthLabel(fieldMonths, locale),
      total: `${locale === 'en' ? 'about' : 'ok.'} ${lengthLabel(Math.round((end - start) / 6) * 6, locale)}`,
      age: locale === 'en' ? String(age) : `${age} ${plural(age, ['rok', 'lata', 'lat'])}`,
    },
  };
};

export type RoadLabel = keyof ReturnType<typeof roadOf>['labels'];
