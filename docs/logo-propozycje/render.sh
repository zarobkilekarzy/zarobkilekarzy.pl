#!/usr/bin/env bash
# Renderuje planszę propozycji logo do PNG (Chromium headless, 2×) i przycina ją do wysokości treści.
# Użycie: ./render.sh   (z dowolnego katalogu)
set -euo pipefail

CHROME="${CHROME:-/Applications/Chromium.app/Contents/MacOS/Chromium}"
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/png"
mkdir -p "$OUT"

rm -f "$OUT/plansza.png"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size=1280,4600 --allow-file-access-from-files --virtual-time-budget=4000 \
  --screenshot="$OUT/plansza.png" "file://$DIR/index.html" >/dev/null 2>&1 || true
# Chromium na macOS potrafi wyjść z kodem ≠ 0 już po zapisaniu zrzutu — liczy się plik
[[ -s "$OUT/plansza.png" ]] || { echo "błąd: brak png/plansza.png" >&2; exit 1; }

# Okno ma zapas wysokości — obcinamy jednolite tło pod stopką
python3 -I - "$OUT/plansza.png" <<'EOF'
import sys
from PIL import Image
path = sys.argv[1]
img = Image.open(path).convert('RGB')
w, h = img.size
bg = img.getpixel((w - 1, h - 1))
y = h - 1
while y > 0 and all(img.getpixel((x, y)) == bg for x in range(0, w, 7)):
    y -= 1
img.crop((0, 0, w, min(h, y + 140))).save(path, optimize=True)
EOF
echo "png/plansza.png"
