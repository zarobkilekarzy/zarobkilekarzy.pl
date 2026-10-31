// Testy archiwum bez sieci, na sztucznych plikach XLSX zbudowanych w locie.
// Uruchomienie z katalogu głównego repo:  node --test tools/programy-lekowe/test/archiwum.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { BladDanych, KODY_WOJ, KOLUMNY, czytajOkres, czytajPlik, liczba } from '../format.mjs';
import { czytajZip, otworzXlsx, toXlsx } from '../xlsx.mjs';
import { doPliku, nazwaProgramu, ukryc, zlozOkres } from '../przetworz.mjs';
import { odswiezLeczonych, przebieg, przelicz } from '../archiwum.mjs';
import { TYTUL_BLAD, TYTUL_OSTRZEZENIA, zglos } from '../raport.mjs';

function zip(pliki) {
  const lokalne = [];
  const katalog = [];
  let offset = 0;
  for (const [nazwa, tresc] of Object.entries(pliki)) {
    const dane = Buffer.from(tresc);
    const spakowane = deflateRawSync(dane);
    const n = Buffer.from(nazwa);
    const naglowek = Buffer.alloc(30);
    naglowek.writeUInt32LE(0x04034b50, 0);
    naglowek.writeUInt16LE(8, 8);
    naglowek.writeUInt32LE(crc32(dane), 14);
    naglowek.writeUInt32LE(spakowane.length, 18);
    naglowek.writeUInt32LE(dane.length, 22);
    naglowek.writeUInt16LE(n.length, 26);
    lokalne.push(naglowek, n, spakowane);
    const wpis = Buffer.alloc(46);
    wpis.writeUInt32LE(0x02014b50, 0);
    wpis.writeUInt16LE(8, 10);
    wpis.writeUInt32LE(crc32(dane), 16);
    wpis.writeUInt32LE(spakowane.length, 20);
    wpis.writeUInt32LE(dane.length, 24);
    wpis.writeUInt16LE(n.length, 28);
    wpis.writeUInt32LE(offset, 42);
    katalog.push(wpis, n);
    offset += naglowek.length + n.length + spakowane.length;
  }
  const cd = Buffer.concat(katalog);
  const koniec = Buffer.alloc(22);
  koniec.writeUInt32LE(0x06054b50, 0);
  koniec.writeUInt16LE(Object.keys(pliki).length, 8);
  koniec.writeUInt16LE(Object.keys(pliki).length, 10);
  koniec.writeUInt32LE(cd.length, 12);
  koniec.writeUInt32LE(offset, 16);
  return Buffer.concat([...lokalne, cd, koniec]);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const litera = (i) => String.fromCharCode(65 + i);

function xlsx(wiersze, { arkusz = 'Dane', utworzono = '2026-10-15T11:31:46Z' } = {}) {
  const napisy = [];
  const xml = wiersze
    .map((w, r) => {
      const komorki = w
        .map((v, i) => {
          if (v === null) return '';
          napisy.push(v);
          return `<c r="${litera(i)}${r + 1}" t="s"><v>${napisy.length - 1}</v></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${komorki}</row>`;
    })
    .join('');
  return zip({
    'xl/workbook.xml': `<workbook><sheets><sheet name="${arkusz}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<sst>${napisy.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>${xml}</sheetData></worksheet>`,
    'docProps/core.xml': `<cp:coreProperties><dc:creator>nie czytać</dc:creator><dcterms:created xsi:type="x">${utworzono}</dcterms:created></cp:coreProperties>`,
  });
}

const SZPITAL = 'SZPITAL TESTOWY';
function wiersz({ okres = '2026-09', woj = '01', kod = '90001', nazwa = 'LECZENIE TESTOWE', pilny = false, podmiot = SZPITAL, kodPodmiotu = 'P1', czeka = '0', przyjeci = '0', dni = '0' } = {}) {
  const [r, m] = okres.split('-');
  return [r, m, woj, 'WOJ', kod, nazwa, pilny ? 'PRZYPADEK PILNY' : 'PRZYPADEK STABILNY', kodPodmiotu, podmiot, 'K1', 'PORADNIA', 'MIASTO;UL. TAJNA 1;+48 000', czeka, przyjeci, dni];
}
function plik(woj, { okres = '2026-09', wiersze = [wiersz({ woj, okres, kodPodmiotu: `P${woj}`, czeka: '10', przyjeci: '5', dni: '20' })], kolumny = KOLUMNY } = {}) {
  const [r, m] = okres.split('-');
  return xlsx([[`Dane statystyczne są prezentowane za okres  ${m}-${r}  .`], kolumny, ...wiersze]);
}
const komplet = (opcje = () => ({})) => KODY_WOJ.map((woj) => ({ woj, buf: plik(woj, opcje(woj)) }));

function katalogi() {
  const baza = mkdtempSync(join(tmpdir(), 'archiwum-'));
  return { raw: join(baza, 'raw'), dane: join(baza, 'dane'), baza };
}
const TERAZ = new Date('2026-10-17T06:00:00Z');

test('xlsx: sprawdza sygnaturę, czyta napisy, encje i datę, bez autora', () => {
  const buf = xlsx([['A & B', null, '<c>']]);
  assert.equal(toXlsx(buf), true);
  assert.equal(toXlsx(Buffer.from('<html>blokada</html>')), false);
  const x = otworzXlsx(buf);
  assert.deepEqual([...x.wiersze('Dane')][0], ['A & B', null, '<c>']);
  assert.equal(x.utworzono, '2026-10-15T11:31:46Z');
  assert.equal(JSON.stringify(x).includes('nie czytać'), false);
  assert.throws(() => czytajZip(Buffer.from('PK nie zip')));
});

test('liczba: twarda spacja jest pułapką NFZ, a tekst to błąd', () => {
  assert.equal(liczba('1 337', 'x'), 1337);
  assert.equal(liczba('', 'x'), null);
  assert.throws(() => liczba('12a', 'x'), BladDanych);
});

test('czytajPlik: wiersze programów bez telefonu i ulicy', () => {
  const buf = plik('01', { wiersze: [wiersz({ czeka: '1 337', przyjeci: '2', dni: '30', pilny: true }), wiersz({ kod: '10000', czeka: '999' })] });
  assert.equal(czytajOkres(buf), '2026-09');
  const p = czytajPlik(buf, '01');
  assert.equal(p.wierszy, 2);
  assert.equal(p.programy.length, 1);
  assert.deepEqual([p.programy[0].czeka, p.programy[0].pilny, p.programy[0].miasto], [1337, true, 'MIASTO']);
  assert.equal(JSON.stringify(p).includes('+48'), false);
  assert.equal(JSON.stringify(p).includes('TAJNA'), false);
});

test('czytajPlik: odstępstwa od formatu to BladDanych', () => {
  assert.throws(() => czytajPlik(plik('01', { kolumny: [...KOLUMNY.slice(0, 14), 'Inna kolumna'] }), '01'), /zmienione kolumny/);
  assert.throws(() => czytajPlik(plik('01'), '02'), /innego oddziału/);
  assert.throws(() => czytajPlik(plik('01', { wiersze: [wiersz({ okres: '2026-08' })] }), '01'), /ma okres/);
  assert.throws(() => czytajPlik(plik('01', { wiersze: [wiersz({ czeka: 'brak' })] }), '01'), /to nie jest liczba/);
  assert.throws(() => czytajPlik(xlsx([['za okres  09-2026  .']], { arkusz: 'Inny' }), '01'), /brak arkusza/);
  assert.throws(() => czytajPlik(Buffer.from('PK nie zip'), '01'), /nie można otworzyć/);
});

test('ukryc: nazwiska i formy osobowe tak, instytucje i patroni nie', () => {
  for (const n of ['JAN NOWAK', 'ANNA KOWALSKA SPECJALISTYCZNA PRAKTYKA LEKARSKA', 'OKULISTYKA S.C. JAN NOWAK, ANNA NOWAK', 'NOWAK KOWALSKI SPÓŁKA JAWNA', 'CENTRUM NOWAK SPÓŁKA KOMANDYTOWA', 'PORADNIA DR N. MED. JAN NOWAK', '"FIRMA" JAN NOWAK, ANNA NOWAK SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', 'ŁUKASZ NOWAK SP. Z O.O.']) assert.equal(ukryc(n), true, n);
  for (const n of ['SZPITAL IM. DR. JANA NOWAKA W TESTOWIE', 'CENTRUM MEDYCZNE TEST SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', 'KLINIKA OKO SP. Z O.O. SPÓŁKA JAWNA', 'BALMED', 'WOJEWÓDZKI OŚRODEK TESTOWY', 'SZPITAL IM. JAN KOWALSKI W TESTOWIE', 'SZPITAL JAN PAWEŁ II SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ', 'SZPITAL IM. JANA NOWAKA SP. Z O.O.']) assert.equal(ukryc(n), false, n);
});

test('nazwaProgramu: te same programy z obu baz', () => {
  assert.equal(nazwaProgramu('LEKI W PROGRAMIE LEKOWYM - LECZENIE CHORYCH NA STWARDNIENIE ROZSIANE'), nazwaProgramu('LECZENIE CHORYCH STWARDNIENIE ROZSIANE'));
  assert.equal(nazwaProgramu('TLI - LECZENIE X - Y'), 'LECZENIE X-Y');
});

const odczyt = (woj, wiersze, okres = '2026-09') => ({ woj, sha256: `h${woj}`, ...czytajPlik(plik(woj, { okres, wiersze }), woj) });

test('zlozOkres: sumy, średnia ważona przyjętymi i ukrywanie bez utraty liczb', () => {
  const { dane } = zlozOkres(
    [
      odczyt('01', [wiersz({ czeka: '10', przyjeci: '1', dni: '100' }), wiersz({ czeka: '10', przyjeci: '3', dni: '20', pilny: true }), wiersz({ dni: '875' })]),
      odczyt('02', [wiersz({ woj: '02', podmiot: 'JAN NOWAK', kodPodmiotu: 'P2', czeka: '5', przyjeci: '1', dni: '40' })]),
    ],
    { wersja: 'v1' },
  );
  assert.deepEqual([dane.sumy.czeka, dane.sumy.pilni, dane.sumy.przyjeci], [25, 10, 5]);
  assert.equal(dane.sumy.sredniaDni, 40);
  assert.equal(dane.sumy.podmiotowUkrytych, 1);
  assert.equal(JSON.stringify(dane).includes('NOWAK'), false);
  assert.equal(dane.podmioty.find((p) => p.ukryty).kod, 'ukryte-02');
  assert.equal(dane.wiersze.reduce((s, w) => s + w[4], 0), 25);
  assert.deepEqual(JSON.parse(doPliku(dane)), dane);
});

test('zlozOkres: flaga skali wyłącza cały podmiot z sum bez flag', () => {
  const leczeni = { rok: 2025, programy: { 'LECZENIE TESTOWE': 40 } };
  const { dane, ostrzezenia } = zlozOkres(
    [
      odczyt('01', [wiersz({ czeka: '30', przyjeci: '2', dni: '10' }), wiersz({ kod: '90002', nazwa: 'INNY', czeka: '100' })]),
      odczyt('02', [wiersz({ woj: '02', kodPodmiotu: 'P2', czeka: '19', przyjeci: '2', dni: '20' })]),
    ],
    { wersja: 'v1', leczeni },
  );
  assert.equal(dane.flagi.length, 1);
  assert.deepEqual([dane.flagi[0].podmiot, dane.flagi[0].czeka, dane.flagi[0].leczeni], ['P1', 30, 40]);
  assert.deepEqual([dane.sumy.czeka, dane.sumy.czekaBezFlag, dane.sumy.sredniaDniBezFlag], [149, 19, 20]);
  assert.equal(ostrzezenia[0].typ, 'flagi');
  assert.equal(JSON.stringify(ostrzezenia).includes(SZPITAL), false);
});

test('zlozOkres: różne okresy i nagłe spadki to błąd, zmiany to ostrzeżenia', () => {
  assert.throws(() => zlozOkres([odczyt('01', [wiersz()]), odczyt('02', [wiersz({ woj: '02', okres: '2026-10' })], '2026-10')], {}), /różnych okresów/);
  const pierwszy = zlozOkres([odczyt('01', [wiersz({ czeka: '100' }), wiersz({ kod: '90002', nazwa: 'STARY', pilny: true })])], { wersja: 'v1' }).dane;
  const bezWierszy = { ...pierwszy, zrodlo: { ...pierwszy.zrodlo, wierszyWszystkich: 100 } };
  assert.throws(() => zlozOkres([odczyt('01', [wiersz({ okres: '2026-10' })], '2026-10')], { poprzedni: bezWierszy }), /spadek liczby wierszy/);
  const { ostrzezenia } = zlozOkres([odczyt('01', [wiersz({ okres: '2026-11', czeka: '10' }), wiersz({ okres: '2026-11', kod: '90003', nazwa: 'NOWY', pilny: true })], '2026-11')], { poprzedni: pierwszy });
  assert.deepEqual(ostrzezenia.map((o) => o.typ).sort(), ['nowe-programy', 'pominiety-miesiac', 'skok', 'zniknely-programy']);
});

test('przebieg: pierwszy zapis, potem bez zmian, potem korekta tylko zmienionego pliku', async () => {
  const { raw, dane, baza } = katalogi();
  const r1 = await przebieg({ raw, dane, pobrane: komplet(), teraz: TERAZ });
  assert.equal(r1.status, 'nowe-dane');
  assert.deepEqual([r1.zapisanoSurowe, r1.zapisanoDane], [true, true]);
  assert.equal(readdirSync(join(raw, '2026-09', '2026-10-17')).length, 16);
  assert.equal(JSON.parse(readFileSync(join(dane, 'indeks.json'), 'utf8'))[0].czeka, 160);

  const r2 = await przebieg({ raw, dane, pobrane: komplet(), teraz: new Date('2026-11-03T06:00:00Z') });
  assert.equal(r2.status, 'bez-zmian');
  assert.equal(r2.zapisanoSurowe, false);

  const zmienione = komplet((woj) => (woj === '05' ? { wiersze: [wiersz({ woj, czeka: '11', przyjeci: '5', dni: '20' })] } : {}));
  const r3 = await przebieg({ raw, dane, pobrane: zmienione, teraz: new Date('2026-11-03T06:00:00Z') });
  assert.equal(r3.status, 'nowe-dane');
  assert.ok(r3.ostrzezenia.some((o) => o.typ === 'korekta'));
  assert.deepEqual(readdirSync(join(raw, '2026-09', '2026-11-03')), ['woj-05.xlsx']);
  const manifest = JSON.parse(readFileSync(join(raw, 'manifest.json'), 'utf8'));
  assert.equal(manifest.wersje.length, 2);
  assert.equal(manifest.wersje[1].pliki['01'].sciezka, '2026-09/2026-10-17/woj-01.xlsx');
  rmSync(baza, { recursive: true });
});

test('przebieg: zmieniony format zachowuje surowe pliki, ale nie publikuje', async () => {
  const { raw, dane, baza } = katalogi();
  const zle = komplet(() => ({ kolumny: [...KOLUMNY.slice(0, 14), 'Nowa kolumna'] }));
  const r = await przebieg({ raw, dane, pobrane: zle, teraz: TERAZ });
  assert.equal(r.status, 'blad');
  assert.match(r.bledy[0], /zmienione kolumny/);
  assert.equal(r.zapisanoSurowe, true);
  assert.equal(r.zapisanoDane, false);
  assert.equal(existsSync(join(raw, '2026-09', '2026-10-17', 'woj-16.xlsx')), true);
  assert.equal(existsSync(join(dane, '2026-09.json')), false);
  rmSync(baza, { recursive: true });
});

test('przebieg: brak pliku zapisuje resztę jako niekompletną, a następny przebieg domyka wersję', async () => {
  const { raw, dane, baza } = katalogi();
  const pobrane = komplet().map((p) => (p.woj === '07' ? { woj: '07', blad: 'odpowiedź nie jest plikiem XLSX' } : p));
  const r = await przebieg({ raw, dane, pobrane, teraz: TERAZ });
  assert.equal(r.status, 'blad');
  assert.match(r.bledy[0], /woj\. 07/);
  assert.equal(JSON.parse(readFileSync(join(raw, 'manifest.json'), 'utf8')).wersje[0].kompletna, false);
  assert.equal(existsSync(join(dane, '2026-09.json')), false);

  const r2 = await przebieg({ raw, dane, pobrane: komplet(), teraz: new Date('2026-10-18T06:00:00Z') });
  assert.equal(r2.status, 'nowe-dane');
  const m = JSON.parse(readFileSync(join(raw, 'manifest.json'), 'utf8'));
  assert.equal(m.wersje[1].kompletna, true);
  assert.equal(m.wersje[1].pliki['01'].sciezka, '2026-09/2026-10-17/woj-01.xlsx');
  assert.equal(m.wersje[1].pliki['07'].sciezka, '2026-09/2026-10-18/woj-07.xlsx');
  rmSync(baza, { recursive: true });
});

test('przebieg: NFZ w trakcie podmiany plików daje błąd bez publikacji', async () => {
  const { raw, dane, baza } = katalogi();
  const pobrane = komplet((woj) => (woj < '09' ? { okres: '2026-10' } : {}));
  const r = await przebieg({ raw, dane, pobrane, teraz: TERAZ });
  assert.equal(r.status, 'blad');
  assert.match(r.bledy[0], /różnych okresów/);
  const wpis = JSON.parse(readFileSync(join(raw, 'manifest.json'), 'utf8')).wersje[0];
  assert.deepEqual([wpis.okres, wpis.kompletna], [null, false]);
  rmSync(baza, { recursive: true });
});

test('przebieg: suchy nic nie zapisuje, a długi brak nowego okresu ostrzega', async () => {
  const { raw, dane, baza } = katalogi();
  const s = await przebieg({ dane, sucho: true, pobrane: komplet(), teraz: TERAZ });
  assert.equal(s.status, 'nowe-dane');
  assert.equal(s.podsumowanie.sumy.czeka, 160);
  assert.equal(existsSync(dane), false);

  await przebieg({ raw, dane, pobrane: komplet(), teraz: TERAZ });
  const r = await przebieg({ raw, dane, pobrane: komplet(), teraz: new Date('2026-12-05T06:00:00Z') });
  assert.equal(r.status, 'bez-zmian');
  assert.equal(r.ostrzezenia[0].typ, 'brak-nowego-okresu');
  rmSync(baza, { recursive: true });
});

test('przelicz: wynik z surowych plików jest powtarzalny bajt w bajt', async () => {
  const { raw, dane, baza } = katalogi();
  await przebieg({ raw, dane, pobrane: komplet(), teraz: TERAZ });
  const przed = readFileSync(join(dane, '2026-09.json'));
  przelicz({ raw, dane });
  assert.deepEqual(readFileSync(join(dane, '2026-09.json')), przed);
  rmSync(baza, { recursive: true });
});

test('leczeni: ostatni rok przed okresem i pobranie tylko nowszego rocznika', async () => {
  const { raw, dane, baza } = katalogi();
  const odpowiedz = (x) => ({ ok: true, status: 200, json: async () => x });
  const zapytania = [];
  const fetchFn = async (url) => {
    zapytania.push(url);
    if (url.includes('available-periods')) return odpowiedz({ 'end-date': '2025-12-31T00:00:00' });
    return odpowiedz({ data: { data: [{ 'drug-program-name': 'LEKI W PROGRAMIE LEKOWYM - LECZENIE TESTOWE', 'number-of-patients': 40 }] }, links: {} });
  };
  assert.equal(await odswiezLeczonych(dane, { fetchFn, przerwa: 0 }), true);
  assert.equal(await odswiezLeczonych(dane, { fetchFn, przerwa: 0 }), false);
  assert.equal(zapytania.filter((u) => u.includes('drug-costs')).length, 1);
  writeFileSync(join(dane, 'leczeni-2026.json'), JSON.stringify({ rok: 2026, programy: {} }));
  const pobrane = komplet((woj) => (woj === '01' ? { wiersze: [wiersz({ czeka: '30' })] } : {}));
  const r = await przebieg({ raw, dane, pobrane, teraz: TERAZ });
  assert.equal(r.podsumowanie.flag, 1);
  rmSync(baza, { recursive: true });
});

function atrapaGitHub(otwarte = []) {
  const wywolania = [];
  const fetchFn = async (url, o) => {
    wywolania.push([o.method, url.replace('https://api.github.com/repos/o/r', ''), o.body ? JSON.parse(o.body) : null]);
    return { ok: true, status: 200, json: async () => (o.method === 'GET' ? otwarte : {}) };
  };
  return { fetchFn, wywolania };
}
const GH = { repo: 'o/r', token: 't', runId: '1' };

test('raport: błąd otwiera zgłoszenie, a następny dobry przebieg je zamyka', async () => {
  const a = atrapaGitHub();
  await zglos({ status: 'blad', bledy: ['woj. 07: HTTP 403'], ostrzezenia: [] }, { ...GH, fetchFn: a.fetchFn });
  const [metoda, sciezka, tresc] = a.wywolania.at(-1);
  assert.deepEqual([metoda, sciezka, tresc.title], ['POST', '/issues', TYTUL_BLAD]);
  assert.match(tresc.body, /HTTP 403/);

  const b = atrapaGitHub([{ number: 7, title: TYTUL_BLAD }]);
  await zglos({ status: 'bez-zmian', bledy: [], ostrzezenia: [] }, { ...GH, fetchFn: b.fetchFn });
  assert.deepEqual(b.wywolania.at(-1).slice(0, 2), ['PATCH', '/issues/7']);
});

test('raport: ostrzeżenia dopisują się do otwartego zgłoszenia i zostają otwarte', async () => {
  const a = atrapaGitHub([{ number: 9, title: TYTUL_OSTRZEZENIA }]);
  await zglos({ status: 'nowe-dane', bledy: [], ostrzezenia: [{ typ: 'skok', opis: 'Skok' }] }, { ...GH, fetchFn: a.fetchFn });
  assert.deepEqual(a.wywolania.at(-1).slice(0, 2), ['POST', '/issues/9/comments']);
  assert.equal(a.wywolania.some(([m]) => m === 'PATCH'), false);
});

test('dane września 2026: suma z wierszy i wartości referencyjne', { skip: !existsSync(new URL('../../../src/data/programy-lekowe/2026-09.json', import.meta.url)) }, () => {
  const d = JSON.parse(readFileSync(new URL('../../../src/data/programy-lekowe/2026-09.json', import.meta.url), 'utf8'));
  assert.deepEqual([d.sumy.czeka, d.sumy.pilni, d.sumy.przyjeci, d.sumy.programow], [11935, 2831, 4831, 141]);
  assert.deepEqual([d.sumy.czekaBezFlag, d.sumy.sredniaDni, d.sumy.sredniaDniBezFlag], [9137, 39.8, 33.2]);
  assert.equal(d.wiersze.reduce((s, w) => s + w[4], 0), d.sumy.czeka);
  assert.equal(d.wiersze.reduce((s, w) => s + w[5], 0), d.sumy.przyjeci);
  assert.equal(JSON.stringify(d).includes('+48'), false);
});
