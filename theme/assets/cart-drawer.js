// assets/cart-drawer.js : tiroir panier et page panier.
// Quantités via /cart/change.js (file de requêtes, une à la fois), contenu rendu à nouveau par la
// Section Rendering API, totaux en compteur masqué, jauge de livraison animée, événement cart:updated.
import { isReduced, EASE, EASE_IO } from 'motion-core';
import { openLayer, announce, t, parse } from 'ui';
import { swapMaskedText } from 'masked-text';

const R = () => window.theme.routes;
const drawerEl = () => document.querySelector('[data-cart-drawer]');
let layer = null, busy = false, chain = Promise.resolve();
const enqueue = (fn) => (chain = chain.then(fn, fn));
export const cartSectionIds = () => [...document.querySelectorAll('[data-cart-root]')].map((r) => r.dataset.sectionId);

// Fait monter les éléments du tiroir depuis leurs masques
function rise(root, base = 250) {
  if (isReduced()) return;
  root.querySelectorAll('.cart__head, .ship, .ci, .cart__upsell, .cart__foot, .cart__empty').forEach((el, i) => {
    el.animate([{ transform: 'translateY(24px)', clipPath: 'inset(100% 0 0 0)' }, { transform: 'none', clipPath: 'inset(0 0 0 0)' }],
      { duration: 700, delay: base + i * 60, easing: EASE, fill: 'backwards' });
  });
}

export function openDrawer(opener) {
  const d = drawerEl(); if (!d || layer || busy) return;
  const panel = d.querySelector('.drawer__panel'), scrim = d.querySelector('.drawer__scrim');
  d.hidden = false;
  layer = openLayer(d, { opener, onEsc: closeDrawer, focus: panel.querySelector('[data-cart-close]') });
  document.dispatchEvent(new Event('cursor:refresh'));
  if (isReduced()) return;
  panel.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)' }], { duration: 850, easing: EASE_IO });
  scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 }); // voile (pas du contenu)
  rise(panel);
}

export async function closeDrawer() {
  const d = drawerEl(); if (!d || !layer || busy) return;
  busy = true;
  if (!isReduced()) {
    const panel = d.querySelector('.drawer__panel'), scrim = d.querySelector('.drawer__scrim');
    scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
    await panel.animate([{ clipPath: 'inset(0 0 0 0%)' }, { clipPath: 'inset(0 0 0 100%)' }], { duration: 600, easing: EASE_IO, fill: 'forwards' }).finished.catch(() => {});
    d.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  }
  d.hidden = true; layer.close(); layer = null; busy = false;
}

// Remplace le contenu des paniers présents (tiroir, page) en animant ce qui change
export function renderSections(sections) {
  if (!sections) return;
  let count = null;
  document.querySelectorAll('[data-cart-root]').forEach((root) => {
    const html = sections[root.dataset.sectionId]; if (!html) return;
    const fresh = parse(html).querySelector('[data-cart-root]'); if (!fresh) return;
    const old = {}; root.querySelectorAll('[data-swap]').forEach((el) => { old[el.dataset.swap] = el.textContent; });
    const oldShip = root.querySelector('[data-ship]');
    const oldRatio = oldShip ? parseFloat(oldShip.dataset.ratio) : 0;
    const active = document.activeElement;
    const focusKey = active && root.contains(active) ? active.dataset.focusKey : null;
    const hadFocus = active && root.contains(active);
    root.replaceWith(fresh);
    // Compteurs masqués : l'ancien texte sort, le nouveau entre
    fresh.querySelectorAll('[data-swap]').forEach((el) => {
      const k = el.dataset.swap, next = el.textContent;
      if (old[k] !== undefined && old[k] !== next) {
        el.textContent = old[k];
        const a = parseFloat(old[k].replace(/[^\d,.-]/g, '').replace(',', '.')), b = parseFloat(next.replace(/[^\d,.-]/g, '').replace(',', '.'));
        swapMaskedText(el.parentElement, next, b < a ? -1 : 1);
      }
    });
    // Jauge : du ratio précédent au nouveau
    const ship = fresh.querySelector('[data-ship]');
    if (ship && !isReduced()) {
      const to = parseFloat(ship.dataset.ratio);
      ship.style.setProperty('--ratio', oldRatio);
      requestAnimationFrame(() => requestAnimationFrame(() => ship.style.setProperty('--ratio', to)));
    }
    if (hadFocus) {
      const target = (focusKey && fresh.querySelector(`[data-focus-key="${focusKey}"]`)) || fresh.querySelector('[data-cart-close], [data-focus-key]');
      if (target) target.focus({ preventScroll: true });
    }
    count = parseInt(fresh.dataset.count, 10);
  });
  if (count !== null) document.dispatchEvent(new CustomEvent('cart:count', { detail: { count } }));
}

function showError(msg) {
  document.querySelectorAll('[data-cart-error]').forEach((el) => { el.textContent = msg; el.hidden = false; });
}

// Replie une ligne supprimée
function collapse(row) {
  if (!row || isReduced()) return;
  row.animate([{ height: `${row.offsetHeight}px`, clipPath: 'inset(0 0 0 0)' }, { height: '0px', paddingBlock: '0px', clipPath: 'inset(0 0 100% 0)' }],
    { duration: 450, easing: EASE_IO, fill: 'forwards' });
}

export function changeLine(key, quantity, row) {
  if (quantity === 0) collapse(row);
  return enqueue(async () => {
    try {
      const res = await fetch(`${R().cartChange}.js`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity, sections: cartSectionIds(), sections_url: location.pathname })
      });
      const data = await res.json();
      if (!res.ok || data.status) throw new Error(data.description || data.message || t('error'));
      renderSections(data.sections);
      announce(t('cartCount', { count: data.item_count }));
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: data } }));
    } catch (err) {
      if (row) row.getAnimations().forEach((a) => a.cancel());
      showError(err.message || t('error'));
    }
  });
}

let noteTimer = 0;
function updateNote(note) {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => enqueue(() => fetch(`${R().cartUpdate}.js`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ note })
  }).catch(() => {})), 400);
}

// Délégation : fonctionne aussi après remplacement du contenu
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-cart-open]');
  if (open && drawerEl() && window.theme.cartType === 'drawer') { e.preventDefault(); openDrawer(open); return; }
  if (e.target.closest('[data-cart-close]')) { closeDrawer(); return; }
  const step = e.target.closest('[data-qty-step]');
  if (step && step.closest('[data-cart-root]')) {
    const row = step.closest('.ci'), input = row.querySelector('[data-qty-input]');
    const q = Math.max(0, (parseInt(input.value, 10) || 0) + parseInt(step.dataset.qtyStep, 10));
    input.value = q; changeLine(row.dataset.key, q, row); return;
  }
  const rm = e.target.closest('[data-remove]');
  if (rm && rm.closest('[data-cart-root]')) { e.preventDefault(); const row = rm.closest('.ci'); changeLine(row.dataset.key, 0, row); }
});
document.addEventListener('change', (e) => {
  const input = e.target.closest('[data-cart-root] [data-qty-input]');
  if (input) { const row = input.closest('.ci'); changeLine(row.dataset.key, Math.max(0, parseInt(input.value, 10) || 0), row); return; }
  const note = e.target.closest('[data-cart-note]');
  if (note) updateNote(note.value);
});
// Ajout depuis une fiche, une carte ou le kit (product-form.js)
document.addEventListener('cart:added', (e) => {
  renderSections(e.detail.sections);
  if (e.detail.open && drawerEl() && window.theme.cartType === 'drawer') openDrawer(e.detail.opener);
  else if (drawerEl() && layer) rise(drawerEl().querySelector('.drawer__panel'), 0);
});
