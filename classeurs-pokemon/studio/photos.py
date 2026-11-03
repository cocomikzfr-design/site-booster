"""Prépare les photos produit : remplace les cartes Magic du classeur ouvert par de vraies
cartes Pokémon, puis remplace le fond blanc par un dégradé de la couleur du classeur.

Usage : python3 studio/photos.py <dossier des photos AliExpress> <dossier de sortie>
Besoin de numpy, scipy et Pillow. Les cartes viennent de studio/cards (fetch-cards.py).
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = sys.argv[1], sys.argv[2]
SIZE = 1600

PHOTOS = {  # couleur -> photo AliExpress (même ordre que la fiche produit)
    'rouge': 'S632b52eb4176497187f1635a8223bb36A.jpg',
    'vert': 'S194489cbcc4b4045901982cb5d3a707aM.jpg',
    'marine': 'Se73ea99b928445baa804543e7f428e71D.jpg',
    'bleu': 'S430a76d932894e15818ac8d61d9b0c32F.jpg',
    'orange': 'S0fa1ed68a6874e188206250cdfb2526fp.jpg',
}
BACKDROP = {  # dégradé de fond : clair, foncé
    'rouge': ('#ffb3b3', '#6e0c1b'), 'vert': ('#eef8c4', '#557a06'), 'marine': ('#b4c6dc', '#0f1a27'),
    'bleu': ('#c9dcff', '#1f4689'), 'orange': ('#ffd9bd', '#9a4719'),
}
# Cartes Magic repérées sur la photo rouge (pixels à 1600 px de côté), puis rapportées
# au cadre du classeur ouvert pour les autres photos.
REF_BOX = None
REF_CARDS = [(238, 1097, 335, 1233), (388, 1097, 482, 1233), (603, 1105, 700, 1235), (745, 1100, 842, 1233),
             (228, 1288, 325, 1422), (372, 1288, 468, 1425), (598, 1290, 690, 1425), (740, 1288, 838, 1425)]


def lum(a):
    return (a[..., 0] * 299 + a[..., 1] * 587 + a[..., 2] * 114) // 1000


def binder_box(l, a):
    # intérieur noir et neutre (la couverture bleu marine est sombre mais bleutée)
    dark = (l < 45) & ((a[..., 2] - a[..., 0]) < 10)
    dark[:850, :] = False
    dark[:, 1050:] = False
    lab, n = ndi.label(ndi.binary_closing(dark, iterations=3))
    big = np.argmax(ndi.sum(dark, lab, range(1, n + 1))) + 1
    ys, xs = np.where(lab == big)
    return xs.min(), ys.min(), xs.max(), ys.max()


def refine(l, rect, r=7):
    """Cale chaque bord du rectangle sur le contour le plus net à ±r pixels."""
    x0, y0, x1, y1 = rect
    gx = np.abs(np.diff(l.astype(float), axis=1))
    gy = np.abs(np.diff(l.astype(float), axis=0))
    def best_col(x, ya, yb):
        cols = range(max(1, x - r), x + r + 1)
        return max(cols, key=lambda c: gx[ya:yb, c].mean())
    def best_row(y, xa, xb):
        rows = range(max(1, y - r), y + r + 1)
        return max(rows, key=lambda q: gy[q, xa:xb].mean())
    mx, my = (x1 - x0) // 5, (y1 - y0) // 5
    return (best_col(x0, y0 + my, y1 - my), best_row(y0, x0 + mx, x1 - mx),
            best_col(x1, y0 + my, y1 - my), best_row(y1, x0 + mx, x1 - mx))


def sleeve(card, w, h):
    """Carte rangée dans une pochette : léger voile et reflet."""
    c = card.convert('RGB').resize((w, h), Image.LANCZOS)
    c = Image.blend(c, Image.new('RGB', (w, h), (235, 238, 242)), 0.07)
    gloss = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(gloss)
    d.polygon([(0, 0), (int(w * 0.55), 0), (0, int(h * 0.45))], fill=34)
    gloss = gloss.filter(ImageFilter.GaussianBlur(w * 0.08))
    c.paste(Image.new('RGB', (w, h), (255, 255, 255)), (0, 0), gloss)
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=max(2, int(w * 0.045)), fill=255)
    return c, mask


def gradient(size, light, dark):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip(np.hypot((xx - w * 0.3) / w, (yy - h * 0.2) / h) / 1.05, 0, 1)[..., None]
    l = np.array(Image.new('RGB', (1, 1), light).getpixel((0, 0)), float)
    d = np.array(Image.new('RGB', (1, 1), dark).getpixel((0, 0)), float)
    return Image.fromarray((l * (1 - t) + d * t).astype(np.uint8))


sets = json.load(open(os.path.join(HERE, 'cards.json')))
ref = Image.open(os.path.join(SRC, PHOTOS['rouge'])).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
ref_l = lum(np.asarray(ref).astype(np.int32))
REF_BOX = binder_box(ref_l, np.asarray(ref).astype(np.int32))
ref_cards = [refine(ref_l, r) for r in REF_CARDS]
os.makedirs(OUT, exist_ok=True)

for color, fname in PHOTOS.items():
    im = Image.open(os.path.join(SRC, fname)).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    l = lum(a)
    bx0, by0, bx1, by1 = binder_box(l, a)
    rx0, ry0, rx1, ry1 = REF_BOX
    sx, sy = (bx1 - bx0) / (rx1 - rx0), (by1 - by0) / (ry1 - ry0)
    keys = (sets[color] + sets['extra'])[:8]
    for (x0, y0, x1, y1), key in zip(ref_cards, keys):
        rect = (round(bx0 + (x0 - rx0) * sx), round(by0 + (y0 - ry0) * sy),
                round(bx0 + (x1 - rx0) * sx), round(by0 + (y1 - ry0) * sy))
        if color != 'rouge':
            rect = refine(l, rect, r=4)
        x0, y0, x1, y1 = rect
        pad = max(2, round((x1 - x0) * 0.04))  # couvre entièrement l'ancienne carte
        x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
        card, mask = sleeve(Image.open(os.path.join(HERE, 'cards', f'{key}.webp')), x1 - x0, y1 - y0)
        im.paste(card, (x0, y0), mask)
    # Fond blanc -> dégradé (seulement le blanc relié aux bords de l'image)
    a = np.asarray(im).astype(np.int32)
    white = (a.min(axis=2) > 232)
    lab, _ = ndi.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = ndi.binary_dilation(np.isin(lab, list(border)), iterations=2)  # retire le liseré blanc
    alpha = Image.fromarray((~bgmask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    out = gradient(im.size, *BACKDROP[color])
    out.paste(im, (0, 0), alpha)
    out.resize((1300, 1300), Image.LANCZOS).save(os.path.join(OUT, f'p-{color}-photo.webp'), 'WEBP', quality=84, method=6)

    # Zoom 1 : la couverture fermée, autour du logo en relief
    a = np.asarray(im).astype(np.int32)
    colored = a.min(axis=2) < 225
    colored[:, :640] = False
    colored[1000:, :] = False
    ys, xs = np.where(colored)
    cx0, cx1, cy0 = np.percentile(xs, 1), np.percentile(xs, 99), np.percentile(ys, 1)
    cw = cx1 - cx0
    mx, my = (cx0 + cx1) / 2, cy0 + cw * 1.32 * 0.5
    w = cw * 0.86
    box = (mx - w / 2, my - w / 1.73 / 2, mx + w / 2, my + w / 1.73 / 2)
    out.crop(tuple(round(v) for v in box)).resize((900, 520), Image.LANCZOS).save(
        os.path.join(OUT, f'p-{color}-a.webp'), 'WEBP', quality=84, method=6)

    # Zoom 2 : les pages du classeur ouvert avec les cartes
    bw = bx1 - bx0
    w = bw * 0.74
    mx, my = bx0 + bw * 0.5, (by0 + by1) / 2
    box = (mx - w / 2, my - w / 1.29 / 2, mx + w / 2, my + w / 1.29 / 2)
    out.crop(tuple(round(v) for v in box)).resize((900, 700), Image.LANCZOS).save(
        os.path.join(OUT, f'p-{color}-b.webp'), 'WEBP', quality=84, method=6)
    print(color, 'binder', (bx0, by0, bx1, by1), 'scale', round(sx, 3), round(sy, 3))
