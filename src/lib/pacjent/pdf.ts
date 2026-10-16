/**
 * PDF-y do druku z treści strony /prawa-pacjenta/ (dane: src/data/prawa-pacjenta.ts → card).
 *
 * 1. Karta kieszonkowa — dwie karty na jednej kartce A4, drukowanej JEDNOSTRONNIE w skali 100%.
 *    Każda połówka to przód i tył obok siebie: przetnij kartkę na pół, złóż połówkę wzdłuż kropek
 *    i masz kartę A6 zadrukowaną z obu stron — bez druku dwustronnego, bez papieru A6 i bez
 *    ustawień drukarki. Druga karta jest dla kogoś bliskiego.
 * 2. Duży druk — dwie strony A4, tekst 14 pt: dla osoby starszej, na lodówkę, na tablicę w przychodni.
 *
 * Obie wersje czarno-białe: drukarka atramentowa nie zużyje kolorowego tuszu.
 * Druga karta na arkuszu jest dla czytnika ekranu dekoracją (ta sama treść nie czyta się dwa razy).
 */
import type { CardContent, CardPhones } from './types';
import { artifact, createPdf, fit, list, measure, mm, tag, text, widthOf, type Pdf, type TextStyle } from '@/lib/pdf/typeset';

const INK = '#000000';
const TEXT = '#333333';
const GREY = '#8a8a8a';
const HAIR = '#bdbdbd';

const A4 = { w: 595.28, h: 841.89 };

/**
 * Pisanie z otagowaniem albo bez — ta sama funkcja rysuje kartę dla czytnika ekranu (pierwsza)
 * i jako dekorację (druga kopia na arkuszu).
 */
interface Writer {
  block: (type: string, draw: () => void) => void;
  list: <T>(items: T[], draw: (item: T, i: number) => void) => void;
  deco: (draw: () => void) => void;
}

const tagged = (pdf: Pdf): Writer => ({
  block: (type, draw) => tag(pdf, pdf.root, type, draw),
  list: (items, draw) => list(pdf, pdf.root, items, draw),
  deco: (draw) => artifact(pdf, draw),
});

const plain: Writer = {
  block: (_, draw) => draw(),
  list: (items, draw) => items.forEach(draw),
  deco: (draw) => draw(),
};

function rule(pdf: Pdf, x: number, y: number, w: number, width = 0.5, color = INK) {
  pdf.doc.save().moveTo(x, y).lineTo(x + w, y).lineWidth(width).strokeColor(color).stroke().restore();
}

// ---------------------------------------------------------------------------
// Karta kieszonkowa (2 × A6 z przodem i tyłem na jednej kartce A4)
// ---------------------------------------------------------------------------

const PANEL = { w: A4.w / 2, h: A4.h / 2 };
/** Margines wewnętrzny panelu: poza strefą, której drukarki nie zadrukowują (~4 mm), z zapasem na cięcie. */
const PAD = mm(7.5);
const BASIS_W = 62;

const C = {
  stamp: { family: 'mono', weight: 500, size: 5.8, tracking: 0.5, upper: true, color: TEXT, leading: 1.2 },
  title: { family: 'display', weight: 500, size: 21, leading: 1.05, tracking: -0.4 },
  label: { family: 'mono', weight: 500, size: 6, tracking: 0.55, upper: true, leading: 1.3 },
  phone: { family: 'display', weight: 400, size: 30, leading: 1, tracking: -0.6 },
  small: { family: 'sans', weight: 400, size: 7.2, leading: 1.36, color: TEXT },
  body: { family: 'sans', weight: 400, size: 7.9, leading: 1.3 },
  strong: { family: 'sans', weight: 600, size: 7.9, leading: 1.3 },
  basis: { family: 'mono', weight: 500, size: 5.8, leading: 1.77, color: TEXT, align: 'right' },
  value: { family: 'display', weight: 500, size: 12.5, leading: 1, tracking: -0.2 },
  sos: { family: 'display', weight: 500, size: 11, leading: 1 },
  foot: { family: 'sans', weight: 400, size: 6.2, leading: 1.35, color: TEXT },
} satisfies Record<string, TextStyle>;

/** Nagłówek sekcji karty: etykieta i linia pod nią; zwraca y pod linią. */
function cardLabel(pdf: Pdf, wr: Writer, label: string, x: number, y: number, w: number) {
  let end = y;
  wr.block('H2', () => { end = text(pdf.doc, label, x, y, w, C.label); });
  wr.deco(() => rule(pdf, x, end + 1.5, w, 0.75));
  return end + 5.5;
}

/** Punkt z podstawą prawną w prawej kolumnie; zwraca y pod punktem. */
function basisItem(pdf: Pdf, item: { text: string; basis: string }, x: number, y: number, w: number) {
  const textW = w - BASIS_W - 6;
  const end = text(pdf.doc, item.text, x, y, textW, C.body);
  return Math.max(end, text(pdf.doc, item.basis, x + w - BASIS_W, y, BASIS_W, C.basis));
}

function front(pdf: Pdf, wr: Writer, c: CardContent, phones: CardPhones, ox: number, oy: number) {
  const { doc } = pdf;
  const x = ox + PAD;
  const w = PANEL.w - 2 * PAD;
  const bottom = oy + PANEL.h - PAD;
  let y = oy + PAD;

  wr.block('P', () => { y = text(doc, `Karta kieszonkowa · ${c.stamp}`, x, y, w, C.stamp); });
  y += 4;
  wr.block('H1', () => { y = text(doc, c.title, x, y, w, C.title); });
  wr.deco(() => rule(pdf, x, y + 4, w, 1.4));
  y += 11;

  wr.block('P', () => { y = text(doc, 'Nie wiesz, od czego zacząć? Zadzwoń', x, y, w, C.label); });
  y += 2;
  wr.block('P', () => {
    const top = y;
    y = text(doc, phones.helpline.phone.display, x, y, w, C.phone);
    doc.link(x, top, widthOf(doc, phones.helpline.phone.display, C.phone), y - top, `tel:${phones.helpline.phone.tel}`);
  });
  y += 3;
  wr.block('P', () => { y = text(doc, `**${phones.helpline.name}** — ${phones.helpline.hours.toLowerCase()}. Wspólny numer Rzecznika Praw Pacjenta i NFZ.`, x, y, w, { ...C.small, bold: 600 }); });
  y += 6;

  // 112: czarny kwadrat z numerem, obok jedno zdanie
  const box = { w: 26, h: 17 };
  wr.deco(() => doc.save().rect(x, y, box.w, box.h).fill(INK).restore());
  wr.block('P', () => {
    text(doc, phones.emergency.phone.display, x, y + (box.h - C.sos.size) / 2, box.w, { ...C.sos, color: '#ffffff', align: 'center' });
    text(doc, 'Zagrożenie życia? Dzwoń pod 112. Infolinia pacjenta nie wysyła karetki.', x + box.w + 7, y + 1.5, w - box.w - 7, C.small);
  });
  y += box.h + 12;

  y = cardLabel(pdf, wr, 'Masz prawo do', x, y, w);
  // linie między punktami rysujemy po liście: dekoracja nie może siedzieć w treści punktu
  const seps: number[] = [];
  wr.list(c.rights, (item, i) => {
    if (i) { seps.push(y + 2.25); y += 4.5; }
    y = basisItem(pdf, item, x, y, w);
  });
  wr.deco(() => seps.forEach((sy) => rule(pdf, x, sy, w, 0.3, HAIR)));

  const footH = measure(doc, `Pełna wersja i źródła: ${c.url}`, w, C.foot);
  fit('karta, przód', y, bottom - footH - 6);
  wr.block('P', () => { text(doc, `Pełna wersja i źródła: **${c.url}**`, x, bottom - footH, w, { ...C.foot, bold: 600 }); });
}

function back(pdf: Pdf, wr: Writer, c: CardContent, ox: number, oy: number) {
  const { doc } = pdf;
  const x = ox + PAD;
  const w = PANEL.w - 2 * PAD;
  const bottom = oy + PANEL.h - PAD;
  let y = oy + PAD;

  y = cardLabel(pdf, wr, 'To jest bezpłatne — choć rzadko kto o tym mówi', x, y, w);
  wr.list(c.free, (item, i) => {
    if (i) y += 4.5;
    y = basisItem(pdf, item, x, y, w);
  });
  y += 11;

  y = cardLabel(pdf, wr, 'Pilnuj terminów', x, y, w);
  const valueW = 52;
  wr.list(c.deadlines, (d, i) => {
    if (i) y += 5;
    text(doc, d.value, x, y, valueW, C.value);
    const end = text(doc, d.text, x + valueW, y + 0.5, w - valueW, C.body);
    y = text(doc, d.basis, x + valueW, end, w - valueW, { ...C.basis, align: 'left' });
  });
  y += 7;

  // ostrzeżenie w ramce
  const inner = w - 14;
  const warnH = measure(doc, c.warning, inner, C.body) + 18;
  wr.deco(() => doc.save().rect(x, y, w, warnH).lineWidth(0.9).strokeColor(INK).stroke().restore());
  wr.block('P', () => {
    text(doc, 'Uwaga', x + 7, y + 5, inner, C.label);
    text(doc, c.warning, x + 7, y + 13, inner, C.body);
  });
  y += warnH + 11;

  y = cardLabel(pdf, wr, 'Gdzie zgłosić', x, y, w);
  wr.list(c.routes, (r, i) => {
    if (i) y += 4.5;
    y = text(doc, r.situation, x, y, w, C.strong);
    y = text(doc, r.contact, x, y, w, C.small);
  });

  const footH = measure(doc, c.legal, w, C.foot);
  fit('karta, tył', y, bottom - footH - 6);
  wr.block('P', () => { text(doc, c.legal, x, bottom - footH, w, C.foot); });
}

/** Linie cięcia i zgięcia + jednozdaniowa instrukcja na linii cięcia. */
function cutMarks(pdf: Pdf) {
  const { doc } = pdf;
  artifact(pdf, () => {
    // zgięcie: kropki pionowo przez środek arkusza
    doc.save().moveTo(PANEL.w, 0).lineTo(PANEL.w, A4.h).lineWidth(0.7).lineCap('round').dash(0.1, { space: 3 }).strokeColor(GREY).stroke().restore();
    // cięcie: kreska poziomo przez środek
    doc.save().moveTo(0, PANEL.h).lineTo(A4.w, PANEL.h).lineWidth(0.5).dash(4, { space: 3 }).strokeColor(GREY).stroke().restore();
    // podpis na linii cięcia (na białym tle, przerywa kreskę)
    const label = 'przetnij wzdłuż kreski · złóż wzdłuż kropek, napisem na zewnątrz';
    const style: TextStyle = { family: 'mono', weight: 500, size: 5.2, tracking: 0.3, color: GREY, leading: 1 };
    const lw = widthOf(doc, label, style) + 10;
    doc.save().rect(A4.w / 2 - lw / 2, PANEL.h - 4, lw, 8).fill('#ffffff').restore();
    text(doc, label, A4.w / 2 - lw / 2 + 5, PANEL.h - style.size / 2, lw, style);
  });
}

export async function renderCard(c: CardContent, phones: CardPhones, date: Date): Promise<Uint8Array> {
  const pdf = await createPdf({
    title: `${c.title} — karta kieszonkowa do wydruku`,
    subject: 'Najważniejsze prawa pacjenta, terminy i numery. Dwie karty na kartce A4: przetnij i złóż.',
    keywords: 'prawa pacjenta, Rzecznik Praw Pacjenta, dokumentacja medyczna, karta do druku',
    date,
  });
  const wr = tagged(pdf);
  front(pdf, wr, c, phones, 0, 0);
  back(pdf, wr, c, PANEL.w, 0);
  // druga karta — dla kogoś bliskiego; dla czytnika ekranu to powtórzenie, więc dekoracja
  artifact(pdf, () => {
    front(pdf, plain, c, phones, 0, PANEL.h);
    back(pdf, plain, c, PANEL.w, PANEL.h);
  });
  cutMarks(pdf);
  return pdf.finish();
}

// ---------------------------------------------------------------------------
// Duży druk (2 strony A4, tekst 14 pt)
// ---------------------------------------------------------------------------

const M = mm(18);
const L = {
  stamp: { family: 'mono', weight: 500, size: 9, tracking: 0.6, upper: true, color: TEXT, leading: 1.3 },
  title: { family: 'display', weight: 500, size: 40, leading: 1.05, tracking: -1 },
  h2: { family: 'display', weight: 500, size: 21, leading: 1.15, tracking: -0.3 },
  lead: { family: 'sans', weight: 600, size: 14, leading: 1.35 },
  phone: { family: 'display', weight: 400, size: 54, leading: 1, tracking: -1.2 },
  body: { family: 'sans', weight: 400, size: 14, leading: 1.38, bold: 600 },
  strong: { family: 'sans', weight: 600, size: 14, leading: 1.38 },
  basis: { family: 'mono', weight: 500, size: 10, leading: 1.9, color: TEXT, align: 'right' },
  value: { family: 'display', weight: 500, size: 24, leading: 1, tracking: -0.4 },
  sos: { family: 'display', weight: 500, size: 22, leading: 1 },
  foot: { family: 'mono', weight: 500, size: 9, leading: 1.3, color: TEXT },
} satisfies Record<string, TextStyle>;

export async function renderLargePrint(c: CardContent, phones: CardPhones, date: Date): Promise<Uint8Array> {
  const pdf = await createPdf({
    title: `${c.title} — duży druk`,
    subject: 'Najważniejsze prawa pacjenta, terminy i numery, dużą czcionką na dwóch stronach A4.',
    keywords: 'prawa pacjenta, duży druk, Rzecznik Praw Pacjenta, karta do druku',
    date,
  });
  const { doc } = pdf;
  const wr = tagged(pdf);
  const x = M;
  const w = A4.w - 2 * M;
  const bottom = A4.h - M;
  const basisW = 104;
  const pages = 2;

  const footer = (n: number) =>
    wr.deco(() => {
      rule(pdf, x, bottom - 16, w, 0.5, HAIR);
      text(doc, c.url, x, bottom - 11, w, L.foot);
      text(doc, `strona ${n} z ${pages}`, x, bottom - 11, w, { ...L.foot, align: 'right' });
    });
  const h2 = (label: string, y: number) => {
    let end = y;
    wr.block('H2', () => { end = text(doc, label, x, y, w, L.h2); });
    wr.deco(() => rule(pdf, x, end + 4, w, 1));
    return end + 14;
  };
  const basisRow = (item: { text: string; basis: string }, y: number) => {
    const end = text(doc, item.text, x, y, w - basisW - 12, L.body);
    return Math.max(end, text(doc, item.basis, x + w - basisW, y, basisW, L.basis));
  };

  // --- strona 1: telefon i prawa ---
  let y = M;
  wr.block('P', () => { y = text(doc, `Duży druk · ${c.stamp}`, x, y, w, L.stamp); });
  y += 6;
  wr.block('H1', () => { y = text(doc, c.title, x, y, w, L.title); });
  wr.deco(() => rule(pdf, x, y + 8, w, 2));
  y += 22;

  wr.block('P', () => { y = text(doc, 'Nie wiesz, od czego zacząć? Zadzwoń:', x, y, w, L.lead); });
  y += 4;
  wr.block('P', () => {
    const top = y;
    y = text(doc, phones.helpline.phone.display, x, y, w, L.phone);
    doc.link(x, top, widthOf(doc, phones.helpline.phone.display, L.phone), y - top, `tel:${phones.helpline.phone.tel}`);
  });
  y += 6;
  wr.block('P', () => { y = text(doc, `${phones.helpline.hours}. **${phones.helpline.name}** — wspólna infolinia Rzecznika Praw Pacjenta i NFZ.`, x, y, w, L.body); });
  y += 14;

  const box = { w: 52, h: 34 };
  wr.deco(() => doc.save().rect(x, y, box.w, box.h).fill(INK).restore());
  wr.block('P', () => {
    text(doc, phones.emergency.phone.display, x, y + (box.h - L.sos.size) / 2, box.w, { ...L.sos, color: '#ffffff', align: 'center' });
    text(doc, '**Zagrożenie życia? Dzwoń pod 112.** Infolinia pacjenta nie wysyła karetki.', x + box.w + 14, y + 0.5, w - box.w - 14, L.body);
  });
  y += box.h + 26;

  y = h2('Masz prawo do', y);
  const seps: number[] = [];
  wr.list(c.rights, (item, i) => {
    if (i) { seps.push(y + 5); y += 10; }
    y = basisRow(item, y);
  });
  wr.deco(() => seps.forEach((sy) => rule(pdf, x, sy, w, 0.4, HAIR)));
  fit('duży druk, strona 1', y, bottom - 26);
  footer(1);

  // --- strona 2: bezpłatne, terminy, gdzie zgłosić ---
  doc.addPage({ size: 'A4', margin: 0 });
  y = M;
  y = h2('To jest bezpłatne — choć rzadko kto o tym mówi', y);
  wr.list(c.free, (item, i) => {
    if (i) y += 9;
    y = basisRow(item, y);
  });
  y += 16;

  y = h2('Pilnuj terminów', y);
  const valueW = 96;
  wr.list(c.deadlines, (d, i) => {
    if (i) y += 10;
    text(doc, d.value, x, y, valueW, L.value);
    const end = text(doc, d.text, x + valueW, y + 2, w - valueW, L.body);
    y = text(doc, d.basis, x + valueW, end, w - valueW, { ...L.basis, align: 'left' });
  });
  y += 12;

  const inner = w - 28;
  const warnH = measure(doc, c.warning, inner, L.body) + 36;
  wr.deco(() => doc.save().rect(x, y, w, warnH).lineWidth(1.5).strokeColor(INK).stroke().restore());
  wr.block('P', () => {
    text(doc, 'Uwaga', x + 14, y + 12, inner, { ...L.stamp, color: INK });
    text(doc, c.warning, x + 14, y + 26, inner, L.body);
  });
  y += warnH + 18;

  y = h2('Gdzie zgłosić', y);
  wr.list(c.routes, (r, i) => {
    if (i) y += 10;
    y = text(doc, r.situation, x, y, w, L.strong);
    y = text(doc, r.contact, x, y, w, { ...L.body, color: TEXT });
  });
  y += 12;
  wr.block('P', () => { y = text(doc, c.legal, x, y, w, { ...L.body, size: 11.5, color: TEXT }); });
  fit('duży druk, strona 2', y, bottom - 26);
  footer(2);

  return pdf.finish();
}
