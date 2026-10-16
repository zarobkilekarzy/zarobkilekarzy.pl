#!/usr/bin/env bash
# Renderuje propozycje OG do PNG 1200×630 (Chromium headless).
# Użycie: ./render.sh   (z dowolnego katalogu)
set -euo pipefail

CHROME="${CHROME:-/Applications/Chromium.app/Contents/MacOS/Chromium}"
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/png"
mkdir -p "$OUT"

shot() { # $1 = plik html, $2 = wariant (home|artykul)
  local name="${1%.html}-$2"
  rm -f "$OUT/$name.png"
  local hash=""; [[ "$2" == "artykul" ]] && hash="#artykul"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1200,630 --allow-file-access-from-files --virtual-time-budget=4000 \
    --screenshot="$OUT/$name.png" "file://$DIR/$1$hash" >/dev/null 2>&1 || true
  # Chromium na macOS potrafi wyjść z kodem ≠ 0 już po zapisaniu zrzutu — liczy się plik
  [[ -s "$OUT/$name.png" ]] && echo "png/$name.png" || { echo "błąd: $name" >&2; exit 1; }
}

for f in a-okladka.html b-liczba.html c-ramka.html; do
  shot "$f" home
  shot "$f" artykul
done
