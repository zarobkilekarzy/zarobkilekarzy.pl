/**
 * Skład PDF przy buildzie (pdfkit): fonty serwisu, łamanie wierszy, znakowanie struktury.
 *
 * - Fonty: statyczne WOFF z @fontsource — te same rodziny co na stronie i w obrazkach OG.
 * - Łamanie wierszy jest własne. @fontsource dzieli font na podzbiory: polskie litery (ą, ę, ł…)
 *   są w pliku latin-ext, więc słowo „płacić” to trzy kawałki w dwóch fontach. Wbudowane
 *   łamanie pdfkit przeniosłoby wiersz na granicy kawałków, czyli w środku słowa. Tu słowo
 *   jest niepodzielne, a podzbiór fontu dobierany znak po znaku.
 * - Tagged PDF (język, tytuł, struktura H1/P/L): czytnik ekranu czyta treść w kolejności
 *   rysowania, a linie i ramki są oznaczone jako dekoracja (Artifact).
 * - Tekst wychodzi poza ramkę → błąd budowania, a nie ucięta karta (zob. `fit`).
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import PDFDocument from 'pdfkit';

export type Family = 'sans' | 'display' | 'mono';
export type Weight = 400 | 500 | 600;
type Doc = PDFKit.PDFDocument;
type Struct = PDFKit.PDFStructureElement;

const PACKAGES: Record<Family, { pkg: string; weights: Weight[] }> = {
  sans: { pkg: 'ibm-plex-sans', weights: [400, 600] },
  display: { pkg: 'inter-tight', weights: [400, 500] },
  mono: { pkg: 'ibm-plex-mono', weights: [500] },
};

const fontName = (family: Family, weight: Weight, ext: boolean) => `${family}-${weight}${ext ? '-ext' : ''}`;

/** Znak z podzbioru latin-ext (Latin Extended-A i B): ą ć ę ł ń ś ź ż. Litera ó jest w podzbiorze latin. */
const isExt = (cp: number) => cp >= 0x100 && cp <= 0x24f;

const resolveModule = createRequire(path.join(process.cwd(), 'package.json')).resolve;
let fontFiles: Promise<{ name: string; data: Buffer }[]> | undefined;
const loadFonts = () =>
  (fontFiles ??= Promise.all(
    (Object.entries(PACKAGES) as [Family, (typeof PACKAGES)[Family]][]).flatMap(([family, { pkg, weights }]) =>
      weights.flatMap((weight) =>
        [false, true].map(async (ext) => ({
          name: fontName(family, weight, ext),
          data: await readFile(resolveModule(`@fontsource/${pkg}/files/${pkg}-${ext ? 'latin-ext' : 'latin'}-${weight}-normal.woff`)),
        })),
      ),
    ),
  ));

// ---------------------------------------------------------------------------
// Dokument
// ---------------------------------------------------------------------------

export interface DocMeta {
  title: string;
  subject: string;
  keywords?: string;
  /** stała data utworzenia: ten sam stan treści = ten sam plik */
  date: Date;
  /** pole Author; `null` — bez autora (dokument anonimowy, np. projekt ustawy) */
  author?: string | null;
}

export interface Pdf {
  doc: Doc;
  /** korzeń drzewa struktury — do niego dodajemy elementy w kolejności czytania */
  root: Struct;
  /** kończy dokument i zwraca bajty */
  finish: () => Promise<Uint8Array>;
}

export async function createPdf(meta: DocMeta): Promise<Pdf> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    pdfVersion: '1.7',
    tagged: true,
    lang: 'pl-PL',
    displayTitle: true,
    info: {
      Title: meta.title,
      Subject: meta.subject,
      Keywords: meta.keywords,
      ...(meta.author === null ? {} : { Author: meta.author ?? 'zarobkilekarzy.pl' }),
      Creator: 'zarobkilekarzy.pl',
      CreationDate: meta.date,
      ModDate: meta.date,
    },
  });
  for (const font of await loadFonts()) doc.registerFont(font.name, font.data);

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Uint8Array>((resolve, reject) => {
    doc.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on('error', reject);
  });

  const root = doc.struct('Document');
  doc.addStructure(root);

  return {
    doc,
    root,
    finish: () => {
      root.end();
      doc.end();
      return done;
    },
  };
}

/** Element struktury z treścią rysowaną w `draw` (np. 'H1', 'P'). */
export const tag = (pdf: Pdf, parent: Struct, type: string, draw: () => void) => parent.add(pdf.doc.struct(type, {}, draw));

/** Lista (L → LI → LBody): każdy punkt rysuje `draw(item, i)`. */
export function list<T>(pdf: Pdf, parent: Struct, items: T[], draw: (item: T, i: number) => void) {
  const l = pdf.doc.struct('L');
  parent.add(l);
  items.forEach((item, i) => l.add(pdf.doc.struct('LI', {}, [pdf.doc.struct('LBody', {}, () => draw(item, i))])));
  l.end();
}

/** Dekoracja (linie, ramki, znaczniki cięcia) — poza drzewem struktury. */
export function artifact(pdf: Pdf, draw: () => void) {
  pdf.doc.markContent('Artifact', { type: 'Layout' });
  draw();
  pdf.doc.endMarkedContent();
}

// ---------------------------------------------------------------------------
// Tekst
// ---------------------------------------------------------------------------

export interface TextStyle {
  family: Family;
  weight: Weight;
  size: number;
  color?: string;
  /** interlinia jako wielokrotność rozmiaru */
  leading?: number;
  /** odstęp między znakami w pt */
  tracking?: number;
  upper?: boolean;
  /** waga fragmentów **pogrubionych** */
  bold?: Weight;
  /** kolor fragmentów ==wyróżnionych== (rysowanych wagą `bold`), np. [?] w projekcie ustawy */
  mark?: string;
  /** kolor linków [etykieta](https://…); domyślnie kolor tekstu */
  link?: string;
  align?: 'left' | 'right' | 'center';
}

interface Piece { text: string; font: string; width: number; href?: string; mark?: boolean }
interface Word { pieces: Piece[]; width: number }
interface Run { text: string; bold: boolean; href?: string; mark?: boolean }

/**
 * **pogrubienie** i [etykieta](https://…) — ten sam zapis co na stronie (lib/inline.ts);
 * ==wyróżnienie== — tylko w PDF (kolor `TextStyle.mark`).
 */
function parse(text: string): Run[] {
  const runs: Run[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|==(.+?)==/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), bold: false });
    if (m[4] !== undefined) runs.push({ text: m[4], bold: true, mark: true });
    else runs.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], bold: false, href: /^https?:/.test(m[3]) ? m[3] : undefined });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false });
  return runs;
}

function words(doc: Doc, text: string, s: TextStyle): Word[] {
  const out: Word[] = [];
  let current: Piece[] = [];
  const flush = () => {
    if (current.length) out.push({ pieces: current, width: current.reduce((w, p) => w + p.width, 0) });
    current = [];
  };
  for (const run of parse(s.upper ? text.toLocaleUpperCase('pl-PL') : text)) {
    const weight = run.bold ? (s.bold ?? 600) : s.weight;
    // spacje zwykłe dzielą słowa; twarde (z typo) zostają w słowie
    for (const chunk of run.text.split(/( )/)) {
      if (chunk === ' ') { flush(); continue; }
      if (!chunk) continue;
      // kawałki tego samego podzbioru fontu; twarda spacja to osobny kawałek (zob. spaceFont)
      let buf = '';
      let bufExt = false;
      const push = () => {
        if (!buf) return;
        const font = fontName(s.family, weight, bufExt);
        const width = doc.font(font).fontSize(s.size).widthOfString(buf, { characterSpacing: s.tracking ?? 0 });
        current.push({ text: buf, font, width, href: run.href, mark: run.mark });
        buf = '';
      };
      for (const ch of chunk) {
        if (ch === NBSP) {
          push();
          current.push({ text: ' ', font: spaceFont(s), width: spaceWidth(doc, s), href: run.href });
          continue;
        }
        const ext = isExt(ch.codePointAt(0)!);
        if (buf && ext !== bufExt) push();
        bufExt = ext;
        buf += ch;
      }
      push();
    }
  }
  flush();
  return out;
}

const NBSP = String.fromCharCode(0xa0);

/**
 * Font, którym rysujemy spację. Statyczny WOFF IBM Plex Mono (latin) ma pusty glif spacji,
 * na którym fontkit wychodzi poza tablicę (RangeError) — w tekście mono spację rysuje więc
 * Plex Sans, a odstęp ma szerokość znaku mono (spaceWidth).
 */
const spaceFont = (s: TextStyle) => (s.family === 'mono' ? fontName('sans', 400, false) : fontName(s.family, s.weight, false));

const spaceWidth = (doc: Doc, s: TextStyle) =>
  s.family === 'mono'
    ? doc.font(fontName('mono', s.weight, false)).fontSize(s.size).widthOfString('0', { characterSpacing: s.tracking ?? 0 })
    : doc.font(fontName(s.family, s.weight, false)).fontSize(s.size).widthOfString(' ', { characterSpacing: s.tracking ?? 0 });

function lines(doc: Doc, text: string, width: number, s: TextStyle): Word[][] {
  const space = spaceWidth(doc, s);
  const out: Word[][] = [];
  let line: Word[] = [];
  let used = 0;
  for (const word of words(doc, text, s)) {
    if (line.length && used + space + word.width > width) {
      out.push(line);
      line = [];
      used = 0;
    }
    used += (line.length ? space : 0) + word.width;
    line.push(word);
  }
  if (line.length) out.push(line);
  return out;
}

const lineHeight = (s: TextStyle) => s.size * (s.leading ?? 1.3);

/** Wysokość akapitu bez rysowania. */
export const measure = (doc: Doc, text: string, width: number, s: TextStyle) => lines(doc, text, width, s).length * lineHeight(s);

/** Liczba wierszy akapitu — do łamania akapitu między stronami (zob. `range` w `text`). */
export const lineCount = (doc: Doc, text: string, width: number, s: TextStyle) => lines(doc, text, width, s).length;

/** Szerokość tekstu w jednym wierszu. */
export const widthOf = (doc: Doc, text: string, s: TextStyle) => {
  const ws = words(doc, text, s);
  return ws.reduce((w, word) => w + word.width, 0) + Math.max(0, ws.length - 1) * spaceWidth(doc, s);
};

/**
 * Rysuje akapit od (x, y) w szerokości `width`; zwraca y pod ostatnim wierszem.
 * `range` — tylko wiersze [from, to) akapitu, od (x, y): koniec strony w środku akapitu.
 */
export function text(doc: Doc, content: string, x: number, y: number, width: number, s: TextStyle, range?: { from: number; to: number }): number {
  const lh = lineHeight(s);
  const space = spaceWidth(doc, s);
  const blank = spaceFont(s);
  const opts = { lineBreak: false, characterSpacing: s.tracking ?? 0 };
  const color = s.color ?? '#000';
  doc.fillColor(color);
  const all = lines(doc, content, width, s);
  const broken = range ? all.slice(range.from, range.to) : all;
  broken.forEach((line, i) => {
    const lineWidth = line.reduce((w, word) => w + word.width, 0) + (line.length - 1) * space;
    let cx = s.align === 'right' ? x + width - lineWidth : s.align === 'center' ? x + (width - lineWidth) / 2 : x;
    // półinterlinia nad tekstem: wiersz stoi w środku swojej wysokości
    const ly = y + i * lh + (lh - s.size) / 2;
    line.forEach((word, wi) => {
      if (wi) {
        // prawdziwa spacja w strumieniu treści: kopiowanie i czytniki ekranu widzą słowa
        doc.font(blank).fontSize(s.size).text(' ', cx, ly, opts);
        cx += space;
      }
      for (const piece of word.pieces) {
        const tint = piece.mark ? (s.mark ?? color) : piece.href ? s.link : undefined;
        if (tint) doc.fillColor(tint);
        doc.font(piece.font).fontSize(s.size).text(piece.text, cx, ly, opts);
        if (tint) doc.fillColor(color);
        if (piece.href) doc.link(cx, ly, piece.width, s.size, piece.href);
        cx += piece.width;
      }
    });
  });
  return y + broken.length * lh;
}

/** Strażnik układu: treść nie zmieściła się w ramce → błąd budowania z nazwą miejsca. */
export function fit(where: string, bottom: number, limit: number) {
  if (bottom > limit + 0.5) {
    throw new Error(`[pdf] ${where}: treść wychodzi poza ramkę o ${(bottom - limit).toFixed(1)} pt — skróć tekst albo zmniejsz stopień pisma`);
  }
}

/** Milimetry → punkty typograficzne (PDF). */
export const mm = (v: number) => (v * 72) / 25.4;
