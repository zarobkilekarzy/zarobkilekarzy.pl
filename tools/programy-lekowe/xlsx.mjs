// Odczyt XLSX bez bibliotek: ZIP przez node:zlib, XML wyrażeniami regularnymi. Pliki NFZ są proste
// (jeden arkusz, bez formuł), a przebieg CI nie instaluje przez to zależności projektu.
// Metadanych autora z docProps/core.xml świadomie nie czytamy: bierzemy tylko datę utworzenia.
import { inflateRawSync } from 'node:zlib';

const SYGN_KONIEC = 0x06054b50;
const SYGN_KATALOG = 0x02014b50;
const SYGN_LOKALNY = 0x04034b50;

export const toXlsx = (buf) => buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;

/** Mapa „ścieżka w ZIP → zawartość”. Rozpakowuje dopiero przy odczycie, bo większość wpisów jest niepotrzebna. */
export function czytajZip(buf) {
  let koniec = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === SYGN_KONIEC) {
      koniec = i;
      break;
    }
  }
  if (koniec < 0) throw new Error('ZIP: brak końca katalogu');
  const wpisy = buf.readUInt16LE(koniec + 10);
  let p = buf.readUInt32LE(koniec + 16);
  const pliki = new Map();
  for (let n = 0; n < wpisy; n++) {
    if (buf.readUInt32LE(p) !== SYGN_KATALOG) throw new Error('ZIP: uszkodzony katalog');
    const metoda = buf.readUInt16LE(p + 10);
    const rozmiar = buf.readUInt32LE(p + 20);
    const dlNazwy = buf.readUInt16LE(p + 28);
    const dlExtra = buf.readUInt16LE(p + 30);
    const dlKomentarza = buf.readUInt16LE(p + 32);
    const lokalny = buf.readUInt32LE(p + 42);
    const nazwa = buf.toString('utf8', p + 46, p + 46 + dlNazwy);
    pliki.set(nazwa, () => {
      if (buf.readUInt32LE(lokalny) !== SYGN_LOKALNY) throw new Error(`ZIP: uszkodzony wpis ${nazwa}`);
      const start = lokalny + 30 + buf.readUInt16LE(lokalny + 26) + buf.readUInt16LE(lokalny + 28);
      const dane = buf.subarray(start, start + rozmiar);
      if (metoda === 0) return dane;
      if (metoda === 8) return inflateRawSync(dane);
      throw new Error(`ZIP: nieznana metoda ${metoda} w ${nazwa}`);
    });
    p += 46 + dlNazwy + dlExtra + dlKomentarza;
  }
  return pliki;
}

const ENCJE = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const odkoduj = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
    if (e[0] !== '#') return ENCJE[e.toLowerCase()];
    return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
  });

const atrybut = (tag, nazwa) => tag.match(new RegExp(`(?:^|\\s)${nazwa}="([^"]*)"`))?.[1];
const tekst = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((m) => odkoduj(m[1])).join('');

function kolumna(ref) {
  let n = 0;
  for (const c of ref.match(/^[A-Z]+/)[0]) n = n * 26 + c.charCodeAt(0) - 64;
  return n - 1;
}

/** Otwiera skoroszyt: nazwy arkuszy, wiersze arkusza (generator tablic) i data utworzenia pliku. */
export function otworzXlsx(buf) {
  const zip = czytajZip(buf);
  const utf8 = (sciezka) => {
    const plik = zip.get(sciezka);
    if (!plik) throw new Error(`XLSX: brak ${sciezka}`);
    return plik().toString('utf8');
  };

  const napisy = zip.has('xl/sharedStrings.xml')
    ? [...utf8('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => (m[1] ? tekst(m[1]) : ''))
    : [];
  const rel = new Map(
    [...utf8('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\s([^>]*?)\/?>/g)].map((m) => [atrybut(m[1], 'Id'), atrybut(m[1], 'Target')]),
  );
  const arkusze = new Map(
    [...utf8('xl/workbook.xml').matchAll(/<sheet\s([^>]*?)\/?>/g)].map((m) => [odkoduj(atrybut(m[1], 'name')), rel.get(atrybut(m[1], 'r:id'))]),
  );

  function* wiersze(nazwa) {
    const cel = arkusze.get(nazwa);
    if (!cel) throw new Error(`XLSX: brak arkusza ${nazwa}`);
    const xml = utf8(cel.startsWith('/') ? cel.slice(1) : `xl/${cel}`);
    for (const r of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      if (!r[1]) continue;
      const wiersz = [];
      for (const c of r[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const typ = atrybut(c[1], 't');
        const v = c[2]?.match(/<v>([^<]*)<\/v>/)?.[1];
        let wartosc = null;
        if (typ === 'inlineStr') wartosc = tekst(c[2] ?? '');
        else if (v !== undefined) wartosc = typ === 's' ? (napisy[Number(v)] ?? null) : odkoduj(v);
        wiersz[kolumna(atrybut(c[1], 'r'))] = wartosc;
      }
      yield Array.from(wiersz, (x) => x ?? null);
    }
  }

  const rdzen = zip.has('docProps/core.xml') ? utf8('docProps/core.xml') : '';
  return {
    arkusze: [...arkusze.keys()],
    wiersze,
    utworzono: rdzen.match(/<dcterms:created[^>]*>([^<]+)</)?.[1] ?? null,
  };
}
