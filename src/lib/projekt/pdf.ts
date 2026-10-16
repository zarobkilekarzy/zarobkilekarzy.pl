/**
 * PDF obywatelskiego projektu nowelizacji art. 27a — skład z tych samych danych co strona
 * /postulat/projekt-ustawy/ (src/data/projekt-ustawy.ts). Adres pliku: projekt.pdf.href.
 *
 * Układ jak w wersji 0.3 sprzed przebudowy serwisu: strona tytułowa, nota o statusie, tekst projektu,
 * uzasadnienie i każdy załącznik od nowej strony. Na każdej stronie znak wodny „wersja wstępna”,
 * stopka z numerem „2 / 8”; od drugiej strony nagłówek ze znakiem serwisu.
 *
 * Skład płynie z góry na dół (`Flow`): akapit, który nie mieści się na stronie, przechodzi
 * na następną wierszami (co najmniej dwa wiersze na każdej stronie), nagłówek nie zostaje sam
 * u dołu strony, a wiersz tabeli przenosi się w całości razem z nagłówkiem tabeli.
 * Liczby stron nie znamy przed złożeniem — render robi drugi przebieg, gdy stopka jej potrzebuje.
 *
 * Dokument jest anonimowy: bez pola Author, bez nazwisk i ścieżek w metadanych.
 */
import { annexes, bill, consolidated, justification, legalQuestions, legend, projekt, references, statusNote } from '@/data/projekt-ustawy';
import { contact } from '@/data/o-serwisie';
import { icons } from '@/icons';
import { formatDate, typo } from '@/lib/format';
import { artifact, createPdf, lineCount, measure, mm, text, widthOf, type Pdf, type TextStyle } from '@/lib/pdf/typeset';
import type { CompareTable } from '@/types';

type Struct = PDFKit.PDFStructureElement;
/** Zakres nagłówka tabeli (atrybut /Scope) — pdfkit 0.20 go obsługuje, @types/pdfkit 0.17 jeszcze nie zna. */
const scope = (s: 'Row' | 'Column') => ({ scope: s }) as PDFKit.Mixins.StructureElementOptions;

/** Dzienne wartości tokenów z src/styles/tokens.css (papier jest zawsze jasny). */
const C = {
  ink: '#040B1B',
  ink2: '#111827',
  text: '#4B5466',
  muted: '#666E80',
  line: '#E6E9EF',
  line2: '#D5DAE2',
  blue: '#2664EC',
  blue50: '#F0F4FE',
  bad: '#B42318',
  amber: '#8A5A00',
  amberBg: '#FFF4DB',
  white: '#FFFFFF',
};

const A4 = { w: 595.28, h: 841.89 };
const X = mm(24);
const W = A4.w - 2 * X;
const TOP = mm(27);
const BOTTOM = A4.h - mm(22);

const S = {
  body: { family: 'sans', weight: 400, size: 10.25, leading: 1.48, color: C.ink2, bold: 600, mark: C.bad, link: C.blue },
  h1: { family: 'display', weight: 400, size: 23, leading: 1.1, tracking: -0.7, color: C.ink },
  h2: { family: 'display', weight: 500, size: 13, leading: 1.3, tracking: -0.25, color: C.ink },
  eyebrow: { family: 'mono', weight: 500, size: 7.5, leading: 1.2, tracking: 0.6, upper: true, color: C.blue },
  billKind: { family: 'sans', weight: 600, size: 12, leading: 1.3, tracking: 3.2, upper: true, color: C.ink, align: 'center' },
  th: { family: 'mono', weight: 500, size: 6.75, leading: 1.35, tracking: 0.45, upper: true, color: C.muted },
  cell: { family: 'sans', weight: 400, size: 8.5, leading: 1.4, color: C.ink2 },
  rowHead: { family: 'display', weight: 500, size: 9.25, leading: 1.38, tracking: -0.1, color: C.ink },
  caption: { family: 'sans', weight: 400, size: 9, leading: 1.45, color: C.text },
  num: { family: 'mono', weight: 500, size: 7.5, leading: 1.2, tracking: 0.3, color: C.blue },
  tag: { family: 'mono', weight: 500, size: 6, leading: 1, tracking: 0.5, upper: true, color: C.white },
  chrome: { family: 'mono', weight: 500, size: 6.5, leading: 1.2, tracking: 0.4, upper: true, color: C.muted },
  folio: { family: 'mono', weight: 500, size: 7.5, leading: 1.2, tracking: 0.3, color: C.ink, align: 'right' },
  wordmark: { family: 'display', weight: 500, size: 8.5, leading: 1, tracking: -0.1, color: C.ink },
  watermark: { family: 'display', weight: 500, size: 66, leading: 1, tracking: 3, upper: true, color: C.blue },
} satisfies Record<string, TextStyle>;

const lh = (s: TextStyle) => s.size * (s.leading ?? 1.3);
/** [?] w treści → wyróżnienie (kolor S.body.mark), objaśnione w nocie o statusie. */
const marks = (s: string) => typo(s).replace(/\[\?\]/g, '==[?]==');

// ---------------------------------------------------------------------------
// Znak serwisu („Puls”) — geometria z src/icons.ts, tak jak w nagłówku strony
// ---------------------------------------------------------------------------

const LOGO = {
  fill: icons.logo.match(/fill="(#[0-9A-Fa-f]{6})"/)![1],
  path: icons.logo.match(/ d="([^"]+)"/)![1],
  stroke: Number(icons.logo.match(/stroke-width="([\d.]+)"/)![1]),
};

function logo(pdf: Pdf, x: number, y: number, size: number) {
  const { doc } = pdf;
  doc.save().rect(x, y, size, size).fill(LOGO.fill).restore();
  doc.save().translate(x, y).scale(size / 24).path(LOGO.path).lineWidth(LOGO.stroke).miterLimit(5).strokeColor(C.white).stroke().restore();
}

/** „zarobkilekarzy.pl” jak w nagłówku serwisu: Inter Tight, „.pl” przygaszone. */
function wordmark(pdf: Pdf, x: number, y: number, s: TextStyle) {
  const name = 'zarobkilekarzy';
  text(pdf.doc, name, x, y, 400, s);
  text(pdf.doc, '.pl', x + widthOf(pdf.doc, name, s), y, 100, { ...s, color: C.muted });
}

function rule(pdf: Pdf, x: number, y: number, w: number, width = 0.5, color = C.line2) {
  pdf.doc.save().moveTo(x, y).lineTo(x + w, y).lineWidth(width).strokeColor(color).stroke().restore();
}

/** Etykieta na wypełnieniu (jak ui/Tag i znacznik „nowy” w Comparison); zwraca szerokość. */
function tagBox(pdf: Pdf, label: string, x: number, y: number, fill = C.blue) {
  const w = widthOf(pdf.doc, label, S.tag) + 8;
  pdf.doc.save().rect(x, y, w, 11).fill(fill).restore();
  return w;
}
const tagText = (pdf: Pdf, label: string, x: number, y: number) => text(pdf.doc, label, x + 4, y + 2.5, 200, S.tag);

// ---------------------------------------------------------------------------
// Przepływ treści przez strony
// ---------------------------------------------------------------------------

const VERSION = `Wersja ${projekt.version} · ${projekt.versionLabel}`;
/** Pierwsze zdanie zastrzeżenia — w stopce każdej strony, gdyby kartka trafiła dalej sama. */
const NOT_A_BILL = projekt.disclaimer.split('. ')[0];

class Flow {
  y = TOP;
  page = 0;

  readonly pdf: Pdf;
  /** liczba stron do stopki; 0 w pierwszym przebiegu */
  readonly total: number;

  constructor(pdf: Pdf, total: number) {
    this.pdf = pdf;
    this.total = total;
  }

  get doc() {
    return this.pdf.doc;
  }

  newPage(cover = false) {
    if (this.page) {
      this.watermark();
      this.doc.addPage({ size: 'A4', margin: 0 });
    }
    this.page += 1;
    this.chrome(cover);
    this.y = TOP;
  }

  /**
   * Znak wodny „wersja wstępna” po przekątnej, od lewego dołu. Rysowany na końcu strony,
   * na wierzchu i półprzezroczysty: widać go także na wyróżnionych wierszach tabeli, a tekst
   * pod nim zostaje czarny. Wywołuje go newPage() i finish().
   */
  watermark() {
    const { pdf, doc } = this;
    artifact(pdf, () => {
      const label = `Wersja ${projekt.versionLabel}`;
      const w = widthOf(doc, label, S.watermark);
      const cx = A4.w / 2;
      const cy = A4.h / 2 + 20;
      doc.save().fillOpacity(0.12).rotate(-54, { origin: [cx, cy] });
      text(doc, label, cx - w / 2, cy - lh(S.watermark) / 2, w + 10, S.watermark);
      doc.restore();
    });
  }

  /** Ostatnia strona: znak wodny i koniec dokumentu. */
  finish() {
    this.watermark();
    return this.pdf.finish();
  }

  /** Nagłówek i stopka — dekoracja poza drzewem struktury. */
  chrome(cover: boolean) {
    const { pdf, doc } = this;
    artifact(pdf, () => {
      if (!cover) {
        const hy = mm(11);
        logo(pdf, X, hy, 10);
        wordmark(pdf, X + 15, hy + 0.5, S.wordmark);
        text(doc, `${projekt.kind} · art. 27a u.d.l. · ${VERSION}`, X, hy + 2.2, W, { ...S.chrome, align: 'right' });
        rule(pdf, X, mm(17), W, 0.5, C.line2);
      }

      const fy = A4.h - mm(17);
      rule(pdf, X, fy, W, 0.5, C.line2);
      text(doc, NOT_A_BILL, X, fy + 7, W - 60, S.chrome);
      text(doc, `${this.page} / ${this.total || '–'}`, X, fy + 6.5, W, S.folio);
    });
  }

  /** Nowa strona, gdy zostało mniej niż `h` miejsca. */
  ensure(h: number) {
    if (this.y + h > BOTTOM + 0.5) this.newPage();
  }

  /** Element struktury z treścią rysowaną od razu (np. nagłówek). */
  block(parent: Struct, type: string, draw: () => void) {
    parent.add(this.doc.struct(type, {}, draw));
  }

  /**
   * Akapit, który może przejść na następną stronę: co najmniej dwa wiersze na dole strony
   * i dwa na górze następnej. `after(y0, y1)` rysuje dekorację obok każdego kawałka
   * (poza treścią otagowaną — zagnieżdżony Artifact psuje strukturę).
   */
  para(parent: Struct, content: string, x: number, w: number, s: TextStyle, opts: { type?: string; after?: (y0: number, y1: number) => void } = {}) {
    const n = lineCount(this.doc, content, w, s);
    const step = lh(s);
    const el = this.doc.struct(opts.type ?? 'P');
    parent.add(el);
    let from = 0;
    while (from < n) {
      const fits = Math.floor((BOTTOM - this.y + 0.5) / step);
      const rest = n - from;
      let take = Math.min(rest, fits);
      if (take < rest) {
        if (rest - take < 2) take = rest - 2;
        if (take < 2) take = 0;
      }
      if (take <= 0) {
        this.newPage();
        continue;
      }
      const y0 = this.y;
      const to = from + take;
      let y1 = y0;
      el.add(() => {
        y1 = text(this.doc, content, x, y0, w, s, { from, to });
      });
      this.y = y1;
      opts.after?.(y0, y1);
      from = to;
      if (from < n) this.newPage();
    }
    el.end();
  }

  /** Nagłówek z co najmniej `keep` pt następnej treści na tej samej stronie. */
  heading(parent: Struct, type: string, content: string, s: TextStyle, keep: number) {
    const h = measure(this.doc, content, W, s);
    this.ensure(h + keep);
    this.block(parent, type, () => {
      this.y = text(this.doc, content, X, this.y, W, s);
    });
  }

  /** Początek części dokumentu: nowa strona, etykieta, tytuł i linia; zakładka w spisie PDF. */
  part(title: string, eyebrow?: string) {
    const { doc, pdf } = this;
    this.newPage();
    doc.outline.addItem(eyebrow ? `${eyebrow}. ${title}` : title);
    if (eyebrow) {
      artifact(pdf, () => doc.save().rect(X, this.y + 1.5, 5.5, 5.5).fill(C.blue).restore());
      this.block(pdf.root, 'P', () => {
        this.y = text(doc, eyebrow, X + 11, this.y, W - 11, S.eyebrow) + 7;
      });
    }
    this.block(pdf.root, 'H2', () => {
      this.y = text(doc, title, X, this.y, W, S.h1);
    });
    artifact(pdf, () => rule(pdf, X, this.y + 8, W, 0.75, C.ink));
    this.y += 22;
  }

  /** Podtytuł w części (Uzasadnienie: 1. Potrzeba i cel). */
  sub(title: string) {
    this.y += 14;
    this.heading(this.pdf.root, 'H3', title, S.h2, 3 * lh(S.body) + 5);
    this.y += 5;
  }

  /** Akapit tekstu głównego z odstępem pod spodem. */
  p(content: string, parent: Struct = this.pdf.root, x = X, w = W) {
    this.para(parent, content, x, w, S.body);
    this.y += 7;
  }
}

// ---------------------------------------------------------------------------
// Tabela (jak blocks/Comparison: cienkie linie, nagłówki kolumn mono, wyróżnione wiersze)
// ---------------------------------------------------------------------------

function table(flow: Flow, t: CompareTable, widths: number[], markLabel?: string) {
  const { doc, pdf } = flow;
  const rowHeader = t.columns.length > 2;
  const hasMarks = t.rows.some((r) => r.marked);
  const PAD_Y = 6.5;
  const GAP = 14;
  const INSET = hasMarks ? 10 : 0;
  const cols = widths.map((f) => f * W);
  const colX = cols.map((_, i) => X + cols.slice(0, i).reduce((a, b) => a + b, 0));
  // szerokość tekstu w komórce: bez odstępu do następnej kolumny, w pierwszej bez wcięcia na pasek
  const textW = (i: number) => cols[i] - (i < cols.length - 1 ? GAP : 0) - (i === 0 ? INSET : 0);
  const textX = (i: number) => colX[i] + (i === 0 ? INSET : 0);
  const cellStyle = (i: number, cell: string): TextStyle =>
    i === 0 && rowHeader ? S.rowHead : cell === '—' || cell === 'bez zmian' ? { ...S.cell, color: C.muted } : S.cell;
  // znacznik „nowy” w pustej komórce brzmienia obowiązującego („—”), obok kreski — bez dodatkowego wiersza
  const showTag = (marked: boolean | undefined, i: number, cell: string) => Boolean(marked && markLabel && cell === '—' && !(i === 0 && rowHeader));
  const TAG_DX = 16;

  if (t.caption) {
    flow.para(pdf.root, typo(t.caption), X, W, S.caption);
    flow.y += 10;
  }

  const el = doc.struct('Table');
  pdf.root.add(el);

  const headH = Math.max(...t.columns.map((c, i) => measure(doc, c, textW(i), S.th))) + 2 * 6;
  const header = (tagged: boolean) => {
    const y = flow.y;
    const draw = () => t.columns.forEach((c, i) => text(doc, typo(c), textX(i), y + 6, textW(i), S.th));
    if (tagged) {
      const tr = doc.struct('TR');
      el.add(tr);
      t.columns.forEach((c, i) => tr.add(doc.struct('TH', scope('Column'), () => text(doc, typo(c), textX(i), y + 6, textW(i), S.th))));
      tr.end();
    } else {
      // powtórzony nagłówek na kolejnej stronie — dla czytnika ekranu to powtórzenie
      artifact(pdf, draw);
    }
    artifact(pdf, () => rule(pdf, X, y + headH, W, 0.75, C.ink));
    flow.y = y + headH;
  };

  flow.ensure(headH + 60);
  header(true);

  for (const row of t.rows) {
    const cells = row.cells.map(typo);
    const h = Math.max(...cells.map((c, i) => measure(doc, c, textW(i), cellStyle(i, c)))) + 2 * PAD_Y;
    if (flow.y + h > BOTTOM) {
      flow.newPage();
      header(false);
    }
    const y = flow.y;
    artifact(pdf, () => {
      if (row.marked) {
        doc.save().rect(X, y, W, h).fill(C.blue50).restore();
        doc.save().rect(X, y, 2.5, h).fill(C.blue).restore();
      }
      cells.forEach((c, i) => showTag(row.marked, i, c) && tagBox(pdf, markLabel!, textX(i) + TAG_DX, y + PAD_Y + 0.5));
      rule(pdf, X, y + h, W, 0.5, C.line2);
    });
    const tr = doc.struct('TR');
    el.add(tr);
    cells.forEach((c, i) => {
      const head = i === 0 && rowHeader;
      tr.add(
        doc.struct(head ? 'TH' : 'TD', head ? scope('Row') : {}, () => {
          text(doc, c, textX(i), y + PAD_Y, textW(i), cellStyle(i, c));
          if (showTag(row.marked, i, c)) tagText(pdf, markLabel!, textX(i) + TAG_DX, y + PAD_Y + 0.5);
        }),
      );
    });
    tr.end();
    flow.y = y + h;
  }
  el.end();
  flow.y += 14;
}

// ---------------------------------------------------------------------------
// Lista numerowana (Załącznik B i C): numer mono w lewej kolumnie
// ---------------------------------------------------------------------------

const NUM_W = 26;

function numbered<T>(flow: Flow, items: T[], paragraphs: (item: T) => { content: string; s: TextStyle }[]) {
  const { doc, pdf } = flow;
  const l = doc.struct('L');
  pdf.root.add(l);
  items.forEach((item, i) => {
    const parts = paragraphs(item);
    const w = W - NUM_W;
    // punkt do 6 wierszy nie dzieli się między strony; dłuższy — dopiero po dwóch wierszach
    const lines = parts.reduce((n, p) => n + lineCount(doc, p.content, w, p.s), 0);
    const first = measure(doc, parts[0].content, w, parts[0].s);
    flow.ensure(lines <= 6 ? parts.reduce((h, p) => h + measure(doc, p.content, w, p.s), 0) : first + 2 * lh(S.body));
    const li = doc.struct('LI');
    l.add(li);
    const y = flow.y;
    li.add(doc.struct('Lbl', {}, () => text(doc, String(i + 1).padStart(2, '0'), X, y + (lh(parts[0].s) - lh(S.num)) / 2 + 0.6, NUM_W, S.num)));
    const body = doc.struct('LBody');
    li.add(body);
    parts.forEach((p) => flow.para(body, p.content, X + NUM_W, w, p.s));
    body.end();
    li.end();
    flow.y += 8;
  });
  l.end();
}

// ---------------------------------------------------------------------------
// Części dokumentu
// ---------------------------------------------------------------------------

function cover(flow: Flow) {
  const { doc, pdf } = flow;
  flow.newPage(true);
  doc.outline.addItem('Strona tytułowa');
  const y0 = mm(24);
  artifact(pdf, () => {
    logo(pdf, X, y0, 24);
    wordmark(pdf, X + 33, y0 + 5, { ...S.wordmark, size: 15 });
  });

  let y = mm(84);
  artifact(pdf, () => doc.save().rect(X, y + 1.5, 5.5, 5.5).fill(C.blue).restore());
  flow.block(pdf.root, 'P', () => {
    y = text(doc, `${projekt.kind} · do weryfikacji prawnej`, X + 11, y, W - 11, S.eyebrow) + 14;
  });
  flow.block(pdf.root, 'H1', () => {
    y = text(doc, typo(projekt.title), X, y, W - 20, { ...S.h1, size: 34, leading: 1.08, tracking: -1.1 }) + 14;
  });
  flow.block(pdf.root, 'P', () => {
    y = text(doc, typo(projekt.subject), X, y, W - 40, { ...S.body, size: 12.5, leading: 1.5, color: C.text }) + 20;
  });
  artifact(pdf, () => tagBox(pdf, VERSION, X, y, C.blue));
  flow.block(pdf.root, 'P', () => tagText(pdf, VERSION, X, y));

  // od dołu: zastrzeżenie w ramce, nad nim metryczka
  const boxPad = 12;
  const note = marks(projekt.disclaimer);
  const noteS: TextStyle = { ...S.body, size: 9.25, leading: 1.5 };
  const boxH = measure(doc, note, W - 2 * boxPad - 3, noteS) + 2 * boxPad - 2;
  const boxY = BOTTOM - boxH;
  const meta: [string, string][] = [
    ['Wersja', `${projekt.version} · ${projekt.versionLabel}`],
    ['Data', formatDate(projekt.date)],
    ['Zakres', projekt.scope],
    ['Kontakt', contact.email],
  ];
  const colW = W / 2;
  const cellH = 30;
  const metaY = boxY - 22 - 2 * cellH - 12;
  artifact(pdf, () => rule(pdf, X, metaY, W, 1, C.ink));
  const dl = doc.struct('L');
  pdf.root.add(dl);
  meta.forEach(([k, v], i) => {
    const cx = X + (i % 2) * colW;
    const cy = metaY + 12 + Math.floor(i / 2) * cellH;
    const li = doc.struct('LI');
    dl.add(li);
    li.add(doc.struct('Lbl', {}, () => text(doc, k, cx, cy, colW - 12, S.chrome)));
    li.add(doc.struct('LBody', {}, () => text(doc, v, cx, cy + 10, colW - 12, { ...S.body, size: 10, color: C.ink })));
    li.end();
  });
  dl.end();

  artifact(pdf, () => {
    doc.save().rect(X, boxY, W, boxH).fill(C.amberBg).restore();
    doc.save().rect(X, boxY, 2.5, boxH).fill(C.amber).restore();
  });
  flow.block(pdf.root, 'P', () => {
    text(doc, note, X + boxPad + 3, boxY + boxPad - 1, W - 2 * boxPad - 3, noteS);
  });
}

function status(flow: Flow) {
  const { doc, pdf } = flow;
  flow.part('Nota o statusie dokumentu');
  statusNote.forEach((p) => flow.p(marks(p)));

  // objaśnienie oznaczeń
  flow.sub('Oznaczenia w dokumencie');
  const markW = 44;
  const l = doc.struct('L');
  pdf.root.add(l);
  legend.forEach((item) => {
    const isTag = item.mark !== '[?]';
    const h = measure(doc, typo(item.text), W - markW, S.body);
    flow.ensure(h);
    const y = flow.y;
    const li = doc.struct('LI');
    l.add(li);
    if (isTag) artifact(pdf, () => tagBox(pdf, item.mark, X, y + 2));
    li.add(
      doc.struct('Lbl', {}, () => {
        if (isTag) tagText(pdf, item.mark, X, y + 2);
        else text(doc, `==${item.mark}==`, X, y, markW, S.body);
      }),
    );
    const body = doc.struct('LBody');
    li.add(body);
    flow.para(body, typo(item.text), X + markW, W - markW, S.body);
    body.end();
    li.end();
    flow.y += 6;
  });
  l.end();
}

function billText(flow: Flow) {
  const { doc, pdf } = flow;
  flow.part('Projekt');
  const [kind, date, subject] = bill.heading;
  flow.block(pdf.root, 'P', () => {
    flow.y = text(doc, kind, X, flow.y, W, S.billKind) + 6;
  });
  flow.block(pdf.root, 'P', () => {
    flow.y = text(doc, date, X, flow.y, W, { ...S.body, align: 'center' }) + 4;
  });
  flow.block(pdf.root, 'P', () => {
    flow.y = text(doc, subject, X, flow.y, W, { ...S.body, weight: 600, color: C.ink, align: 'center' });
  });
  flow.y += 20;

  // hierarchia: artykuł od lewej krawędzi; punkt — numer wysunięty, treść wcięta;
  // cytowany (dodawany) ustęp — wcięty pod treścią punktu, z kobaltową linią jak nowy przepis na stronie
  const PKT_X = X + 16;
  const PKT_TEXT = X + 34;
  const QUOTE_X = PKT_TEXT + 10;
  for (const art of bill.articles) {
    flow.para(pdf.root, `**${art.label}** ${typo(art.text)}`, X, W, S.body);
    flow.y += 8;
    if (!art.points) continue;
    const l = doc.struct('L');
    pdf.root.add(l);
    for (const point of art.points) {
      const intro = typo(point.intro);
      flow.ensure(lh(S.body) * 3);
      const y = flow.y;
      const li = doc.struct('LI');
      l.add(li);
      li.add(doc.struct('Lbl', {}, () => text(doc, point.label, PKT_X, y, PKT_TEXT - PKT_X, S.body)));
      const body = doc.struct('LBody');
      li.add(body);
      flow.para(body, intro, PKT_TEXT, X + W - PKT_TEXT, S.body);
      flow.y += 6;
      point.units.forEach((unit, i) => {
        const open = i === 0 ? '„' : '';
        const close = i === point.units.length - 1 ? `”${point.end}` : '';
        flow.para(body, `${open}**${unit.label}** ${typo(unit.text)}${close}`, QUOTE_X, X + W - QUOTE_X, S.body, {
          type: 'Quote',
          after: (y0, y1) => artifact(pdf, () => doc.save().rect(PKT_TEXT, y0 + 2, 1.5, y1 - y0 - 4).fill(C.blue).restore()),
        });
        flow.y += 5;
      });
      body.end();
      li.end();
      flow.y += 4;
    }
    l.end();
    flow.y += 8;
  }
}

function reasons(flow: Flow) {
  flow.part('Uzasadnienie');
  justification.forEach((section, i) => {
    if (i) flow.y += 4;
    flow.sub(section.title);
    section.paragraphs.forEach((p) => flow.p(marks(p.lead ? `**${p.lead}** ${p.text}` : p.text)));
    if (section.table) {
      flow.y += 4;
      table(flow, { ...section.table, caption: undefined }, [0.24, 0.38, 0.38]);
    }
    section.after?.forEach((p) => flow.p(marks(p.text)));
  });
}

function annexA(flow: Flow) {
  flow.part(annexes.a.title, annexes.a.label);
  table(flow, consolidated, [0.47, 0.53], 'nowy');
}

function annexB(flow: Flow) {
  flow.part(annexes.b.title, annexes.b.label);
  numbered(flow, legalQuestions, (q) => [
    { content: typo(q.question), s: { ...S.body, weight: 600, color: C.ink } },
    ...q.answer.map((a) => ({ content: marks(a), s: S.body })),
  ]);
}

function annexC(flow: Flow) {
  flow.part(annexes.c.title, annexes.c.label);
  numbered(flow, references, (r) => [
    {
      // na papierze link musi być czytelny: etykieta z danych i adres bez protokołu
      content: r.link
        ? `${typo(r.text)} ${r.link.label[0].toLocaleUpperCase('pl-PL')}${r.link.label.slice(1)}: [${r.link.href.replace(/^https?:\/\//, '')}](${r.link.href}).`
        : typo(r.text),
      s: S.body,
    },
  ]);
}

// ---------------------------------------------------------------------------

export interface RenderedPdf {
  bytes: Uint8Array;
  pages: number;
}

async function compose(total: number): Promise<RenderedPdf> {
  const pdf = await createPdf({
    title: `${projekt.title} (art. 27a) — wersja ${projekt.version}, ${projekt.versionLabel}`,
    subject: projekt.subject,
    keywords: 'projekt ustawy, art. 27a, ustawa o działalności leczniczej, jawność wynagrodzeń, pseudonimizacja, dane otwarte',
    date: projekt.date,
    author: null,
  });
  const flow = new Flow(pdf, total);
  cover(flow);
  status(flow);
  billText(flow);
  reasons(flow);
  annexA(flow);
  annexB(flow);
  annexC(flow);
  return { bytes: await flow.finish(), pages: flow.page };
}

/** Składa PDF; stopka „n / liczba stron” wymaga drugiego przebiegu z policzoną liczbą stron. */
export async function renderProjekt(): Promise<RenderedPdf> {
  const draft = await compose(0);
  const final = await compose(draft.pages);
  if (final.pages !== draft.pages) throw new Error(`[pdf] projekt ustawy: liczba stron zmieniła się między przebiegami (${draft.pages} → ${final.pages})`);
  return final;
}
