// Format plików NFZ „Terminy leczenia – dane do pobrania”: 16 XLSX (jeden na oddział wojewódzki),
// stan list oczekujących na koniec miesiąca. Każde odstępstwo od formatu to BladDanych: lepiej nie
// opublikować miesiąca, niż opublikować go źle, a surowy plik i tak zostaje w archiwum.
// Definicje liczb (schemat API Terminy leczenia): oczekujący = wpisani na koniec miesiąca, bez
// kontynuujących leczenie i uprawnionych poza kolejnością; skreśleni = skreśleni w miesiącu z powodu
// udzielenia świadczenia; średni czas = średnia liczba dni oczekiwania podana dla komórki.
import { otworzXlsx } from './xlsx.mjs';

export const URL_STRONY = 'https://gsl.nfz.gov.pl/GSL/GSL/PlikiZDanymi';
export const urlPliku = (woj) => `https://gsl.nfz.gov.pl/GSL/GSL/PobierzPlikDanych?woj=${woj}`;

// Kody oddziałów NFZ (01–16), nie TERYT.
export const WOJEWODZTWA = {
  '01': 'dolnośląskie',
  '02': 'kujawsko-pomorskie',
  '03': 'lubelskie',
  '04': 'lubuskie',
  '05': 'łódzkie',
  '06': 'małopolskie',
  '07': 'mazowieckie',
  '08': 'opolskie',
  '09': 'podkarpackie',
  10: 'podlaskie',
  11: 'pomorskie',
  12: 'śląskie',
  13: 'świętokrzyskie',
  14: 'warmińsko-mazurskie',
  15: 'wielkopolskie',
  16: 'zachodniopomorskie',
};
export const KODY_WOJ = Object.keys(WOJEWODZTWA).map((k) => k.padStart(2, '0')).sort();

// „osob” bez ó jest w oryginale.
export const KOLUMNY = [
  'Rok',
  'Miesiąc',
  'Kod OW NFZ',
  'Nazwa województwa',
  'Kod świadczenia',
  'Nazwa świadczenia',
  'Kategoria medyczna',
  'Kod świadczeniodawcy',
  'Nazwa świadczeniodawcy',
  'Kod techniczny komórki',
  'Nazwa komórki',
  'Adres komórki',
  'Liczba oczekujących',
  'Liczba osob skreślonych',
  'Średni czas oczekiwania',
];
const K = Object.fromEntries(KOLUMNY.map((k, i) => [k, i]));

// Wszystkie 141 kodów z tym początkiem we wrześniu 2026 r. to programy lekowe (sprawdzone z listą
// produktów kontraktowych NFZ). Nazwy różnią się między bazami, więc filtrujemy po kodzie.
export const PREFIKS_PROGRAMU = '90';

export class BladDanych extends Error {}

const czysc = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** NFZ zapisuje liczby od 1000 wzwyż jako tekst z twardą spacją (`1 337`). */
export function liczba(v, opis) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).replace(/[\s ]/g, '');
  if (!/^\d+$/.test(s)) throw new BladDanych(`${opis}: to nie jest liczba („${s.slice(0, 20)}”)`);
  return Number(s);
}

/** Okres z pierwszego wiersza pliku („… za okres  09-2026  .”) albo null. Nie zgłasza błędów. */
export function czytajOkres(buf) {
  try {
    const { wiersze } = otworzXlsx(buf);
    for (const w of wiersze('Dane')) {
      const m = czysc(w.find(Boolean)).match(/za okres (\d{2})-(\d{4})/);
      return m ? `${m[2]}-${m[1]}` : null;
    }
  } catch {
    // Plik sprawdzi potem czytajPlik. Tu chodzi tylko o katalog, w którym leży kopia surowa.
  }
  return null;
}

/** Pełny odczyt i kontrola jednego pliku. Zwraca wiersze programów i liczbę wszystkich wierszy. */
export function czytajPlik(buf, woj) {
  let xlsx;
  try {
    xlsx = otworzXlsx(buf);
  } catch (e) {
    throw new BladDanych(`woj. ${woj}: nie można otworzyć pliku (${e.message})`);
  }
  if (!xlsx.arkusze.includes('Dane')) throw new BladDanych(`woj. ${woj}: brak arkusza „Dane”`);

  let okres = null;
  let naglowek = false;
  let wierszy = 0;
  const programy = [];
  for (const w of xlsx.wiersze('Dane')) {
    if (!okres) {
      const m = czysc(w.find(Boolean)).match(/za okres (\d{2})-(\d{4})/);
      if (!m) throw new BladDanych(`woj. ${woj}: pierwszy wiersz nie podaje okresu`);
      okres = `${m[2]}-${m[1]}`;
      continue;
    }
    if (!naglowek) {
      const kolumny = w.map(czysc);
      if (kolumny.join('|') !== KOLUMNY.join('|')) throw new BladDanych(`woj. ${woj}: zmienione kolumny: ${kolumny.join(', ').slice(0, 300)}`);
      naglowek = true;
      continue;
    }
    wierszy++;
    const okresWiersza = `${czysc(w[K.Rok])}-${czysc(w[K['Miesiąc']]).padStart(2, '0')}`;
    if (okresWiersza !== okres) throw new BladDanych(`woj. ${woj}: wiersz ma okres ${okresWiersza}, a plik ${okres}`);
    if (czysc(w[K['Kod OW NFZ']]).padStart(2, '0') !== woj) throw new BladDanych(`woj. ${woj}: wiersz z innego oddziału (${czysc(w[K['Kod OW NFZ']])})`);

    const kod = czysc(w[K['Kod świadczenia']]);
    if (!kod.startsWith(PREFIKS_PROGRAMU)) continue;

    const kategoria = czysc(w[K['Kategoria medyczna']]);
    if (kategoria !== 'PRZYPADEK PILNY' && kategoria !== 'PRZYPADEK STABILNY') throw new BladDanych(`woj. ${woj}: nieznana kategoria „${kategoria.slice(0, 40)}”`);
    programy.push({
      kod,
      nazwa: czysc(w[K['Nazwa świadczenia']]),
      pilny: kategoria === 'PRZYPADEK PILNY',
      kodPodmiotu: czysc(w[K['Kod świadczeniodawcy']]),
      podmiot: czysc(w[K['Nazwa świadczeniodawcy']]),
      kodKomorki: czysc(w[K['Kod techniczny komórki']]),
      komorka: czysc(w[K['Nazwa komórki']]),
      // Z adresu tylko miejscowość. Dalej w polu są ulica i telefon, których nie publikujemy.
      miasto: czysc(String(w[K['Adres komórki']] ?? '').split(';')[0]),
      czeka: liczba(w[K['Liczba oczekujących']], `woj. ${woj}, liczba oczekujących`) ?? 0,
      przyjeci: liczba(w[K['Liczba osob skreślonych']], `woj. ${woj}, liczba skreślonych`) ?? 0,
      dni: liczba(w[K['Średni czas oczekiwania']], `woj. ${woj}, średni czas`),
    });
  }
  if (!naglowek) throw new BladDanych(`woj. ${woj}: brak wierszy z danymi`);
  return { okres, wierszy, programy, utworzono: xlsx.utworzono };
}
