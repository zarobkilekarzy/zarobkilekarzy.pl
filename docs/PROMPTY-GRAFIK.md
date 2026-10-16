# Prompty dla agenta generującego grafiki — strona główna

Status (15.10.2026): wszystkie 7 zdjęć wygenerowanych i wpiętych. Strona działa na Astro. Oryginały leżą w `src/assets/img/`, a Astro w czasie budowania kompresuje je do WebP w kilku szerokościach (komponent `src/components/ui/Photo.astro`).

**Podmiana zdjęcia:** nadpisz plik w `src/assets/img/` pod tą samą nazwą i uruchom `npm run build`. Punkt kadrowania (`position`) ustawia się przy użyciu komponentu: w sekcji (np. `Hero.astro`) albo w `src/data/home.ts` dla paska tematów.

Dostarczone pliki mają poziome proporcje (5:4 / 3:2), więc strona kadruje je przez `object-fit: cover`. Przy ponownym generowaniu najlepiej trzymać się proporcji z tabeli: wtedy kadr nic nie ucina. Generuj w rozdzielczości co najmniej takiej jak w tabeli. Astro nie powiększa obrazów, więc za mały plik będzie miękki na ekranach Retina.

## Wspólny styl (dopisz do każdego promptu, jeśli generator nie trzyma kontekstu)

> Black-and-white documentary photograph, natural window light, soft shadows, medium contrast, subtle 35mm film grain, calm and neutral mood, clean minimal composition with negative space, realistic, editorial style for a Polish public-health information portal. No text, no logos, no brand names, no identifiable faces.

**Negatywny prompt:** color, sepia, HDR, oversaturated, stock-photo smile, posed models, readable text, watermark, logo, distorted hands, extra fingers, blurry faces, cartoon, illustration, 3D render.

Uwagi:
- Zdjęcia są i tak desaturowane w CSS (`grayscale(1)`), ale generuj je od razu w czerni i bieli: tonacja będzie spójna.
- Bez rozpoznawalnych twarzy. Serwis opisuje mechanizmy, a nie osoby, i zdjęcia mają to oddawać.
- Wnętrza mają wyglądać jak polska publiczna służba zdrowia: zwykłe, czyste, trochę zużyte, bez luksusu prywatnej kliniki.

---

| # | Plik | Proporcje | Rozmiar | Sekcja |
|---|------|-----------|---------|--------|
| 1 | `hero-pokoj-lekarski.jpg` | 5:6 | 1600×1920 | Hero |
| 2 | `monitoring-teczki.jpg` | 16:10 | 1600×1000 | Nowe i zaktualizowane (wyróżniony) = okładka przeglądarki monitoringu |
| 3 | `temat-kontrakty.jpg` | 3:4 | 1200×1600 | Pasek „Wiele perspektyw” · 01 |
| 4 | `temat-dyzury.jpg` | 3:4 | 1200×1600 | Pasek „Wiele perspektyw” · 02 |
| 5 | `temat-kolejki.jpg` | 3:4 | 1200×1600 | Pasek „Wiele perspektyw” · 03 |
| 6 | `temat-ksztalcenie.jpg` | 3:4 | 1200×1600 | Pasek „Wiele perspektyw” · 04 |
| 7 | `pacjent-konsultacja.jpg` | 4:5 | 1600×2000 | Dla pacjenta |

---

### 1. `hero-pokoj-lekarski.jpg` (5:6 pionowo, min. 1600×1920) — wersja 2

> Vertical portrait-format (5:6) black-and-white documentary photograph of a doctors' duty room in a Polish public hospital, early morning. In the left half of the frame: a black office chair with a white medical coat draped over its back, next to a plain grey desk; on the desk a stethoscope, a short stack of paper patient charts with a ballpoint pen on top, and a closed laptop. Behind, a pale wall with a cork board holding pinned duty rosters (illegible). On the right, a tall window with venetian blinds letting in soft high-key daylight that falls across the desk; the lower-right quarter of the frame is a calm, evenly lit wall or blind surface with no objects. Eye-level, 35mm lens, shallow depth of field, muted grey tones, fine film grain, generous negative space in the upper third. No people, no readable text, no logos. Output at least 1600×1920 px.

*Kompozycja:* prawą dolną ćwiartkę zostaw pustą, bo tam leży niebieski badge „3 746 rozliczeń w bazie”. Obecny plik (1168×784, 3:2) jest kadrowany do 5:6 i ma za małą rozdzielczość na ekrany Retina. Ta wersja promptu wymusza pion i wyższą rozdzielczość.

### 2. `monitoring-teczki.jpg` (16:10, wygenerowano 3:2 w Grok Imagine)
Overhead flat-lay photograph of dozens of identical plain manila document folders arranged in a precise grid on a large grey office table, filling the frame edge to edge. Some folders lie open with thin stacks of printed tables inside, some are closed and tied with string, a few are empty. Soft diffused daylight from a window on the left. Black and white documentary photography, fine film grain, muted mid-tones, 35mm lens shot from directly above, everything in sharp focus.

*Kompozycja:* zdjęcie jest też okładką w obrazku OG (kadr ok. 470×510 ze środka), więc wzór musi wypełniać cały kadr. Poprzednia wersja (`nowe-archiwum-szpitala.jpg`, archiwum z regałami) nie jest już używana.

### 3. `temat-kontrakty.jpg` (3:4, 1200×1600)
Black-and-white close-up photograph of a doctor's hands signing a multi-page contract on a wooden desk; the cuff of a white coat visible, a stethoscope lying beside the papers, a calculator and a fountain pen. Directional window light from the left, crisp detail on skin and paper texture, shallow depth of field, fine film grain. Face not visible, text on documents illegible, no logos.

*Kompozycja:* dolna 1/3 kadru będzie przykryta ciemnym gradientem z podpisem, więc główny motyw umieść w górnych 2/3.

### 4. `temat-dyzury.jpg` (3:4, 1200×1600)
Black-and-white photograph of a long hospital corridor at night during an on-call shift: fluorescent ceiling lights reflecting on polished linoleum, a single doctor in scrubs walking away from the camera, slightly motion-blurred, an empty wheelchair parked by the wall, rows of closed patient-room doors. Quiet, tired atmosphere, deep blacks, fine grain. No identifiable face, no readable text, no logos.

### 5. `temat-kolejki.jpg` (3:4, 1200×1600)
Black-and-white documentary photograph of a public outpatient clinic waiting room in Poland: a row of connected plastic chairs, several patients of different ages seated and waiting, seen from behind or in soft focus, a queue-ticket dispenser on the wall with unreadable numbers, daylight from large windows. Respectful, calm, slightly melancholic. No identifiable faces, no readable text, no logos.

### 6. `temat-ksztalcenie.jpg` (3:4, 1200×1600)
Black-and-white photograph of medical students in a university lecture hall, shot from the back rows looking down the tiered seating toward a lecturer and a large projection screen showing an abstract anatomical line drawing (no text). Students with laptops and notebooks, a few in white coats. Soft overhead light, strong rhythm of rows, fine grain. No identifiable faces, no logos.

### 7. `pacjent-konsultacja.jpg` (4:5, 1600×2000)
Black-and-white photograph of a consultation in a doctor's office: across a plain desk, a doctor (only hands and white-coat sleeve visible) points at a printed medical document while explaining it to a middle-aged patient whose hands rest on the desk holding reading glasses. Calm, respectful, trustworthy atmosphere, soft natural window light, shallow depth of field, focus on the hands and the paper, fine film grain. No identifiable faces, illegible text, no logos.

*Kompozycja:* dolna prawa część kadru zostanie przykryta niebieskim badge'em „0 zł”, więc dłonie i dokument umieść wyżej, w środkowej części.

---

# Strony działów

- **/dane/** i **/analizy/** (układ „Katalog”) nie mają zdjęć działów. /dane/ używa tylko okładki przeglądarki monitoringu (`monitoring-teczki.jpg`, patrz #2).
- **/mechanizmy/** (układ „Przewodnik”) ma własne pionowe zdjęcia działów (15.10.2026), osobne od pasków tematów na stronie głównej. Kadr na stronie to 5:6, więc generuj w 3:4 albo 4:5. Prawy dolny róg zasłania plakietka z liczbą (oprócz działu „Dostęp do zawodu”). Kadr (`position`) zmienia się w `src/data/mechanizmy.ts`.

Wspólny ogon stylu tych promptów: *Black and white documentary photography, natural window light, fine film grain, muted mid-tones, quiet editorial mood.*

| Dział | Plik | Źródło |
|-------|------|--------|
| 01 Jawność i kontrola | `mechanizm-jawnosc.jpg` | Grok Imagine |
| 02 Jak płaci NFZ | `mechanizm-platnik.jpg` | Duck.ai, prompt w stylu GPT Image (druga wersja) |
| 03 Formy zatrudnienia | `mechanizm-zatrudnienie.jpg` | Duck.ai |
| 04 Dostęp do zawodu | `mechanizm-dostep.jpg` | Duck.ai |

**01 Jawność i kontrola:** Over-the-shoulder close-up of an elderly person's hands holding a smartphone at a kitchen table, thumb resting on one entry in a long list of medical visits. The screen shows soft out-of-focus rows; the hands and the phone edge are sharp. Reading glasses and a cup sit in the upper part of the frame. The lower right is plain, dark tabletop. *(ogon stylu)*, 50mm lens, shallow depth of field, vertical composition.

**02 Jak płaci NFZ** (druga wersja; pierwsza z Groka miała pseudokod na ekranie i dwa klawisze Enter): Vertical 4:5 black-and-white documentary photograph. Scene: the registration desk of an ordinary Polish public outpatient clinic, late afternoon. Close-up of a receptionist's hand (grey cardigan sleeve, no face visible) entering from the right edge of the frame and pressing the Enter key of a slightly worn, light-grey full-size office keyboard; the fingertip is the sharpest point. Keyboard: realistic standard QWERTY layout with exactly one Enter key, running diagonally from the lower left toward the center. Background: the edge of a monitor in the upper left, its screen deeply out of focus with only soft grey horizontal bars and no readable characters; beyond the desk, in soft blur, a waiting corridor with a row of empty plastic chairs and daylight from tall windows. Composition: the lower-right quarter is plain, calm desk surface. Look: natural window light, fine 35mm film grain, muted mid-tones, gentle contrast, 50mm lens at f/2, shallow depth of field; unretouched, like a press photo, not glossy, not HDR. Avoid: readable text on the screen, logos, brand names, extra fingers, duplicated keys.

**03 Formy zatrudnienia:** Three different plain hospital ID badges on lanyards hanging from a single coat hook beside a white doctor's coat, against a pale wall. Each badge has a different shape and lanyard pattern, with blank white cards. On a narrow shelf below, a smartphone lies face down next to a car key. The lower right is a simple, shadowy wall. *(ogon stylu)*, 50mm lens, subject in the upper center of a vertical frame.

**04 Dostęp do zawodu:** Steep empty university lecture hall seen from the top row, rows of wooden folding seats descending toward a small stage. Only the first three rows near the stage have seats folded down, lit by light from tall windows; every row above is folded up and closed off by a rope barrier stretched across the aisle in the foreground. *(ogon stylu)*, 24mm lens, deep focus, vertical composition.
