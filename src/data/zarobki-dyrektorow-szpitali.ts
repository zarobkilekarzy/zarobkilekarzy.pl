/**
 * Analiza /analizy/zarobki-dyrektorow-szpitali/: przypadki kadry zarządzającej szpitali opisane przez
 * media na podstawie oświadczeń majątkowych (2024–2025) oraz adresy przepisów i publikacji.
 * Tekst i przypisy są w content/articles/zarobki-dyrektorow-szpitali.mdx — tu dane tabeli
 * (components/dyrektorzy/CaseTable) i LINKS dla bloków w artykule.
 *
 * Bez nazwisk: wiersz to miejscowość i funkcja. Kwoty brutto za rok, tak jak podały źródła.
 * Sprawdzone 15.10.2026.
 * Celowo pominięte: Wrocław (źródło kwoty niedostępne, HTTP 403) i Garwolin (sprawa przed sądem pracy).
 */
import { formatPL } from '@/lib/format';

export const LINKS = {
  /** ustawa z 21.08.1997 o ograniczeniu prowadzenia działalności gospodarczej przez osoby pełniące funkcje publiczne, t.j. Dz.U. 2025 poz. 499 */
  isap97: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19971060679',
  /** ustawa kominowa z 3.03.2000, t.j. Dz.U. 2019 poz. 2136 */
  isap00: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20000260306',
  /** ustawa z 9.06.2016 o zasadach kształtowania wynagrodzeń osób kierujących niektórymi spółkami */
  isap16: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20160001202',
  usg: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19900160095',
  usp: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19980910578',
  usw: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19980910576',
  sn: 'https://www.rp.pl/samorzad/art12474711-dyrektor-szpitala-nie-moze-byc-prezesem-spolki-i-miec-w-niej-duzych-udzialow',
  konkret24: 'https://konkret24.tvn24.pl/polska/dlaczego-prezes-orlenu-nie-sklada-oswiadczenia-majatkowego-a-prezes-uzdrowiska-w-rabce-musi-wyjasniamy-ra1053560-ls5790477',
  bipSlaskie: 'https://bip.slaskie.pl/wojewodztwo/oswiadczenia_dyrektorzy_jednostek_prezesi_spolek/',
  rynekZdrowia: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Nagrody-dla-dyrektorow-szpitali-zwiekszajacych-zadluzenie-Nie-ma-przeszkod,120642,1.html',
  wpGrojec: 'https://wiadomosci.wp.pl/gigantyczne-pieniadze-lekarz-ujawnia-jak-zarobil-w-rok-ponad-3-mln-zl-brutto-7297502251550752a',
  rpGrojec: 'https://www.rp.pl/zdrowie/art44641281-trzy-miliony-zlotych-w-rok-rekordowe-zarobki-32-letniego-ortopedy',
  moneyLosice: 'https://www.money.pl/praca/zarobila-prawie-1-7-mln-zl-w-rok-jako-lekarz-i-dyrektor-szpital-ma-rekordowe-zyski-7298147642693632a.html',
  naostroKwota: 'https://naostro.info/dyrektor-ostrowieckiego-szpitala-zarobil-ponad-milion-zlotych-2/',
  naostroRewident: 'https://naostro.info/niepokojace-dane-na-temat-ostrowieckiego-szpitala-rewident-istotna-niepewnosc-dotyczaca-kontynuacji-dzialalnosci/',
  istotne: 'https://istotne.pl/wiadomosc/63741',
  bolec: 'https://www.bolec.info/boleslawiec/informacje/kategoria/35808/czy-szpital-swietego-lukasza-tonie-w-dlugach',
  ilovetychy: 'https://ilovetychy.pl/wydarzenia/gigantyczne-wynagrodzenia-w-spolkach-nalezacych-do-tychow-rekordzistka-przekroczyla-900-tys-zl/',
  moneyTomaszow: 'https://www.money.pl/praca/wykrecil-864-tys-zl-jako-dyrektor-i-lekarz-pracowal-niemal-non-stop-7304920814070176a.html',
  interiaTomaszow: 'https://wydarzenia.interia.pl/lubelskie/news-kolejny-lekarz-z-ogromnymi-zarobkami-to-dyrektor-szpitala-i,nId,23502968',
  bankierTomaszow: 'https://www.bankier.pl/wiadomosc/Szpital-tonie-w-dlugach-dyrektor-z-PiS-zarabia-krocie-864-tys-zl-dla-lekarza-radnego-PiS-9155336.html',
  ndz24: 'https://ndz24.pl/pl/11_wiadomosci/1800_dzialdowski-szpital-w-agonii-prawda-ukryta-pod-platnymi-certyfikatami.html',
  zero: 'https://zero.pl/news/sypie-sie-tynk-i-sypia-sie-premie-pol-miliona-dla-dyrektora-szpitala-to-za-malo',
};

export interface Amount {
  /** kwota do wyświetlenia, np. „396,5 tys. zł” */
  text: string;
  /** dopowiedzenie pod kwotą (mniejszym krojem) */
  note?: string;
}

export interface DirectorCase {
  /** miejscowość (bez nazwy szpitala i nazwiska) */
  place: string;
  /** funkcja, jak opisują ją źródła */
  role: string;
  /** rok, którego dotyczy oświadczenie */
  year: number;
  /** wynagrodzenie za kierowanie szpitalem */
  management: Amount;
  /** praca lekarska i pozostałe dochody z oświadczenia; brak = źródło nie podaje */
  other?: Amount;
  /** łącznie z oświadczenia; brak = źródło podaje tylko wynagrodzenie za kierowanie */
  total?: Amount;
  /** kondycja szpitala według źródła (z rokiem) */
  hospital?: string;
  sources: { label: string; href: string }[];
}

/** Kwota roczna → „ok. 33 tys. zł miesięcznie” (do kolumny „Za kierowanie”). */
const monthly = (yearly: number) => `ok. ${formatPL(yearly / 12 / 1000, 1)} tys. zł miesięcznie`;

/** Kolejność: od największej znanej kwoty z oświadczenia. */
export const CASES: DirectorCase[] = [
  {
    place: 'Grójec i Nowe Miasto nad Pilicą',
    role: 'prezes szpitala-spółki w Grójcu od października 2025 r., od 2026 r. także p.o. dyrektora SPZOZ w Nowym Mieście; praktykujący lekarz',
    year: 2025,
    management: { text: 'ok. 161 tys. zł', note: 'dochodu z umowy o pracę za 2025 r., m.in. jako prezes (od października) — źródła nie wydzielają samego kierowania; dziś według WP 22 i 18 tys. zł miesięcznie w dwóch szpitalach' },
    other: { text: '2,8 mln zł', note: 'przychodu z praktyki lekarskiej (dochód ponad 2,4 mln zł)' },
    total: { text: 'ponad 3 mln zł', note: 'przychodu; dochód ok. 2,6 mln zł' },
    hospital: 'oba szpitale z długiem ok. 20 mln zł każdy (według starosty)',
    sources: [
      { label: 'WP', href: LINKS.wpGrojec },
      { label: 'rp.pl', href: LINKS.rpGrojec },
    ],
  },
  {
    place: 'Łosice',
    role: 'dyrektor szpitala',
    year: 2024,
    management: { text: '396,5 tys. zł', note: monthly(396_500) },
    other: { text: '1,26 mln zł', note: 'za działalność leczniczą na rzecz kierowanego szpitala' },
    total: { text: 'ok. 1,65 mln zł', note: 'bez emerytury' },
    hospital: 'rekordowe zyski',
    sources: [{ label: 'money.pl', href: LINKS.moneyLosice }],
  },
  {
    place: 'Ostrowiec Świętokrzyski',
    role: 'dyrektor naczelny szpitala',
    year: 2024,
    management: { text: '1,07 mln zł', note: 'cała umowa o pracę; źródło nie rozdziela kierowania i pracy lekarskiej' },
    total: { text: 'co najmniej 1,07 mln zł' },
    hospital: 'strata 11,7 mln zł w 2025 r., straty z lat ubiegłych 55,1 mln zł; biegły rewident: istotna niepewność co do kontynuacji działalności',
    sources: [
      { label: 'naOSTRO.info (kwota)', href: LINKS.naostroKwota },
      { label: 'naOSTRO.info (rewident)', href: LINKS.naostroRewident },
    ],
  },
  {
    place: 'Bolesławiec',
    role: 'dyrektor szpitala, radny sejmiku',
    year: 2025,
    management: { text: '726,6 tys. zł', note: `z działalności gospodarczej — usługi zarządzania szpitalem; ${monthly(726_550)}` },
    other: { text: '303,5 tys. zł', note: 'w tym dieta radnego 58,5 tys. zł' },
    total: { text: '1,03 mln zł' },
    hospital: 'dług 48,7 mln zł (wrzesień 2023 r., dane MZ)',
    sources: [
      { label: 'istotne.pl (kwota)', href: LINKS.istotne },
      { label: 'bolec.info (dług)', href: LINKS.bolec },
    ],
  },
  {
    place: 'Tychy',
    role: 'prezes miejskiej spółki prowadzącej szpital wojewódzki',
    year: 2024,
    management: { text: 'ponad 908 tys. zł', note: monthly(908_000) },
    other: { text: 'nie wliczono', note: 'źródło pomija emeryturę, rady nadzorcze i inne dochody' },
    sources: [{ label: 'ilovetychy.pl', href: LINKS.ilovetychy }],
  },
  {
    place: 'Tomaszów Lubelski',
    role: 'dyrektor szpitala, radny powiatu',
    year: 2025,
    management: { text: '324 albo ok. 328 tys. zł', note: 'dwie wersje w prasie (zob. tekst); ok. 27 tys. zł miesięcznie' },
    other: { text: '522 albo 536 tys. zł', note: 'za pracę lekarską i dyżury' },
    total: { text: '864 tys. zł' },
    hospital: 'strata 5,2 mln zł w I kw. 2026 r.',
    sources: [
      { label: 'money.pl', href: LINKS.moneyTomaszow },
      { label: 'Interia', href: LINKS.interiaTomaszow },
      { label: 'Bankier', href: LINKS.bankierTomaszow },
    ],
  },
  {
    place: 'Działdowo',
    role: 'dyrektor szpitala',
    year: 2024,
    management: { text: '335,6 tys. zł', note: monthly(335_648) },
    other: { text: '351,1 tys. zł', note: 'z kontraktu medycznego' },
    total: { text: '686,8 tys. zł' },
    hospital: 'strata netto 8,4 mln zł w 2025 r.; 9,9 tys. zł gotówki na koniec roku',
    sources: [{ label: 'Nasz Dziennik', href: LINKS.ndz24 }],
  },
  {
    place: 'Suwałki',
    role: 'dyrektor szpitala wojewódzkiego',
    year: 2025,
    management: { text: '505,1 tys. zł', note: `${monthly(505_100)}; w 2022 r. 305,9 tys. zł` },
    hospital: 'dług 58,7 mln zł na koniec 2024 r.',
    sources: [{ label: 'zero.pl', href: LINKS.zero }],
  },
];
