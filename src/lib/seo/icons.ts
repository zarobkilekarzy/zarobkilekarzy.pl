/**
 * Ikony serwisu (favicon.ico, apple-touch-icon, ikony manifestu) rastrowane w buildzie z SVG — zero binariów
 * w repo. Źródło: public/favicon.svg (pełny kadr). Ikona „maskable” ma własne źródło obok (icon-maskable.svg):
 * szczyt zapisu EKG wychodzi poza jej strefę bezpieczną (koło 80% szerokości), więc tam znak jest pomniejszony
 * do 80%, a linia nadal biegnie od krawędzi do krawędzi.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCES = {
  favicon: 'public/favicon.svg',
  maskable: 'src/lib/seo/icon-maskable.svg',
} as const;

type IconSource = keyof typeof SOURCES;

export const ICONS = {
  'apple-touch-icon': { size: 180, source: 'favicon' },
  'icon-192': { size: 192, source: 'favicon' },
  'icon-512': { size: 512, source: 'favicon' },
  'icon-maskable-512': { size: 512, source: 'maskable' },
} as const satisfies Record<string, { size: number; source: IconSource }>;

export type IconName = keyof typeof ICONS;

export async function iconPng(size: number, source: IconSource = 'favicon'): Promise<Buffer> {
  return sharp(await readFile(path.join(process.cwd(), SOURCES[source])), { density: 72 * Math.ceil(size / 24) })
    .resize(size, size)
    .png()
    .toBuffer();
}

/**
 * favicon.ico z obrazkami PNG w środku (format ICO dopuszcza PNG od Windows Vista; czytają go wszystkie
 * przeglądarki). Nagłówek ICONDIR + wpis ICONDIRENTRY na każdy rozmiar, potem dane PNG.
 */
export async function faviconIco(sizes: number[] = [16, 32, 48]): Promise<Buffer> {
  const images = await Promise.all(sizes.map((size) => iconPng(size)));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // zarezerwowane
  header.writeUInt16LE(1, 2); // typ: ikona
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map((png, i) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0); // szerokość (0 = 256)
    entry.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1); // wysokość
    entry.writeUInt8(0, 2); // liczba kolorów palety
    entry.writeUInt8(0, 3); // zarezerwowane
    entry.writeUInt16LE(1, 4); // płaszczyzny
    entry.writeUInt16LE(32, 6); // bity na piksel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images]);
}
