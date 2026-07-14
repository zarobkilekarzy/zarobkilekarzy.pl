// Izomorficzny generator WYPEŁNIONEGO PDF-a petycji (jsPDF) — działa w przeglądarce
// (przycisk „Pobierz wypełniony PDF") i w Node (prototyp/testy). Treść z jednego źródła
// prawdy (petycja.ts), pola imię/miejscowość/adres podmieniane danymi wnoszącego — dzięki
// temu plik nadaje się na ZAŁĄCZNIK do pisma ogólnego gov.pl (nie tylko na wydruk).
//
// Fonty przekazujemy jako base64 TTF (w przeglądarce pobierane z /fonts/*.ttf, w Node
// czytane z dysku), bo jsPDF osadza tylko sfnt przez addFileToVFS.
import { PETYCJA_TRESC, ADRESACI } from './petycja';

export interface PetycjaPdfData {
  imie: string;
  miejscowosc: string;
  adresat: 'mz' | 'senat';
  data: string; // np. „14 lipca 2026"
  adresKorespondencji: string; // brzmienie linii „Adres do korespondencji"
}

type Fonts = { regular: string; bold: string };

const A4 = { w: 595.28, h: 841.89 };
const M = { top: 62, bottom: 64, left: 64, right: 64 };
const CW = A4.w - M.left - M.right;
const PAGE_BOTTOM = A4.h - M.bottom;

const COL = {
  ink: [20, 35, 58],
  soft: [81, 99, 122],
  faint: [97, 109, 122],
  brand: [15, 76, 129],
  line: [219, 227, 236],
} as const;

function classify(block: string) {
  const lines = block.split('\n');
  const head = lines[0];
  if (head === 'PETYCJA') return { kind: 'title', title: head, sub: lines.slice(1).join(' ') };
  if (/^Wnoszący petycję:/.test(head)) return { kind: 'meta', lines };
  if (/^\d+\.\s/.test(block)) {
    const m = block.match(/^(\d+)\.\s([\s\S]*)$/)!;
    return { kind: 'item', num: m[1], text: m[2].replace(/\n/g, ' ') };
  }
  if (head === 'UZASADNIENIE' || head === 'Oświadczenia')
    return { kind: 'section', heading: head, body: lines.slice(1) };
  if (/^Z poważaniem/.test(head)) return { kind: 'sign', lines };
  if (/^———/.test(head)) return { kind: 'foot', body: lines.slice(1).join(' ') };
  return { kind: 'para', text: block.replace(/\n/g, ' ') };
}

// jsPDFCtor = klasa jsPDF (import po stronie wywołującego, by nie wiązać budowania).
export function buildFilledPetycjaPdf(jsPDFCtor: any, fonts: Fonts, d: PetycjaPdfData) {
  const doc = new jsPDFCtor({ unit: 'pt', format: 'a4', compress: true });
  doc.addFileToVFS('Plex.ttf', fonts.regular);
  doc.addFont('Plex.ttf', 'Plex', 'normal');
  doc.addFileToVFS('PlexB.ttf', fonts.bold);
  doc.addFont('PlexB.ttf', 'Plex', 'bold');

  const fill = (t: string) =>
    t.replace(/\{\{IMIE\}\}/g, d.imie)
      .replace(/\{\{MIEJSCOWOSC\}\}/g, d.miejscowosc)
      .replace(/\{\{ADRES_KORESPONDENCJI\}\}/g, d.adresKorespondencji);

  const cur = { y: M.top };
  const set = (font: 'normal' | 'bold', size: number, col: readonly number[]) => {
    doc.setFont('Plex', font);
    doc.setFontSize(size);
    doc.setTextColor(col[0], col[1], col[2]);
  };
  const linesOf = (text: string, size: number, width = CW) => {
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width) as string[];
  };
  const heightOf = (n: number, size: number, lh = 1.35) => n * size * lh;
  const ensure = (h: number) => { if (cur.y + h > PAGE_BOTTOM) { doc.addPage(); cur.y = M.top; } };

  // blok tekstu z podziałem NA GRANICY bloku (żaden blok nie jest wyższy niż strona)
  const block = (
    text: string,
    { size = 10.5, font = 'normal', col = COL.ink, align = 'left', x = M.left, width = CW, lh = 1.35, gap = 0.6 }:
      { size?: number; font?: 'normal' | 'bold'; col?: readonly number[]; align?: 'left' | 'center' | 'justify'; x?: number; width?: number; lh?: number; gap?: number } = {},
  ) => {
    set(font, size, col);
    const ls = linesOf(text, size, width);
    const h = heightOf(ls.length, size, lh);
    ensure(h);
    // jsPDF kotwiczy align:'right' na PRAWEJ krawędzi, 'center' na środku podanego x.
    const anchorX = align === 'center' ? A4.w / 2 : align === 'right' ? A4.w - M.right : x;
    doc.text(ls, anchorX, cur.y, { baseline: 'top', align, maxWidth: width, lineHeightFactor: lh });
    cur.y += h + gap * size;
  };

  // — NAGŁÓWEK: data (kropkowana) + adresat, do prawej —
  set('normal', 10, COL.soft);
  doc.text('……………………………, dnia ' + d.data + ' r.', A4.w - M.right, cur.y, { baseline: 'top', align: 'right' });
  cur.y += heightOf(1, 10) + 8;
  ADRESACI[d.adresat].blok.forEach((line, i) => {
    set(i === 0 ? 'bold' : 'normal', 10.5, COL.ink);
    doc.text(line, A4.w - M.right, cur.y, { baseline: 'top', align: 'right' });
    cur.y += heightOf(1, 10.5, 1.25);
  });
  cur.y += 18;

  for (const raw of PETYCJA_TRESC.split('\n\n')) {
    const b: any = classify(raw);

    if (b.kind === 'title') {
      ensure(80);
      block(b.title, { font: 'bold', size: 22, col: COL.brand, align: 'center', gap: 0.3 });
      block(fill(b.sub), { size: 11, col: COL.soft, align: 'center', width: CW - 40, x: M.left + 20, gap: 0.8, lh: 1.3 });
      ensure(24);
      doc.setDrawColor(COL.line[0], COL.line[1], COL.line[2]);
      doc.setLineWidth(1);
      doc.line(A4.w / 2 - 40, cur.y, A4.w / 2 + 40, cur.y);
      cur.y += 16;
    } else if (b.kind === 'meta') {
      for (const line of b.lines) {
        const idx = line.indexOf(': ') + 2;
        const label = fill(line.slice(0, idx));
        const value = fill(line.slice(idx));
        set('bold', 10.5, COL.ink);
        const lw = doc.getTextWidth(label);
        ensure(heightOf(1, 10.5));
        if (lw + doc.getTextWidth(value) <= CW) {
          doc.text(label, M.left, cur.y, { baseline: 'top' });
          set('normal', 10.5, COL.soft);
          doc.text(value, M.left + lw, cur.y, { baseline: 'top' });
          cur.y += heightOf(1, 10.5, 1.35) + 0.15 * 10.5;
        } else {
          doc.text(label, M.left, cur.y, { baseline: 'top' });
          cur.y += heightOf(1, 10.5, 1.35);
          block(value, { col: COL.soft, gap: 0.3 });
        }
      }
      cur.y += 0.5 * 10.5;
    } else if (b.kind === 'item') {
      const size = 10.5;
      const ls = linesOf(fill(b.text), size, CW - 22);
      const h = heightOf(ls.length, size);
      ensure(h);
      set('bold', size, COL.brand);
      doc.text(b.num + '.', M.left, cur.y, { baseline: 'top' });
      set('normal', size, COL.ink);
      doc.text(ls, M.left + 22, cur.y, { baseline: 'top', align: 'justify', maxWidth: CW - 22, lineHeightFactor: 1.35 });
      cur.y += h + 0.55 * size;
    } else if (b.kind === 'section') {
      cur.y += 0.5 * 11;
      block(b.heading, { font: 'bold', size: 11, col: COL.brand, gap: 0.4 });
      (b.body as string[]).forEach((line, i) =>
        block(fill(line), { align: 'justify', gap: i < b.body.length - 1 ? 0.35 : 0.7 }));
    } else if (b.kind === 'sign') {
      cur.y += 1.2 * 10.5;
      block(fill(b.lines[0]), { gap: 1.4 });
      (b.lines as string[]).slice(1).forEach((line) =>
        block(fill(line), { align: 'right', gap: 0.5 }));
    } else if (b.kind === 'foot') {
      cur.y += 1.2 * 9;
      ensure(24);
      doc.setDrawColor(COL.line[0], COL.line[1], COL.line[2]);
      doc.setLineWidth(0.75);
      doc.line(M.left, cur.y, M.left + CW, cur.y);
      cur.y += 8;
      block(fill(b.body), { size: 8.5, col: COL.faint, lh: 1.45, gap: 0 });
    } else {
      block(fill(b.text), { align: 'justify' });
    }
  }

  // numeracja stron (dół–środek), tylko gdy > 1 strona
  const pages = doc.getNumberOfPages();
  if (pages > 1) {
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      set('normal', 8, COL.faint);
      doc.text(`${i} / ${pages}`, A4.w / 2, A4.h - 30, { baseline: 'top', align: 'center' });
    }
  }

  return doc;
}
