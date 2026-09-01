// Model podaży lekarzy dla symulatora „ilu lekarzy będzie" (/analizy/symulator-podazy-lekarzy).
//
// PROTOTYP. Jedno miejsce na dane i rachunek — importowany zarówno przez frontmatter
// strony (pierwszy render, wartości w tekście), jak i przez skrypt w przeglądarce
// (przeliczanie po każdym ruchu suwaka). Dzięki temu liczba w akapicie i liczba na
// wykresie nie mogą się rozjechać.
//
// ZASADA NACZELNA: przy domyślnych ustawieniach model ma ODTWARZAĆ rzeczywistość —
// stan startowy (2026) równa się co do osoby wydrukowi z rejestru NIL. Wszystko, co
// użytkownik zmieni, jest liczone jako ODCHYLENIE od tego stanu. Dlatego wartość
// informacyjną mają RÓŻNICE między scenariuszami, a nie poziomy bezwzględne —
// to samo zastrzeżenie jest wypisane na stronie.

/** Rocznik, w którym zaczyna się edytowalna historia (najstarsza kotwica naboru). */
export const ROK_MIN = 1987;
/** Ostatni rocznik, dla którego użytkownik ustawia nabór. */
export const ROK_MAX = 2050;
/** Stan startowy = wydruk z rejestru NIL. */
export const ROK0 = 2026;
/** Koniec horyzontu prognozy (rocznik 2050 kończy specjalizację w 2062). */
export const ROK_KONIEC = 2062;

export const STUDIA = 6;
export const SPECJALIZACJA = 6;
/** Przyjęty wiek rozpoczęcia studiów — służy tylko do przypisania rocznika rejestru
 *  do roku naboru (wiek 46–50 w 2026 r. ↔ studia zaczęte ok. 1995–1999). */
export const WIEK_STARTU = 19;

export const REJESTR_DATA = '16 stycznia 2026';
/** Lekarze wykonujący zawód wg rejestru NIL (bez dentystów), 16.01.2026. */
export const REJESTR_SUMA = 164892;
/** Lekarze pracujący bezpośrednio z pacjentem — GUS, 2024. Linia odniesienia:
 *  rejestr jest o ~24 tys. szerszy niż realna praca przy pacjencie. */
export const GUS_PRZY_PACJENCIE = 141193;
/** Lekarze specjaliści pracujący z pacjentem — GUS 2024 (64,5% z 141 193). */
export const GUS_SPECJALISCI = 91100;

/** Piramida wieku lekarzy WYKONUJĄCYCH ZAWÓD — rejestr NIL, 16.01.2026.
 *  Suma kontrolna = REJESTR_SUMA. */
export const grupyWieku: ReadonlyArray<{ grupa: string; od: number; do: number; v: number }> = [
  { grupa: '≤25', od: 25, do: 25, v: 176 },
  { grupa: '26–30', od: 26, do: 30, v: 20346 },
  { grupa: '31–35', od: 31, do: 35, v: 19834 },
  { grupa: '36–40', od: 36, do: 40, v: 17008 },
  { grupa: '41–45', od: 41, do: 45, v: 12787 },
  { grupa: '46–50', od: 46, do: 50, v: 11607 },
  { grupa: '51–55', od: 51, do: 55, v: 12563 },
  { grupa: '56–60', od: 56, do: 60, v: 15963 },
  { grupa: '61–65', od: 61, do: 65, v: 15183 },
  { grupa: '66–70', od: 66, do: 70, v: 14830 },
  { grupa: '71+', od: 71, do: 71, v: 24595 },
];

/** Kubeł „71+" — rejestr nie podaje go w rocznikach, więc model traktuje go osobno. */
export const KUBEL_71 = 24595;

// — Nabór bazowy: miejsca na studiach lekarskich PO POLSKU (stacjonarne +
//   niestacjonarne + osobna pula dla cudzoziemców na studiach polskojęzycznych).
//   Studia obcojęzyczne są ŚWIADOMIE poza modelem: zostaje po nich w Polsce <1%
//   absolwentów, więc nie zasilają polskiego rynku.
//
//   2012–2025: wartości DOKŁADNE, z rozporządzeń MZ (baza researchu projektu).
//   1987–2011: punkty kontrolne z relacji o ówczesnych limitach i wcześniejszych
//   rozporządzeń — lata pośrednie interpolowane liniowo. Kategorie przez cztery
//   dekady nie są idealnie tożsame (1987 i 1990 to „miejsca na I roku", 2003 to
//   „studia dzienne"), o czym strona mówi wprost w podpisie.
export const ROK_DOKLADNE_OD = 2012;

const kotwice: Record<number, number> = {
  1987: 6000,
  1990: 3300,
  2003: 2090,
  2005: 2360,
  2010: 3800,
  2012: 3914,
  2013: 3991,
  2014: 4059,
  2015: 4637,
  2016: 5359,
  2017: 5722,
  2018: 5955,
  2019: 6266,
  2020: 6342,
  2021: 7215,
  2022: 7527,
  2023: 7975,
  2024: 8043,
  2025: 8616,
};

/** Nabór bazowy rok po roku, indeksowany `rok - ROK_MIN`. Po 2025 r. — utrzymanie
 *  ostatniego znanego limitu (to jest „scenariusz zero": nic nie zmieniamy). */
export const naborBazowy: number[] = (() => {
  const lata = Object.keys(kotwice).map(Number).sort((a, b) => a - b);
  const out: number[] = [];
  for (let r = ROK_MIN; r <= ROK_MAX; r++) {
    if (r >= 2025) {
      out.push(kotwice[2025]);
      continue;
    }
    const i = lata.findIndex((l) => l > r);
    const r0 = lata[i - 1];
    const r1 = lata[i];
    out.push(Math.round(kotwice[r0] + ((kotwice[r1] - kotwice[r0]) * (r - r0)) / (r1 - r0)));
  }
  return out;
})();

export const LICZBA_LAT = ROK_MAX - ROK_MIN + 1;
/** Limit polskojęzyczny obowiązujący dziś (rok akademicki 2025/26). */
export const LIMIT_DZIS = kotwice[2025];
/** Miejsca polskojęzyczne z PROJEKTU rozporządzenia na 2024/25 — do tej liczby
 *  odnosi się analiza zespołu NIL („7797 → 4100"), więc warianty przeliczamy
 *  proporcjonalnie względem niej, a nie względem dzisiejszego limitu. */
export const NIL_BAZA = 7797;

export interface Ustawienia {
  /** Wiek, do którego lekarz pracuje. */
  wiekOdejscia: number;
  /** Udział rocznika, który kończy specjalizację (0–1). */
  udzialSpec: number;
}

export const USTAWIENIA_DOMYSLNE: Ustawienia = {
  wiekOdejscia: 70,
  // 64,5% lekarzy pracujących z pacjentem miało w 2024 r. tytuł specjalisty (GUS).
  udzialSpec: 0.65,
};

export interface PunktProgozy {
  rok: number;
  lekarze: number;
  specjalisci: number;
}

// Roczniki jednoroczne wyprowadzone z pięcioletnich grup rejestru (podział równy
// wewnątrz grupy — rejestr nie podaje dokładniejszego rozbicia).
const rocznikiRejestru: { wiek: number; n: number }[] = (() => {
  const out: { wiek: number; n: number }[] = [];
  for (const g of grupyWieku) {
    if (g.grupa === '71+') continue;
    const szer = g.do - g.od + 1;
    for (let w = g.od; w <= g.do; w++) out.push({ wiek: w, n: g.v / szer });
  }
  return out;
})();

/** Rok rozpoczęcia studiów przez lekarza, który w 2026 r. ma `wiek` lat. */
export const rokNaboruDlaWieku = (wiek: number) => ROK0 - wiek + WIEK_STARTU;

// Ostatni rocznik naboru, który zdążył już wejść do rejestru (wiek 26 w 2026 r.).
const OSTATNI_W_REJESTRZE = rokNaboruDlaWieku(26); // 2019

/** Udział rocznika pozostający na rynku w roku `rok`, przy odejściu w wieku `R`.
 *  Rocznik nie znika z dnia na dzień: między R a R+5 wygasa po 1/5 rocznie.
 *  Ten sam bieg dotyczy tych, którzy dziś już są starsi niż R (m.in. 24,6 tys.
 *  osób 71+, które rejestr wciąż liczy jako wykonujące zawód). */
function udzialCzynnych(wiekWRoku: number, R: number, latOdStartu: number): number {
  if (wiekWRoku <= R) return 1;
  const poR = wiekWRoku - R;
  // Kto był starszy niż R już na starcie, wygasa licząc od dziś, a nie wstecz.
  const lat = Math.min(poR, latOdStartu);
  return lat >= 5 ? 0 : (5 - lat) / 5;
}

/**
 * Prognoza liczby lekarzy na rynku.
 *
 * @param nabor tablica naboru rok po roku, indeksowana `rok - ROK_MIN`
 */
export function symuluj(nabor: number[], u: Ustawienia = USTAWIENIA_DOMYSLNE): PunktProgozy[] {
  const { wiekOdejscia: R, udzialSpec: p } = u;
  const wynik: PunktProgozy[] = [];

  for (let rok = ROK0; rok <= ROK_KONIEC; rok++) {
    const latOdStartu = rok - ROK0;
    let lekarze = 0;
    let specjalisci = 0;

    // 1. Roczniki, które są już w rejestrze. Zmiana naboru w przeszłości skaluje
    //    rocznik proporcjonalnie — dzięki temu przy nietkniętych suwakach model
    //    odtwarza rejestr co do osoby, a przy zmianie pokazuje „co by było".
    for (const { wiek, n } of rocznikiRejestru) {
      const e = rokNaboruDlaWieku(wiek);
      let osoby = n;
      if (e >= ROK_MIN && e <= OSTATNI_W_REJESTRZE) {
        const i = e - ROK_MIN;
        osoby *= naborBazowy[i] ? nabor[i] / naborBazowy[i] : 1;
      }
      const czynni = udzialCzynnych(wiek + latOdStartu, R, latOdStartu);
      if (czynni === 0) continue;
      osoby *= czynni;
      lekarze += osoby;
      if (e + STUDIA + SPECJALIZACJA < rok) specjalisci += osoby * p;
    }

    // 2. Kubeł 71+ — rejestr nie rozbija go na roczniki, więc model traktuje całą
    //    grupę tak, jakby miała dokładnie 71 lat, i postarza ją razem z resztą.
    //    (Gdyby zamiast tego wstawić tu stały wiek, grupa nigdy by nie wygasła.)
    {
      const czynni = udzialCzynnych(71 + latOdStartu, R, latOdStartu);
      if (czynni > 0) {
        const osoby = KUBEL_71 * czynni;
        lekarze += osoby;
        specjalisci += osoby * p;
      }
    }

    // 3. Roczniki, które dopiero wejdą na rynek (nabór od 2020 r. — dyplom w 2026 r.
    //    lub później). Zgodnie z założeniem: studia kończy 100% przyjętych.
    for (let e = OSTATNI_W_REJESTRZE + 1; e <= ROK_MAX; e++) {
      if (e + STUDIA >= rok) break;
      const osoby0 = nabor[e - ROK_MIN];
      const wiekWRoku = WIEK_STARTU + STUDIA + (rok - (e + STUDIA));
      const czynni = udzialCzynnych(wiekWRoku, R, latOdStartu);
      if (czynni === 0) continue;
      const osoby = osoby0 * czynni;
      lekarze += osoby;
      if (e + STUDIA + SPECJALIZACJA < rok) specjalisci += osoby * p;
    }

    wynik.push({ rok, lekarze: Math.round(lekarze), specjalisci: Math.round(specjalisci) });
  }
  return wynik;
}

export interface Preset {
  id: string;
  nazwa: string;
  opis: string;
  /** Czy preset rusza przeszłość (inny kolor przycisku — to kontrfakt, nie polityka). */
  historia?: boolean;
  zastosuj: (nabor: number[]) => void;
}

// Warianty zespołu eksperckiego NIL są wyrażone wobec 7797 miejsc polskojęzycznych
// z projektu rozporządzenia na 2024/25. Przenosimy je na dzisiejszy limit
// PROPORCJONALNIE — inaczej porównywalibyśmy liczby z dwóch różnych lat.
const skala = (miejscaNIL: number) => Math.round(LIMIT_DZIS * (miejscaNIL / NIL_BAZA));

export const presety: Preset[] = [
  {
    id: 'baza',
    nazwa: 'Prawdziwa historia',
    opis: `Rzeczywiste limity z rozporządzeń, a od 2026 r. utrzymanie dzisiejszego poziomu (${LIMIT_DZIS} miejsc). Stan wyjściowy symulatora.`,
    zastosuj: (n) => naborBazowy.forEach((v, i) => (n[i] = v)),
  },
  {
    id: 'nil-a',
    nazwa: 'Wariant A (NIL)',
    opis: `Cięcie skokowe od 2027 r. o niemal połowę — w przeliczeniu na dzisiejszy limit do ${skala(4100)} miejsc rocznie.`,
    zastosuj: (n) => {
      for (let r = 2027; r <= ROK_MAX; r++) n[r - ROK_MIN] = skala(4100);
    },
  },
  {
    id: 'nil-b',
    nazwa: 'Wariant B (NIL)',
    opis: `Zmniejszanie naboru o ok. 9% rocznie aż do poziomu odpowiadającego ${skala(4200)} miejscom.`,
    zastosuj: (n) => {
      const dno = skala(4200);
      let v = n[2026 - ROK_MIN];
      for (let r = 2027; r <= ROK_MAX; r++) {
        v = Math.max(dno, Math.round(v * 0.91));
        n[r - ROK_MIN] = v;
      }
    },
  },
  {
    id: 'nil-c',
    nazwa: 'Wariant C (NIL)',
    opis: `Cięcie o 1500 miejsc od razu, a potem o 4% rocznie do 2034 r. (proporcjonalnie do dzisiejszego limitu).`,
    zastosuj: (n) => {
      let v = Math.round(n[2026 - ROK_MIN] - skala(1500));
      for (let r = 2027; r <= ROK_MAX; r++) {
        if (r >= 2028 && r <= 2034) v = Math.round(v * 0.96);
        n[r - ROK_MIN] = v;
      }
    },
  },
  {
    id: 'bez-ciecia',
    nazwa: 'Gdyby nie ścięto (1987–2005)',
    opis: 'Kontrfakt: nabór trzyma poziom z 1987 r. przez cały okres cięcia. Pokazuje, ilu lekarzy dziś by było, gdyby tamtej decyzji nie podjęto.',
    historia: true,
    zastosuj: (n) => {
      for (let r = ROK_MIN; r <= 2005; r++) n[r - ROK_MIN] = 6000;
    },
  },
];

// — Geometria wykresów. Trzymana tu, a nie w .astro, żeby pierwszy render (serwer)
//   i przeliczanie po ruchu suwaka (przeglądarka) używały DOKŁADNIE tych samych
//   współrzędnych — inaczej wykres skakałby przy pierwszej interakcji.

export const WYK = {
  szer: 900,
  wys: 320,
  x0: 58,
  x1: 884,
  y0: 264,
  yTop: 26,
} as const;

/** Górna granica osi naboru — 12 000 miejsc mieści i dzisiejszy limit, i absurdy. */
export const NABOR_MAX = 12000;
/** Skok wartości przy przeciąganiu — okrągłe liczby zamiast „4 137". */
export const NABOR_KROK = 50;

export const szerSlupka = (WYK.x1 - WYK.x0) / LICZBA_LAT;
export const naborX = (rok: number) => WYK.x0 + (rok - ROK_MIN) * szerSlupka;
export const naborY = (v: number) =>
  WYK.y0 - (Math.min(v, NABOR_MAX) / NABOR_MAX) * (WYK.y0 - WYK.yTop);
/** Odwrotność `naborX` — z piksela na rok (przeciąganie po wykresie). */
export const xNaRok = (x: number) =>
  Math.max(ROK_MIN, Math.min(ROK_MAX, ROK_MIN + Math.floor((x - WYK.x0) / szerSlupka)));
/** Odwrotność `naborY` — z piksela na liczbę miejsc, zaokrągloną do kroku. */
export const yNaNabor = (y: number) => {
  const v = ((WYK.y0 - y) / (WYK.y0 - WYK.yTop)) * NABOR_MAX;
  return Math.max(0, Math.min(NABOR_MAX, Math.round(v / NABOR_KROK) * NABOR_KROK));
};

export const LAT_WYNIKU = ROK_KONIEC - ROK0 + 1;
export const wynikX = (rok: number) =>
  WYK.x0 + ((rok - ROK0) / (ROK_KONIEC - ROK0)) * (WYK.x1 - WYK.x0);
export const wynikY = (v: number, vMax: number) =>
  WYK.y0 - (Math.max(0, Math.min(v, vMax)) / vMax) * (WYK.y0 - WYK.yTop);

/** Skala osi wyniku: okrągłe setki tysięcy, nigdy mniej niż 400 tys. */
export const skalaWyniku = (maks: number) =>
  Math.max(400000, Math.ceil((maks * 1.08) / 100000) * 100000);

export const sciezka = (
  dane: PunktProgozy[],
  pole: 'lekarze' | 'specjalisci',
  vMax: number,
): string =>
  dane
    .map((d, i) => `${i ? 'L' : 'M'}${wynikX(d.rok).toFixed(1)},${wynikY(d[pole], vMax).toFixed(1)}`)
    .join(' ');

/** Formatowanie liczb — Intl nie grupuje czterocyfrowych w pl-PL, a chcemy
 *  „6 000" obok „164 892". Twarda spacja, żeby liczba nie łamała się w wierszu. */
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const tys = (n: number) => {
  const v = Math.round(n / 100) / 10;
  return `${(Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')) } tys.`;
};
