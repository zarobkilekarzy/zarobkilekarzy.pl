/**
 * Zestawienie /dane/personel-medyczny/: ustawowa siatka płac w ochronie zdrowia, którą rysuje
 * components/personel/PayScale. Tekst, liczebność zawodów i źródła są w
 * content/articles/personel-medyczny.mdx.
 *
 * Aktualizacja co roku 1 lipca: nowa kwota bazowa (BASE) przelicza wszystkie minima.
 * Współczynniki zmienia tylko nowelizacja ustawy z 8 czerwca 2017 r.
 */

/** Kwota bazowa: przeciętne wynagrodzenie w gospodarce z poprzedniego roku według GUS. */
export const BASE = {
  amount: 8903.56,
  from: '1 lipca 2026 r.',
  basis: 'przeciętne wynagrodzenie w 2025 r., komunikat GUS z 9.02.2026',
} as const;

/** Minimum zasadnicze dla współczynnika, zaokrąglone do grosza: 1,45 → 12 910,16 zł. */
export const minimum = (coef: number) => Math.round(coef * BASE.amount * 100) / 100;

export interface PayGroup {
  /** numer grupy z załącznika do ustawy */
  group: number;
  title: string;
  note?: string;
  coef: number;
  /** lekarze — punkt odniesienia; pozostałe grupy to zawody opisane w zestawieniu */
  doctor?: boolean;
}

/** Grupy zawodów medycznych, od najwyższego współczynnika. */
export const PAY_SCALE: PayGroup[] = [
  { group: 1, title: 'Lekarz, lekarz dentysta ze specjalizacją', note: 'Najwyższy próg siatki.', coef: 1.45, doctor: true },
  {
    group: 2,
    title: 'Pielęgniarka, położna, diagnosta, fizjoterapeuta, farmaceuta — magister ze specjalizacją',
    note: 'Najwyższa grupa dla pielęgniarek i położnych; tu także psycholog kliniczny.',
    coef: 1.29,
  },
  { group: 3, title: 'Lekarz, lekarz dentysta bez specjalizacji', coef: 1.19, doctor: true },
  {
    group: 5,
    title: 'Pielęgniarka, położna — magister bez specjalizacji albo licencjat lub średnie ze specjalizacją',
    note: 'Tu też fizjoterapeuci i diagności z tytułem magistra oraz psycholodzy.',
    coef: 1.02,
  },
  { group: 4, title: 'Lekarz stażysta', note: 'Minimum niemal równe grupie 6.', coef: 0.95, doctor: true },
  {
    group: 6,
    title: 'Pielęgniarka, położna — licencjat lub średnie bez specjalizacji; ratownik medyczny',
    note: 'Także fizjoterapeuci z licencjatem. Ratownik wyżej w siatce nie awansuje — to jego stały postulat.',
    coef: 0.94,
  },
  { group: 7, title: 'Opiekun medyczny, technik ze średnim wykształceniem', coef: 0.86 },
];

/** Najniższa grupa siatki (stanowiska niemedyczne) — tylko do podpisu pod tabelą. */
export const NON_MEDICAL = { group: 10, title: 'salowa i sanitariusz', coef: 0.65 } as const;
