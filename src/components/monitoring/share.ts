/**
 * Okno „Grafika do udostępnienia” dla placówki z listą płac: podgląd, wybór formatu i wersji,
 * pobranie PNG i udostępnienie pliku (Web Share API). Wszystko w przeglądarce — grafikę rysuje
 * ./grafika na <canvas>, nic nie idzie na serwer. Moduł ładuje się dopiero po kliknięciu przycisku
 * w szczegółach wiersza (import() w MonitoringGrid.astro), więc nie obciąża pierwszego wejścia.
 */
import { terms, type Index } from '@/components/datagrid/engine';
import { slug } from '@/lib/format';
import { canvasFile, cardAlt, drawCard, FORMATS, type CardInput, type FormatKey, type ThemeKey } from './grafika';
import type { Row, Stats } from './grid';

/** Pola elementu datagridu (components/datagrid/element.ts), z których korzysta okno. */
type GridElement = HTMLElement & { index?: Index<Row>; byKey: Map<string, Row>; data?: Stats };

// wybór formatu i wersji zostaje do zamknięcia strony
let format: FormatKey = 'pion';
let theme: ThemeKey = 'jasny';
let current: { card: CardInput; label: string; file: File | null } | null = null;
let render = 0;

/**
 * Adres tabeli zawężonej do tej placówki (kod QR). Wyszukiwarka dopasowuje fragmenty, więc „#14”
 * trafia też w #140 — bierzemy pierwsze zapytanie, które daje dokładnie jeden wiersz.
 */
function link(el: GridElement, row: Row): string {
  const index = el.index;
  const unique = (q: string) => {
    const words = terms(q);
    return index ? index.hay.filter((hay) => words.every((w) => hay.includes(w))).length === 1 : false;
  };
  const q = [`#${row.id}`, `#${row.id} ${row.city}`, row.label].find(unique) ?? `#${row.id}`;
  const url = new URL(location.pathname, import.meta.env.SITE);
  url.searchParams.set('q', q);
  return url.href;
}

const fileName = (label: string, f: FormatKey, t: ThemeKey) =>
  `zarobkilekarzy-${slug(label).slice(0, 60).replace(/-+$/, '')}-${FORMATS[f].width}x${FORMATS[f].height}${t === 'jasny' ? '' : `-${t}`}.png`;

function dialogParts(dialog: HTMLDialogElement) {
  const $ = <E extends Element = HTMLElement>(sel: string) => dialog.querySelector<E>(sel)!;
  return {
    name: $('[data-share-name]'),
    canvas: $<HTMLCanvasElement>('[data-share-canvas]'),
    preview: $('[data-share-preview]'),
    download: $<HTMLButtonElement>('[data-share-download]'),
    native: $<HTMLButtonElement>('[data-share-native]'),
    source: $<HTMLAnchorElement>('[data-share-source]'),
  };
}

async function draw(dialog: HTMLDialogElement) {
  if (!current) return;
  const parts = dialogParts(dialog);
  const id = ++render;
  parts.preview.setAttribute('aria-busy', 'true');
  parts.download.disabled = true;
  parts.native.disabled = true;
  // rysujemy na boku i podmieniamy gotowy obraz, żeby podgląd nie mrugał pustym płótnem
  const canvas = document.createElement('canvas');
  await drawCard(canvas, current.card, format, theme);
  if (id !== render) return; // w międzyczasie zmieniono format albo wersję
  parts.canvas.width = canvas.width;
  parts.canvas.height = canvas.height;
  parts.canvas.getContext('2d')!.drawImage(canvas, 0, 0);
  parts.preview.removeAttribute('aria-busy');
  // plik PNG (kodowanie trwa chwilę) dopiero po pokazaniu podglądu
  const file = await canvasFile(canvas, fileName(current.label, format, theme));
  if (id !== render) return;
  current.file = file;
  parts.download.disabled = !file;
  parts.native.disabled = !file;
  parts.native.hidden = !(file && navigator.canShare?.({ files: [file] }));
}

function download() {
  const file = current?.file;
  if (!file) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function share() {
  if (!current?.file) return;
  const { card } = current;
  void navigator
    .share({
      files: [current.file],
      title: card.name,
      text: `${card.name} — roczne wypłaty dla lekarzy w ${card.year} r. Dane z monitoringu „${card.source.monitoring}”: ${card.link}`,
    })
    .catch(() => {});
}

function bind(dialog: HTMLDialogElement) {
  if (dialog.dataset.bound) return;
  dialog.dataset.bound = '';
  dialog.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'format') format = input.value as FormatKey;
    else if (input.name === 'wersja') theme = input.value as ThemeKey;
    else return;
    void draw(dialog);
  });
  dialog.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (target === dialog || target.closest('[data-share-close]')) return dialog.close();
    if (target.closest('[data-share-download]')) return download();
    if (target.closest('[data-share-native]')) return share();
  });
}

/** Otwiera okno dla placówki z przycisku `[data-mon-share="<id>"]` w szczegółach wiersza. */
export function openShare(button: HTMLElement) {
  const el = button.closest<GridElement>('zl-monitoring');
  const dialog = document.querySelector<HTMLDialogElement>('[data-mon-share-dialog]');
  const row = el?.byKey.get(button.dataset.monShare ?? '');
  const data = el?.data;
  if (!el || !dialog || !row?.payroll || !data) return;

  const page = new URL(location.pathname, import.meta.env.SITE);
  const card: CardInput = {
    id: row.id,
    name: row.label,
    city: row.city,
    voivodeship: row.voivodeship,
    year: data.year,
    payroll: row.payroll,
    labels: data.labels,
    high: data.high,
    dist: data.dist,
    source: data.source,
    page: `${page.host}${page.pathname.replace(/\/$/, '')}`,
    link: link(el, row),
  };
  current = { card, label: row.label, file: null };

  bind(dialog);
  const parts = dialogParts(dialog);
  parts.name.textContent = row.label;
  parts.source.href = row.url;
  parts.canvas.setAttribute('aria-label', cardAlt(card));
  for (const input of dialog.querySelectorAll<HTMLInputElement>('input[name="format"], input[name="wersja"]')) {
    input.checked = input.value === (input.name === 'format' ? format : theme);
  }
  void draw(dialog);
  if (!dialog.open) dialog.showModal();
}
