"""Convertit les PNG générés en WebP (avec transparence pour les objets détourés)."""
import glob, os, sys
from PIL import Image

src, dst, art = sys.argv[1], sys.argv[2], sys.argv[3]
TRANSPARENT = {'hero-binder', 'corner-card', 'corner-binder'}
for p in sorted(glob.glob(os.path.join(src, '*.png'))):
    name = os.path.basename(p)[:-4]
    im = Image.open(p)
    transparent = name in TRANSPARENT or name.startswith('cover-')
    if not transparent:
        im = im.convert('RGB')
    im.save(os.path.join(dst, name + '.webp'), 'WEBP', quality=86 if transparent else 80, method=6)
# Décorations de la section « À propos »
for num, name in ((25, 'pikachu'), (94, 'ectoplasma')):
    im = Image.open(os.path.join(art, f'{num}.png')).convert('RGBA')
    im.thumbnail((440, 440))
    im.save(os.path.join(dst, name + '.webp'), 'WEBP', quality=86, method=6)
# Illustrations des cartes rangées dans le classeur qui s'ouvre
os.makedirs(os.path.join(dst, 'art'), exist_ok=True)
for num in (1, 3, 4, 6, 7, 9, 25, 26, 54, 94, 129, 130, 131, 133, 134, 135, 136, 143, 145, 146, 150, 151, 155, 175, 197, 249, 250, 257, 384, 778):
    im = Image.open(os.path.join(art, f'{num}.png')).convert('RGBA')
    im.thumbnail((260, 260))
    im.save(os.path.join(dst, 'art', f'{num}.webp'), 'WEBP', quality=84, method=6)
print('WebP exportés dans', dst)
