// Generuje obrazek Open Graph (1200×630) do udostępnień w social mediach.
// Uruchom: npm run og  (wymaga devDependency `sharp`).
// Źródłem prawdy jest poniższy SVG; wynik trafia do public/og-image.png.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const out = resolve(outDir, 'og-image.png');

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f6f9fc"/>
  <rect width="1200" height="12" fill="#0f4c81"/>
  <rect x="0" y="618" width="1200" height="12" fill="#b3261e"/>

  <!-- wordmark -->
  <g transform="translate(80,82)">
    <rect width="46" height="46" rx="11" fill="#0f4c81"/>
    <path d="M9 23 H17 L21 12 L27 34 L31 23 H37" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="62" y="31" font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="700" fill="#0f4c81">zarobkilekarzy.pl</text>
  </g>

  <!-- akcent: stan obecny -->
  <text x="1120" y="96" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="2" fill="#51637a">STAN OBECNY</text>
  <text x="1120" y="150" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="700" fill="#b3261e">0</text>
  <text x="1120" y="182" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="21" fill="#51637a">publicznych rejestrów wynagrodzeń</text>

  <!-- nagłówek -->
  <text x="80" y="322" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="700" fill="#14233a">Publiczne pieniądze,</text>
  <text x="80" y="416" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="700" fill="#14233a">niejawne zarobki.</text>

  <!-- podtytuł -->
  <text x="82" y="500" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="#51637a">Jawny rejestr wynagrodzeń lekarzy ze środków publicznych.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log('OG image →', out);
