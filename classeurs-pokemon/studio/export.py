"""Convertit les PNG générés en WebP (avec transparence pour les objets détourés)."""
import glob, os, sys
from PIL import Image

src, dst, art = sys.argv[1], sys.argv[2], sys.argv[3]
TRANSPARENT = {'hero-binder', 'corner-card', 'corner-binder'}
for p in sorted(glob.glob(os.path.join(src, '*.png'))):
    name = os.path.basename(p)[:-4]
    im = Image.open(p)
    if name not in TRANSPARENT:
        im = im.convert('RGB')
    im.save(os.path.join(dst, name + '.webp'), 'WEBP', quality=86 if name in TRANSPARENT else 80, method=6)
# Décorations de la section « À propos »
for num, name in ((25, 'pikachu'), (94, 'ectoplasma')):
    im = Image.open(os.path.join(art, f'{num}.png')).convert('RGBA')
    im.thumbnail((440, 440))
    im.save(os.path.join(dst, name + '.webp'), 'WEBP', quality=86, method=6)
print('WebP exportés dans', dst)
