/**
 * /sklep/ — sklep na CupSell i grafiki do samodzielnego druku. Pliki: src/data/sklep-grafiki.ts (generowany),
 * źródła grafik i opisy produktów: repo ../zarobkilekarzy-sklep.
 */
import type { ShopDesign } from '@/types';

const SKLEP = 'https://zarobkilekarzy.cupsell.pl/';
const produkt = (nr: string) => `${SKLEP}produkt/${nr}.html`;

export const shopPage = {
  title: 'Sklep',
  seoTitle: 'Sklep i grafiki do druku',
  description: 'Koszulki, kubki, torba, body i podkładka z hasłami zarobkilekarzy.pl. Marża 10 zł na sztuce, a wszystkie grafiki do pobrania i samodzielnego druku.',
  lead: 'Gadżety z hasłami serwisu. Kup je w naszym sklepie albo pobierz grafiki i wydrukuj sam.',
  url: SKLEP,
  banner: {
    label: 'Sklep na CupSell',
    title: 'Zapraszamy do sklepu',
    text: 'Koszulki, kubki, torba, body i podkładka pod mysz. W tym sklepie wszystkie kwoty są jawne.',
    cta: 'Przejdź do sklepu',
    receipt: {
      head: 'Sklep zarobkilekarzy.pl',
      rows: ['Koszulka', 'Kubek', 'Torba', 'Body', 'Podkładka'],
      rowValue: 'Cena jawna',
      total: ['Marża na sztuce', '10,00 zł'] as const,
    },
  },
  margin: {
    title: 'Kto sprzedaje i ile zarabiamy',
    paragraphs: [
      'Serwis zarobkilekarzy.pl niczego nie sprzedaje bezpośrednio. **Sprzedawcą jest CupSell**: przyjmuje zamówienie i płatność, drukuje, wysyła oraz obsługuje zwroty i reklamacje. My dostarczamy grafiki i dostajemy marżę od każdej sprzedanej rzeczy.',
      'Na każdej rzeczy ze sklepu zarabiamy **10 zł**. Tyle wynosi nasza marża, bez względu na produkt.',
      'Resztę ceny dostaje CupSell: to cena produktu z nadrukiem. CupSell drukuje, pakuje i wysyła zamówienie. Przykład: kubek kosztuje 40 zł, z czego 30 zł to cena kubka z nadrukiem w CupSell, a 10 zł to nasza marża. Wysyłkę płacisz osobno, według cennika CupSell.',
    ],
  },
  catalog: {
    title: 'Grafiki do pobrania',
    lead: 'Nie musisz kupować u nas. Pobierz plik i wydrukuj go w dowolnej drukarni: na koszulce, kubku, torbie albo na czym chcesz.',
  },
  print: {
    title: 'Jak wydrukować samodzielnie',
    items: [
      'Pliki PNG mają przezroczyste tło i 300 DPI przy pełnej wielkości nadruku: ok. 30 cm szerokości na koszulce, torbie i body. Kubek ma nadruk ok. 7 cm wysokości, w jeszcze wyższej rozdzielczości.',
      'Wersja „na jasne” ma ciemny napis i pasuje do białych i jasnych materiałów. Wersja „na ciemne” ma jasny napis: do czarnych i granatowych.',
      'Podkładka to pełny nadruk na całą powierzchnię, 25 × 19 cm, bez przezroczystości.',
      'W drukarni powiedz, na czym chcesz drukować. Koszulki i torby zwykle drukuje się techniką DTG albo sitodrukiem, kubki i podkładki sublimacją.',
    ],
    license: 'Grafiki są na licencji [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), jak cała strona. Możesz je drukować na własny użytek, dla znajomych i na sprzedaż. Podaj źródło: zarobkilekarzy.pl (na większości grafik adres już jest), a jeśli coś zmieniasz, zaznacz to.',
  },
};

export const shopDesigns: ShopDesign[] = [
  {
    key: 'koszulka-przed-wizyta',
    title: 'Przed wizytą skonsultuj się z księgowym',
    product: 'Koszulka',
    note: 'Nadruk ok. 30 cm szerokości. W pliku jest przezroczysty margines na wiszący przecinek i kropkę: środek pliku to środek napisu.',
    shop: [
      { label: 'Koszulka damska, ciemny napis', href: produkt('4873167-Przed-wizyt-skonsultuj-si-z-ksi-gowym-damska-ciemny-napis-') },
      { label: 'Koszulka damska, biały napis', href: produkt('4873194-Przed-wizyt-skonsultuj-si-z-ksi-gowym-damska-bia-y-napis-') },
    ],
  },
  {
    key: 'kubek-doba-40-godzin',
    title: 'Moja doba ma 40 godzin. Mam na to faktury',
    product: 'Kubek',
    note: 'Nadruk ok. 7 cm wysokości, z przodu kubka. Nie zmniejszaj: najmniejsze cyfry tarczy mają ok. 2 mm.',
    shop: [
      { label: 'Kubek biały', href: produkt('4873156-Doba-ma-40-godzin') },
      { label: 'Kubek z czarnym uchem', href: produkt('4873199-Doba-ma-40-godzin') },
    ],
  },
  {
    key: 'torba-termin-na-nfz',
    title: 'Na NFZ termin w 2035 r. Prywatnie po 16:00',
    product: 'Torba',
    note: 'Tablica z poczekalni. Najlepiej wygląda na czarnej torbie: wtedy tablicą jest sama tkanina.',
    shop: [{ label: 'Torba czarna', href: produkt('4873161-Termin-na-NFZ') }],
  },
  {
    key: 'body-w-kolejce',
    title: 'W kolejce do specjalisty od urodzenia',
    product: 'Body niemowlęce',
    note: 'Nadruk ok. 12 cm szerokości na body.',
    shop: [{ label: 'Body niemowlęce', href: produkt('4873197-W-kolejce-do-specjalisty-od-urodzenia') }],
  },
  {
    key: 'podkladka-dyzurcha',
    title: 'Udowodnij, że jesteś lekarzem',
    product: 'Podkładka pod mysz',
    note: 'Pełny nadruk 25 × 19 cm. Wersja pionowa to ten sam obraz obrócony o 90°, dla drukarni, które przyjmują podkładkę w pionie.',
    shop: [{ label: 'Podkładka pod mysz', href: produkt('4873198-Udowodnij-e-jeste-lekarzem') }],
  },
];
