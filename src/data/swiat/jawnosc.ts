/**
 * Glob płac lekarzy, warstwa „Jawność”: czy da się poznać płacę konkretnego lekarza opłacanego z pieniędzy publicznych.
 * Poziomy: 3 — imiennie z urzędu (publikacja z mocy prawa), 2 — na wniosek albo częściowo, 1 — jawne tylko zasady
 * (tabele płac) i średnie, 0 — brak. Każdy wpis ma przepis w tekście pierwotnym; notatki z wyszukiwania: research/swiat/.
 * Klucz = numeryczny kod ISO 3166-1.
 */
import type { Transparency } from '@/lib/swiat/types';

export const transparency: Record<string, Transparency> = {
  '616': {
    level: 2,
    text: 'Pojedyncze umowy placówek publicznych są w Centralnym Rejestrze Umów od lipca 2026 r., a płace podaje placówka na wniosek, jeśli zechce. Sumy dla osoby nie publikuje nikt.',
    scope: 'one',
    law: 'Ustawa o finansach publicznych, art. 34a (Centralny Rejestr Umów); ustawa o dostępie do informacji publicznej',
    href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1844/text.pdf',
    more: { label: 'zarobkilekarzy.pl: Brak jawności', href: '/mechanizmy/brak-jawnosci/' },
  },

  // ---------- Europa Północna i Zachodnia ----------
  '578': {
    level: 3,
    text: 'Każdy sprawdzi w internecie dochód netto, majątek i podatek dowolnej osoby (podatnik widzi, kto go sprawdzał). Wypłaty brutto pracownika publicznego są jawne na wniosek.',
    scope: 'total',
    law: 'Skatteforvaltningsloven § 9-7; offentleglova § 25',
    href: 'https://lovdata.no/dokument/NL/lov/2016-05-27-14',
  },
  '246': {
    level: 3,
    text: 'Co roku w listopadzie jawne są imię i nazwisko, rok urodzenia, dochód do opodatkowania i podatek każdego podatnika.',
    scope: 'total',
    law: 'Ustawa o jawności danych podatkowych 1346/1999, § 5',
    href: 'https://finlex.fi/fi/lainsaadanto/1999/1346',
  },
  '352': {
    level: 3,
    text: 'Lista podatków nałożonych na każdą osobę jest co roku przez dwa tygodnie wyłożona do wglądu. Stałe pensje pracowników publicznych są jawne na wniosek.',
    scope: 'total',
    law: 'Ustawa o podatku dochodowym 90/2003, art. 98; ustawa o informacji 140/2012, art. 7',
    href: 'https://island.is/stjornartidindi/nr/776cbde2-e2bf-4c5b-aeaa-99af5000d63b',
  },
  '752': {
    level: 2,
    text: 'Każdy, także anonimowo, może poprosić urząd skarbowy o ustalony dochód z pracy konkretnej osoby. Płace pracowników publicznych są dokumentem jawnym.',
    scope: 'total',
    law: 'Offentlighets- och sekretesslagen, rozdz. 27 § 6; Tryckfrihetsförordningen, rozdz. 2 § 1',
    href: 'https://rkrattsbaser.gov.se/sfst?bet=2009:400',
  },
  '208': {
    level: 2,
    text: 'Na wniosek urząd podaje imię, stanowisko i wynagrodzenie pracownika publicznego, także lekarza w szpitalu regionu. Imię można zataić ze względu na bezpieczeństwo pracownika.',
    scope: 'one',
    law: 'Offentlighedsloven § 21 ust. 3 (zmiana z 2024 r.)',
    href: 'https://www.retsinformation.dk/eli/lta/2020/145',
  },
  '756': {
    level: 2,
    text: 'Tylko w części kantonów, np. Zurychu i Neuchâtel, osoba trzecia uzyska dochód do opodatkowania danej osoby. W większości kantonów nie.',
    scope: 'total',
    law: 'Prawo kantonalne; zestawienie Federalnej Administracji Podatkowej (stan na 1.01.2025)',
    href: 'https://www.estv2.admin.ch/stp/ds/a-oeffentlichkeit-steuerregister-de.pdf',
  },
  '250': {
    level: 1,
    text: 'Na wniosek podaje się tylko stałe składniki pensji pracownika publicznego (stopień, wskaźnik). Premie i kwota łączna są zwykle niejawne.',
    scope: 'one',
    law: 'Kodeks relacji z administracją, art. L311-6 (opinia komisji CADA 20226817)',
    href: 'https://cada.data.gouv.fr/20226817/',
  },
  '276': {
    level: 1,
    text: 'Jawne są tabele płac lekarzy z układów zbiorowych. Płacę konkretnej osoby chronią ustawa o informacji i tajemnica skarbowa.',
    scope: 'one',
    law: 'Informationsfreiheitsgesetz § 5 ust. 2; Abgabenordnung § 30',
    href: 'https://www.gesetze-im-internet.de/ifg/__5.html',
  },
  '040': {
    level: 1,
    text: 'Jawne są tabele płac i statystyki Trybunału Obrachunkowego dla grup zawodów. Płacę konkretnej osoby chroni wyjątek ochrony danych osobowych.',
    scope: 'one',
    law: 'Informationsfreiheitsgesetz § 6 ust. 1 pkt 7 lit. a (od 1.09.2025)',
    href: 'https://www.ris.bka.gv.at/eli/bgbl/i/2024/5/P6/NOR40260540',
  },
  '528': {
    level: 1,
    text: 'Imiennie jawne są płace zarządów i rad nadzorczych instytucji publicznych. Praca lekarza jest z tej ustawy wprost wyłączona.',
    scope: 'one',
    law: 'Wet normering topinkomens, art. 1.5a i 4.1',
    href: 'https://wetten.overheid.nl/BWBR0032249/',
  },
  '372': {
    level: 1,
    text: 'Jawna jest skala płac stanowiska. Konkretna pensja konsultanta to dane osobowe i zwykle nie jest ujawniana.',
    scope: 'one',
    law: 'Freedom of Information Act 2014, art. 2 i 37',
    href: 'https://www.irishstatutebook.ie/eli/2014/act/30/section/2/enacted/en/html',
  },
  // ---------- Europa Środkowa, Wschodnia i Południowa ----------
  '380': {
    level: 3,
    text: 'Kierownicy w publicznej ochronie zdrowia, także ordynatorzy, publikują swoje wynagrodzenia i łączną kwotę ze wszystkich źródeł publicznych. Zwykłych lekarzy ten obowiązek nie obejmuje.',
    scope: 'total',
    law: 'D.lgs. 33/2013, art. 14 ust. 1 lit. c i ust. 1-ter, art. 41 ust. 2–3',
    href: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2013-03-14;33',
  },
  '705': {
    level: 2,
    text: 'Ustawa mówi wprost, że płace w sektorze publicznym są jawne, z imieniem i nazwiskiem oraz kwotą brutto. Sąd nakazał szpitalowi w Celje ujawnić imiona i płace.',
    scope: 'one',
    law: 'Ustawa o wspólnych podstawach systemu płac w sektorze publicznym (ZSTSPJS), art. 48 ust. 1',
    href: 'https://pisrs.si/pregledPredpisa?id=ZAKO8826',
  },
  '203': {
    level: 2,
    text: 'Płaca z pieniędzy publicznych jest jawna na wniosek: dla funkcjonariuszy publicznych i członków organów zawsze, a dla zwykłego pracownika tylko wtedy, gdy wnioskodawca wykaże przeważający interes publiczny.',
    scope: 'one',
    law: 'Ustawa 106/1999 Sb. o wolnym dostępie do informacji, § 8c',
    href: 'https://www.e-sbirka.cz/sb/1999/106',
  },
  '191': {
    level: 2,
    text: 'Informacje o wydawaniu środków publicznych są dostępne bez ważenia prywatności; rzecznik podaje jako przykład płacę brutto pracownika służby publicznej. Decyzji o płacy lekarza nie znaleźliśmy.',
    scope: 'one',
    law: 'Ustawa o prawie dostępu do informacji (ZPPI), art. 16 ust. 3',
    href: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2013_02_25_403.html',
  },
  '233': {
    level: 2,
    text: 'Dokumentów o płacach osób opłacanych z budżetu nie wolno utajnić jako wewnętrznych, ale dostęp można ograniczyć ze względu na prywatność. Z urzędu publikuje się tylko płace urzędników.',
    scope: 'one',
    law: 'Ustawa o informacji publicznej (AvTS), § 28, § 35 i § 36',
    href: 'https://www.riigiteataja.ee/akt/AvTS',
  },
  '703': {
    level: 1,
    text: 'Imiennie jawne są płace kierowników i funkcjonariuszy opłacanych z budżetu. Płaca zwykłego lekarza wymaga jego zgody.',
    scope: 'one',
    law: 'Ustawa 211/2000 Z.z. o wolnym dostępie do informacji, § 9 ust. 3',
    href: 'https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2000/211/20250101.html',
  },
  '348': {
    level: 1,
    text: 'Płace urzędników są jawne, a kierowników — imiennie na wniosek. Dla pracowników ochrony zdrowia ustawa wymienia jako jawne tylko pracodawcę, nazwisko i kategorię.',
    scope: 'one',
    law: 'Ustawa o informacji (Infotv.), § 26 ust. 2; ustawa o pracownikach ochrony zdrowia (Eszjtv.), § 14 ust. 2',
    href: 'https://njt.hu/jogszabaly/2011-112-00-00',
  },
  '724': {
    level: 1,
    text: 'Z urzędu jawne są roczne wynagrodzenia najwyższych urzędników i szefów instytucji. Płace pozostałych pracowników tylko na wniosek, po ważeniu interesów i zwykle bez nazwisk.',
    scope: 'one',
    law: 'Ley 19/2013 de transparencia, art. 8 ust. 1 lit. f i art. 15',
    href: 'https://www.boe.es/buscar/act.php?id=BOE-A-2013-12887',
  },

  // ---------- poza Europą ----------
  '076': {
    level: 3,
    text: 'Portale przejrzystości publikują imiennie wynagrodzenie każdego pracownika administracji federalnej z dodatkami; Sąd Najwyższy uznał publikację nazwisk i płac za zgodną z prawem. Lekarzy pracujących przez własne firmy to nie obejmuje.',
    scope: 'one',
    law: 'Decreto 7.724/2012, art. 7 § 3 pkt VI; STF, temat 483',
    href: 'https://portal.stf.jus.br/jurisprudenciaRepercussao/tema.asp?num=483',
  },
  '152': {
    level: 3,
    text: 'Instytucje publiczne co miesiąc publikują listę personelu na etatach, kontraktach i honorariach z wynagrodzeniem brutto i pełnym nazwiskiem.',
    scope: 'one',
    law: 'Ley 20.285 o dostępie do informacji publicznej, art. 7 lit. d',
    href: 'https://www.bcn.cl/leychile/navegar?idNorma=276363',
  },
  '604': {
    level: 3,
    text: 'Instytucje państwowe publikują w portalu przejrzystości wszystkie kwoty pobrane przez każdą osobę w ich służbie, z jej identyfikacją, niezależnie od formy zatrudnienia.',
    scope: 'one',
    law: 'TUO ustawy 27806, art. 5 i 25; rozporządzenie DS 072-2003-PCM, art. 8 lit. m',
    href: 'https://cdn.www.gob.pe/uploads/document/file/7713377/6526929-resolucion-n-010307472020.pdf',
  },
  '840': {
    level: 3,
    text: 'Imię, stanowisko i roczna pensja pracowników federalnych są jawne; w wielu stanach także pensje pracowników publicznych, np. lekarzy szpitali Uniwersytetu Kalifornijskiego. Lekarzy z własną praktyką to nie obejmuje.',
    scope: 'one',
    law: '5 CFR 293.311; prawo stanowe (np. Texas Government Code § 552.022)',
    href: 'https://www.ecfr.gov/current/title-5/section-293.311',
  },
  '124': {
    level: 3,
    text: 'Kolumbia Brytyjska i Nowy Brunszwik co roku publikują imiennie płatności z planu publicznego dla każdego lekarza. Ontario publikuje płace pracowników szpitali od 100 tys. CAD.',
    scope: 'total',
    law: 'Financial Information Act (Kolumbia Brytyjska); Public Sector Salary Disclosure Act, 1996 (Ontario)',
    href: 'https://www.ontario.ca/page/public-sector-salary-disclosure',
    more: { label: 'zarobkilekarzy.pl: spory z lekarzami w Kanadzie', href: '/analizy/kanada-lekarze-ustawa-specjalna/' },
  },
  '170': {
    level: 1,
    text: 'Jawne są skale płac według kategorii stanowisk, a dla kadry kierowniczej także deklaracje majątkowe i podatkowe. Płacy zwykłego lekarza się nie publikuje.',
    scope: 'one',
    law: 'Ley 1712/2014, art. 9 lit. c; Ley 2013/2019, art. 2',
    href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=56882',
  },
  '392': {
    level: 1,
    text: 'Jawne są imię, stanowisko i zakres obowiązków urzędnika. Indywidualna płaca należy do danych osobowych wyłączonych z dostępu.',
    scope: 'one',
    law: 'Ustawa 42/1999 o dostępie do informacji administracji, art. 5 pkt 1',
    href: 'https://laws.e-gov.go.jp/law/411AC0000000042',
  },
  '410': {
    level: 1,
    text: 'Jawne są imię i stanowisko urzędnika; płacy konkretnej osoby można odmówić jako danych osobowych. Instytucje publiczne ujawniają tylko łączne koszty osobowe.',
    scope: 'one',
    law: 'Ustawa o ujawnianiu informacji przez instytucje publiczne, art. 9 ust. 1 pkt 6',
    href: 'https://law.go.kr/법령/공공기관의정보공개에관한법률/제9조',
  },

  '826': {
    level: 1,
    text: 'Szpitale publikują łączne wynagrodzenie członków zarządów, także dyrektorów medycznych. Pozostałych lekarzy obejmują tylko skale płac i widełki.',
    scope: 'one',
    law: 'National Health Service Act 2006, załącznik 7, pkt 26(2)(ac)',
    href: 'https://www.legislation.gov.uk/ukpga/2006/41/schedule/7',
  },
};
