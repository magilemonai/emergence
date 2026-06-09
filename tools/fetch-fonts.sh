#!/usr/bin/env bash
# Fetch the 'latin' woff2 subset for each font we embed, into fonts/<Family>-<weight>.woff2
# Usage: tools/fetch-fonts.sh  (edit the FONTS list below)
set -e
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
cd "$(dirname "$0")/.."
mkdir -p fonts
fetch () { # $1=Family (url form, + for space)  $2=weight  $3=outfamily
  local css; css=$(curl -s -A "$UA" "https://fonts.googleapis.com/css2?family=$1:wght@$2&display=swap")
  local url; url=$(printf '%s' "$css" | grep -o 'https://[^)]*\.woff2' | tail -1)  # last block = latin subset
  curl -s -A "$UA" "$url" -o "fonts/$3-$2.woff2"
  echo "fonts/$3-$2.woff2  $(wc -c < "fonts/$3-$2.woff2")B"
}
for spec in "$@"; do IFS='|' read -r fam wt out <<< "$spec"; fetch "$fam" "$wt" "$out"; done
