/**
 * Pliki grafik do pobrania na /sklep/ (public/sklep/grafiki/). PLIK GENEROWANY — nie edytować ręcznie:
 * źródła i generatory w repo sklepu (../zarobkilekarzy-sklep), eksport: node strona/eksport.mjs.
 */
export interface ShopFile {
  /** klucz grafiki z src/data/sklep.ts */
  key: string;
  /** na-jasne / na-ciemne = podłoże, poziomo / pionowo = układ */
  variant: 'na-jasne' | 'na-ciemne' | 'poziomo' | 'pionowo';
  href: string;
  preview: string;
  width: number;
  height: number;
  dpi: number;
  bytes: number;
  previewWidth: number;
  previewHeight: number;
}

export const SHOP_FILES: ShopFile[] = [
  {
    key: 'koszulka-przed-wizyta',
    variant: 'na-jasne',
    href: '/sklep/grafiki/zarobkilekarzy-koszulka-przed-wizyta-na-jasne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-koszulka-przed-wizyta-na-jasne.webp',
    width: 3840,
    height: 4097,
    dpi: 300,
    bytes: 581266,
    previewWidth: 525,
    previewHeight: 560
  },
  {
    key: 'koszulka-przed-wizyta',
    variant: 'na-ciemne',
    href: '/sklep/grafiki/zarobkilekarzy-koszulka-przed-wizyta-na-ciemne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-koszulka-przed-wizyta-na-ciemne.webp',
    width: 3840,
    height: 4097,
    dpi: 300,
    bytes: 489755,
    previewWidth: 525,
    previewHeight: 560
  },
  {
    key: 'kubek-doba-40-godzin',
    variant: 'na-jasne',
    href: '/sklep/grafiki/zarobkilekarzy-kubek-doba-40-godzin-na-jasne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-kubek-doba-40-godzin-na-jasne.webp',
    width: 2496,
    height: 2684,
    dpi: 947,
    bytes: 267014,
    previewWidth: 521,
    previewHeight: 560
  },
  {
    key: 'kubek-doba-40-godzin',
    variant: 'na-ciemne',
    href: '/sklep/grafiki/zarobkilekarzy-kubek-doba-40-godzin-na-ciemne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-kubek-doba-40-godzin-na-ciemne.webp',
    width: 2496,
    height: 2684,
    dpi: 947,
    bytes: 235341,
    previewWidth: 521,
    previewHeight: 560
  },
  {
    key: 'torba-termin-na-nfz',
    variant: 'na-jasne',
    href: '/sklep/grafiki/zarobkilekarzy-torba-termin-na-nfz-na-jasne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-torba-termin-na-nfz-na-jasne.webp',
    width: 3536,
    height: 4450,
    dpi: 300,
    bytes: 835023,
    previewWidth: 445,
    previewHeight: 560
  },
  {
    key: 'torba-termin-na-nfz',
    variant: 'na-ciemne',
    href: '/sklep/grafiki/zarobkilekarzy-torba-termin-na-nfz-na-ciemne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-torba-termin-na-nfz-na-ciemne.webp',
    width: 3536,
    height: 4450,
    dpi: 300,
    bytes: 817482,
    previewWidth: 445,
    previewHeight: 560
  },
  {
    key: 'body-w-kolejce',
    variant: 'na-jasne',
    href: '/sklep/grafiki/zarobkilekarzy-body-w-kolejce-na-jasne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-body-w-kolejce-na-jasne.webp',
    width: 3537,
    height: 2900,
    dpi: 300,
    bytes: 328057,
    previewWidth: 560,
    previewHeight: 459
  },
  {
    key: 'body-w-kolejce',
    variant: 'na-ciemne',
    href: '/sklep/grafiki/zarobkilekarzy-body-w-kolejce-na-ciemne.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-body-w-kolejce-na-ciemne.webp',
    width: 3537,
    height: 2900,
    dpi: 300,
    bytes: 284178,
    previewWidth: 560,
    previewHeight: 459
  },
  {
    key: 'podkladka-dyzurcha',
    variant: 'poziomo',
    href: '/sklep/grafiki/zarobkilekarzy-podkladka-dyzurcha-poziomo.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-podkladka-dyzurcha-poziomo.webp',
    width: 2953,
    height: 2244,
    dpi: 300,
    bytes: 942207,
    previewWidth: 560,
    previewHeight: 426
  },
  {
    key: 'podkladka-dyzurcha',
    variant: 'pionowo',
    href: '/sklep/grafiki/zarobkilekarzy-podkladka-dyzurcha-pionowo.png',
    preview: '/sklep/grafiki/podglad/zarobkilekarzy-podkladka-dyzurcha-pionowo.webp',
    width: 2244,
    height: 2953,
    dpi: 300,
    bytes: 792189,
    previewWidth: 426,
    previewHeight: 560
  }
];
