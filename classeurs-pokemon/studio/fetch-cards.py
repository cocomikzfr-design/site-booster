"""Télécharge les vraies cartes (en français) depuis TCGdex et écrit studio/cards/index.json (noms + raretés)."""
import json, os, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cards')
SERIES = {'base1': 'base', 'base2': 'base', 'base3': 'base', 'sv03.5': 'sv'}

def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()

os.makedirs(OUT, exist_ok=True)
wanted = sorted({k for ids in json.load(open(os.path.join(HERE, 'cards.json'))).values() for k in ids})
index = {}
for key in wanted:
    set_id, local = key.rsplit('-', 1)
    info = json.loads(get(f'https://api.tcgdex.net/v2/fr/cards/{set_id}-{local}'))
    index[key] = {'name': info['name'], 'rarity': info.get('rarity'), 'set': info['set']['name'], 'number': f"{local}/{info['set']['cardCount']['official']}"}
    path = os.path.join(OUT, f'{key}.webp')
    if not os.path.exists(path):
        with open(path, 'wb') as f:
            f.write(get(f'https://assets.tcgdex.net/fr/{SERIES[set_id]}/{set_id}/{local}/high.webp'))
    print(key, index[key]['name'], '·', index[key]['rarity'])
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, indent=1)
