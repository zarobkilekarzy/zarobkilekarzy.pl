// Przetwarzanie: 16 odczytanych plików → jeden plik miesiąca `RRRR-MM.json` i podsumowanie w `indeks.json`.
// Wynik zależy tylko od surowych plików i tego kodu, więc ponowne przeliczenie nie tworzy sztucznych zmian.
//
// Schemat pliku miesiąca (krótkie wiersze, bo programów × komórek jest ok. 20 tys.):
//   { okres, wersja, zrodlo: { url, utworzono, wierszyWszystkich, sha256: { woj: hash } },
//     programy: [{ kod, nazwa }], podmioty: [{ kod, nazwa, woj, ukryty? }], komorki: [{ nazwa, miasto }],
//     wiersze: [[programy[i], podmioty[i], komorki[i] | null, pilny 0/1, czeka, przyjeci, dni | null]],
//     sumy, flagi: [{ typ: 'skala', podmiot, program, czeka, leczeni, rok }] }
//
// Liczby:
//   przyjeci   — skreśleni w miesiącu z powodu udzielenia świadczenia;
//   sredniaDni — średnia ważona przyjętymi, jak w odpowiedziach MZ. Komórki z zerem przyjętych nie liczą się:
//                bywa w nich niezerowy czas przy zerze czekających (np. „875 dni” z pustej komórki);
//   *BezFlag   — bez całych podmiotów z flagą, bo flaga podważa ich sprawozdawczość, nie jeden wiersz.
//
// Flaga „skala”: podmiot zgłasza w programie co najmniej 30 czekających i ponad połowę liczby leczonych
// w tym programie w całym kraju (`leczeni-RRRR.json`, ostatni rok przed okresem). Flaga znaczy „do wyjaśnienia”, nie „błąd” ani zarzut.
import { createHash } from 'node:crypto';
import { URL_STRONY, BladDanych } from './format.mjs';

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// Nazwy programów różnią się między plikami kolejek a statystyką NFZ.
const ALIASY = new Map([
  ['LECZENIE CHORYCH STWARDNIENIE ROZSIANE', 'LECZENIE CHORYCH NA STWARDNIENIE ROZSIANE'],
  ['LECZENIE PACJENTÓW Z CHOROBAMI SIATKÓWKI (AMD, DME)', 'LECZENIE PACJENTÓW Z CHOROBAMI SIATKÓWKI'],
  ['LECZENIE CHORYCH NA NOWOTWORY MIELOPROLIFERACYJNE PH(-)', 'LECZENIE CHORYCH NA NOWOTWORY MIELOPROLIFERACYJNE PH (-)'],
]);

export function nazwaProgramu(s) {
  const n = String(s)
    .toUpperCase()
    .replace(/^(LEKI W PROGRAMIE LEKOWYM|PROGRAM LEKOWY)\s*-\s*/, '')
    .replace(/^(TLI|TLK)\s*-\s*/, '')
    .replace(/["'’]/g, '')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return ALIASY.get(n) ?? n;
}

// Słowa wskazujące organizację. Nazwa bez żadnego z nich bywa imieniem i nazwiskiem właściciela.
const ORGANIZACJA =
  /SZPITAL|CENTRUM|SPÓŁKA|SP\. ?Z|INSTYTUT|ZAKŁAD|ZESPÓŁ|PRZYCHODNI|KLINIK|UNIWERSYTECK|SPZOZ|ZOZ|OŚRODEK|ODDZIAŁ|S\.A\.|MEDICAL|LECZNICA|FUNDACJA|STOWARZYSZENIE|POLIKLINIKA|SANATORIUM|WOJEWÓDZKI|MIEJSKI|POWIATOWY/;
// Marki bez nazwisk, przejrzane ręcznie, które reguła wyżej uznałaby za osobę.
const MARKI = /^("OKO-MED"|AMICUR\b|BALMED$|MEDEOR$|PORADNIE LEKARSKIE SUNMEDICA$)/;

// Imię w mianowniku przed kolejnym wyrazem: tak zapisuje się właścicieli i wspólników także w spółkach z o.o.
// Patroni stoją po „im.” i w dopełniaczu („im. Jana”), więc reguła ich nie łapie.
const IMIE =
  /(?<![\p{L}.])(?<!IM\.? )(ADAM|ADRIAN|AGATA|AGNIESZKA|ALEKSANDER|ALEKSANDRA|ALICJA|ANDRZEJ|ANETA|ANNA|ANTONI|ARKADIUSZ|ARTUR|BARBARA|BARTOSZ|BEATA|BOGDAN|BOŻENA|BRYGIDA|CEZARY|CZESŁAW|DANIEL|DANUTA|DARIUSZ|DOMINIK|DOROTA|EDYTA|ELŻBIETA|EMILIA|EWA|FILIP|GRAŻYNA|GRZEGORZ|HALINA|HANNA|HENRYK|IGOR|IRENA|IWONA|IZABELA|JACEK|JADWIGA|JAKUB|JAN|JANINA|JANUSZ|JAROSŁAW|JERZY|JOANNA|JOLANTA|JÓZEF|JUSTYNA|KAMIL|KAMILA|KAROL|KAROLINA|KATARZYNA|KAZIMIERZ|KINGA|KLAUDIA|KRZYSZTOF|LECH|LESZEK|LIDIA|ŁUKASZ|MACIEJ|MAGDALENA|MAŁGORZATA|MARCIN|MAREK|MARIA|MARIAN|MARIUSZ|MARTA|MARZENA|MATEUSZ|MICHAŁ|MIROSŁAW|MIROSŁAWA|MONIKA|NATALIA|NORBERT|OLGA|PATRYK|PAULINA|PAWEŁ|PIOTR|PRZEMYSŁAW|RAFAŁ|RENATA|ROBERT|ROMAN|RYSZARD|SEBASTIAN|SŁAWOMIR|STANISŁAW|STEFAN|SYLWIA|SZYMON|TADEUSZ|TERESA|TOMASZ|URSZULA|WALDEMAR|WANDA|WIESŁAW|WIKTOR|WITOLD|WŁADYSŁAW|WOJCIECH|ZBIGNIEW|ZDZISŁAW|ZOFIA)\s+(?!PAWEŁ(?!\p{L}))\p{Lu}[\p{Lu}-]{2,}/u;

/**
 * Czy nazwa podmiotu może zawierać imię i nazwisko. Zasada strony: bez nazwisk. Reguła jest celowo ostrożna,
 * a pomyłka kosztuje mało: podmiot trafia do pozycji zbiorczej województwa, a liczby zostają w sumach.
 * Patroni szpitali („im. dr. …”) zostają, to nazwy własne instytucji.
 */
export function ukryc(nazwa) {
  const n = String(nazwa).toUpperCase();
  if (MARKI.test(n)) return false;
  if (/PRAKTYKA|DR N\. ?MED|\bS\.\s?C\b|\bSC\b/.test(n) || IMIE.test(n)) return true;
  if (/SPÓŁKA (JAWNA|PARTNERSKA|KOMANDYTOWA)/.test(n) && !/(SPÓŁKA Z OGRANICZON|SP\. ?Z ?O\. ?O)/.test(n)) return true;
  return !ORGANIZACJA.test(n);
}

const srednia = (wiersze) => {
  const przyjeci = wiersze.reduce((s, w) => s + (w.dni !== null ? w.przyjeci : 0), 0);
  if (!przyjeci) return null;
  return Math.round((10 * wiersze.reduce((s, w) => s + (w.dni !== null ? w.dni * w.przyjeci : 0), 0)) / przyjeci) / 10;
};
const suma = (wiersze, pole) => wiersze.reduce((s, w) => s + w[pole], 0);

function policzSumy(wiersze, flagowani) {
  const bez = wiersze.filter((w) => !flagowani.has(w.kodPodmiotu));
  const pilni = (xs) => suma(xs.filter((w) => w.pilny), 'czeka');
  const zKolejka = wiersze.filter((w) => w.czeka > 0);
  return {
    czeka: suma(wiersze, 'czeka'),
    pilni: pilni(wiersze),
    przyjeci: suma(wiersze, 'przyjeci'),
    sredniaDni: srednia(wiersze),
    czekaBezFlag: suma(bez, 'czeka'),
    pilniBezFlag: pilni(bez),
    przyjeciBezFlag: suma(bez, 'przyjeci'),
    sredniaDniBezFlag: srednia(bez),
    programow: new Set(wiersze.map((w) => w.kod)).size,
    programowZKolejka: new Set(zKolejka.map((w) => w.kod)).size,
    podmiotow: new Set(wiersze.map((w) => w.kodPodmiotu)).size,
    podmiotowZKolejka: new Set(zKolejka.map((w) => w.kodPodmiotu)).size,
    podmiotowUkrytych: new Set(wiersze.filter((w) => w.ukryty).map((w) => w.kodPodmiotu)).size,
  };
}

function policzFlagi(wiersze, leczeni) {
  const razem = new Map();
  for (const w of wiersze) {
    const k = `${w.kodPodmiotu}|${w.kod}`;
    razem.set(k, { ...(razem.get(k) ?? { kodPodmiotu: w.kodPodmiotu, kod: w.kod, nazwa: w.nazwa, czeka: 0 }), czeka: (razem.get(k)?.czeka ?? 0) + w.czeka });
  }
  const flagi = [];
  for (const r of razem.values()) {
    const n = leczeni?.programy?.[nazwaProgramu(r.nazwa)];
    if (n && r.czeka >= 30 && r.czeka > 0.5 * n) flagi.push({ typ: 'skala', kodPodmiotu: r.kodPodmiotu, program: r.kod, czeka: r.czeka, leczeni: n, rok: leczeni.rok });
  }
  return flagi;
}

const kluczPodmiotuUkrytego = (woj) => `ukryte-${woj}`;

/**
 * Składa miesiąc z odczytanych plików. `pliki`: [{ woj, okres, wierszy, programy, utworzono, sha256 }].
 * Zgłasza BladDanych przy różnych okresach, braku wierszy programów lub nagłym spadku względem `poprzedni`.
 */
export function zlozOkres(pliki, { wersja, leczeni, poprzedni } = {}) {
  const okresy = new Set(pliki.map((p) => p.okres));
  if (okresy.size !== 1) throw new BladDanych(`pliki z różnych okresów: ${[...okresy].sort().join(', ')}`);
  const [okres] = okresy;

  const wiersze = pliki.flatMap((p) => p.programy.map((w) => ({ ...w, woj: p.woj, ukryty: ukryc(w.podmiot) })));
  if (!wiersze.length) throw new BladDanych('brak wierszy programów lekowych');

  const wierszyWszystkich = pliki.reduce((s, p) => s + p.wierszy, 0);
  if (poprzedni) {
    const p = poprzedni.zrodlo.wierszyWszystkich;
    if (wierszyWszystkich < 0.6 * p) throw new BladDanych(`nagły spadek liczby wierszy: ${wierszyWszystkich} wobec ${p}`);
    const pp = poprzedni.wiersze.length;
    if (wiersze.length < 0.5 * pp) throw new BladDanych(`nagły spadek liczby wierszy programów: ${wiersze.length} wobec ${pp}`);
  }

  const flagiSurowe = policzFlagi(wiersze, leczeni);
  const flagowani = new Set(flagiSurowe.map((f) => f.kodPodmiotu));
  const sumy = policzSumy(wiersze, flagowani);

  const programy = [...new Map(wiersze.map((w) => [w.kod, { kod: w.kod, nazwa: w.nazwa }])).values()].sort((a, b) => a.kod.localeCompare(b.kod));
  const iProgramu = new Map(programy.map((p, i) => [p.kod, i]));

  const podmiotyM = new Map();
  for (const w of wiersze) {
    if (w.ukryty) podmiotyM.set(kluczPodmiotuUkrytego(w.woj), { kod: kluczPodmiotuUkrytego(w.woj), nazwa: 'Podmioty, których nazwa może zawierać nazwisko (łącznie)', woj: w.woj, ukryty: true });
    else podmiotyM.set(w.kodPodmiotu, { kod: w.kodPodmiotu, nazwa: w.podmiot, woj: w.woj });
  }
  const podmioty = [...podmiotyM.values()].sort((a, b) => a.kod.localeCompare(b.kod));
  const iPodmiotu = new Map(podmioty.map((p, i) => [p.kod, i]));
  const kodPublicznyPodmiotu = (w) => (w.ukryty ? kluczPodmiotuUkrytego(w.woj) : w.kodPodmiotu);

  const komorkiM = new Map();
  for (const w of wiersze) {
    if (!w.ukryty) komorkiM.set(`${w.kodPodmiotu}|${w.kodKomorki}`, { nazwa: w.komorka, miasto: w.miasto });
  }
  const klucze = [...komorkiM.keys()].sort();
  const iKomorki = new Map(klucze.map((k, i) => [k, i]));
  const komorki = klucze.map((k) => komorkiM.get(k));

  // Podmioty ukryte łączymy w jedną pozycję na program, województwo i kategorię.
  const scalone = new Map();
  const wynik = [];
  for (const w of wiersze) {
    if (!w.ukryty) {
      wynik.push([iProgramu.get(w.kod), iPodmiotu.get(w.kodPodmiotu), iKomorki.get(`${w.kodPodmiotu}|${w.kodKomorki}`), w.pilny ? 1 : 0, w.czeka, w.przyjeci, w.dni]);
      continue;
    }
    const k = `${w.kod}|${w.woj}|${w.pilny}`;
    const s = scalone.get(k) ?? { kod: w.kod, woj: w.woj, pilny: w.pilny, czeka: 0, przyjeci: 0, wazone: 0 };
    s.czeka += w.czeka;
    s.przyjeci += w.przyjeci;
    if (w.dni !== null) s.wazone += w.dni * w.przyjeci;
    scalone.set(k, s);
  }
  for (const s of scalone.values()) {
    wynik.push([iProgramu.get(s.kod), iPodmiotu.get(kluczPodmiotuUkrytego(s.woj)), null, s.pilny ? 1 : 0, s.czeka, s.przyjeci, s.przyjeci ? Math.round(s.wazone / s.przyjeci) : null]);
  }
  wynik.sort((a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] ?? -1) - (b[2] ?? -1) || a[3] - b[3]);

  const publiczny = new Map(wiersze.map((w) => [w.kodPodmiotu, kodPublicznyPodmiotu(w)]));
  const flagi = flagiSurowe
    .map(({ kodPodmiotu, ...f }) => ({ ...f, podmiot: publiczny.get(kodPodmiotu) }))
    .sort((a, b) => b.czeka - a.czeka || a.podmiot.localeCompare(b.podmiot) || a.program.localeCompare(b.program));

  const dane = {
    okres,
    wersja,
    zrodlo: {
      url: URL_STRONY,
      utworzono: pliki.map((p) => p.utworzono).filter(Boolean).sort().at(-1) ?? null,
      wierszyWszystkich,
      sha256: Object.fromEntries([...pliki].sort((a, b) => a.woj.localeCompare(b.woj)).map((p) => [p.woj, p.sha256])),
    },
    programy,
    podmioty,
    komorki,
    wiersze: wynik,
    sumy,
    flagi,
  };
  return { dane, ostrzezenia: ostrzezenia(dane, poprzedni) };
}

/** Ostrzeżenia trafiają do publicznego zgłoszenia, więc bez nazw szpitali: tylko typy, liczby i programy. */
function ostrzezenia(dane, poprzedni) {
  const out = [];
  if (dane.flagi.length) out.push({ typ: 'flagi', opis: `Wiersze do wyjaśnienia (czekających ponad połowa leczonych w kraju): ${dane.flagi.length}. Suma z nimi ${dane.sumy.czeka}, bez tych podmiotów ${dane.sumy.czekaBezFlag}.` });
  if (!poprzedni) return out;

  const { czeka } = poprzedni.sumy;
  if (poprzedni.okres === dane.okres) {
    if (JSON.stringify(poprzedni.zrodlo.sha256) !== JSON.stringify(dane.zrodlo.sha256)) out.push({ typ: 'korekta', opis: `NFZ zmienił pliki za ${dane.okres}. Liczba czekających: ${czeka} → ${dane.sumy.czeka}.` });
  } else {
    const [r, m] = poprzedni.okres.split('-').map(Number);
    const nastepny = m === 12 ? `${r + 1}-01` : `${r}-${String(m + 1).padStart(2, '0')}`;
    if (dane.okres !== nastepny) out.push({ typ: 'pominiety-miesiac', opis: `Po ${poprzedni.okres} przyszedł od razu ${dane.okres}. Brakującego miesiąca NFZ już nie udostępnia.` });
  }
  if (czeka && Math.abs(dane.sumy.czeka - czeka) / czeka > 0.3) out.push({ typ: 'skok', opis: `Suma czekających zmieniła się o ponad 30%: ${czeka} → ${dane.sumy.czeka}.` });

  const nazwy = (d) => new Map(d.programy.map((p) => [p.kod, p.nazwa]));
  const teraz = nazwy(dane);
  const wtedy = nazwy(poprzedni);
  const nowe = [...teraz.keys()].filter((k) => !wtedy.has(k));
  const znikly = [...wtedy.keys()].filter((k) => !teraz.has(k));
  if (nowe.length) out.push({ typ: 'nowe-programy', opis: `Nowe programy: ${nowe.map((k) => `${k} ${teraz.get(k)}`).join('; ')}.` });
  if (znikly.length) out.push({ typ: 'zniknely-programy', opis: `Zniknęły programy: ${znikly.map((k) => `${k} ${wtedy.get(k)}`).join('; ')}.` });
  if (dane.sumy.podmiotowUkrytych > poprzedni.sumy.podmiotowUkrytych) out.push({ typ: 'nowe-ukryte', opis: `Więcej podmiotów z ukrytą nazwą: ${poprzedni.sumy.podmiotowUkrytych} → ${dane.sumy.podmiotowUkrytych}. Warto przejrzeć regułę.` });
  return out;
}

/** JSON z jednym wierszem na linię: czytelny diff i dobra kompresja w gicie. */
export function doPliku(dane) {
  const linie = (xs) => `[\n${xs.map((x) => JSON.stringify(x)).join(',\n')}\n]`;
  const pola = Object.entries(dane).map(([k, v]) => `${JSON.stringify(k)}: ${Array.isArray(v) && v.length ? linie(v) : JSON.stringify(v)}`);
  return `{\n${pola.join(',\n')}\n}\n`;
}

export function zlozIndeks(miesiace) {
  return [...miesiace]
    .sort((a, b) => a.okres.localeCompare(b.okres))
    .map((d) => ({ okres: d.okres, wersja: d.wersja, ...d.sumy, flag: d.flagi.length }));
}
