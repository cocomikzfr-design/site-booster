#!/usr/bin/env bash
# Télécharge les illustrations utilisées par studio.html (dépôt PokeAPI/sprites).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p art
for id in 1 3 4 6 7 9 25 26 39 52 54 94 129 130 131 133 134 135 136 143 144 145 146 149 150 151 155 175 196 197 249 250 257 282 384 445 448 658 700 778 887; do
  [ -f "art/$id.png" ] || curl -sf -o "art/$id.png" "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/$id.png"
done
echo "OK : $(ls art | wc -l) images"
