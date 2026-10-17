/**
 * Dane analizy „Wizyty prywatne: im dłuższa kolejka, tym drożej” (content/articles/wizyty-prywatne-kolejka-cena.mdx),
 * używane przez infografiki (lib/infografiki/zestawy.ts).
 */
import { WHC_EDITIONS } from '@/data/kolejki';

export const LINKS = {
  nfz2024: 'https://www.nfz.gov.pl/gfx/nfz/userfiles/_public/bip/dzialalnosc_nfz/sprawozdania_z_dzialalnosci_nfz/zalacznik_do_uchwaly_nr_15-sig.pdf',
  nil: 'https://nil.org.pl/uploaded_files/art_1778144361_perspektywa-27-final.pdf',
};

/** AOS w sprawozdaniu NFZ za 2024 r., tab. II.19 (koszty realizacji, tys. zł) i II.20 (pacjenci, świadczenia) — jedna definicja dla trzech lat */
export const AOS = [
  { year: 2022, cost: 11_509_062.82, patients: 16_757_984, services: 83_402_081 },
  { year: 2023, cost: 15_381_121.07, patients: 17_554_469, services: 89_861_581 },
  { year: 2024, cost: 17_906_878.53, patients: 18_121_943, services: 94_862_561 },
];
export const AOS_FIRST = AOS[0];
export const AOS_LAST = AOS.at(-1)!;

/** Barometr WHC: średni czas oczekiwania na pojedyncze świadczenie w latach porównania AOS */
export const WHC_2022 = WHC_EDITIONS.find((e) => e.label === 'XI 2022')!;
export const WHC_2024 = WHC_EDITIONS.find((e) => e.label === 'X/XI 2024')!;

export const pct = (from: number, to: number) => (to / from - 1) * 100;

/**
 * NIL, raport „Perspektywa 27”: model pracy respondentów, % (ankieta internetowa 29.04–4.05.2026,
 * lekarze i lekarze dentyści, N = 2243, próba nielosowa). Do 100% brakuje pozostałych odpowiedzi.
 */
export const WORK_MODEL = {
  publicOnly: 30.8,
  mostlyPublic: 31.0,
  both: 18.5,
  mostlyPrivate: 5.4,
  privateOnly: 11.9,
};
export const NIL_N = 2243;
/** łączy oba sektory: głównie publicznie, po równo i głównie prywatnie */
export const combined = Math.round((WORK_MODEL.mostlyPublic + WORK_MODEL.both + WORK_MODEL.mostlyPrivate) * 10) / 10;
/** nie wykonywało obecnie pracy klinicznej — reszta do 100% */
export const NO_CLINICAL = 2.4;
