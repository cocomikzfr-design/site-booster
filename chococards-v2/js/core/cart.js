/* ==========================================================================
   Panier (démo) : stockage local + événements + « carte qui vole »
   --------------------------------------------------------------------------
   Stockage : localStorage 'chococards:v2:panier' (try/catch : marche aussi
   en navigation privée, le panier vit alors le temps de la page).

   Événements sur document :
     'cart:change' → detail { lines, count, total }   (après toute modification)
     'cart:add'    → detail { product, qty, source }   (après un ajout)

   API :
     cart.lines / cart.count / cart.total / cart.add(id, qty, { source })
     cart.setQty(id, qty) / cart.remove(id) / cart.clear()
     flyToCart(imageEl, { target }) → Promise : clone l'image et la fait voler
                                       jusqu'au bouton panier ([data-cart-target])
     initCart() → branche les boutons [data-add-to-cart="id"] (délégation),
                  met à jour [data-cart-count] et l'aria-label du bouton panier.

   Bouton type :
     <article data-product="pk-me06-etb"> … <div data-fly>image</div> …
       <button data-add-to-cart="pk-me06-etb">Précommander</button>
   Pour personnaliser l'ajout, écoutez 'cart:add' ou appelez cart.add() vous-même.
   ========================================================================== */

import { prefs } from './motion.js';
import { emit, $$ } from './utils.js';
import { getProduit, statutInfo, formatPrix } from './format.js';
import { toast } from './ui.js';

const KEY = 'chococards:v2:panier';
let lines = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((l) => getProduit(l.id) && l.qty > 0) : [];
  } catch {
    return [];
  }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* stockage indisponible : panier en mémoire */ }
}

function snapshot() {
  const detailed = lines.map((l) => ({ ...l, product: getProduit(l.id) })).filter((l) => l.product);
  return {
    lines: detailed,
    count: detailed.reduce((n, l) => n + l.qty, 0),
    total: detailed.reduce((n, l) => n + l.qty * l.product.prix, 0),
  };
}

function changed() {
  save();
  const snap = snapshot();
  updateBadges(snap);
  emit('cart:change', snap);
}

export const cart = {
  get lines() { return snapshot().lines; },
  get count() { return snapshot().count; },
  get total() { return snapshot().total; },
  add(id, qty = 1, { source = null } = {}) {
    const product = getProduit(id);
    if (!product || !statutInfo(product.statut).achat) return false;
    const line = lines.find((l) => l.id === id);
    if (line) line.qty = Math.min(99, line.qty + qty);
    else lines.push({ id, qty });
    changed();
    emit('cart:add', { product, qty, source });
    return true;
  },
  setQty(id, qty) {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    if (qty <= 0) lines = lines.filter((l) => l.id !== id);
    else line.qty = Math.min(99, qty);
    changed();
  },
  remove(id) { lines = lines.filter((l) => l.id !== id); changed(); },
  clear() { lines = []; changed(); },
  has(id) { return lines.some((l) => l.id === id); },
};

/** Met à jour les pastilles [data-cart-count] et le libellé des boutons panier. */
function updateBadges(snap = snapshot()) {
  $$('[data-cart-count]').forEach((el) => {
    el.textContent = String(snap.count);
    el.hidden = snap.count === 0;
  });
  $$('[data-cart-target]').forEach((el) => {
    el.setAttribute('aria-label', `Ouvrir le panier, ${snap.count} article${snap.count > 1 ? 's' : ''}`);
  });
}

/** Cible visible du vol : le premier [data-cart-target] affiché à l'écran. */
function visibleTarget() {
  return $$('[data-cart-target]').find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  });
}

/**
 * Fait voler un clone de imageEl jusqu'au panier (transform + opacité uniquement, WAAPI).
 * Sans mouvement : simple rebond de l'icône. Ne rejette jamais.
 */
export function flyToCart(imageEl, { target } = {}) {
  const dest = target || visibleTarget();
  const bump = () => { if (dest) { dest.classList.remove('is-bump'); void dest.offsetWidth; dest.classList.add('is-bump'); } };
  if (!imageEl || !dest || prefs.reduced || !imageEl.animate) { bump(); return Promise.resolve(); }
  const from = imageEl.getBoundingClientRect();
  const to = dest.getBoundingClientRect();
  if (!from.width) { bump(); return Promise.resolve(); }
  const size = Math.min(from.width, from.height, 220);
  const clone = document.createElement('div');
  clone.className = 'fly-clone';
  clone.setAttribute('aria-hidden', 'true');
  const src = imageEl.tagName === 'IMG' ? imageEl : imageEl.querySelector('img');
  if (src) {
    const img = new Image();
    img.src = src.currentSrc || src.src;
    img.alt = '';
    clone.appendChild(img);
  } else {
    const c = imageEl.cloneNode(true);
    c.removeAttribute('id');
    clone.appendChild(c);
  }
  Object.assign(clone.style, {
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  });
  document.body.appendChild(clone);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const end = 28 / size;
  // Trajectoire en arc : X linéaire, Y qui monte puis plonge
  const anim = clone.animate([
    { transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1 },
    { transform: `translate3d(${dx * 0.45}px, ${Math.min(dy, 0) * 0.6 - 90}px, 0) scale(${(1 + end) / 2}) rotate(-12deg)`, opacity: 1, offset: 0.55 },
    { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${end}) rotate(8deg)`, opacity: 0.2 },
  ], { duration: 820, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards' });
  return anim.finished.catch(() => {}).then(() => { clone.remove(); bump(); });
}

export function initCart() {
  updateBadges();
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    const id = btn.getAttribute('data-add-to-cart');
    const product = getProduit(id);
    if (!product) return;
    const host = btn.closest('[data-product]');
    const fly = host?.querySelector('[data-fly]') || host?.querySelector('img');
    if (cart.add(id, 1, { source: btn })) {
      flyToCart(fly);
      const verbe = product.statut === 'precommande' ? 'Précommande ajoutée' : 'Ajouté au panier';
      toast(`${verbe} : ${product.court || product.nom} · ${formatPrix(product.prix)}`);
    }
  });
  // Synchronisation entre onglets
  addEventListener('storage', (e) => { if (e.key === KEY) { lines = load(); changed(); } });
}

